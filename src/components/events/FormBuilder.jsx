import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import { Plus, Trash2, GripVertical, Save, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FormBuilder({ eventId }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [eventId]);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      toast.error('Failed to load form fields');
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    const newField = {
      id: `temp-${Date.now()}`,
      event_id: eventId,
      label: 'New Field',
      field_type: 'text',
      is_required: false,
      options: [],
      order_index: fields.length,
      isNew: true
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = async (id) => {
    const field = fields.find(f => f.id === id);
    if (field.isNew) {
      setFields(fields.filter(f => f.id !== id));
      return;
    }
    
    // Don't allow removing Name or Email if they are the first two
    if (field.order_index <= 1 && (field.label === 'Full Name' || field.label === 'Email Address')) {
      toast.error('Cannot remove required base fields');
      return;
    }

    try {
      const { error } = await supabase.from('form_fields').delete().eq('id', id);
      if (error) throw error;
      setFields(fields.filter(f => f.id !== id));
      toast.success('Field removed');
    } catch (error) {
      toast.error('Failed to remove field');
    }
  };

  const moveField = (index, direction) => {
    if (index === 0 && direction === -1) return;
    if (index === fields.length - 1 && direction === 1) return;
    
    // Prevent moving base fields
    if (index <= 1 || (index === 2 && direction === -1)) {
      toast.error('Base fields must remain at the top');
      return;
    }

    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + direction];
    newFields[index + direction] = temp;
    
    // Update order_index
    newFields.forEach((f, i) => f.order_index = i);
    setFields(newFields);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toUpsert = fields.map(f => {
        // Ensure options is an array if it's a dropdown or radio
        if ((f.field_type === 'dropdown' || f.field_type === 'radio') && !Array.isArray(f.options)) {
          f.options = [];
        }
        
        if (!f.label || f.label.trim() === '') {
          throw new Error('All fields must have a label');
        }

        const { isNew, tempId, _optionsText, ...rest } = f;
        const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.id);
        if (!isRealUuid) {
          const { id, ...newRest } = rest;
          return newRest;
        }
        return rest;
      });

      const { error } = await supabase
        .from('form_fields')
        .upsert(toUpsert);

      if (error) {
        console.error('Save error:', error);
        throw error;
      }
      toast.success('Form saved successfully');
      fetchFields();
    } catch (error) {
      toast.error(error.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-slate-400">Loading form fields...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-syne font-semibold">Registration Form Fields</h3>
          <p className="text-sm text-slate-400">Define the fields participants will fill out when registering.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={addField}><Plus className="w-4 h-4 mr-2" /> Add Field</Button>
          <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Form'}</Button>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const isBaseField = index <= 1 && (field.label === 'Full Name' || field.label === 'Email Address');
          
          return (
            <Card key={field.id} className="overflow-hidden">
              <div className="flex">
                <div className="bg-slate-900 w-10 flex flex-col items-center justify-center border-r border-slate-800 text-slate-600">
                  {!isBaseField && (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => moveField(index, -1)} className="hover:text-white">&uarr;</button>
                      <button onClick={() => moveField(index, 1)} className="hover:text-white">&darr;</button>
                    </div>
                  )}
                </div>
                
                <CardContent className="flex-1 p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <Label>Field Label</Label>
                      <Input 
                        value={field.label} 
                        onChange={e => updateField(field.id, 'label', e.target.value)}
                        disabled={isBaseField}
                      />
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                      <Label>Field Type</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-slate-700 bg-elevated-admin px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-cyan disabled:opacity-50"
                        value={field.field_type}
                        onChange={e => updateField(field.id, 'field_type', e.target.value)}
                        disabled={isBaseField}
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="radio">Multiple Choice</option>
                        <option value="file">File Upload</option>
                      </select>
                    </div>
                      <div className="pt-8 flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={field.include_in_certificate}
                            onChange={e => updateField(field.id, 'include_in_certificate', e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-accent-cyan focus:ring-accent-cyan"
                          />
                          <span className="group-hover:text-accent-cyan transition-colors">Cert Placeholder</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={field.is_required}
                            onChange={e => updateField(field.id, 'is_required', e.target.checked)}
                            disabled={isBaseField}
                            className="rounded border-slate-700 bg-slate-900 text-accent-cyan focus:ring-accent-cyan"
                          />
                          <span className="group-hover:text-accent-cyan transition-colors">Required</span>
                        </label>
                        {!isBaseField && (
                          <button onClick={() => removeField(field.id)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                  </div>

                  {(field.field_type === 'dropdown' || field.field_type === 'radio') && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                      <Label>Options (comma separated)</Label>
                      <Input 
                        placeholder="Option 1, Option 2, Option 3" 
                        value={field._optionsText !== undefined ? field._optionsText : (Array.isArray(field.options) ? field.options.join(', ') : '')}
                        onChange={e => {
                          const val = e.target.value;
                          const arr = val.split(',').map(s => s.trim()).filter(Boolean);
                          // We store the raw text temporarily in the field object to allow typing commas
                          setFields(fields.map(f => f.id === field.id ? { ...f, options: arr, _optionsText: val } : f));
                        }}
                        onBlur={() => {
                          // Clean up the temporary text on blur
                          setFields(fields.map(f => {
                            const { _optionsText, ...rest } = f;
                            return rest;
                          }));
                        }}
                      />
                    </div>
                  )}

                  {field.field_type === 'file' && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                      <Label>Accepted file types</Label>
                      <div className="flex flex-wrap gap-2">
                        {['image', 'pdf'].map(type => {
                          const isSelected = Array.isArray(field.options?.accept) && field.options.accept.includes(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                const currentAccept = Array.isArray(field.options?.accept) ? field.options.accept : [];
                                const newAccept = isSelected 
                                  ? currentAccept.filter(t => t !== type)
                                  : [...currentAccept, type];
                                updateField(field.id, 'options', { ...field.options, accept: newAccept });
                              }}
                              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isSelected 
                                  ? 'bg-accent-cyan text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                              }`}
                            >
                              {type === 'image' ? 'Images (JPG, PNG)' : 'PDF Document'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
