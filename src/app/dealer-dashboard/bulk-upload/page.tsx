'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// --- DEALER BULK UPLOAD ------------------------------------------------------
// A dealer fills in one spreadsheet row per item and selects all their photos
// at once. Photos are matched to rows by FILE NAME (the "photos" column), the
// way large marketplaces do it. Everything is checked and shown before a
// single listing is created, and anything that cannot import comes back as a
// spreadsheet with the reason, ready to fix and upload again.

// Same ids as the single Add Listing page, so imported stock appears in the
// same browse categories.
const CATEGORIES = [
  { id: 'pistols', label: 'Pistols' },
  { id: 'bolt-action', label: 'Bolt Action Rifles' },
  { id: 'semi-auto-rifles', label: 'Semi-Auto Rifles' },
  { id: 'lever-action', label: 'Lever Action Rifles' },
  { id: 'pump-action-rifles', label: 'Pump Action Rifles' },
  { id: 'shotguns', label: 'Shotguns' },
  { id: 'revolvers', label: 'Revolvers' },
  { id: 'air-guns', label: 'Air Guns' },
  { id: 'airsoft', label: 'Airsoft' },
  { id: 'knives', label: 'Knives & Blades' },
  { id: 'holsters', label: 'Holsters & Carry' },
  { id: 'magazines', label: 'Magazines' },
  { id: 'ammunition', label: 'Ammunition' },
  { id: 'optics', label: 'Optics & Sights' },
  { id: 'reloading', label: 'Reloading' },
  { id: 'accessories', label: 'Accessories & Parts' },
];

const HEADERS = [
  'title', 'description', 'price', 'category', 'make', 'model', 'calibre',
  'condition', 'action_type', 'barrel_length', 'capacity', 'licence_type',
  'negotiable', 'photos',
];

// Column names dealers commonly use for the same thing.
const ALIASES: Record<string, string> = {
  category_id: 'category', categories: 'category',
  caliber: 'calibre', calibre_id: 'calibre',
  license_type: 'licence_type', licence: 'licence_type', license: 'licence_type',
  is_negotiable: 'negotiable',
  photo: 'photos', images: 'photos', image: 'photos', pictures: 'photos',
  photo_files: 'photos',
  action: 'action_type', barrel: 'barrel_length', brand: 'make',
  name: 'title', price_zar: 'price', price_r: 'price',
};

const MAX_ROWS = 500;
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const HOW_TO = [
  'HOW TO UPLOAD YOUR STOCK',
  '',
  '1. Fill in the Stock tab: one row per item. Keep the column names in row 1.',
  '   Delete the two EXAMPLE rows before uploading.',
  '2. Required for every item: title, price and category.',
  '   Category must be one of the values in the Valid values tab (first column).',
  '   Make, calibre and condition should match the Valid values tab exactly;',
  '   if not, the item still imports, just without that detail.',
  '3. Price: numbers only, e.g. 12500 (R 12 500 and 12,500 also work).',
  '4. negotiable: yes or no.',
  '5. photos: type the file names of that item\'s photos, separated by commas,',
  '   e.g. g19-front.jpg, g19-side.jpg. The first one is the cover photo.',
  '   Up to 5 photos per item. JPG, PNG or WEBP, up to 5MB each.',
  '6. On the Gun X bulk upload page: choose this spreadsheet, then select all',
  '   your photos at once. We match them to your items by file name.',
  '7. Check the preview, then press Import. Rows that cannot import come back',
  '   as a spreadsheet with the problem written next to each one.',
  '',
  'Up to 500 items per file. Save as .xlsx (or .csv) when you are done.',
];

type Lookup = { id: string; name: string };
type SheetRow = { line: number; cells: unknown[] };

type Row = {
  line: number;
  raw: Record<string, string>;
  title: string;
  description: string;
  price: number | null;
  categoryId: string | null;
  makeId: string | null;
  model: string;
  calibreId: string | null;
  conditionId: string | null;
  actionType: string;
  barrelLength: string;
  capacity: string;
  licenceType: string;
  negotiable: boolean;
  photoNames: string[];
  photos: File[];
  errors: string[];
  warnings: string[];
};

type Result = {
  line: number;
  title: string;
  ok: boolean;
  message: string;
  id?: string;
  photoCount: number;
  raw: Record<string, string>;
};

