'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, Notice, inputCls, labelCls, goldBtn, ghostBtn } from '@/components/club-portal/ui';

export default function ClubPortalSettings() {
  const router = useRouter();
  const { email, club } = useClubPortal();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const changePassword = async () => {
    setMsg(null);
    if (pw.length < 8) return setMsg({ kind: 'err', text: 'Use at least 8 characters.' });
    if (pw !== pw2) return setMsg({ kind: 'err', text: 'The two passwords do not match.' });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ kind: 'err', text: error.message });
    setPw('');
    setPw2('');
    setMsg({ kind: 'ok', text: 'Password changed.' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/business/login');
  };

  return (
    <div className="flex flex-col gap-5 max-w-[640px]">
      <PortalTitle a="Account" b="settings" />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Panel title="Login">
        <p className={labelCls}>Login email</p>
        <p className="text-[14px] mb-3">{email}</p>
        <p className="text-[12px] text-[#8A8E99] leading-relaxed">
          To change the login email or the club name ({club.name}), email{' '}
          <a className="text-[#C9922A]" href="mailto:support@gunx.co.za">support@gunx.co.za</a>.
        </p>
      </Panel>
      <Panel title="Change password">
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" className={inputCls} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          <div><button onClick={changePassword} disabled={busy} className={goldBtn}>{busy ? 'Saving...' : 'Change password'}</button></div>
        </div>
      </Panel>
      <div><button onClick={signOut} className={ghostBtn}>Sign out</button></div>
    </div>
  );
}
