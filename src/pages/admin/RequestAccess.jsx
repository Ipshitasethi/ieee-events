import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Zap, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RequestAccess() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase.from('profiles').select('status').eq('id', session.user.id).single();
        if (profile?.status === 'admin') {
          navigate('/admin');
        } else if (profile?.status === 'pending') {
          setSuccess(true);
        }
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (!success || !currentUserId) return;

    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUserId}` },
        (payload) => {
          if (payload.new.status === 'admin') {
            toast.success('Your access was approved!');
            navigate('/admin');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [success, currentUserId, navigate]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Call Supabase signUp. The DB trigger will handle creating the profile and sending the email.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      setCurrentUserId(data?.user?.id);
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-admin flex items-center justify-center p-4 relative overflow-hidden dark">
        <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none"></div>
        <Card glow className="w-full max-w-md relative z-10 text-center">
          <CardContent className="pt-8 pb-8 flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
            <h2 className="font-syne text-2xl font-bold text-white mb-2">Request Sent!</h2>
            <p className="text-slate-400 mb-6">
              Your request for access has been submitted. You will receive an email once the workspace owner approves your account.
            </p>
            <div className="flex items-center text-accent-cyan text-sm mb-6 animate-pulse">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Waiting for real-time approval...
            </div>
            <Link to="/">
              <Button>Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-admin flex items-center justify-center p-4 relative overflow-hidden dark">
      <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded bg-accent-blue/20 flex items-center justify-center glow-border mb-4">
            <Zap className="w-7 h-7 text-accent-cyan" />
          </div>
          <h1 className="font-syne font-bold text-3xl text-white tracking-tight">Request Access</h1>
          <p className="text-slate-400 mt-2">Create an account to manage events</p>
        </div>

        <Card glow className="w-full">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password (to use later)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-slate-500">Minimum 6 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Request Access'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
