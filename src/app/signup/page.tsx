import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[450px] bg-[#191C23] border border-white/5 rounded-md p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-extrabold uppercase text-[#F0EDE8] mb-2">
              Join the <span className="text-[#C9922A]">Armory</span>
            </h1>
            <p className="text-[#8A8E99] text-sm">Create your account to start trading and tracking bounties.</p>
          </div>

          {/* SOCIAL LOGINS */}
          <div className="flex flex-col gap-3 mb-8">
            <button className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-sm text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-4 h-4" alt="Google" />
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-bold py-3 rounded-sm text-xs uppercase tracking-widest hover:brightness-110 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continue with Facebook
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-8">
            <div className="w-full border-b border-white/5"></div>
            <span className="absolute bg-[#191C23] px-4 text-[10px] text-[#8A8E99] uppercase tracking-[0.3em] font-bold">Or Email</span>
          </div>

          {/* STANDARD FORM */}
          <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8A8E99]">Full Name</label>
              <input type="text" className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A]" placeholder="John Doe" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8A8E99]">Email Address</label>
              <input type="email" className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A]" placeholder="john@example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8A8E99]">Password</label>
              <input type="password" className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A]" placeholder="••••••••" />
            </div>

            <button type="submit" className="w-full bg-[#C9922A] text-black font-bold py-4 rounded-sm text-xs uppercase tracking-[0.2em] mt-2 hover:brightness-110 transition-all">
              Create Account
            </button>
          </form>

          <p className="text-center text-[#8A8E99] text-xs mt-8">
            Already have an account? <Link href="/login" className="text-[#C9922A] hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
