import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 py-20">
        <div className="w-full max-w-[500px] bg-[#191C23] border border-white/5 rounded-sm p-10 md:p-14 shadow-2xl">
          
          <div className="text-center mb-10">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-5xl font-black uppercase tracking-tighter text-[#F0EDE8] mb-3">
              SIGN <span className="text-[#C9922A]">IN</span>
            </h1>
            <p className="text-[#8A8E99] text-[11px] font-bold uppercase tracking-[0.3em]">Welcome back to the armory</p>
          </div>

          {/* SOCIAL LOGIN */}
          <div className="flex flex-col gap-4 mb-10">
            <button className="w-full flex items-center justify-center gap-4 bg-white text-black font-black py-4 rounded-sm text-[11px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-10">
            <div className="w-full border-b border-white/5"></div>
            <span className="absolute bg-[#191C23] px-6 text-[10px] text-[#8A8E99] uppercase tracking-[0.4em] font-black">Or Credentials</span>
          </div>

          {/* LOGIN FORM */}
          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8E99]">Email Address</label>
              <input type="email" className="bg-[#0D0F13] border border-white/10 rounded-sm px-5 py-4 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-all" placeholder="OPERATOR@GUNX.CO.ZA" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8E99]">Password</label>
                <Link href="#" className="text-[9px] uppercase font-bold text-[#C9922A] hover:underline">Forgot?</Link>
              </div>
              <input type="password" className="bg-[#0D0F13] border border-white/10 rounded-sm px-5 py-4 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-all" placeholder="••••••••" />
            </div>

            {/* REMEMBER ME OPTION */}
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] appearance-none cursor-pointer flex items-center justify-center after:content-['✓'] after:text-black after:text-[10px] after:hidden checked:after:block" />
              <label htmlFor="remember" className="text-[10px] font-bold uppercase tracking-widest text-[#8A8E99] cursor-pointer">Stay logged in on this device</label>
            </div>

            <button type="submit" className="w-full bg-[#C9922A] text-black font-black py-5 rounded-sm text-[12px] uppercase tracking-[0.3em] mt-2 hover:brightness-110 transition-all shadow-[0_0_30px_rgba(201,146,42,0.15)]">
              Access Account
            </button>
          </form>

          <p className="text-center text-[#8A8E99] text-[11px] mt-10 uppercase tracking-[0.2em] font-bold">
            New to Gun X? <Link href="/signup" className="text-[#C9922A] hover:underline ml-2">Register Now</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
