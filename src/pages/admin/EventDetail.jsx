import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, LayoutTemplate, FileText, Users, QrCode } from 'lucide-react';
import QRCodeTab from '../../components/events/QRCodeTab';
import FormBuilder from '../../components/events/FormBuilder';
import CertificateBuilder from '../../components/events/CertificateBuilder';
import AttendanceTab from '../../components/events/AttendanceTab';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');

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
    </div>
  );
}
