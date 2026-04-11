'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

const CATEGORY_OPTIONS = [
  'pistols', 'rifles', 'shotguns', 'revolvers',
  'air-guns', 'airsoft', 'knives', 'holsters',
  'magazines', 'ammunition', 'reloading',
];

const SAMPLE_ROWS = [
  {
    title: 'Glock 19 Gen 5 — Excellent Condition',
    description: 'Comes with 3 magazines and original case',
    price: 12500,
    category_id: 'pistols',
    make: 'Glock',
    model: '19 Gen 5',
    calibre: '9mm Luger (9x19mm)',
    condition: 'Like New',
    action_type: 'Semi-Auto',
    barrel_length: '102mm',
    capacity: '15+1',
    licence_type: 'Section 13',
    is_negotiable: 'false',
  },
  {
    title: 'Remington 700 Hunting Rifle with Scope',
    description: 'Bolt action hunting rifle, lightly used',
    price: 18000,
    category_id: 'rifles',
    make: 'Remington',
    model: '700',
    calibre: '.308 Winchester',
    condition: 'Good',
    action_type: 'Bolt Action',
    barrel_length: '610mm',
    capacity: '5',
    licence_type: 'Section 13',
    is_negotiable: 'true',
  },
  {
    title: 'Mossberg 500 Pump Action Shotgun',
    description: 'Great home defence shotgun, barely used',
    price: 9500,
    category_id: 'shotguns',
    make: 'Mossberg',
    model: '500',
    calibre: '12 Gauge',
    condition: 'Good',
    action_type: 'Pump Action',
    barrel_length: '470mm',
    capacity: '6+1',
    licence_type: 'Section 13',
    is_negotiable: 'false',
  },
  {
    title: 'Smith & Wesson Model 686 Revolver',
    description: 'Classic 357 Magnum revolver in excellent condition',
    price: 15000,
    category_id: 'revolvers',
    make: 'Smith & Wesson',
    model: '686',
    calibre: '.357 Magnum',
    condition: 'Like New',
    action_type: 'Double Action',
    barrel_length: '152mm',
    capacity: '6',
    licence_type: 'Section 13',
    is_negotiable: 'false',
  },
  {
    title: 'Diana 350 Magnum Air Rifle',
    description: 'Powerful spring piston air rifle for pest control',
    price: 3200,
    category_id: 'air-guns',
    make: 'Diana',
    model: '350 Magnum',
    calibre: '.177',
    condition: 'Good',
    action_type: 'Spring Piston',
    barrel_length: '480mm',
    capacity: '1',
    licence_type: 'No Licence Required',
    is_negotiable: 'true',
  },
  {
    title: 'Tokyo Marui M4 Airsoft Rifle',
    description: 'High quality AEG airsoft rifle with extras',
    price: 4500,
    category_id: 'airsoft',
    make: 'Tokyo Marui',
    model: 'M4A1',
    calibre: '6mm BB',
    condition: 'Like New',
    action_type: 'AEG',
    barrel_length: '363mm',
    capacity: '300',
    licence_type: 'No Licence Required',
    is_negotiable: 'false',
  },
  {
    title: 'Benchmade Griptilian Folding Knife',
    description: 'USA made folding knife, excellent EDC option',
    price: 2800,
    category_id: 'knives',
    make: 'Benchmade',
    model: 'Griptilian 551',
    calibre: '',
    condition: 'Brand New',
    action_type: '',
    barrel_length: '',
    capacity: '',
    licence_type: '',
    is_negotiable: 'false',
  },
  {
    title: 'Safariland Level 3 Duty Holster — Glock 17',
    description: 'ALS/SLS retention holster, right hand',
    price: 1800,
    category_id: 'holsters',
    make: 'Safariland',
    model: '6360',
    calibre: '',
    condition: 'Brand New',
    action_type: '',
    barrel_length: '',
    capacity: '',
    licence_type: '',
    is_negotiable: 'false',
  },
  {
    title: 'Glock 17 OEM 17-Round Magazine',
    description: 'Factory original Glock magazine, 9mm',
    price: 650,
    category_id: 'magazines',
    make: 'Glock',
    model: '17 Magazine',
    calibre: '9mm Luger (9x19mm)',
    condition: 'Brand New',
    action_type: '',
    barrel_length: '',
    capacity: '17',
    licence_type: '',
    is_negotiable: 'false',
  },
  {
    title: 'Winchester 9mm FMJ 115gr — 50 Rounds',
    description: 'Full metal jacket range ammunition',
    price: 380,
    category_id: 'ammunition',
    make: 'Winchester',
    model: 'USA Forged',
    calibre: '9mm Luger (9x19mm)',
    condition: 'Brand New',
    action_type: '',
    barrel_length: '',
    capacity: '50',
    licence_type: '',
    is_negotiable: 'false',
  },
  {
    title: 'Dillon Precision RL550C Reloading Press',
    description: 'Progressive reloading press, complete setup',
    price: 12000,
    category_id: 'reloading',
    make: 'Dillon Precision',
    model: 'RL550C',
    calibre: '',
    condition: 'Good',
    action_type: '',
    barrel_length: '',
    capacity: '',
    licence_type: '',
    is_negotiable: 'true',
  },
];

