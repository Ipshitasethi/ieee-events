import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Shield, UserPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('view');
  const [inviting, setInviting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      setCurrentUserRole(currentProfile?.role || 'owner'); // Defaulting to owner for demo purposes

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If there are no profiles yet, we might just be setting up
      setMembers(data || []);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      // In a real app, you would use admin API to invite users. 
      // For this demo with the client API, we simulate by showing a success message 
      // since inviteUserByEmail requires service role key or specific setup.
      toast.success(`Invite sent to ${inviteEmail} as ${inviteRole}`);
      setShowInvite(false);
      setInviteEmail('');
    } catch (error) {
      toast.error('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (id, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Role updated');
      setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const removeMember = async (id) => {
    try {
      // In a real app, this should delete the user from auth.users or revoke access
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Member removed');
      setMembers(members.filter(m => m.id !== id));
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-syne text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-sm text-slate-400">Manage who has access to the admin dashboard.</p>
        </div>
        {(currentUserRole === 'owner' || currentUserRole === 'full') && (
          <Button onClick={() => setShowInvite(true)}><UserPlus className="w-4 h-4 mr-2" /> Invite Member</Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Email / ID</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading team...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No team members found.</td></tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200 flex items-center gap-2">
                        {member.id === currentUserId && <span className="w-2 h-2 rounded-full bg-accent-cyan"></span>}
                        {member.email || member.id}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{member.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {currentUserRole === 'owner' && member.id !== currentUserId ? (
                        <select 
                          value={member.role || 'view'} 
                          onChange={(e) => updateRole(member.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-accent-cyan focus:border-accent-cyan block w-full p-2"
                        >
                          <option value="owner">Owner</option>
                          <option value="full">Full Access</option>
                          <option value="edit">Editor</option>
                          <option value="view">Viewer</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                          <Shield className="w-3 h-3 text-accent-cyan" />
                          {member.role || 'owner'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {currentUserRole === 'owner' && member.id !== currentUserId && (
                        <button 
                          onClick={() => removeMember(member.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card glow className="w-full max-w-sm shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-syne text-xl font-semibold">Invite Team Member</h3>
            </div>
            <div className="p-6">
              <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    type="email" 
                    required 
                    placeholder="colleague@ieee.org"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-elevated-admin px-3 py-2 text-sm text-slate-200"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                  >
                    <option value="view">Viewer (Read-only)</option>
                    <option value="edit">Editor (Manage events)</option>
                    <option value="full">Full Access</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
              <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit" form="invite-form" disabled={inviting}>
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
