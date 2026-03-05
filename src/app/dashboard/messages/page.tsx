import React from 'react';

export default function MessagesPage() {
  const conversations = [
    { id: 1, user: "BulletBiter_SA", item: "Glock 19 Gen 5", lastMsg: "Is the price negotiable?", time: "2h ago", unread: true },
    { id: 2, user: "Veldskoen_Hunter", item: "Musgrave .308", lastMsg: "Can we meet at Tac Shac for the transfer?", time: "5h ago", unread: false },
    { id: 3, user: "ReloadingPro", item: "Somchem S365", lastMsg: "I have 2 tins left for you.", time: "1d ago", unread: false },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-[#191C23] border border-white/5 rounded-md overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        
        {/* INBOX LIST */}
        <aside className="w-full md:w-[350px] border-r border-white/5 flex flex-col bg-[#111318]">
          <div className="p-6 border-b border-white/5">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-bold uppercase tracking-wide text-[#F0EDE8]">Safe Room Inbox</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((chat) => (
              <div key={chat.id} className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${chat.unread ? 'bg-[#C9922A]/5 border-l-2 border-l-[#C9922A]' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-[#F0EDE8]">{chat.user}</span>
                  <span className="text-[10px] text-[#8A8E99] uppercase">{chat.time}</span>
                </div>
                <p className="text-[11px] text-[#C9922A] font-semibold uppercase tracking-wider mb-1">{chat.item}</p>
                <p className="text-xs text-[#8A8E99] truncate">{chat.lastMsg}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* ACTIVE CHAT WINDOW */}
        <main className="hidden md:flex flex-1 flex-col bg-[#0D0F13]">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/5 bg-[#191C23] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#C9922A] rounded-full flex items-center justify-center text-black font-bold text-xs">BB</div>
              <div>
                <p className="text-sm font-bold text-[#F0EDE8]">BulletBiter_SA</p>
                <p className="text-[10px] text-[#2A9C6E] uppercase font-bold tracking-widest">Online</p>
              </div>
            </div>
            <button className="text-[11px] text-[#8A8E99] uppercase font-bold border border-white/10 px-3 py-1 hover:text-white hover:border-white transition-all">View Listing</button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
            <div className="max-w-[80%] bg-[#191C23] p-4 rounded-md border border-white/5 self-start">
              <p className="text-sm text-[#F0EDE8]">Hi, I saw your Glock 19 listing. Is the price negotiable if I take the extra mags too?</p>
              <span className="text-[9px] text-[#8A8E99] mt-2 block uppercase">14:20 PM</span>
            </div>
            
            <div className="max-w-[80%] bg-[#C9922A] p-4 rounded-md self-end">
              <p className="text-sm text-black font-medium">Hey! I can do a small discount for a quick deal. Are you a member at a local club for the transfer?</p>
              <span className="text-[9px] text-black/60 mt-2 block uppercase font-bold">14:25 PM</span>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 bg-[#191C23] border-t border-white/5">
            <div className="flex gap-4">
              <input type="text" placeholder="Type your message..." className="flex-1 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
              <button className="bg-[#C9922A] text-black font-bold uppercase tracking-widest px-6 py-3 rounded-sm text-xs hover:brightness-110">Send</button>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