const norm = (s: unknown): string =>
  String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const headerKey = (h: unknown): string => {
  const k = norm(h).replace(/[\s\-/]+/g, '_').replace(/[^a-z0-9_]/g, '');
  return ALIASES[k] || k;
};

const baseName = (n: string): string =>
  (n.split(/[\\/]/).pop() || '').trim().toLowerCase();

const dupKey = (title: string, price: number): string => `${norm(title)}|${price}`;

const rand = (n: number): string =>
  'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Reads rand amounts as South Africans type them: 12500, R 12 500, 12,500,
// 12 500,00 and 12,500.00 all become 12500.
function parsePrice(v: unknown): number | null {
  if (typeof v === 'number') {
    return isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  }
  let s = String(v ?? '').replace(/[Rr]/g, '').replace(/[\s\u00a0]/g, '');
  if (!s) return null;
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = parseFloat(s);
  return n > 0 && n < 100000000 ? n : null;
}

function parseYes(v: string): boolean {
  return ['yes', 'y', 'true', '1', 'ja'].includes(norm(v));
}

function findCategory(v: string): string | null {
  const k = norm(v);
  const hit = CATEGORIES.find((c) => c.id === k || norm(c.label) === k);
  return hit ? hit.id : null;
}

function categoryHint(v: string): string {
  if (/^rifles?$/.test(norm(v))) {
    return 'Category "rifles" is too general: use bolt-action, semi-auto-rifles, ' +
      'lever-action or pump-action-rifles';
  }
  return `Category "${v}" is not one of ours (see the Valid values tab)`;
}

