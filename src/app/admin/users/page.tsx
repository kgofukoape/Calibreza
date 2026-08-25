'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type UserRecord = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  email_confirmed_at: string | null;
  user_metadata: { full_name?: string };
};

type UserWithListings = UserRecord & {
  listingCount: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithListings[]>([]);
  const [filtered, setFiltered] = useState<UserWithListings[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithListings | null>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [modMsg, setModMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('gunx_admin_session');
      if (session !== 'authenticated') { router.push('/admin/login'); return; }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (search) {
      result = result.filter((u) =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.user_metadata?.full_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, users]);

  const loadUsers = async () => {
    // Get users from auth via admin API
    // Since we're using anon key we query the users table instead
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('member_since', { ascending: false });

    if (!usersData) { setLoading(false); return; }

    // Get listing counts per user
    const { data: listingCounts } = await supabase
      .from('listings')
      .select('seller_id');

    const countMap: Record<string, number> = {};
    listingCounts?.forEach((l) => {
      if (l.seller_id) countMap[l.seller_id] = (countMap[l.seller_id] || 0) + 1;
    });

    const enriched = usersData.map((u: any) => ({
      ...u,
      listingCount: countMap[u.id] || 0,
    }));

    setUsers(enriched);
    setFiltered(enriched);
    setLoading(false);
  };

  const loadUserListings = async (userId: string) => {
    setLoadingListings(true);
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, status, category_id, created_at')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
    setUserListings(data || []);
    setLoadingListings(false);
  };

  const handleSelectUser = (user: UserWithListings) => {
    setSelectedUser(user);
    loadUserListings(user.id);
  };

  // Members had no way to be restricted at all — the users table had no status
  // column until now. Suspension hides their listings from buyers; nothing is
  // deleted, and reinstating restores exactly what the suspension hid.
  const handleSuspendUser = async (user: any) => {
    const isSuspended = user.status === 'suspended';
    const label = user.email || 'this member';
    let reason = '';

    if (!isSuspended) {
      const input = prompt(
        `Suspend ${label}?\n\n` +
        `Their listings will be hidden from buyers. Nothing is deleted.\n\n` +
        `Reason (required — recorded in the audit trail):`
      );
      if (input === null) return;
      if (input.trim().length < 3) {
        setModMsg({ kind: 'err', text: 'A reason is required to suspend an account.' });
        return;
      }
      reason = input.trim();
    } else if (!confirm(`Reinstate ${label}? Listings hidden by the suspension will be restored.`)) return;

    setActionLoading(user.id);
    setModMsg(null);
    try {
      const res = await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'user',
          entityId: user.id,
          action: isSuspended ? 'reinstate' : 'suspend',
          reason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setModMsg({ kind: 'ok', text: data.message || 'Done.' });
        const patch = {
          status: data.status,
          suspended_reason: data.suspended_reason ?? null,
          suspended_at: data.suspended_at ?? null,
        };
        setUsers(prev => prev.map(u => u.id === user.id ? ({ ...u, ...patch } as any) : u));
        if (selectedUser?.id === user.id) {
          setSelectedUser(prev => prev ? ({ ...prev, ...patch } as any) : prev);
        }
        if (selectedUser?.id === user.id) loadUserListings(user.id);
      } else {
        setModMsg({ kind: 'err', text: data.error || 'Something went wrong.' });
      }
    } catch {
      setModMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setActionLoading(null);
  };

  // ── DELETE AN ACCOUNT ───────────────────────────────────────────────────
  // This used to delete the user's listings directly and then the user, both
  // with the anon key. The users table has no DELETE policy, so the account
  // deletion silently did nothing — while the listings deletion could well
  // succeed first. The outcome was the worst available: a seller whose entire
  // stock had been destroyed, still holding an account.
  //
  // /api/admin/account holds the service key and deletes the auth user, which
  // cascades to the profile and everything keyed to it. Listings are not
  // deleted separately — they either cascade or are deliberately kept.
  const handleDeleteUser = async (userId: string) => {
    const reason = prompt(
      'Deleting an account is permanent. Why is it being deleted?\n\n' +
      '(Recorded in the audit log. At least 5 characters.)',
    );
    if (!reason || reason.trim().length < 5) return;

    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      setConfirmDelete(null);
    } catch (err: any) {
      alert(`Could not delete the account: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── PASSWORD RESET ──────────────────────────────────────────────────────
  // Sends a recovery link. Deliberately cannot set a password: an administrator
  // who can do that can enter any account, which removes your ability to say
  // the account holder must have acted themselves.
  const handleSendReset = async (email: string) => {
    setActionLoading(email);
    try {
      const res = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reset_link', email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send');
      alert(json.message);
    } catch (err: any) {
      alert(`Could not send the reset link: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Archives rather than deletes, matching /admin/listings: the record, the
  // seller's history and any enquiry trail survive, and the listing leaves the
  // public site immediately because the read policy is status = 'active'.
  const handleDeleteListing = async (listingId: string) => {
    try {
      const res = await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'listing', entityId: listingId,
          action: 'set_status', status: 'archived',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not archive');
    } catch (err: any) {
      alert(`Could not remove the listing: ${err.message}`);
      return;
    }
    setUserListings((prev) => prev.filter((l) => l.id !== listingId));
    if (selectedUser) {
      setUsers((prev) => prev.map((u) => u.id === selectedUser.id
        ? { ...u, listingCount: u.listingCount - 1 }
        : u
      ));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gunx_admin_session');
    router.push('/admin/login');
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const formatCategory = (cat: string) => cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

  const getInitial = (user: any) => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getName = (user: any) => user?.full_name || user?.email?.split('@')[0] || 'Unknown User';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Sidebar = () => (
    <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs">K</div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
            <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Main</p>
        <ul className="space-y-1">
          {[
            { href: '/admin', icon: '⚡', label: 'Overview' },
            { href: '/admin/dealers', icon: '🏪', label: 'Dealers' },
            { href: '/admin/listings', icon: '📋', label: 'Listings' },
            { href: '/admin/users', icon: '👥', label: 'Users', active: true },
            { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                item.active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
          <ul className="space-y-1">
            <li><Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"><span>🌐</span><span>View Site</span></Link></li>
            <li><Link href="https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"><span>🗄️</span><span>Supabase</span></Link></li>
          </ul>
        </div>
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
          <span>🚪</span><span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] overflow-y-auto">

        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
            User <span className="text-[#E63946]">Management</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            {users.length} registered users
          </p>
        </header>

        <div className="flex h-[calc(100vh-73px)]">

          {/* LEFT — User List */}
          <div className="w-[380px] flex-shrink-0 border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#080B12] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E63946]/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No users found</p>
                  <p className="text-white/20 text-xs mt-2">Users appear here after registering on the site</p>
                </div>
              ) : (
                filtered.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full text-left px-4 py-4 hover:bg-white/5 transition-all ${
                      selectedUser?.id === user.id ? 'bg-[#E63946]/5 border-l-2 border-[#E63946]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#4CC9F0]/10 border border-[#4CC9F0]/20 flex items-center justify-center text-[#4CC9F0] font-black text-sm flex-shrink-0">
                        {getInitial(user)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{getName(user)}</p>
                        <p className="text-[10px] text-white/40 truncate">{(user as any).email || '—'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-[#4CC9F0]/10 text-[#4CC9F0]">
                          {user.listingCount} listings
                        </span>
                        <span className="text-[8px] text-white/20">
                          {formatDate((user as any).member_since || user.created_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — User Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedUser ? (
              <div className="p-6 space-y-6">

                {/* User Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#4CC9F0]/10 border border-[#4CC9F0]/20 flex items-center justify-center text-[#4CC9F0] font-black text-2xl">
                      {getInitial(selectedUser)}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                        {getName(selectedUser)}
                      </h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest">
                        {(selectedUser as any).email}
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        Joined {formatDate((selectedUser as any).member_since || selectedUser.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {confirmDelete === selectedUser.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteUser(selectedUser.id)}
                          disabled={actionLoading === selectedUser.id}
                          className="text-[10px] font-black uppercase tracking-widest text-white bg-[#E63946] px-3 py-2 rounded-sm hover:brightness-110 transition-all disabled:opacity-40"
                        >
                          {actionLoading === selectedUser.id ? '...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-3 py-2 rounded-sm hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                      {modMsg && (
                        <div className={`w-full p-2 rounded-sm text-[11px] font-bold border mb-2 ${
                          modMsg.kind === 'ok'
                            ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                            : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
                        }`}>{modMsg.text}</div>
                      )}
                      <button
                        onClick={() => handleSuspendUser(selectedUser)}
                        disabled={actionLoading === selectedUser.id}
                        className={`text-[10px] font-black uppercase tracking-widest border px-3 py-2 rounded-sm transition-all disabled:opacity-40 mr-2 ${
                          (selectedUser as any).status === 'suspended'
                            ? 'text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/10'
                            : 'text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/10'
                        }`}
                      >
                        {actionLoading === selectedUser.id
                          ? '...'
                          : (selectedUser as any).status === 'suspended' ? '✓ Reinstate' : '⊘ Suspend'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(selectedUser.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-2 rounded-sm hover:bg-[#E63946]/10 transition-all"
                      >
                        Delete User
                      </button>
                      </>
                    )}
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Listings', value: selectedUser.listingCount, color: 'text-[#4CC9F0]' },
                    // province_id and user_type were dropped: nothing ever wrote
                    // to them, so this panel showed a dash and "private" for
                    // every user regardless of who they were. The live fields
                    // are province (written at signup) and account_type
                    // (personal or business).
                    { label: 'Province', value: (selectedUser as any).province || '—', color: 'text-white' },
                    { label: 'Account Type', value: (selectedUser as any).account_type || 'personal', color: 'text-[#10B981]' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#0D1420] border border-white/5 rounded-sm p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.label}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-2xl font-black uppercase ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* User's Listings */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white">
                      User's <span className="text-[#4CC9F0]">Listings</span>
                      <span className="ml-2 text-white/30">({userListings.length})</span>
                    </h3>
                  </div>

                  {loadingListings ? (
                    <div className="p-8 text-center text-white/30 text-sm">Loading...</div>
                  ) : userListings.length === 0 ? (
                    <div className="p-8 text-center text-white/30 text-sm">No listings from this user</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {userListings.map((listing) => (
                        <div key={listing.id} className="px-5 py-3 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{listing.title}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">
                              {formatCategory(listing.category_id)} · R {listing.price?.toLocaleString('en-ZA')} · {formatDate(listing.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                              listing.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/40'
                            }`}>
                              {listing.status}
                            </span>
                            <Link
                              href={`/listings/${listing.id}`}
                              target="_blank"
                              className="text-[9px] font-black uppercase text-[#4CC9F0] hover:brightness-125 transition-all"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="text-[9px] font-black uppercase text-[#E63946] hover:brightness-125 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">👥</div>
                  <p className="text-white/30 font-black uppercase tracking-widest text-sm">Select a user to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}