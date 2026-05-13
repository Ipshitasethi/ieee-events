import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, LayoutTemplate, FileText, Users, QrCode, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import QRCodeTab from '../../components/events/QRCodeTab';
import FormBuilder from '../../components/events/FormBuilder';
import CertificateBuilder from '../../components/events/CertificateBuilder';
import AttendanceTab from '../../components/events/AttendanceTab';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Event deleted');
      navigate('/admin/events');
    } catch (error) {
      toast.error('Failed to delete event');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="text-slate-400 p-8">Loading event...</div>;
  if (!event) return <div className="text-slate-400 p-8">Event not found.</div>;

  const tabs = [
    { id: 'form', label: 'Form Builder', icon: FileText },
    { id: 'cert', label: 'Certificate Template', icon: LayoutTemplate },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'qr', label: 'QR Code', icon: QrCode },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/events" className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-slate-200">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-syne text-2xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
              {event.date ? new Date(event.date).toLocaleDateString() : 'No Date'} 
              <span className="text-slate-600">&bull;</span>
              <span className={event.is_active ? 'text-green-400' : 'text-slate-500'}>
                {event.is_active ? 'Active' : 'Closed'}
              </span>
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 gap-2 h-9 px-3"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4" />
          Delete Event
        </Button>
      </div>

      <div className="border-b border-slate-800">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4">
        {activeTab === 'form' && <FormBuilder eventId={id} />}
        {activeTab === 'cert' && <CertificateBuilder eventId={id} />}
        {activeTab === 'attendance' && <AttendanceTab eventId={id} />}
        {activeTab === 'qr' && <QRCodeTab event={event} onEventUpdate={fetchEvent} />}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <Card glow className="w-full max-w-md shadow-2xl border-red-900/50">
            <CardHeader>
              <CardTitle className="text-red-400">Delete Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Are you sure you want to delete <span className="font-bold text-white">"{event.name}"</span>? 
                This action cannot be undone and will remove all participant data.
              </p>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <Button 
                  variant="danger" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
