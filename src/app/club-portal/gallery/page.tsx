'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, Notice, goldBtn } from '@/components/club-portal/ui';

const MAX = 10;

export default function ClubPortalGallery() {
  const { club, readOnly, reload } = useClubPortal();
  const images: string[] = club.images || [];
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const save = async (next: string[]) => {
    const { error } = await supabase.from('shooting_clubs').update({ images: next }).eq('id', club.id);
    if (error) throw new Error(error.message);
    await reload();
  };

  const add = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMsg(null);
    const room = MAX - images.length;
    const picked = Array.from(files).slice(0, room);
    if (picked.length === 0) {
      setMsg({ kind: 'err', text: `The gallery holds ${MAX} photos. Remove one to add another.` });
      return;
    }
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of picked) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5MB.`);
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `gallery/${club.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from('club-images').upload(path, file);
        if (error) throw new Error(error.message);
        urls.push(supabase.storage.from('club-images').getPublicUrl(path).data.publicUrl);
      }
      await save([...images, ...urls]);
      const skipped = files.length - picked.length;
      setMsg({ kind: 'ok', text: `Added ${urls.length} photo${urls.length === 1 ? '' : 's'}.` +
        (skipped > 0 ? ` ${skipped} not added: the gallery holds ${MAX}.` : '') });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'Could not add photos.' });
    }
    setBusy(false);
  };

  const remove = async (url: string) => {
    if (!confirm('Remove this photo from your gallery?')) return;
    setBusy(true);
    setMsg(null);
    try {
      await save(images.filter((u) => u !== url));
      const marker = '/club-images/';
      const at = url.indexOf(marker);
      if (at > -1) await supabase.storage.from('club-images').remove([url.slice(at + marker.length)]);
      setMsg({ kind: 'ok', text: 'Photo removed.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'Could not remove the photo.' });
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <PortalTitle a="Club" b="gallery" sub={`Shoot days, your range, your members in action. Up to ${MAX} photos, 5MB each.`} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Panel title={`Photos (${images.length} of ${MAX})`}>
        {images.length === 0 ? (
          <p className="text-[13px] text-[#8A8E99] mb-4">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {images.map((url) => (
              <div key={url} className="relative group aspect-square bg-[#0D0F13] rounded-sm overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {!readOnly && (
                  <button onClick={() => remove(url)} disabled={busy}
                    className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!readOnly && images.length < MAX && (
          <label className={`${goldBtn} inline-block cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
            {busy ? 'Uploading...' : 'Add photos'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
          </label>
        )}
      </Panel>
    </div>
  );
}
