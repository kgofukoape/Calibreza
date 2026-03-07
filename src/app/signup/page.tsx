import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 py-20">
        <div className="w-full max-w-[500px] bg-[#191C23] border border-white/5 rounded-sm p-10 md:p-14 shadow-2xl">
          
          <div className="text-center mb-10">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-5xl font-black uppercase tracking-tighter text-[#F0EDE8] mb-3">
              JOIN <span className="text-[#C9922A]">GUN X</span>
            </h1>
            <p className="text-[#8A8E99] text-[11px] font-bold uppercase tracking-[0.3em]">Create your firearms trading account</p>
          </div>

          {/* SOCIAL AUTHENTICATION */}
          <div className="flex flex-col gap-4 mb-10">
            <button className="w-full flex items-center justify-center gap-4 bg-white text-black font-black py-4 rounded-sm text-[11px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-4 bg-[#1877F2] text-white font-black py-4 rounded-sm text-[11px] uppercase tracking-[0.2em] hover:brightness-110 transition-all">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continue with Facebook
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-10">
            <div className="w-full border-b border-white/5"></div>
            <span className="absolute bg-[#191C23] px-6 text-[10px] text-[#8A8E99] uppercase tracking-[0.4em] font-black">Or Direct Entry</span>
          </div>

          {/* REGISTRATION FORM */}
          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8E99]">Full Name</label>
              <input type="text" className="bg-[#0D0F13] border border-white/10 rounded-sm px-5 py-4 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-all placeholder:text-white/5" placeholder="JOHN DOE" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8E99]">Email Address</label>
              <input type="email" className="bg-[#0D0F13] border border-white/10 rounded-sm px-5 py-4 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-all placeholder:text-white/5" placeholder="OPERATOR@GUNX.CO.ZA" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8E99]">Password</label>
              <input type="password" className="bg-[#0D0F13] border border-white/10 rounded-sm px-5 py-4 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-all" placeholder="••••••••" />
            </div>

            <button type="submit" className="w-full bg-[#C9922A] text-black font-black py-5 rounded-sm text-[12px] uppercase tracking-[0.3em] mt-4 hover:brightness-110 transition-all shadow-[0_0_30px_rgba(201,146,42,0.15)]">
              Create Account
            </button>
          </form>

          <p className="text-center text-[#8A8E99] text-[11px] mt-10 uppercase tracking-[0.2em] font-bold">
            Already a member? <Link href="/login" className="text-[#C9922A] hover:underline ml-2">Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
