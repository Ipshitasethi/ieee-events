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
    <div className="flex h-screen bg-bg-admin text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-surface-admin flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded bg-accent-blue/20 flex items-center justify-center glow-border">
            <Zap className="w-5 h-5 text-accent-cyan" />
          </div>
          <span className="font-syne font-bold text-xl tracking-tight text-white">IEEE Attend</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium font-syne">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none"></div>
        <div className="relative z-10 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
