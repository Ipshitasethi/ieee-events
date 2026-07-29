import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Zap, LayoutDashboard, Calendar, Users, Settings, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate('/login');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg-admin text-slate-200">Loading...</div>;
  }

  if (!session) return null;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Events', icon: Calendar, path: '/admin/events' },
    { label: 'Team', icon: Users, path: '/admin/team' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-bg-admin text-slate-200 overflow-hidden dark">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative order-first md:order-last">
        <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none"></div>
        <div className="relative z-10 p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Sidebar / Bottom Nav */}
      <aside className="w-full md:w-64 flex-shrink-0 border-t md:border-t-0 md:border-r border-slate-800 bg-surface-admin flex flex-row md:flex-col order-last md:order-first z-50 h-16 md:h-auto pb-safe">
        <div className="p-6 items-center gap-3 border-b border-slate-800 hidden md:flex">
          <div className="w-8 h-8 rounded bg-accent-blue/20 flex items-center justify-center glow-border">
            <Zap className="w-5 h-5 text-accent-cyan" />
          </div>
          <span className="font-syne font-bold text-xl tracking-tight text-white">IEEE Attend</span>
        </div>

        <nav className="flex-1 px-2 md:px-4 py-0 md:py-6 space-y-0 md:space-y-1 overflow-x-auto md:overflow-y-auto flex flex-row md:flex-col justify-around md:justify-start items-center md:items-stretch w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'text-accent-cyan md:bg-accent-cyan/10 md:border-l-2 md:border-accent-cyan' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 md:border-l-2 md:border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] md:text-base font-medium font-syne">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Mobile Logout Button */}
          <button 
            onClick={handleLogout} 
            className="flex md:hidden flex-col items-center justify-center gap-1 px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium font-syne">Logout</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 hidden md:block">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-slate-300 truncate">{session.user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-accent-cyan transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
