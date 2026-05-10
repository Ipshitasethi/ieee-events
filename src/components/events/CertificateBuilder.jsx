import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import toast from 'react-hot-toast';
import { UploadCloud, Image as ImageIcon, Move, Settings, Type, Palette, Maximize } from 'lucide-react';

export default function CertificateBuilder({ eventId }) {
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingField, setDraggingField] = useState(null);
  const [activeSettings, setActiveSettings] = useState(null);
  const previewRef = useRef(null);
  
  // Mapping structure: { "fieldLabel": { x: 50, y: 50, size: 48, color: '#000000', fontFamily: 'Syne', fontWeight: '600' } }
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [templateRes, fieldsRes] = await Promise.all([
        supabase.from('certificate_templates').select('*').eq('event_id', eventId).single(),
        supabase.from('form_fields').select('*').eq('event_id', eventId)
      ]);
      
      if (templateRes.data) {
        setTemplate(templateRes.data);
        setMapping(templateRes.data.placeholder_map || {});
      }
      if (fieldsRes.data) {
        const certFields = fieldsRes.data.filter(f => f.include_in_certificate);
        const labels = certFields.map(f => f.label);
        setFields(labels);
        
        setMapping(prev => {
          const newMapping = {};
          // Only keep mappings for fields that still exist and have the 'cert' toggle enabled
          labels.forEach(l => {
            if (prev[l]) {
              newMapping[l] = prev[l];
            } else {
              newMapping[l] = { 
                x: 50, 
                y: 50, 
                size: 48, 
                color: '#000000', 
                fontFamily: '"Syne", sans-serif', 
                fontWeight: '600',
                textAlign: 'center'
              };
            }
          });
          return newMapping;
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificate-templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('certificate-templates')
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;

      const { data, error } = await supabase
        .from('certificate_templates')
        .upsert({ event_id: eventId, template_url: url, placeholder_map: mapping }, { onConflict: 'event_id' })
        .select()
        .single();

      if (error) throw error;
      setTemplate(data);
      toast.success('Template uploaded successfully');
    } catch (error) {
      toast.error('Error uploading template');
    } finally {
      setUploading(false);
    }
  };

  const updateMapping = (field, key, value) => {
    setMapping(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: key === 'x' || key === 'y' || key === 'size' ? Number(value) : value
      }
    }));
  };

  const saveMapping = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('certificate_templates')
        .upsert({ 
          event_id: eventId, 
          placeholder_map: mapping,
          template_url: template?.template_url 
        }, { onConflict: 'event_id' });
      
      if (error) throw error;
      toast.success('Mappings saved');
    } catch (error) {
      toast.error('Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  const handleMouseDown = (e, field) => {
    e.stopPropagation();
    setDraggingField(field);
  };

  const handleMouseMove = (e) => {
    if (!draggingField || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    updateMapping(draggingField, 'x', clampedX.toFixed(1));
    updateMapping(draggingField, 'y', clampedY.toFixed(1));
  };

  const handleMouseUp = () => {
    setDraggingField(null);
  };

  useEffect(() => {
    if (draggingField) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingField]);

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-syne font-semibold">Certificate Designer</h3>
          <p className="text-sm text-slate-400">Customize text styles and drag placeholders to position them.</p>
        </div>
        <Button onClick={saveMapping} disabled={saving} glow className="bg-accent-cyan text-slate-950 font-bold">
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Label className="mb-4 block">Template Background</Label>
              <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  {uploading ? 'Uploading...' : 'Replace template image'}
                </p>
              </div>
            </CardContent>
          </Card>

          {template && template.template_url && (
            <div className="space-y-4">
              <h4 className="font-syne font-medium text-slate-300 px-1">Placeholder Styles</h4>
              {fields.length === 0 ? (
                <Card><CardContent className="p-6 text-sm text-slate-500 italic">No placeholders enabled. Use 'Form Builder'.</CardContent></Card>
              ) : (
                fields.map(field => {
                  const m = mapping[field] || {};
                  const isActive = activeSettings === field;
                  return (
                    <Card key={field} className={`${isActive ? 'ring-1 ring-accent-cyan bg-slate-800/50' : 'bg-elevated-admin'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                              <Type className="w-4 h-4 text-accent-cyan" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-200">{field}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{m.fontFamily?.replace(/"/g, '') || 'Default'}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setActiveSettings(isActive ? null : field)}
                            className={isActive ? 'text-accent-cyan' : 'text-slate-400'}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>

                        {isActive && (
                          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase text-slate-500">Size (Zoom)</Label>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="range" min="10" max="200" 
                                  value={m.size || 48} 
                                  onChange={e => updateMapping(field, 'size', e.target.value)}
                                  className="flex-1"
                                />
                                <span className="text-xs font-mono text-accent-cyan w-8">{m.size || 48}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase text-slate-500">Color</Label>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="color" 
                                  value={m.color || '#000000'} 
                                  onChange={e => updateMapping(field, 'color', e.target.value)}
                                  className="w-full h-8 p-1 bg-slate-900 border-slate-700"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase text-slate-500">Font Family</Label>
                              <select 
                                className="w-full h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-slate-300"
                                value={m.fontFamily || '"Syne", sans-serif'}
                                onChange={e => updateMapping(field, 'fontFamily', e.target.value)}
                              >
                                <option value='"Syne", sans-serif'>Syne</option>
                                <option value='"Inter", sans-serif'>Inter</option>
                                <option value='"Montserrat", sans-serif'>Montserrat</option>
                                <option value='"Dancing Script", cursive'>Cursive</option>
                                <option value='serif'>Serif</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase text-slate-500">Weight</Label>
                              <select 
                                className="w-full h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-slate-300"
                                value={m.fontWeight || '600'}
                                onChange={e => updateMapping(field, 'fontWeight', e.target.value)}
                              >
                                <option value="400">Regular</option>
                                <option value="600">Semi-Bold</option>
                                <option value="700">Bold</option>
                                <option value="800">Extra-Bold</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="sticky top-8">
          <Card glow className="overflow-hidden bg-slate-900 border-slate-700 shadow-2xl">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-accent-cyan" />
                <span className="text-sm font-bold text-slate-200">Interactive Canvas</span>
              </div>
              <div className="text-[10px] text-slate-500 animate-pulse">Drag placeholders to move</div>
            </div>
            <div className="p-4 relative bg-slate-950" ref={previewRef}>
              {template && template.template_url ? (
                <div className="relative w-full aspect-[1.414] bg-white rounded shadow-inner overflow-hidden border border-slate-800 select-none">
                  <img src={template.template_url} alt="Template" className="w-full h-full object-contain pointer-events-none" />
                  
                  {fields.map(field => {
                    const m = mapping[field];
                    if (!m) return null;
                    const isDragging = draggingField === field;
                    const isActive = activeSettings === field;
                    
                    return (
                      <div 
                        key={field}
                        onMouseDown={(e) => handleMouseDown(e, field)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all cursor-move px-2 py-1 whitespace-nowrap shadow-md flex items-center gap-1
                          ${isDragging ? 'border-accent-cyan bg-accent-cyan/20 scale-110 z-50' : 
                            isActive ? 'border-accent-cyan bg-accent-cyan/10 ring-4 ring-accent-cyan/20 z-40' : 
                            'border-dashed border-accent-cyan/40 bg-accent-cyan/5 hover:border-accent-cyan/80 z-30'}`}
                        style={{ 
                          left: `${m.x}%`, 
                          top: `${m.y}%`, 
                          color: m.color || '#000000',
                          fontFamily: m.fontFamily || 'inherit',
                          fontWeight: m.fontWeight || 'bold',
                          fontSize: `${Math.max(8, m.size / 4)}px`
                        }}
                      >
                        <Move className="w-3 h-3 opacity-50" />
                        {`{{${field}}}`}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full aspect-[1.414] bg-elevated-admin rounded flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
                  <p className="font-syne text-sm">Upload a template to begin</p>
                </div>
              )}
            </div>
          </Card>
          <p className="mt-4 text-[10px] text-slate-500 text-center uppercase tracking-widest">A4 Landscape Aspect Ratio (1.414:1)</p>
        </div>
      </div>
    </div>
  );
}
