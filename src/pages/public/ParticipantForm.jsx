import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Calendar, Info, Upload, FileText, X, FileCheck } from 'lucide-react';
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
  const [fileData, setFileData] = useState({}); // Stores { label: { file, preview, name } }

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

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 5MB Validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData(prev => ({
        ...prev,
        [field.label]: {
          file,
          preview: file.type.startsWith('image/') ? reader.result : null,
          name: file.name
        }
      }));
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      setFileData(prev => ({
        ...prev,
        [field.label]: {
          file,
          preview: null,
          name: file.name
        }
      }));
    }
  };

  const removeFile = (label) => {
    setFileData(prev => {
      const newData = { ...prev };
      delete newData[label];
      return newData;
    });
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

      // Generate a temporary ID for participant to use in file path
      const participantId = crypto.randomUUID();

      // Clean form data (trim keys and values)
      const cleanData = {};
      Object.keys(formData).forEach(k => {
        const val = formData[k];
        cleanData[k.trim()] = typeof val === 'string' ? val.trim() : val;
      });

      // Handle File Uploads
      const fileLabels = Object.keys(fileData);
      for (const label of fileLabels) {
        const { file } = fileData[label];
        const field = fields.find(f => f.label === label);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${id}/${participantId}/${field.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('participant-uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('participant-uploads')
          .getPublicUrl(filePath);

        cleanData[label] = publicUrl;
      }

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
        navigate(`/event/${id}/certificate/${existing.id}`, { state: { participant: existing, template } });
        return;
      }

      // Insert new participant
      const { data, error } = await supabase
        .from('participants')
        .insert([{
          id: participantId,
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
      navigate(`/event/${id}/certificate/${data.id}`, { state: { participant: data, template } });
    } catch (error) {
      toast.error(error.message || 'Failed to mark attendance. Please try again.');
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
      <div className="bg-white rounded-xl text-center p-12 shadow-lg">
        <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h2 className="font-syne text-2xl font-bold text-slate-800 mb-2">Event Not Found</h2>
        <p className="text-slate-500">The event you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  if (!event.is_active) {
    return (
      <div className="bg-white rounded-xl text-center p-12 border-t-4 border-t-red-400 shadow-lg">
        <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="font-syne text-2xl font-bold text-slate-800 mb-2">Attendance Closed</h2>
        <p className="text-slate-500">Attendance for <strong>{event.name}</strong> is currently closed.</p>
      </div>
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

      <div className="bg-white rounded-xl shadow-xl border-t-4 border-t-accent-blue overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label variant="public" className="font-semibold">{field.label} {field.is_required && <span className="text-red-500">*</span>}</Label>
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
                ) : field.field_type === 'file' ? (
                  <div className="space-y-3">
                    {!fileData[field.label] ? (
                      <div 
                        onClick={() => document.getElementById(`file-${field.id}`).click()}
                        className="group relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-accent-blue hover:bg-blue-50/50 transition-all cursor-pointer"
                      >
                        <input 
                          id={`file-${field.id}`}
                          type="file" 
                          className="hidden"
                          accept={field.options?.accept?.map(t => t === 'image' ? 'image/jpeg,image/png' : 'application/pdf').join(',')}
                          onChange={(e) => handleFileChange(field, e)}
                          required={field.is_required && !fileData[field.label]}
                        />
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-accent-blue" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</p>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
                              {field.options?.accept?.map(t => t === 'image' ? 'JPG, PNG' : 'PDF').join(' or ') || 'Any File'} — MAX 5MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 group animate-in fade-in slide-in-from-bottom-2">
                        {fileData[field.label].preview ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                            <img src={fileData[field.label].preview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 flex-shrink-0">
                            <FileText className="w-8 h-8 text-red-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{fileData[field.label].name}</p>
                          <p className="text-xs text-green-600 flex items-center gap-1 font-medium mt-0.5">
                            <FileCheck className="w-3 h-3" /> Ready to upload
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(field.label)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Input 
                    variant="public"
                    type={field.label.toLowerCase().includes('email') ? 'email' : 'text'}
                    className="h-11"
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
        </div>
      </div>
    </div>
  );
}