// CSV with quotes, commas or semicolons (South African Excel often saves
// semicolon CSVs), and Windows or Mac line endings.
function parseDelimited(text: string): unknown[][] {
  const first = text.split(/\r?\n/, 1)[0] || '';
  const delim = first.split(';').length > first.split(',').length ? ';' : ',';
  const rows: unknown[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === delim) {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function friendly(msg: string): string {
  if (/row-level security/i.test(msg)) {
    return 'Your account cannot add listings right now. Contact support@gunx.co.za.';
  }
  return msg;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dealer, setDealer] = useState<any>(null);
  const [makes, setMakes] = useState<Lookup[]>([]);
  const [calibres, setCalibres] = useState<Lookup[]>([]);
  const [conditions, setConditions] = useState<Lookup[]>([]);
  const [provinceId, setProvinceId] = useState<string | null>(null);
  const [existing, setExisting] = useState<Set<string>>(new Set());

  const [fileName, setFileName] = useState('');
  const [table, setTable] = useState<{ headers: string[]; rows: SheetRow[] } | null>(null);
  const [fileError, setFileError] = useState('');
  const [photos, setPhotos] = useState<Map<string, File>>(new Map());
  const [photoNotes, setPhotoNotes] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<Result[] | null>(null);
  const [notice, setNotice] = useState('');

  const sheetInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/dealer/login'); return; }

    const { data: d } = await supabase
      .from('dealers').select('*').eq('user_id', user.id).maybeSingle();
    if (d?.status === 'suspended') { router.replace('/dealer-dashboard'); return; }
    if (!d || d.status !== 'approved') { router.replace('/business/pending'); return; }
    setDealer(d);

    const [mk, cb, cd, pv, st] = await Promise.all([
      supabase.from('makes').select('id, name').order('name'),
      supabase.from('calibres').select('id, name').order('name'),
      supabase.from('conditions').select('id, name').order('name'),
      supabase.from('provinces').select('id, name'),
      supabase.from('listings').select('title, price').eq('dealer_id', d.id).limit(5000),
    ]);
    setMakes((mk.data as Lookup[]) || []);
    setCalibres((cb.data as Lookup[]) || []);
    setConditions((cd.data as Lookup[]) || []);
    const prov = ((pv.data as Lookup[]) || []).find((p) => norm(p.name) === norm(d.province));
    setProvinceId(prov ? prov.id : null);
    setExisting(new Set(((st.data as any[]) || []).map((l) => dupKey(l.title, Number(l.price)))));
    setLoading(false);
  };

  // --- Template -------------------------------------------------------------
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const stock = XLSX.utils.aoa_to_sheet([
      HEADERS,
      ['EXAMPLE: Glock 19 Gen 5 (delete this row)', 'Comes with 3 magazines, original case',
        12500, 'pistols', 'Glock', '19 Gen 5', '9mm Luger (9x19mm)', 'Like New',
        'Semi-Auto', '102mm', '15+1', 'Section 13', 'no', 'g19-front.jpg, g19-side.jpg'],
      ['EXAMPLE: Winchester 9mm FMJ 115gr, 50 rounds (delete this row)', 'Range ammunition',
        380, 'ammunition', 'Winchester', 'USA Forged', '9mm Luger (9x19mm)', 'Brand New',
        '', '', '50', '', 'no', 'win-9mm.jpg'],
    ]);
    stock['!cols'] = HEADERS.map((h) => ({
      wch: h === 'title' || h === 'description' ? 42 : h === 'photos' ? 34 : 16,
    }));
    XLSX.utils.book_append_sheet(wb, stock, 'Stock');

    const how = XLSX.utils.aoa_to_sheet(HOW_TO.map((l) => [l]));
    how['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, how, 'How to');

    const n = Math.max(CATEGORIES.length, makes.length, calibres.length, conditions.length);
    const vals = XLSX.utils.aoa_to_sheet([
      ['category (type this)', 'category name', 'make', 'calibre', 'condition'],
      ...Array.from({ length: n }, (_, i) => [
        CATEGORIES[i]?.id || '', CATEGORIES[i]?.label || '',
        makes[i]?.name || '', calibres[i]?.name || '', conditions[i]?.name || '',
      ]),
    ]);
    vals['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 26 }, { wch: 28 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, vals, 'Valid values');

    XLSX.writeFile(wb, 'gunx-stock-template.xlsx');
  };

  // --- Reading the spreadsheet ---------------------------------------------
  const readSheet = async (file: File | undefined) => {
    if (!file) return;
    setFileError('');
    setResults(null);
    setTable(null);
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    try {
      let aoa: unknown[][];
      if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
        aoa = parseDelimited((await file.text()).replace(/^\uFEFF/, ''));
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
        const name = wb.SheetNames.find((s) => norm(s) === 'stock') || wb.SheetNames[0];
        aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], {
          header: 1, defval: '', raw: true, blankrows: false,
        }) as unknown[][];
      } else {
        setFileError('Please choose an .xlsx or .csv file.');
        return;
      }

      const headers = (aoa[0] || []).map(headerKey);
      const missing = ['title', 'price', 'category'].filter((h) => !headers.includes(h));
      if (missing.length) {
        setFileError(`Row 1 must hold the column names. Missing: ${missing.join(', ')}. ` +
          'Download the template to see the layout.');
        return;
      }
      const data = aoa.slice(1)
        .map((cells, i) => ({ line: i + 2, cells }))
        .filter((r) => r.cells.some((c) => String(c ?? '').trim() !== ''));
      if (!data.length) {
        setFileError('The spreadsheet has column names but no items.');
        return;
      }
      if (data.length > MAX_ROWS) {
        setFileError(`This file has ${data.length} items. Please split it into files ` +
          `of ${MAX_ROWS} items or fewer.`);
        return;
      }
      setTable({ headers, rows: data });
    } catch {
      setFileError('We could not read that file. Save it as .xlsx from Excel or ' +
        'Google Sheets and try again.');
    }
  };

  // --- Photos ---------------------------------------------------------------
  const addPhotos = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next = new Map(photos);
    const notes: string[] = [];
    Array.from(list).forEach((f) => {
      if (!PHOTO_TYPES.includes(f.type)) {
        notes.push(`${f.name}: not a JPG, PNG or WEBP photo, skipped`);
        return;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        notes.push(`${f.name}: larger than 5MB, skipped`);
        return;
      }
      next.set(baseName(f.name), f);
    });
    setPhotos(next);
    setPhotoNotes(notes);
    setResults(null);
  };

  const thumbs = useMemo(() => {
    const m = new Map<File, string>();
    photos.forEach((f) => m.set(f, URL.createObjectURL(f)));
    return m;
  }, [photos]);

  useEffect(() => () => {
    thumbs.forEach((u) => URL.revokeObjectURL(u));
  }, [thumbs]);

  // --- Checking every row ---------------------------------------------------
  const rows: Row[] = useMemo(() => {
    if (!table) return [];
    const byName = (list: Lookup[]) => new Map(list.map((x) => [norm(x.name), x.id]));
    const mk = byName(makes);
    const cb = byName(calibres);
    const cd = byName(conditions);
    const seen = new Set<string>();

    return table.rows.map(({ line, cells }) => {
      const raw: Record<string, string> = {};
      table.headers.forEach((h, j) => {
        if (h) raw[h] = String(cells[j] ?? '').trim();
      });
      const errors: string[] = [];
      const warnings: string[] = [];

      const title = raw.title || '';
      if (!title) errors.push('Title is missing');
      else if (/^example/i.test(title)) errors.push('This is an example row: delete it from your spreadsheet');
      else if (title.length > 150) errors.push('Title is longer than 150 characters');

      const price = parsePrice(raw.price);
      if (price === null) errors.push(`Price "${raw.price || ''}" is not an amount we can read`);

      const categoryId = raw.category ? findCategory(raw.category) : null;
      if (!raw.category) errors.push('Category is missing');
      else if (!categoryId) errors.push(categoryHint(raw.category));

      const lookup = (val: string | undefined, map: Map<string, string>, label: string) => {
        if (!val) return null;
        const id = map.get(norm(val));
        if (!id) warnings.push(`${label} "${val}" is not in our list, so it is saved without a ${label.toLowerCase()}`);
        return id || null;
      };
      const makeId = lookup(raw.make, mk, 'Make');
      const calibreId = lookup(raw.calibre, cb, 'Calibre');
      const conditionId = lookup(raw.condition, cd, 'Condition');

      const photoNames = (raw.photos || '').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      const files: File[] = [];
      if (photoNames.length === 0) {
        warnings.push('No photos: you can add them after importing');
      } else if (photos.size === 0) {
        warnings.push('Photos are listed but not selected yet (step 3)');
      } else {
        photoNames.forEach((n) => {
          const f = photos.get(baseName(n));
          if (f) files.push(f);
          else warnings.push(`Photo "${n}" was not among the photos you selected`);
        });
      }
      if (files.length > MAX_PHOTOS) {
        warnings.push(`Only the first ${MAX_PHOTOS} photos are used`);
        files.length = MAX_PHOTOS;
      }

      if (title && price !== null) {
        const k = dupKey(title, price);
        if (existing.has(k)) errors.push('Already in your stock with the same title and price');
        else if (seen.has(k)) errors.push('Same title and price as an earlier row in this file');
        seen.add(k);
      }

      return {
        line, raw, title,
        description: raw.description || '',
        price, categoryId, makeId,
        model: raw.model || '',
        calibreId, conditionId,
        actionType: raw.action_type || '',
        barrelLength: raw.barrel_length || '',
        capacity: raw.capacity || '',
        licenceType: raw.licence_type || '',
        negotiable: parseYes(raw.negotiable || ''),
        photoNames, photos: files, errors, warnings,
      };
    });
  }, [table, makes, calibres, conditions, photos, existing]);

  const unusedPhotos = useMemo(() => {
    const used = new Set<string>();
    rows.forEach((r) => r.photoNames.forEach((n) => used.add(baseName(n))));
    return Array.from(photos.keys()).filter((k) => !used.has(k));
  }, [rows, photos]);

  const importable = rows.filter((r) => r.errors.length === 0);
  const withNotes = importable.filter((r) => r.warnings.length > 0).length;
  const blocked = rows.length - importable.length;

  // --- Import ---------------------------------------------------------------
  const runImport = async () => {
    if (!dealer || importable.length === 0) return;
    setNotice('');

    let list = importable;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: allow } = await supabase.rpc('listing_allowance', { p_user_id: user.id });
      if (allow && allow.unlimited !== true) {
        const left = Number(allow.remaining ?? 0);
        if (left <= 0) {
          setNotice(`Your listing allowance for this ${allow.period} is used up ` +
            `(${allow.used} of ${allow.allowance}). Upgrade your plan to import more.`);
          return;
        }
        if (list.length > left) {
          const go = confirm(`Your plan has room for ${left} more listing(s), but ` +
            `${list.length} items are ready.\n\nImport the first ${left} now?`);
          if (!go) return;
          list = list.slice(0, left);
        }
      }
    }

    setImporting(true);
    setProgress({ done: 0, total: list.length });
    const out: Result[] = [];

    // Four items at a time, each item's photos uploaded together: several
    // times faster than one by one, gentle enough on storage. The list was
    // already trimmed to the plan allowance, so this cannot overshoot it.
    const BATCH = 4;
    let done = 0;

    const importOne = async (r: Row): Promise<Result> => {
      const uploaded = await Promise.all(r.photos.map(async (f) => {
        const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${dealer.id}/${Date.now()}-` +
          `${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from('listings').upload(path, f, { cacheControl: '3600', upsert: false });
        if (error || !data) return null;
        return supabase.storage.from('listings').getPublicUrl(data.path).data.publicUrl;
      }));
      // Promise.all keeps the order, so the first photo stays the cover.
      const urls = uploaded.filter((u): u is string => !!u);
      const photoFail = uploaded.length - urls.length;

      const { data: ins, error } = await supabase.from('listings').insert({
        title: r.title,
        description: r.description,
        price: r.price,
        is_negotiable: r.negotiable,
        category_id: r.categoryId,
        make_id: r.makeId,
        model: r.model,
        calibre_id: r.calibreId,
        condition_id: r.conditionId,
        action_type: r.actionType,
        barrel_length: r.barrelLength,
        capacity: r.capacity,
        licence_type: r.licenceType,
        province_id: provinceId,
        city: dealer.city || '',
        status: 'active',
        images: urls,
        dealer_id: dealer.id,
        listing_type: 'dealer',
        views_count: 0,
        is_featured: false,
      }).select('id').single();

      if (error || !ins) {
        return { line: r.line, title: r.title, ok: false, raw: r.raw, photoCount: 0,
          message: friendly(error?.message || 'Not saved') };
      }
      return { line: r.line, title: r.title, ok: true, raw: r.raw, id: ins.id,
        photoCount: urls.length,
        message: photoFail ? `${photoFail} photo(s) did not upload` : 'Imported' };
    };

    for (let i = 0; i < list.length; i += BATCH) {
      const chunk = list.slice(i, i + BATCH);
      const settled = await Promise.allSettled(chunk.map(importOne));
      settled.forEach((s, j) => {
        const r = chunk[j];
        out.push(s.status === 'fulfilled' ? s.value : {
          line: r.line, title: r.title, ok: false, raw: r.raw, photoCount: 0,
          message: 'Unexpected error, please try again',
        });
      });
      done += chunk.length;
      setProgress({ done, total: list.length });
    }

    setResults(out);
    setImporting(false);
  };

  const downloadToFix = () => {
    const bad = [
      ...rows.filter((r) => r.errors.length).map((r) => ({ ...r.raw, problem: r.errors.join('; ') })),
      ...(results || []).filter((x) => !x.ok).map((x) => ({ ...x.raw, problem: x.message })),
    ];
    const ws = XLSX.utils.json_to_sheet(bad, { header: [...HEADERS, 'problem'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    XLSX.writeFile(wb, 'gunx-stock-to-fix.xlsx');
  };

  const reset = () => {
    setTable(null);
    setFileName('');
    setFileError('');
    setPhotos(new Map());
    setPhotoNotes([]);
    setResults(null);
    setNotice('');
    if (sheetInput.current) sheetInput.current.value = '';
    if (photoInput.current) photoInput.current.value = '';
  };

  // --- UI -------------------------------------------------------------------
  const card = 'bg-[#13151A] border border-white/5 rounded-sm p-4 sm:p-6';
  const stepTitle = 'text-[11px] font-black uppercase tracking-[2px] text-[#C9922A] mb-2';
  const btn = 'w-full sm:w-auto bg-[#C9922A] text-black font-black uppercase tracking-widest ' +
    'text-[12px] px-5 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-40';
  const btnGhost = 'w-full sm:w-auto border border-white/15 text-[#F0EDE8] font-black uppercase ' +
    'tracking-widest text-[12px] px-5 py-3 rounded-sm hover:bg-white/5 transition-all';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading...</p>
      </div>
    );
  }

  const ok = (results || []).filter((r) => r.ok);
  const failed = (results || []).filter((r) => !r.ok);
  const needPhotos = ok.filter((r) => r.photoCount === 0);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
        <div>
          <Link href="/dealer-dashboard" className="text-[12px] text-[#8A8E99] hover:text-[#C9922A]">
            &larr; Dealer dashboard
          </Link>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl sm:text-4xl font-black uppercase mt-2">
            Bulk <span className="text-[#C9922A]">upload</span>
          </h1>
          <p className="text-sm text-[#8A8E99] mt-1">
            Add many items at once from a spreadsheet, with their photos.
          </p>
        </div>

        {/* HOW IT WORKS */}
        <div className={card}>
          <p className={stepTitle}>How it works</p>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-[#C9CCD3] leading-relaxed">
            <li>Download the template and fill in one row per item. Title, price and category are required.</li>
            <li>
              In the <strong className="text-[#F0EDE8]">photos</strong> column, type the file names of that
              item&apos;s photos, separated by commas, e.g. <code className="text-[#C9922A]">g19-front.jpg, g19-side.jpg</code>.
              The first photo is the cover. Up to 5 per item.
            </li>
            <li>Choose your filled-in spreadsheet below.</li>
            <li>
              Select all your photos at once (open the folder and press Ctrl+A, or Cmd+A on a Mac).
              We match them to your items by file name. Capital letters do not matter.
            </li>
            <li>Check the preview, then press Import. Anything that cannot import comes back with the reason.</li>
          </ol>
        </div>

        {/* STEP 1 */}
        <div className={card}>
          <p className={stepTitle}>Step 1: Template</p>
          <p className="text-sm text-[#8A8E99] mb-4">
            The template has three tabs: Stock (fill this in), How to, and Valid values
            (the exact categories, makes, calibres and conditions we recognise).
          </p>
          <button onClick={downloadTemplate} className={btnGhost}>Download template (.xlsx)</button>
        </div>

        {/* STEP 2 */}
        <div className={card}>
          <p className={stepTitle}>Step 2: Your spreadsheet</p>
          <input ref={sheetInput} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => readSheet(e.target.files?.[0])} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button onClick={() => sheetInput.current?.click()} className={btn} disabled={importing}>
              {fileName ? 'Choose a different file' : 'Choose spreadsheet'}
            </button>
            {fileName && <span className="text-sm text-[#C9CCD3] break-all">{fileName}</span>}
          </div>
          {fileError && <p className="mt-3 text-sm text-[#E63946]">{fileError}</p>}
          {table && <p className="mt-3 text-sm text-[#8A8E99]">{rows.length} item(s) found.</p>}
        </div>

        {/* STEP 3 */}
        <div className={card}>
          <p className={stepTitle}>Step 3: Photos</p>
          <input ref={photoInput} type="file" multiple accept="image/jpeg,image/png,image/webp"
            className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addPhotos(e.dataTransfer.files); }}
            className={'border-2 border-dashed rounded-sm p-6 text-center transition-all ' +
              (dragging ? 'border-[#C9922A] bg-[#C9922A]/5' : 'border-white/10')}
          >
            <p className="text-sm text-[#C9CCD3] mb-3">Drag all your photos here, or</p>
            <button onClick={() => photoInput.current?.click()} className={btn} disabled={importing}>
              Select photos
            </button>
            <p className="text-[12px] text-[#8A8E99] mt-3">JPG, PNG or WEBP, up to 5MB each.</p>
          </div>
          {photos.size > 0 && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
              <span className="text-[#C9CCD3]">{photos.size} photo(s) selected.</span>
              <button onClick={() => { setPhotos(new Map()); setPhotoNotes([]); }}
                className="text-[#8A8E99] hover:text-[#E63946] text-left sm:ml-3 underline">
                Clear photos
              </button>
            </div>
          )}
          {photoNotes.length > 0 && (
            <ul className="mt-3 text-[12px] text-[#E8A33D] space-y-1">
              {photoNotes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          {table && unusedPhotos.length > 0 && (
            <p className="mt-3 text-[12px] text-[#E8A33D]">
              {unusedPhotos.length} photo(s) are not named in any row and will not be used:{' '}
              {unusedPhotos.slice(0, 8).join(', ')}{unusedPhotos.length > 8 ? '...' : ''}
            </p>
          )}
        </div>

        {/* STEP 4 */}
        {table && !results && (
          <div className={card}>
            <p className={stepTitle}>Step 4: Check and import</p>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm p-3">
                <p className="text-2xl font-black text-[#2A9C6E]">{importable.length - withNotes}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#8A8E99]">Ready</p>
              </div>
              <div className="bg-[#E8A33D]/10 border border-[#E8A33D]/30 rounded-sm p-3">
                <p className="text-2xl font-black text-[#E8A33D]">{withNotes}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#8A8E99]">With notes</p>
              </div>
              <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-sm p-3">
                <p className="text-2xl font-black text-[#E63946]">{blocked}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#8A8E99]">Will not import</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {rows.map((r) => {
                const bad = r.errors.length > 0;
                const note = !bad && r.warnings.length > 0;
                return (
                  <div key={r.line}
                    className={'border rounded-sm p-3 ' + (bad ? 'border-[#E63946]/40'
                      : note ? 'border-[#E8A33D]/30' : 'border-white/10')}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-[#8A8E99]">
                          Row {r.line} &middot;{' '}
                          <span className={bad ? 'text-[#E63946]' : note ? 'text-[#E8A33D]' : 'text-[#2A9C6E]'}>
                            {bad ? 'Will not import' : note ? 'Imports with notes' : 'Ready'}
                          </span>
                        </p>
                        <p className="text-sm font-bold truncate">{r.title || '(no title)'}</p>
                        <p className="text-[12px] text-[#8A8E99]">
                          {r.price !== null ? rand(r.price) : 'No price'}
                          {r.categoryId ? ` \u00b7 ${CATEGORIES.find((c) => c.id === r.categoryId)?.label}` : ''}
                        </p>
                      </div>
                    </div>
                    {r.photos.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {r.photos.map((f, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={thumbs.get(f)} alt="" loading="lazy" decoding="async"
                            className="w-12 h-12 object-cover rounded-sm border border-white/10" />
                        ))}
                      </div>
                    )}
                    {(r.errors.length > 0 || r.warnings.length > 0) && (
                      <ul className="mt-2 space-y-1 text-[12px]">
                        {r.errors.map((m) => <li key={m} className="text-[#E63946]">{m}</li>)}
                        {r.warnings.map((m) => <li key={m} className="text-[#E8A33D]">{m}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {notice && <p className="mt-4 text-sm text-[#E63946]">{notice}</p>}

            {importing ? (
              <div className="mt-5">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C9922A] transition-all"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                </div>
                <p className="text-sm text-[#8A8E99] mt-2">
                  Importing {progress.done} of {progress.total}... keep this page open.
                </p>
              </div>
            ) : (
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button onClick={runImport} className={btn} disabled={importable.length === 0}>
                  Import {importable.length} item(s)
                </button>
                {blocked > 0 && (
                  <button onClick={downloadToFix} className={btnGhost}>Download rows to fix</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* RESULTS */}
        {results && (
          <div className={card}>
            <p className={stepTitle}>Done</p>
            <p className="text-sm text-[#C9CCD3] mb-4">
              {ok.length} item(s) imported{failed.length + blocked > 0
                ? `, ${failed.length + blocked} not imported` : ''}.
            </p>

            {failed.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-2">Not saved</p>
                <ul className="space-y-1 text-[12px]">
                  {failed.map((f) => (
                    <li key={f.line} className="text-[#C9CCD3]">
                      Row {f.line}: {f.title} &middot; <span className="text-[#E63946]">{f.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {needPhotos.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#E8A33D] mb-2">
                  Needs photos ({needPhotos.length})
                </p>
                <ul className="space-y-1 text-[12px]">
                  {needPhotos.map((n) => (
                    <li key={n.id}>
                      <Link href={`/dealer-dashboard/add-listing?edit=${n.id}`}
                        className="text-[#C9922A] hover:brightness-125">
                        {n.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dealer-dashboard/inventory" className={btn + ' text-center'}>View inventory</Link>
              {failed.length + blocked > 0 && (
                <button onClick={downloadToFix} className={btnGhost}>Download rows to fix</button>
              )}
              <button onClick={reset} className={btnGhost}>Upload another file</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
