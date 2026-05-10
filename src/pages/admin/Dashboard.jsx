import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/Card';
import { Calendar, Users, Activity, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    participantsToday: 0,
    totalParticipants: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch Events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*, participants(count)');
        
      if (eventsError) throw eventsError;

      const { data: allParticipants, error: partError } = await supabase
        .from('participants')
        .select('id, created_at');
        
      if (partError) throw partError;

      const active = events.filter(e => e.is_active).length;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const todayParts = allParticipants.filter(p => new Date(p.created_at) >= today).length;

      setStats({
        totalEvents: events.length,
        activeEvents: active,
        participantsToday: todayParts,
        totalParticipants: allParticipants.length,
      });

      // Recent 5 events
      const sorted = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      setRecentEvents(sorted);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'text-blue-400' },
    { title: 'Active Right Now', value: stats.activeEvents, icon: Activity, color: 'text-green-400' },
    { title: 'Participants Today', value: stats.participantsToday, icon: Target, color: 'text-accent-cyan' },
    { title: 'Total Participants', value: stats.totalParticipants, icon: Users, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-syne text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <Link to="/admin/events/new" className="bg-accent-cyan text-bg-admin px-4 py-2 rounded-md font-medium text-sm hover:bg-cyan-400 transition-colors">
          + New Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} glow className="relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold font-syne">{loading ? '-' : stat.value}</h3>
                </div>
                <div className={`p-3 rounded-lg bg-slate-800/50 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-syne text-xl font-semibold mb-4">Recent Events</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Event Name</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Participants</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading events...</td>
                  </tr>
                ) : recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No events found. Create one to get started.</td>
                  </tr>
                ) : (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">{event.name}</td>
                      <td className="px-6 py-4 text-slate-400">{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</td>
                      <td className="px-6 py-4">
                        {event.is_active ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono">
                        {event.participants?.[0]?.count || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/events/${event.id}`} className="text-accent-cyan hover:text-cyan-300 font-medium text-sm">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
