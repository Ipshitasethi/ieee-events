import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import { Search, Download, UserPlus, FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { getCertificateBase64 } from '../../services/certificateGenerator';

export default function AttendanceTab({ eventId }) {
  const [participants, setParticipants] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipant, setNewParticipant] = useState({});
  const [adding, setAdding] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [newlyAdded, setNewlyAdded] = useState([]); // Array of IDs to highlight

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`participants-${eventId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'participants', 
        filter: `event_id=eq.${eventId}` 
      }, payload => {
        const newRecord = payload.new;
        setParticipants(prev => [newRecord, ...prev]);
        setNewlyAdded(prev => [...prev, newRecord.id]);
        
        // Remove highlight after 10 seconds
        setTimeout(() => {
          setNewlyAdded(prev => prev.filter(id => id !== newRecord.id));
        }, 10000);
      })
      .subscribe((status) => {
        setRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [partsRes, fieldsRes, tempRes] = await Promise.all([
        supabase.from('participants').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
        supabase.from('form_fields').select('*').eq('event_id', eventId).order('order_index', { ascending: true }),
        supabase.from('certificate_templates').select('*').eq('event_id', eventId).single()
      ]);
      
      if (partsRes.data) setParticipants(partsRes.data);
      if (tempRes.data) setTemplate(tempRes.data);
      if (fieldsRes.data) {
        setFormFields(fieldsRes.data);
        // Initialize state for new participant
        const initForm = {};
        fieldsRes.data.forEach(f => initForm[f.label] = '');
        setNewParticipant(initForm);
      }
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(p => {
    // Search filter
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term);
    
    // Dynamic field filter
    let matchesField = true;
    if (filterField && filterValue) {
      const val = p.form_data?.[filterField]?.toString().toLowerCase() || '';
      matchesField = val.includes(filterValue.toLowerCase());
    }
    
    return matchesSearch && matchesField;
  });

  const handleExportCSV = () => {
    const data = filteredParticipants.map(p => ({
      Name: p.name,
      Email: p.email,
      ...p.form_data,
      'Registered At': new Date(p.created_at).toLocaleString(),
      'Certificate URL': p.certificate_url || 'N/A'
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-${eventId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const data = filteredParticipants.map(p => ({
      Name: p.name,
      Email: p.email,
      ...p.form_data,
      'Registered At': new Date(p.created_at).toLocaleString(),
      'Certificate URL': p.certificate_url || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `attendance-${eventId}.xlsx`);
  };

  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this participant? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setParticipants(prev => prev.filter(p => p.id !== id));
      toast.success('Participant deleted');
    } catch (error) {
      toast.error('Failed to delete participant');
      console.error(error);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const name = newParticipant['Full Name'];
      const email = newParticipant['Email Address'];
      
      if (!name || !email) {
        toast.error('Name and Email are required');
        return;
      }

      // Remove base fields from form_data to avoid duplication if desired, or keep them. 
      // We will keep them for simplicity in certificate generation.

      const { data, error } = await supabase
        .from('participants')
        .insert([{
          event_id: eventId,
          name,
          email,
          form_data: newParticipant
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Participant added successfully');
      setShowAddModal(false);
      // In a full implementation, we might trigger certificate generation here via an Edge Function
    } catch (error) {
      toast.error('Failed to add participant');
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-3 w-full max-w-4xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {realtimeActive && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 flex-1 min-w-[300px]">
            <select 
              className="flex h-10 w-full rounded-md border border-slate-700 bg-elevated-admin px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent-cyan"
              value={filterField}
              onChange={(e) => {
                setFilterField(e.target.value);
                setFilterValue(''); // Reset value when field changes
              }}
            >
              <option value="">Filter by Field...</option>
              {formFields.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
            </select>
            
            {(() => {
              const selectedFieldObj = formFields.find(f => f.label === filterField);
              const hasOptions = selectedFieldObj && (selectedFieldObj.field_type === 'dropdown' || selectedFieldObj.field_type === 'radio') && Array.isArray(selectedFieldObj.options);
              
              if (hasOptions) {
                return (
                  <select
                    className="flex h-10 flex-1 rounded-md border border-slate-700 bg-elevated-admin px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option value="">Select an option...</option>
                    {selectedFieldObj.options.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                );
              }
              
              return (
                <Input 
                  placeholder="Filter value..." 
                  className="flex-1"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  disabled={!filterField}
                />
              );
            })()}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExportCSV} title="Export CSV" className="px-3">
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleExportExcel} title="Export Excel" className="px-3 text-green-400 border-green-400/30 hover:bg-green-400/10">
            <FileSpreadsheet className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none">
            <UserPlus className="w-4 h-4 mr-2" /> Add Participant
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Name</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Email</th>
                {formFields.filter(f => f.label !== 'Full Name' && f.label !== 'Email Address').map(f => (
                  <th key={f.id} className="px-6 py-4 font-medium whitespace-nowrap">{f.label}</th>
                ))}
                <th className="px-6 py-4 font-medium whitespace-nowrap">Registered At</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={formFields.length + 3} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredParticipants.length === 0 ? (
                <tr><td colSpan={formFields.length + 3} className="px-6 py-8 text-center text-slate-500">No participants found.</td></tr>
              ) : (
                filteredParticipants.map(p => {
                  const isNew = newlyAdded.includes(p.id);
                  return (
                    <tr key={p.id} className={`transition-all duration-1000 ${isNew ? 'bg-accent-cyan/10 ring-1 ring-inset ring-accent-cyan/30' : 'hover:bg-slate-800/20'}`}>
                      <td className="px-6 py-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          {p.name}
                          {isNew && (
                            <span className="text-[10px] bg-accent-cyan text-slate-950 px-1.5 py-0.5 rounded font-bold animate-bounce uppercase">New</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{p.email}</td>
                    {formFields.filter(f => f.label !== 'Full Name' && f.label !== 'Email Address').map(f => (
                      <td key={f.id} className="px-6 py-4 text-slate-400">
                        {p.form_data?.[f.label] || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          title="Delete Participant"
                          onClick={() => handleDeleteParticipant(p.id)}
                          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors focus:outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <a 
                          href={`/event/${eventId}/certificate/${p.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-accent-cyan hover:underline flex items-center gap-1 font-medium text-xs whitespace-nowrap"
                        >
                          <Download className="w-3 h-3" /> View
                        </a>
                      </div>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card glow className="w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-syne text-xl font-semibold">Add Participant</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="add-participant-form" onSubmit={handleManualAdd} className="space-y-4">
                {formFields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label>{field.label} {field.is_required && <span className="text-red-400">*</span>}</Label>
                    {field.field_type === 'textarea' ? (
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-elevated-admin px-3 py-2 text-sm text-slate-200"
                        required={field.is_required}
                        value={newParticipant[field.label] || ''}
                        onChange={e => setNewParticipant({...newParticipant, [field.label]: e.target.value})}
                      />
                    ) : field.field_type === 'dropdown' ? (
                      <select
                        className="flex h-10 w-full rounded-md border border-slate-700 bg-elevated-admin px-3 py-2 text-sm text-slate-200"
                        required={field.is_required}
                        value={newParticipant[field.label] || ''}
                        onChange={e => setNewParticipant({...newParticipant, [field.label]: e.target.value})}
                      >
                        <option value="">Select option</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.field_type === 'radio' ? (
                      <div className="space-y-2">
                        {field.options?.map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-sm text-slate-300">
                            <input 
                              type="radio" 
                              name={field.label}
                              required={field.is_required}
                              checked={newParticipant[field.label] === opt}
                              onChange={() => setNewParticipant({...newParticipant, [field.label]: opt})}
                              className="text-accent-cyan bg-slate-900 border-slate-700"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input 
                        required={field.is_required}
                        value={newParticipant[field.label] || ''}
                        onChange={e => setNewParticipant({...newParticipant, [field.label]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
              </form>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" form="add-participant-form" disabled={adding}>
                {adding ? 'Adding...' : 'Add Participant'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
