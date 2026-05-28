import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Task, ProjectMember, BoardEvent } from '../types';
import { useWebsocket } from '../context/WebsocketContext';
import { useAuth } from '../context/AuthContext';
import { Plus, User, FileText, Move, Trash2, Calendar, Star, AlertCircle } from 'lucide-react';

interface BoardProps {
  projectId: number;
  projectCode: string;
}

const Board: React.FC<BoardProps> = ({ projectId, projectCode }) => {
  const { user } = useAuth();
  const { subscribe, send, connected } = useWebsocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time notifications toast
  const [notification, setNotification] = useState<{ message: string; actor: string } | null>(null);

  // New task form state
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskPoints, setTaskPoints] = useState(3);
  const [taskAssignee, setTaskAssignee] = useState<number | null>(null);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, membersRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}/tasks`),
        axios.get(`/api/projects/${projectId}/members`)
      ]);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
    } catch (e) {
      console.error('Failed to load board data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [projectId]);

  // WebSocket Subscription for Real-time board movements
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribe(`/topic/project/${projectId}/board`, (event: BoardEvent) => {
      console.log('WS Broadcast Received:', event);

      if (event.type === 'TASK_MOVED' && event.task) {
        const updatedTask = event.task;
        
        // Instant HUD visual notification toast!
        if (event.actor !== user?.username) {
          setNotification({ message: event.message, actor: event.actor });
          setTimeout(() => setNotification(null), 4000);
        }

        // Re-load board tasks to reflect precise database re-order coordinates!
        // This guarantees that all users see exactly identical, correct card stack ordering.
        axios.get(`/api/projects/${projectId}/tasks`).then((res) => {
          setTasks(res.data);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [connected, projectId, user]);

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE') => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr);
    
    // Find destination column tasks to place card at the absolute end index
    const columnTasks = tasks.filter(t => t.status === targetStatus);
    const destIndex = columnTasks.length;

    // Send movement payload via WebSockets to automatically broadcast to all members!
    send(`/app/project/${projectId}/move-task/${taskId}`, {
      status: targetStatus,
      orderIndex: destIndex
    });

    // Optimistic local UI shift before WS returns (makes dragging feel snappy!)
    setTasks(prevTasks => {
      return prevTasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: targetStatus, orderIndex: destIndex };
        }
        return t;
      });
    });
  };

  // Add Task API submission
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const res = await axios.post(`/api/projects/${projectId}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        storyPoints: taskPoints,
        assigneeId: taskAssignee
      });

      setTasks(prev => [...prev, res.data]);
      setShowModal(false);
      
      // Clear form
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskPoints(3);
      setTaskAssignee(null);

    } catch (e) {
      console.error('Failed to create task:', e);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`/api/tasks/${taskId}?projectId=${projectId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Synchronizing Kanban workspace...</p>
      </div>
    );
  }

  // Filter tasks into columns
  const columns = {
    TODO: { title: 'To Do', tasks: tasks.filter(t => t.status === 'TODO'), bg: 'bg-slate-900/40' },
    IN_PROGRESS: { title: 'In Progress', tasks: tasks.filter(t => t.status === 'IN_PROGRESS'), bg: 'bg-indigo-950/10' },
    IN_REVIEW: { title: 'In Review', tasks: tasks.filter(t => t.status === 'IN_REVIEW'), bg: 'bg-purple-950/10' },
    DONE: { title: 'Completed', tasks: tasks.filter(t => t.status === 'DONE'), bg: 'bg-emerald-950/10' }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Visual Live Notifications HUD Toaster */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border border-indigo-500/30 px-5 py-3.5 rounded-2xl flex items-center gap-3.5 shadow-2xl animate-fade-in">
          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping shrink-0" />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Collaboration Stream</p>
            <p className="text-xs font-semibold text-slate-200 mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Board controls bar */}
      <div className="flex justify-between items-center bg-slate-900/30 border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-slate-400">{connected ? 'WebSockets Sync Active' : 'Disconnected'}</span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Task</span>
        </button>
      </div>

      {/* Columns board grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[65vh]">
        {Object.entries(columns).map(([colStatus, col]) => (
          <div 
            key={colStatus} 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, colStatus as any)}
            className={`glass-panel rounded-2xl p-4 flex flex-col h-full ${col.bg} border border-white/5`}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span>{col.title}</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded-md">{col.tasks.length}</span>
              </h4>
            </div>

            {/* Cards container scroll area */}
            <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[55vh] pr-1.5 board-scroll pb-4">
              {col.tasks.length > 0 ? (
                col.tasks
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing relative select-none"
                    >
                      {/* Drag grip icon */}
                      <Move className="w-3.5 h-3.5 text-slate-600 absolute right-4 top-4 opacity-0 hover:opacity-100 transition-opacity" />

                      {/* Header details */}
                      <div className="flex justify-between items-start gap-3">
                        <span className="text-[10px] font-extrabold tracking-wider bg-slate-800 border border-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded-md uppercase">
                          {task.projectCode}-{task.id}
                        </span>
                        <span className={`text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded uppercase ${
                          task.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          task.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400' :
                          task.priority === 'MEDIUM' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h5 className="text-xs font-bold text-slate-200 mt-2.5 leading-snug">{task.title}</h5>
                      {task.description && (
                        <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
                      )}

                      {/* Footer assignees & points */}
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <User className="w-3 h-3 text-indigo-500" />
                          <span className="font-semibold">{task.assigneeName || 'Unassigned'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded">
                            <Star className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" />
                            <span>{task.storyPoints}</span>
                          </span>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="h-28 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl text-[10px] text-slate-600 font-medium">
                  Drop dynamic tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl relative animate-slide-up">
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-widest mb-6">Create New Task Coordinates</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="Design login system architecture..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Task Description</label>
                <textarea
                  placeholder="Draft system layouts, entities, and encryption rules..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="glass-input w-full px-3 py-2.5 rounded-lg text-slate-200 resize-none board-scroll"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-lg text-slate-200"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Story Weight (Points)</label>
                  <input
                    type="number"
                    min={0}
                    max={21}
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(parseInt(e.target.value))}
                    className="glass-input w-full px-3 py-2.5 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Assign User</label>
                <select
                  value={taskAssignee || ''}
                  onChange={(e) => setTaskAssignee(e.target.value ? parseInt(e.target.value) : null)}
                  className="glass-input w-full px-3 py-2.5 rounded-lg text-slate-200"
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.userId}>{m.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl"
                >
                  Register Coordinates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
