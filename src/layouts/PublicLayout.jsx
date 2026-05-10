import React from 'react';
import { Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg-public flex flex-col font-dm-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-blue" />
          </div>
          <span className="font-syne font-bold text-xl text-slate-900 tracking-tight">IEEE Attend</span>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-xl">
          <Outlet />
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} IEEE Student Branch
      </footer>
    </div>
  );
}
