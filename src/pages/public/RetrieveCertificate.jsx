import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Search, Download, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function RetrieveCertificate() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          event_id,
          events (
            name,
            date
          )
        `)
        .ilike('email', email.trim());

      if (error) throw error;
      setResults(data || []);
      
      if (data && data.length === 0) {
        toast.error('No certificates found for this email.');
      }
    } catch (error) {
      toast.error('Failed to retrieve certificates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="font-syne text-3xl font-bold text-slate-900 tracking-tight">Retrieve Certificate</h1>
        <p className="text-slate-500 mt-2">Enter your email address to find all your past event certificates.</p>
      </div>

      <Card className="shadow-lg border-t-4 border-t-accent-blue">
        <CardContent className="p-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email Address</Label>
              <Input 
                id="email"
                type="email"
                placeholder="Enter your registered email..."
                className="h-12 border-slate-300 bg-slate-50 text-slate-800 focus:ring-accent-blue"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="h-12 px-6" disabled={loading}>
              {loading ? 'Searching...' : <><Search className="w-4 h-4 mr-2" /> Find</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="font-syne font-bold text-xl text-slate-800">Your Certificates ({results.length})</h3>
          
          {results.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500">No records found. Make sure you used the exact email you registered with.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map(result => (
                <Card key={result.id} className="hover:border-accent-blue hover:shadow-md transition-all">
                  <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-syne font-bold text-lg text-slate-900">{result.events?.name}</h4>
                      <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                        <Calendar className="w-4 h-4" />
                        {result.events?.date ? new Date(result.events.date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <Link to={`/event/${result.event_id}/certificate/${result.id}`}>
                      <Button variant="outline" className="text-accent-blue border-accent-blue hover:bg-accent-blue hover:text-white w-full sm:w-auto">
                        <Download className="w-4 h-4 mr-2" /> View Certificate
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
