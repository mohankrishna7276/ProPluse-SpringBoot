import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProjectStats, BoardEvent } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Activity, Download, CheckCircle, Clock, AlertCircle, TrendingUp, Users, PlusCircle } from 'lucide-react';

interface DashboardProps {
  projectId: number;
  projectCode: string;
}

interface AuditLog {
  id: number;
  action: string;
  details: string;
  createdAt: string;
  user?: {
    username: string;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ projectId, projectCode }) => {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('CONTRIBUTOR');
  const [addMemberMessage, setAddMemberMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}/stats`),
        axios.get(`/api/projects/${projectId}/logs?page=0&size=5`)
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data.content);
    } catch (e) {
      console.error('Failed to load dashboard statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [projectId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportMessage(null);
      const res = await axios.post(`/api/projects/${projectId}/export`);
      setExportMessage(res.data);
      
      // Auto dismiss message
      setTimeout(() => {
        setExportMessage(null);
      }, 5000);
    } catch (e) {
      console.error('Failed to initiate CSV export:', e);
      setExportMessage('Unable to compile task logs. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberMessage(null);
    if (!newMemberUsername.trim()) return;

    try {
      await axios.post(`/api/projects/${projectId}/members?username=${newMemberUsername}&role=${newMemberRole}`);
      setAddMemberMessage(`Successfully added user '${newMemberUsername}' as ${newMemberRole}!`);
      setNewMemberUsername('');
      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setAddMemberMessage(`Error: ${err.response.data.message}`);
      } else {
        setAddMemberMessage('Error: User not found or lacks permissions.');
      }
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Processing telemetry streams...</p>
      </div>
    );
  }

  // Pre-process chart data
  const statusData = [
    { name: 'To Do', value: Number(stats.todoTasks), color: '#64748b' },
    { name: 'In Progress', value: Number(stats.inProgressTasks), color: '#6366f1' },
    { name: 'In Review', value: Number(stats.inReviewTasks), color: '#a855f7' },
    { name: 'Completed', value: Number(stats.doneTasks), color: '#10b981' }
  ].filter(item => item.value > 0);

  const workloadData = stats.workloads.map(w => ({
    name: w.username,
    'Story Points': w.storyPoints,
    'Task Count': w.taskCount
  }));

  const completionRate = stats.totalTasks > 0 
    ? Math.round((Number(stats.doneTasks) / Number(stats.totalTasks)) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Overview stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks Card */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workspace Tasks</p>
              <h3 className="text-3xl font-bold mt-2 text-slate-100">{stats.totalTasks}</h3>
            </div>
            <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span className="text-indigo-400 font-semibold">{stats.todoTasks} Pending</span>
            <span>•</span>
            <span>{stats.inProgressTasks} Coding</span>
          </div>
        </div>

        {/* Completion Velocity Card */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Velocity</p>
              <h3 className="text-3xl font-bold mt-2 text-emerald-400">{completionRate}%</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{stats.doneTasks} Resolved</span>
            <span>out of {stats.totalTasks} total</span>
          </div>
        </div>

        {/* Story Points telemetry */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Story Points Burned</p>
              <h3 className="text-3xl font-bold mt-2 text-indigo-400">
                {stats.completedStoryPoints} <span className="text-xs font-normal text-slate-400">/ {stats.totalStoryPoints} pts</span>
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.totalStoryPoints > 0 ? (stats.completedStoryPoints / stats.totalStoryPoints) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Critical Tasks Action */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compile Project Report</p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? 'Compiling CSV...' : 'Generate Spreadsheet'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          {exportMessage && (
            <p className="absolute bottom-2 left-6 right-6 text-[10px] text-indigo-300 font-semibold animate-pulse-subtle bg-slate-900/90 py-0.5 rounded text-center truncate">
              {exportMessage}
            </p>
          )}
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Task Allocation By Stage</h4>
            <p className="text-xs text-slate-400">Numerical distribution across workflow lanes</p>
          </div>
          
          <div className="h-60 w-full flex items-center justify-center my-4">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#cbd5e1' }}
                    itemStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 flex flex-col items-center gap-1.5">
                <AlertCircle className="w-6 h-6 text-slate-600" />
                <span>No active data points seeded.</span>
              </div>
            )}
          </div>
        </div>

        {/* User Workload Allocation Chart */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Member Workspace Workload</h4>
          <p className="text-xs text-slate-400 mb-6">Assigned tasks volume vs compiled story points</p>
          
          <div className="h-60 w-full">
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Task Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Story Points" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-1.5">
                <Users className="w-6 h-6 text-slate-600" />
                <span>No assigned tasks on board.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chronological Logs and Settings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chronological Audit Logs */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span>Workspace Operations Audit</span>
          </h4>
          
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 board-scroll">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 bg-slate-900/30 border border-white/5 rounded-xl text-xs hover:border-slate-800 transition-colors">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-slate-300 font-medium leading-relaxed">{log.details}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Actor: {log.user?.username || 'System Engine'}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No historical activity logs recorded.</p>
            )}
          </div>
        </div>

        {/* Member Settings Workspace Add */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Project Team Roster</span>
            </h4>
            <p className="text-xs text-slate-400 mb-6">Provision new collaborators onto project</p>
          </div>

          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="charlie_dev"
                value={newMemberUsername}
                onChange={(e) => setNewMemberUsername(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Project Permission
              </label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg text-xs text-slate-200"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Provision Access</span>
            </button>
          </form>

          {addMemberMessage && (
            <div className="mt-4 p-2 rounded-lg bg-slate-900 border border-white/5 text-[10px] text-center text-indigo-300 font-medium">
              {addMemberMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
