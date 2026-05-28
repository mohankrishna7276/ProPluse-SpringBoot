import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebsocketProvider, useWebsocket } from './context/WebsocketContext';
import { Project } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import { LayoutDashboard, Trello, LogOut, Shield, ChevronDown, Plus, Sparkles, FolderKanban } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'board'>('dashboard');
  const [loading, setLoading] = useState(true);

  // New project modal states
  const [showProjModal, setShowProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/projects');
      setProjects(res.data);
      if (res.data.length > 0 && !activeProject) {
        setActiveProject(res.data[0]);
      }
    } catch (e) {
      console.error('Failed to pull workspaces:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newProjName.trim() || !newProjCode.trim()) return;

    try {
      const res = await axios.post('/api/projects', {
        name: newProjName,
        code: newProjCode.toUpperCase(),
        description: newProjDesc
      });
      
      const newProj = res.data;
      setProjects(prev => [...prev, newProj]);
      setActiveProject(newProj);
      setShowProjModal(false);

      // Reset
      setNewProjName('');
      setNewProjCode('');
      setNewProjDesc('');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to provision project workspace. Code may be in use.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Calibrating workspace frequencies...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 relative">
      {/* Visual background gradients */}
      <div className="glow-grid" />

      {/* Modern custom navigation bar */}
      <nav className="glass-panel sticky top-0 z-40 border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        {/* Title branding */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Shield className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="font-extrabold text-slate-100 tracking-tight text-lg">ProPulse</span>
        </div>

        {/* Dynamic Project Workspace Selector */}
        {activeProject && (
          <div className="relative group">
            <button className="flex items-center gap-2 bg-slate-900/40 border border-white/5 hover:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 transition-colors">
              <FolderKanban className="w-4 h-4 text-indigo-500" />
              <span>{activeProject.name}</span>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase bg-slate-800 px-1 py-0.5 rounded">
                {activeProject.code}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Dropdown list of other projects */}
            <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl border border-white/5 p-2 hidden group-hover:block transition-all shadow-2xl animate-fade-in">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest px-3 py-1.5 border-b border-white/5">
                Workspaces
              </p>
              <div className="space-y-1 mt-1 max-h-40 overflow-y-auto board-scroll">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => setActiveProject(proj)}
                    className={`w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-xl transition-all ${
                      activeProject.id === proj.id 
                        ? 'bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 font-semibold' 
                        : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate mr-2">{proj.name}</span>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase shrink-0">
                      {proj.code}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowProjModal(true)}
                className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold text-[10px] rounded-xl border border-indigo-500/20"
              >
                <Plus className="w-3 h-3" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        )}

        {/* User profile & Actions */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-slate-200 font-semibold">{user?.username}</span>
            <span className="text-[10px] text-slate-500">{user?.email}</span>
          </div>

          <button 
            onClick={logout}
            className="p-2.5 bg-slate-900/40 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-8">
        {activeProject ? (
          <div className="space-y-6">
            {/* View selectors tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-5 py-2.5 font-bold tracking-wider text-xs uppercase border-b-2 transition-all ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Performance Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-2 px-5 py-2.5 font-bold tracking-wider text-xs uppercase border-b-2 transition-all ${
                  activeTab === 'board'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trello className="w-4 h-4" />
                <span>Collaborative Kanban</span>
              </button>
            </div>

            {/* Active page rendering */}
            <div className="py-2">
              {activeTab === 'dashboard' ? (
                <Dashboard projectId={activeProject.id} projectCode={activeProject.code} />
              ) : (
                <Board projectId={activeProject.id} projectCode={activeProject.code} />
              )}
            </div>
          </div>
        ) : (
          /* Blank State Onboarding View */
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-lg mx-auto">
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl mb-4">
              <FolderKanban className="w-12 h-12 text-indigo-500 animate-pulse-subtle" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-200 tracking-tight">Provision Active Workspace</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Welcome to ProPulse. In order to begin processing telemetry diagnostics, you must provision an initial project workspace.
            </p>
            <button
              onClick={() => setShowProjModal(true)}
              className="mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4" />
              <span>Initialize Project</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Project Modal Popup */}
      {showProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl relative animate-slide-up">
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-widest mb-6">Initialize Project Workspace</h3>
            
            {error && (
              <div className="mb-4 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="ProPulse Web Platform..."
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
                  Project Code (2-6 Cap Letters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="PROP"
                  value={newProjCode}
                  onChange={(e) => setNewProjCode(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-lg text-slate-200 uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Project Description</label>
                <textarea
                  placeholder="Draft system specs, metrics trackers..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  rows={3}
                  className="glass-input w-full px-3.5 py-2.5 rounded-lg text-slate-200 resize-none board-scroll"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProjModal(false)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Provision Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <WebsocketProvider>
        <AuthConsumer />
      </WebsocketProvider>
    </AuthProvider>
  );
};

// Utility wrapper to route based on authentication
const AuthConsumer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardContent /> : <Login />;
};

export default App;
