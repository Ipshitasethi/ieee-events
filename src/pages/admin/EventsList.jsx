import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Plus, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', description: '', date: '' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, participants(count)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEvents(data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userData.user.id)
        .single();
        
      // Quick fallback if profile doesn't exist for some reason
      const created_by = profile ? profile.id : userData.user.id;

      const { data, error } = await supabase
        .from('events')
        .insert([{ ...newEvent, created_by }])
        .select()
        .single();

      if (error) throw error;
      
      // Auto-create default form fields (Name and Email)
      await supabase.from('form_fields').insert([
        { event_id: data.id, label: 'Full Name', field_type: 'text', is_required: true, order_index: 1 },
        { event_id: data.id, label: 'Email Address', field_type: 'text', is_required: true, order_index: 2 }
      ]);

      toast.success('Event created!');
      navigate(`/admin/events/${data.id}`);
    } catch (error) {
      toast.error('Failed to create event');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-syne text-2xl font-bold tracking-tight">Events</h1>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Event
        </Button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading events...</div>
      ) : events.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-700 bg-transparent">
          <CalendarIcon className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="font-syne text-xl font-semibold text-slate-300 mb-2">No events found</h3>
          <p className="text-slate-500 mb-6 max-w-sm">Get started by creating your first event to manage attendance and certificates.</p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Event</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Link key={event.id} to={`/admin/events/${event.id}`}>
              <Card glow={event.is_active} className="h-full hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardHeader className="pb-3 border-b border-slate-800/50">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-slate-200 group-hover:text-accent-cyan transition-colors">{event.name}</CardTitle>
                    {event.is_active ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">
                    {event.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{event.date ? new Date(event.date).toLocaleDateString() : 'No date set'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-300">
                      <Users className="w-4 h-4 text-slate-500" />
                      {event.participants?.[0]?.count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card glow className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Input 
                    id="name" 
                    value={newEvent.name} 
                    onChange={e => setNewEvent({...newEvent, name: e.target.value})} 
                    required 
                    placeholder="e.g. Intro to Machine Learning"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newEvent.date} 
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <textarea 
                    id="desc"
                    className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-elevated-admin px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                    value={newEvent.description}
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Brief details about the event..."
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
