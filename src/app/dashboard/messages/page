'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

type Message = {
  id: string;
  listing_id: string | null;
  sender_id: string;
  recipient_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  listing?: { title: string; images: string[] } | null;
};

type Thread = {
  other_user_id: string;
  other_user_name: string;
  listing_id: string | null;
  listing_title: string | null;
  listing_image: string | null;
  last_message: string;
  last_at: string;
  unread_count: number;
  messages: Message[];
};

export default function DashboardMessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getCurrentUser().then(u => {
      if (!mounted) return;
      if (!u) { router.push('/login'); return; }
      setUser(u);
      userIdRef.current = u.id;
      loadMessages(u.id);
      setupSubscription(u.id);
    });

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages]);

  const setupSubscription = (userId: string) => {
    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`inbox_${userId}_${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_messages',
        filter: `recipient_id=eq.${userId}`,
      }, () => {
        if (userIdRef.current) loadMessages(userIdRef.current);
      })
      .subscribe();

    channelRef.current = channel;
  };

  const loadMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_messages')
      .select('*, listing:listing_id(title, images)')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (error || !data) { setLoading(false); return; }

    const profileMap: Record<string, { full_name: string; email: string }> = {};
    data.forEach(m => {
      profileMap[m.sender_id] = profileMap[m.sender_id] || { full_name: 'User', email: '' };
      profileMap[m.recipient_id] = profileMap[m.recipient_id] || { full_name: 'User', email: '' };
    });

    const threadMap: Record<string, Thread> = {};
    data.forEach(m => {
      const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      const key = `${otherId}::${m.listing_id || 'null'}`;

      if (!threadMap[key]) {
        threadMap[key] = {
          other_user_id: otherId,
          other_user_name: profileMap[otherId]?.full_name || 'User',
          listing_id: m.listing_id,
          listing_title: (m.listing as any)?.title || null,
          listing_image: (m.listing as any)?.images?.[0] || null,
          last_message: m.body,
          last_at: m.created_at,
          unread_count: 0,
          messages: [],
        };
      }

      threadMap[key].messages.push(m);
      threadMap[key].last_message = m.body;
      threadMap[key].last_at = m.created_at;
      if (!m.is_read && m.recipient_id === userId) {
        threadMap[key].unread_count++;
      }
    });

    const threadList = Object.values(threadMap).sort(
      (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
    );

    setThreads(threadList);
    setSelectedThread(prev => {
      if (prev) {
        const key = `${prev.other_user_id}::${prev.listing_id || 'null'}`;
        return threadMap[key] || prev;
      }
      if (threadList.length > 0) {
        markThreadRead(threadList[0], userId);
        return threadList[0];
      }
      return null;
    });
    setLoading(false);
  };

  const markThreadRead = async (thread: Thread, userId: string) => {
    const unreadIds = thread.messages
      .filter(m => !m.is_read && m.recipient_id === userId)
      .map(m => m.id);
    if (unreadIds.length === 0) return;
    await supabase.from('user_messages').update({ is_read: true }).in('id', unreadIds);
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    if (user) markThreadRead(thread, user.id);
    setThreads(prev => prev.map(t =>
      t.other_user_id === thread.other_user_id && t.listing_id === thread.listing_id
        ? { ...t, unread_count: 0 }
        : t
    ));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !user) return;
    setSending(true);

    const { data, error } = await supabase.from('user_messages').insert({
      sender_id: user.id,
      recipient_id: selectedThread.other_user_id,
      listing_id: selectedThread.listing_id,
      body: newMessage.trim(),
      is_read: false,
    }).select().single();

    if (!error && data) {
      setSelectedThread(prev => prev ? {
        ...prev,
        messages: [...prev.messages, data],
        last_message: data.body,
        last_at: data.created_at,
      } : prev);
      setNewMessage('');
    }
    setSending(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-6 py-6">

        <div className="mb-4">
          <div className="text-[11px] text-[#8A8E99] uppercase tracking-widest mb-2 flex items-center gap-2">
            <Link href="/dashboard" className="hover:text-[#C9922A]">Dashboard</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Messages</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase">
            Messages {totalUnread > 0 && <span className="text-[#C9922A]">({totalUnread} unread)</span>}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-12 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">No messages yet</h3>
            <p className="text-[#8A8E99] text-sm">When buyers contact you about a listing, their messages will appear here.</p>
          </div>
        ) : (
          <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">

            {/* Thread list */}
            <div className="w-[300px] flex-shrink-0 bg-[#13151A] border border-white/5 rounded-sm overflow-y-auto">
              {threads.map((thread, idx) => (
                <button key={idx} onClick={() => handleSelectThread(thread)}
                  className={`w-full text-left px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 ${
                    selectedThread?.other_user_id === thread.other_user_id && selectedThread?.listing_id === thread.listing_id
                      ? 'bg-white/5 border-l-2 border-l-[#C9922A]'
                      : ''
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-[#C9922A] flex items-center justify-center flex-shrink-0 text-black font-black text-sm">
                    {thread.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[13px] font-bold text-[#F0EDE8] truncate">{thread.other_user_name}</span>
                      <span className="text-[10px] text-[#8A8E99] flex-shrink-0 ml-2">{formatTime(thread.last_at)}</span>
                    </div>
                    {thread.listing_title && (
                      <p className="text-[10px] text-[#C9922A] font-bold uppercase tracking-wider truncate mb-0.5">
                        Re: {thread.listing_title}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-[#8A8E99] truncate">{thread.last_message}</p>
                      {thread.unread_count > 0 && (
                        <span className="bg-[#C9922A] text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Message pane */}
            {selectedThread && (
              <div className="flex-1 bg-[#13151A] border border-white/5 rounded-sm flex flex-col">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-black text-sm flex-shrink-0">
                    {selectedThread.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[14px] text-[#F0EDE8]">{selectedThread.other_user_name}</p>
                    {selectedThread.listing_title && (
                      <Link href={`/listings/${selectedThread.listing_id}`}
                        className="text-[11px] text-[#C9922A] hover:brightness-125 transition-all">
                        Re: {selectedThread.listing_title} →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                  {selectedThread.messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-sm px-4 py-2.5 ${
                          isMine ? 'bg-[#C9922A] text-black' : 'bg-[#0D0F13] border border-white/10 text-[#F0EDE8]'
                        }`}>
                          <p className="text-[13px] leading-relaxed">{msg.body}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-black/60' : 'text-[#8A8E99]'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="px-5 py-4 border-t border-white/5 flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors"
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
