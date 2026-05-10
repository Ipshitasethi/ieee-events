import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, FileDown, CheckCircle2 } from 'lucide-react';
import { drawCertificateOnCanvas, downloadAsPDF, downloadAsPNG } from '../../services/certificateGenerator';
import toast from 'react-hot-toast';

export default function CertificatePreview() {
  const { id, pid } = useParams();
  const [participant, setParticipant] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [id, pid]);

  useEffect(() => {
    if (participant && template && canvasRef.current) {
      generateCertificate();
    }
  }, [participant, template]);

  const fetchData = async () => {
    try {
      const [partRes, tempRes] = await Promise.all([
        supabase.from('participants').select('*').eq('id', pid).single(),
        supabase.from('certificate_templates').select('*').eq('event_id', id).single()
      ]);

      if (partRes.error) throw partRes.error;
      
      setParticipant(partRes.data);
      setTemplate(tempRes.data || null);
      
      if (!tempRes.data) {
        setErrorMsg('No certificate template has been set up for this event yet.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Could not find participant or certificate data.');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    try {
      await drawCertificateOnCanvas(canvasRef.current, template, participant.form_data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to render certificate preview');
    }
  };

  const handleDownloadPDF = () => {
    if (!canvasRef.current) return;
    const filename = `${participant.name.replace(/\s+/g, '_')}_Certificate.pdf`;
    downloadAsPDF(canvasRef.current, filename);
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const filename = `${participant.name.replace(/\s+/g, '_')}_Certificate.png`;
    downloadAsPNG(canvasRef.current, filename);
  };

  if (loading) return <div className="text-center p-12 text-slate-500">Loading certificate...</div>;

  if (errorMsg) {
    return (
      <Card className="text-center p-12">
        <h2 className="font-syne text-2xl font-bold text-slate-800 mb-2">Notice</h2>
        <p className="text-slate-500">{errorMsg}</p>
        <div className="mt-6">
          <Link to="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-syne text-3xl font-bold text-slate-900 tracking-tight">Your Certificate is Ready!</h1>
        <p className="text-slate-500 mt-2">Congratulations, {participant.name}. Here is your participation certificate.</p>
      </div>

      <Card className="shadow-2xl overflow-hidden bg-slate-50 border border-slate-200">
        <div className="w-full aspect-[1.414] bg-white relative">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain"
          ></canvas>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleDownloadPDF} className="h-12 px-8 text-base bg-slate-900 text-white hover:bg-slate-800 shadow-md">
          <FileDown className="w-5 h-5 mr-2" /> Download PDF
        </Button>
        <Button onClick={handleDownloadPNG} variant="outline" className="h-12 px-8 text-base border-slate-300 hover:bg-slate-100 shadow-sm text-slate-700">
          <Download className="w-5 h-5 mr-2" /> Download PNG
        </Button>
      </div>
    </div>
  );
}
