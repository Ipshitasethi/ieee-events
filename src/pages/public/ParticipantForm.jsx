import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Calendar, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCertificateBase64 } from '../../services/certificateGenerator';

export default function ParticipantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [fields, setFields] = useState([]);
   const [formData, setFormData] = useState({});
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      const [eventRes, fieldsRes, templateRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('form_fields').select('*').eq('event_id', id).order('order_index', { ascending: true }),
        supabase.from('certificate_templates').select('*').eq('event_id', id).single()
      ]);

      if (eventRes.error) throw eventRes.error;
      
      setEvent(eventRes.data);
      if (templateRes.data) setTemplate(templateRes.data);
      if (fieldsRes.data) {
        setFields(fieldsRes.data);
        const initForm = {};
        fieldsRes.data.forEach(f => initForm[f.label] = '');
        setFormData(initForm);
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const findValue = (search) => {
        const key = Object.keys(formData).find(k => k.toLowerCase().trim().includes(search.toLowerCase()));
        return key ? formData[key] : null;
      };

      const name = findValue('name') || formData['Full Name'];
      const email = findValue('email') || formData['Email Address'];

      if (!name || !email) {
        toast.error('Name and Email are required');
        setSubmitting(false);
        return;
      }

      // Clean form data (trim keys and values)
      const cleanData = {};
      Object.keys(formData).forEach(k => {
        const val = formData[k];
        cleanData[k.trim()] = typeof val === 'string' ? val.trim() : val;
      });

      // Check if already registered (match both name AND email)
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', id)
        .eq('email', email.trim())
        .eq('name', name.trim())
        .single();
        
      if (existing) {
        toast.success('Attendance already marked! Viewing certificate...');
        navigate(`/event/${id}/certificate/${existing.id}`);
        return;
      }

      // Insert new participant
      const { data, error } = await supabase
        .from('participants')
        .insert([{
          event_id: id,
          name: name.trim(),
          email: email.trim(),
          form_data: cleanData
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Attendance marked successfully!');
      
      // Navigate to the success page to show the certificate in real-time
      navigate(`/event/${id}/certificate/${data.id}`);
    } catch (error) {
      toast.error('Failed to mark attendance. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-12 text-slate-500 font-medium">Loading form...</div>;
  }

  if (!event) {
    return (
      <Card className="text-center p-12">
        <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h2 className="font-syne text-2xl font-bold text-slate-800 mb-2">Event Not Found</h2>
        <p className="text-slate-500">The event you are looking for does not exist or has been removed.</p>
      </Card>
    );
  }

  if (!event.is_active) {
    return (
      <Card className="text-center p-12 border-t-4 border-t-red-400 shadow-lg">
        <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="font-syne text-2xl font-bold text-slate-800 mb-2">Attendance Closed</h2>
        <p className="text-slate-500">Attendance for <strong>{event.name}</strong> is currently closed.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="font-syne text-3xl font-bold text-slate-900 tracking-tight">{event.name}</h1>
        {event.date && (
          <p className="text-accent-blue flex items-center justify-center gap-2 mt-2 font-medium">
            <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString()}
          </p>
        )}
        {event.description && (
          <p className="text-slate-600 mt-4 max-w-lg mx-auto leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      <Card className="shadow-xl border-t-4 border-t-accent-blue">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-slate-700 font-semibold">{field.label} {field.is_required && <span className="text-red-500">*</span>}</Label>
                {field.field_type === 'textarea' ? (
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-blue transition-all"
                    required={field.is_required}
                    value={formData[field.label] || ''}
                    onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                  />
                ) : field.field_type === 'dropdown' ? (
                  <select
                    className="flex h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-blue transition-all"
                    required={field.is_required}
                    value={formData[field.label] || ''}
                    onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.field_type === 'radio' ? (
                  <div className="space-y-3 pt-1">
                    {field.options?.map(opt => (
                      <label key={opt} className="flex items-center gap-3 text-sm text-slate-700 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                        <input 
                          type="radio" 
                          name={field.label}
                          required={field.is_required}
                          checked={formData[field.label] === opt}
                          onChange={() => setFormData({...formData, [field.label]: opt})}
                          className="w-4 h-4 text-accent-blue border-slate-300 focus:ring-accent-blue"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input 
                    type={field.label.toLowerCase().includes('email') ? 'email' : 'text'}
                    className="h-11 border-slate-300 bg-slate-50 text-slate-800 focus:ring-accent-blue"
                    required={field.is_required}
                    value={formData[field.label] || ''}
                    onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                  />
                )}
              </div>
            ))}
            
            <div className="pt-4">
              <Button type="submit" className="w-full h-12 text-base font-bold bg-accent-blue text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30" disabled={submitting}>
                {submitting ? 'Processing...' : 'Mark Attendance & Get Certificate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