type ParsedRow = {
  title: string;
  description: string;
  price: string;
  category_id: string;
  make: string;
  model: string;
  calibre: string;
  condition: string;
  action_type: string;
  barrel_length: string;
  capacity: string;
  licence_type: string;
  is_negotiable: string;
  _error?: string;
};

type Dealer = {
  id: string;
  business_name: string;
  slug: string;
  subscription_tier: string;
  status: string;
  city: string;
  province: string;
};

export default function BulkUploadPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);

  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }

    const { data: dealerData } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!dealerData || dealerData.status !== 'approved') {
      router.push('/dealer/login');
      return;
    }

    setDealer(dealerData);
    await loadLookups();
    setLoading(false);
  };

  const loadLookups = async () => {
    const [makesRes, calibresRes, conditionsRes] = await Promise.all([
      supabase.from('makes').select('id, name').order('name'),
      supabase.from('calibres').select('id, name').order('name'),
      supabase.from('conditions').select('id, name').order('name'),
    ]);
    setMakes(makesRes.data || []);
    setCalibres(calibresRes.data || []);
    setConditions(conditionsRes.data || []);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // SHEET 1 — Template with sample rows
    const templateData = [
      [
        'title', 'description', 'price', 'category_id', 'make', 'model',
        'calibre', 'condition', 'action_type', 'barrel_length', 'capacity',
        'licence_type', 'is_negotiable',
      ],
      ...SAMPLE_ROWS.map((row) => [
        row.title, row.description, row.price, row.category_id, row.make,
        row.model, row.calibre, row.condition, row.action_type,
        row.barrel_length, row.capacity, row.licence_type, row.is_negotiable,
      ]),
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(templateData);

    // Column widths for Sheet 1
    ws1['!cols'] = [
      { wch: 40 }, // title
      { wch: 40 }, // description
      { wch: 10 }, // price
      { wch: 15 }, // category_id
      { wch: 20 }, // make
      { wch: 20 }, // model
      { wch: 25 }, // calibre
      { wch: 12 }, // condition
      { wch: 15 }, // action_type
      { wch: 14 }, // barrel_length
      { wch: 10 }, // capacity
      { wch: 15 }, // licence_type
      { wch: 14 }, // is_negotiable
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Template');

    // SHEET 2 — Valid Values reference
    const maxLen = Math.max(makes.length, calibres.length, conditions.length, CATEGORY_OPTIONS.length);

    const validValuesData = [
      ['MAKES', 'CALIBRES', 'CONDITIONS', 'CATEGORY IDs'],
      ...Array.from({ length: maxLen }, (_, i) => [
        makes[i]?.name || '',
        calibres[i]?.name || '',
        conditions[i]?.name || '',
        CATEGORY_OPTIONS[i] || '',
      ]),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(validValuesData);

    ws2['!cols'] = [
      { wch: 30 }, // makes
      { wch: 30 }, // calibres
      { wch: 20 }, // conditions
      { wch: 20 }, // categories
    ];

    XLSX.utils.book_append_sheet(wb, ws2, 'Valid Values');

    // Download
    XLSX.writeFile(wb, 'gunx_bulk_upload_template.xlsx');
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      const errors: string[] = [];
      if (!row.title) errors.push('Title is required');
      if (!row.price || isNaN(parseFloat(row.price))) errors.push('Valid price is required');
      if (!row.category_id || !CATEGORY_OPTIONS.includes(row.category_id)) {
        errors.push(`Category must be one of: ${CATEGORY_OPTIONS.join(', ')}`);
      }

      if (errors.length > 0) row._error = errors.join(' | ');
      rows.push(row as ParsedRow);
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.endsWith('.csv');
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isXLSX) {
      setParseError('Please upload a .csv or .xlsx file only.');
      return;
    }

    setCsvFile(file);
    setParseError('');
    setParsedRows([]);
    setUploadResults(null);

    if (isXLSX) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          const rows: ParsedRow[] = json.map((row: any) => {
            const errors: string[] = [];
            if (!row.title) errors.push('Title is required');
            if (!row.price || isNaN(parseFloat(String(row.price)))) errors.push('Valid price is required');
            if (!row.category_id || !CATEGORY_OPTIONS.includes(String(row.category_id))) {
              errors.push(`Category must be one of: ${CATEGORY_OPTIONS.join(', ')}`);
            }
            return {
              title: String(row.title || ''),
              description: String(row.description || ''),
              price: String(row.price || ''),
              category_id: String(row.category_id || ''),
              make: String(row.make || ''),
              model: String(row.model || ''),
              calibre: String(row.calibre || ''),
              condition: String(row.condition || ''),
              action_type: String(row.action_type || ''),
              barrel_length: String(row.barrel_length || ''),
              capacity: String(row.capacity || ''),
              licence_type: String(row.licence_type || ''),
              is_negotiable: String(row.is_negotiable || 'false'),
              _error: errors.length > 0 ? errors.join(' | ') : undefined,
            };
          });

          if (rows.length === 0) {
            setParseError('No data rows found. Please check the file.');
            return;
          }
          setParsedRows(rows);
          setStep(2);
        } catch {
          setParseError('Failed to parse Excel file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        try {
          const rows = parseCSV(text);
          if (rows.length === 0) {
            setParseError('No data rows found. Please check the file.');
            return;
          }
          setParsedRows(rows);
          setStep(2);
        } catch {
          setParseError('Failed to parse CSV. Please check the format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const findId = (list: any[], name: string): string | null => {
    const found = list.find((item) =>
      item.name.toLowerCase() === name.toLowerCase()
    );
    return found?.id || null;
  };

  const handleUpload = async () => {
    if (!dealer || parsedRows.length === 0) return;
    const validRows = parsedRows.filter((r) => !r._error);
    if (validRows.length === 0) return;

    setUploading(true);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      try {
        const makeId = findId(makes, row.make);
        const calibreId = findId(calibres, row.calibre);
        const conditionId = findId(conditions, row.condition);

        const { error } = await supabase.from('listings').insert({
          title: row.title,
          description: row.description || '',
          price: parseFloat(row.price),
          is_negotiable: row.is_negotiable === 'true',
          category_id: row.category_id,
          make_id: makeId,
          model: row.model || '',
          calibre_id: calibreId,
          condition_id: conditionId,
          action_type: row.action_type || '',
          barrel_length: row.barrel_length || '',
          capacity: row.capacity || '',
          licence_type: row.licence_type || '',
          city: dealer.city || '',
          province_id: null,
          dealer_id: dealer.id,
          listing_type: 'dealer',
          status: 'active',
          images: [],
          views_count: 0,
          is_featured: false,
        });

        if (error) { failed++; } else { success++; }
      } catch { failed++; }
    }

    setUploadResults({ success, failed });
    setUploading(false);
    setStep(3);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  const validRows = parsedRows.filter((r) => !r._error);
  const errorRows = parsedRows.filter((r) => r._error);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-[#C9922A] text-xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#13151A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start group">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors">
              GUN <span className="text-[#C9922A] group-hover:text-[#F0EDE8]">X</span>
            </span>
            <span className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Dealer Dashboard</span>
          </Link>
        </div>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C9922A] flex items-center justify-center text-black text-xl font-black rounded-sm">
              {dealer?.business_name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{dealer?.business_name}</h3>
              <p className="text-xs text-[#8A8E99] uppercase tracking-wider">{dealer?.subscription_tier || 'Free'} Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/dealer-dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📊</span><span>Overview</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📦</span><span>Inventory</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/add-listing" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>➕</span><span>Add Listing</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/bulk-upload" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm">
                <span>📁</span><span>Bulk Upload</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/analytics" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📈</span><span>Analytics</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/subscription" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>💳</span><span>Subscription</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⚙️</span><span>Profile</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/promote" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⭐</span><span>Promote Listings</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href={`/dealers/${dealer?.slug}`} target="_blank" className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">
            View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">

        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight">
              Bulk <span className="text-[#C9922A]">Upload</span>
            </h1>
            <p className="text-[#8A8E99] text-sm mt-1">Import multiple listings at once using a CSV or Excel file.</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-[#C9922A] text-black px-5 py-2.5 rounded-sm text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all"
          >
            ⬇️ Download Template
          </button>
        </header>

        <div className="p-8 space-y-8 max-w-5xl">

          {/* Step Indicator */}
          <div className="flex items-center gap-0">
            {[
              { num: 1, label: 'Upload File' },
              { num: 2, label: 'Review Data' },
              { num: 3, label: 'Results' },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black transition-all ${
                    step >= s.num ? 'bg-[#C9922A] text-black' : 'bg-white/10 text-[#8A8E99]'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${
                    step >= s.num ? 'text-[#F0EDE8]' : 'text-[#8A8E99]'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-px mx-4 ${step > s.num ? 'bg-[#C9922A]' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1 — Upload */}
          {step === 1 && (
            <div className="space-y-6">

              {/* Instructions */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">
                  How It <span className="text-[#C9922A]">Works</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { step: '1', icon: '⬇️', title: 'Download Template', desc: 'Get our Excel template. Sheet 1 has sample data, Sheet 2 has all valid values for makes, calibres and conditions.' },
                    { step: '2', icon: '✏️', title: 'Fill In Your Data', desc: 'Replace the sample rows with your listings. Use the Valid Values sheet as reference. No serial numbers required.' },
                    { step: '3', icon: '📤', title: 'Upload & Review', desc: 'Upload your completed file (.csv or .xlsx), review the parsed data, then confirm the import.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-8 h-8 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center text-[#C9922A] font-black text-sm flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <div className="text-lg mb-1">{item.icon}</div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-[#F0EDE8] mb-1">{item.title}</h3>
                        <p className="text-xs text-[#8A8E99] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CSV Fields Reference */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">
                  Field <span className="text-[#C9922A]">Reference</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { field: 'title', required: true, note: 'Full listing title' },
                    { field: 'description', required: false, note: 'Listing description' },
                    { field: 'price', required: true, note: 'Number only e.g. 12500' },
                    { field: 'category_id', required: true, note: CATEGORY_OPTIONS.join(', ') },
                    { field: 'make', required: false, note: 'Brand name — see Valid Values sheet' },
                    { field: 'model', required: false, note: 'e.g. 19 Gen 5' },
                    { field: 'calibre', required: false, note: 'See Valid Values sheet' },
                    { field: 'condition', required: false, note: 'Brand New, Like New, Good, Fair' },
                    { field: 'action_type', required: false, note: 'e.g. Semi-Auto, Bolt Action' },
                    { field: 'barrel_length', required: false, note: 'e.g. 102mm' },
                    { field: 'capacity', required: false, note: 'e.g. 15+1' },
                    { field: 'licence_type', required: false, note: 'e.g. Section 13' },
                    { field: 'is_negotiable', required: false, note: 'true or false' },
                  ].map((f) => (
                    <div key={f.field} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <code className="text-[11px] font-black text-[#C9922A] bg-[#C9922A]/10 px-2 py-0.5 rounded-sm">
                          {f.field}
                        </code>
                        {f.required && (
                          <span className="text-[9px] font-black uppercase text-red-400 border border-red-400/30 px-1.5 py-0.5 rounded-sm">Required</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8A8E99] leading-relaxed">{f.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Area */}
              {parseError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 font-bold text-sm">
                  ❌ {parseError}
                </div>
              )}

              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">
                  Upload <span className="text-[#C9922A]">Your File</span>
                </h2>
                <label className="flex flex-col items-center justify-center w-full h-[160px] border-2 border-dashed border-white/10 rounded-sm cursor-pointer hover:border-[#C9922A]/30 transition-all">
                  <span className="text-4xl mb-3">📁</span>
                  <p className="text-sm font-bold text-[#F0EDE8] mb-1">Click to upload your file</p>
                  <p className="text-xs text-[#8A8E99]">.csv or .xlsx · Max 5MB</p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 2 — Review */}
          {step === 2 && (
            <div className="space-y-6">

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-4 text-center">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#F0EDE8]">{parsedRows.length}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">Total Rows</div>
                </div>
                <div className="bg-[#13151A] border border-[#2A9C6E]/20 rounded-sm p-4 text-center">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#2A9C6E]">{validRows.length}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">Valid</div>
                </div>
                <div className="bg-[#13151A] border border-red-500/20 rounded-sm p-4 text-center">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-red-400">{errorRows.length}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">Errors</div>
                </div>
              </div>

              {errorRows.length > 0 && (
                <div className="bg-[#13151A] border border-red-500/20 rounded-sm p-6">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4 text-red-400">
                    ❌ Rows with Errors ({errorRows.length})
                  </h2>
                  <div className="space-y-3">
                    {errorRows.map((row, i) => (
                      <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-sm p-3">
                        <p className="text-sm font-bold text-[#F0EDE8] mb-1">{row.title || `Row ${i + 1}`}</p>
                        <p className="text-xs text-red-400">{row._error}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#8A8E99] mt-4">These rows will be skipped. Only valid rows will be imported.</p>
                </div>
              )}

              {validRows.length > 0 && (
                <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#2A9C6E]">
                      ✅ Valid Rows — Ready to Import ({validRows.length})
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#0D0F13]">
                          {['Title', 'Category', 'Price', 'Make', 'Model', 'Condition'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.map((row, i) => (
                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                            <td className="px-4 py-3 font-bold text-[#F0EDE8] max-w-[200px] truncate">{row.title}</td>
                            <td className="px-4 py-3 text-[#8A8E99]">{row.category_id}</td>
                            <td className="px-4 py-3 font-black text-[#C9922A]">R {parseFloat(row.price).toLocaleString('en-ZA')}</td>
                            <td className="px-4 py-3 text-[#8A8E99]">{row.make || '—'}</td>
                            <td className="px-4 py-3 text-[#8A8E99]">{row.model || '—'}</td>
                            <td className="px-4 py-3 text-[#8A8E99]">{row.condition || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setStep(1); setCsvFile(null); setParsedRows([]); setParseError(''); }}
                  className="px-6 py-3 border border-white/10 rounded-sm text-sm font-black uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 transition-all"
                >
                  ← Upload Different File
                </button>
                {validRows.length > 0 && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? `Importing ${validRows.length} listings...` : `Import ${validRows.length} Listing${validRows.length !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — Results */}
          {step === 3 && uploadResults && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-12">
                <div className="text-6xl mb-6">
                  {uploadResults.failed === 0 ? '✅' : uploadResults.success === 0 ? '❌' : '⚠️'}
                </div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-6">
                  Import <span className="text-[#C9922A]">Complete</span>
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/20 rounded-sm p-4">
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-[#2A9C6E]">
                      {uploadResults.success}
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">Successfully Imported</div>
                  </div>
                  <div className={`border rounded-sm p-4 ${uploadResults.failed > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-4xl font-black ${uploadResults.failed > 0 ? 'text-red-400' : 'text-[#8A8E99]'}`}>
                      {uploadResults.failed}
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">Failed</div>
                  </div>
                </div>
                <p className="text-[#8A8E99] text-sm mb-8">
                  {uploadResults.success > 0
                    ? `${uploadResults.success} listing${uploadResults.success !== 1 ? 's' : ''} added to your inventory as active. You can add images from the inventory page.`
                    : 'No listings were imported. Please check your file and try again.'}
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/dealer-dashboard/inventory"
                    className="bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all"
                  >
                    View Inventory
                  </Link>
                  <button
                    onClick={() => { setStep(1); setCsvFile(null); setParsedRows([]); setUploadResults(null); setParseError(''); }}
                    className="border border-white/10 text-[#8A8E99] px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:bg-white/5 transition-all"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}