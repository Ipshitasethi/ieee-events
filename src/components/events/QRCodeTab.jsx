import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function QRCodeTab({ event, onEventUpdate }) {
  const [updating, setUpdating] = useState(false);
  const registrationUrl = `${window.location.origin}/event/${event.id}`;

  const toggleStatus = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !event.is_active })
        .eq('id', event.id);
        
      if (error) throw error;
      toast.success(`Attendance ${!event.is_active ? 'Opened' : 'Closed'}`);
      if (onEventUpdate) onEventUpdate();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('event-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${event.name}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <Card glow className="w-full max-w-sm flex-shrink-0">
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg mb-6">
            <QRCodeSVG 
              id="event-qr-code"
              value={registrationUrl} 
              size={200}
              level={"H"}
              includeMargin={false}
            />
          </div>
          <Button onClick={handleDownload} variant="outline" className="w-full">
            Download QR as PNG
          </Button>
        </CardContent>
      </Card>
      
      <div className="flex-1 space-y-6">
        <div>
          <h3 className="text-lg font-syne font-semibold mb-2">Attendance Status</h3>
          <p className="text-sm text-slate-400 mb-6">
            When attendance is closed, the public link will display a closed message and will not accept new check-ins.
          </p>
          
          <div className="flex items-center gap-6 p-6 rounded-xl bg-elevated-admin border border-slate-800">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${event.is_active ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse' : 'bg-slate-600'}`}></span>
                <span className="font-medium text-lg">{event.is_active ? 'ACTIVE' : 'CLOSED'}</span>
              </div>
            </div>
            <Button 
              onClick={toggleStatus} 
              disabled={updating}
              variant={event.is_active ? 'danger' : 'primary'}
            >
              {updating ? 'Updating...' : event.is_active ? 'Close Attendance' : 'Open Attendance'}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Public Link</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 select-all">
              {registrationUrl}
            </code>
            <Button variant="outline" onClick={() => {
              navigator.clipboard.writeText(registrationUrl);
              toast.success('Copied to clipboard');
            }}>Copy</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
