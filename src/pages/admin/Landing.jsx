import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Zap, Shield, UserPlus } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-admin flex items-center justify-center p-4 relative overflow-hidden dark">
      <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded bg-accent-blue/20 flex items-center justify-center glow-border mb-4">
            <Zap className="w-7 h-7 text-accent-cyan" />
          </div>
          <h1 className="font-syne font-bold text-3xl text-white tracking-tight">IEEE Attend</h1>
          <p className="text-slate-400 mt-2">Welcome to the platform</p>
        </div>

        <div className="grid gap-6">
          <Card glow className="w-full hover:border-accent-cyan transition-colors group">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-slate-800/50 text-slate-300 group-hover:text-accent-cyan transition-colors">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-syne text-xl font-bold text-white mb-2">Admin Login</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Already have access? Sign in to manage events and attendees.
                  </p>
                </div>
                <Link to="/login" className="w-full">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card glow className="w-full hover:border-accent-blue transition-colors group">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-slate-800/50 text-slate-300 group-hover:text-accent-blue transition-colors">
                  <UserPlus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-syne text-xl font-bold text-white mb-2">Request Access</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    New here? Request admin access from the workspace owner.
                  </p>
                </div>
                <Link to="/request-access" className="w-full">
                  <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                    Request Access
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
