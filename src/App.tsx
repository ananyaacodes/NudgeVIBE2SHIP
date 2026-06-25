import { useState, useEffect } from 'react';
import { Task, ChatMessage } from './types';
import { TaskSidebar } from './components/TaskSidebar';
import { NudgeChat } from './components/NudgeChat';
import { Starfield } from './components/Starfield';
import { LandscapeBackground } from './components/LandscapeBackground';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './lib/firebase-client';
import { User } from 'firebase/auth';
import { 
  Sparkles, 
  LogOut, 
  AlertOctagon, 
  User as UserIcon,
  HelpCircle,
  TrendingUp,
  Flame,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setCurrentUser(user);
        setGoogleToken(token || null);
        setNeedsAuth(false);
      },
      () => {
        setCurrentUser(null);
        setGoogleToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Tasks once authenticated
  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [currentUser]);

  const fetchTasks = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'x-user-id': currentUser.uid
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setGoogleToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setGoogleToken(null);
      setNeedsAuth(true);
      setChatHistory([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Task Mutators
  const handleAddTask = async (title: string, dueDate: string, priority: Task['priority'], category: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid
        },
        body: JSON.stringify({ title, due_date: dueDate, priority, category })
      });
      if (response.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Error logging task:', err);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid
        },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.uid
        }
      });
      if (response.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Send Message to Nudge Chat
  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;

    // Create user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      parts: [{ text }],
      createdAt: new Date().toISOString()
    };

    const nextHistory = [...chatHistory, userMsg];
    setChatHistory(nextHistory);
    setIsLoadingChat(true);

    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.uid
      };
      if (googleToken) {
        headers['Authorization'] = `Bearer ${googleToken}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: nextHistory })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update history with full history returned by Gemini (including tool calls and responses)
        if (data.updatedHistory) {
          const finalHistory = data.updatedHistory.map((h: any) => ({
            id: Math.random().toString(),
            role: h.role,
            parts: h.parts,
            createdAt: new Date().toISOString()
          }));
          setChatHistory(finalHistory);
        } else {
          // Fallback if updatedHistory isn't returned
          const assistantMsg: ChatMessage = {
            id: Math.random().toString(),
            role: 'model',
            parts: [{ text: data.text }],
            createdAt: new Date().toISOString()
          };
          setChatHistory([...nextHistory, assistantMsg]);
        }

        // If Nudge performed backend actions like add_task or suggest_schedule, refresh the local tasks!
        if (data.actionsTaken && data.actionsTaken.length > 0) {
          console.log('[App] Action executed by Nudge. Refreshing task list.');
          await fetchTasks();
        }

      } else {
        const errData = await response.json();
        const errorMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'model',
          parts: [{ text: `Error: ${errData.error || 'Failed to get answer from Nudge.'}` }],
          createdAt: new Date().toISOString(),
          isSystem: true
        };
        setChatHistory([...nextHistory, errorMsg]);
      }
    } catch (err: any) {
      console.error('Chat failed:', err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        parts: [{ text: 'Network communication interrupted. Please check your connection.' }],
        createdAt: new Date().toISOString(),
        isSystem: true
      };
      setChatHistory([...nextHistory, errorMsg]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Proactive Alarms Helper: Find tasks due within 24 hours that are pending or in-progress
  const getProactiveAlarms = () => {
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      const dueTime = new Date(task.due_date).getTime();
      const now = Date.now();
      const hoursLeft = (dueTime - now) / (1000 * 60 * 60);
      return hoursLeft > 0 && hoursLeft <= 24;
    });
  };

  const criticalTasks = getProactiveAlarms();

  return (
    <div id="app-container" className="flex flex-col h-screen w-full bg-transparent text-zinc-100 selection:bg-violet-600 selection:text-white font-sans overflow-hidden relative">
      {/* Interactive Starfield Parallax Particles */}
      <Starfield />

      {/* Dynamic Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0d0926]/85 border-b border-[#251e4d]/40 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center border border-violet-400/20 shadow-[0_0_15px_rgba(139,92,246,0.45)]">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base tracking-wide text-white leading-none">Last-Minute Life Saver</h1>
            <span className="text-[10px] text-violet-400 font-mono tracking-wider uppercase mt-1.5 block font-semibold">Proactive AI Deadline Guardian</span>
          </div>
        </div>

        {/* User Account / Control info */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-zinc-200">{currentUser.displayName || 'Committed User'}</span>
              <span className="text-[10px] text-indigo-400/70 font-mono">{currentUser.email}</span>
            </div>
            
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                referrerPolicy="no-referrer"
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-violet-800/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-zinc-400" />
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-[#251e4d]/50 hover:bg-violet-950/20 hover:border-violet-900/30 text-indigo-300 hover:text-violet-400 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Proactive Flag Banner (Critical alarm less than 24h away) */}
      <AnimatePresence>
        {currentUser && criticalTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-950/30 border-b border-indigo-900/40 px-6 py-2.5 flex items-center justify-between text-xs text-indigo-100 z-10"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4.5 h-4.5 text-violet-400 animate-bounce" />
              <span>
                <strong>CRITICAL ALARM:</strong> you have <strong>{criticalTasks.length}</strong> deadline(s) due in less than 24 hours!
              </span>
            </div>
            <button
              onClick={() => handleSendMessage("Re-plan my day to finish my urgent tasks before they are due.")}
              className="btn-pill-lavender text-white font-semibold px-5 py-1.5 text-[11px] transition-all cursor-pointer shadow-[0_0_15px_rgba(167,139,250,0.35)]"
            >
              Have Nudge Re-Plan Day
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden z-10">
        {needsAuth ? (
          /* Landing Screen / Onboarding */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden w-full">
            {/* Full Scene Illustration background */}
            <LandscapeBackground />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6">
              {/* The Cosmic Orb Area with Floating Glass Cards */}
              <div className="relative w-full max-w-md h-72 flex items-center justify-center my-2">
                {/* Soft glowing halo bleeding into the background behind the orb */}
                <div className="absolute w-80 h-80 rounded-full bg-violet-600/15 blur-3xl scale-125 animate-pulse pointer-events-none"></div>
                
                {/* Main character Nudge orb */}
                <div className="relative z-10">
                  {/* Secondary outer glow */}
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl scale-110 pointer-events-none"></div>
                  
                  {/* ROTATING GLOW RING: Orbiting light animation */}
                  <div className="nudge-orbit-ring" />

                  <div className={`w-36 h-36 ${isLoadingChat ? 'nudge-orb-thinking' : criticalTasks.length > 0 ? 'nudge-orb-urgent' : 'nudge-orb-organic'} flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(139,92,246,0.35)]`}>
                    {/* CRESCENT HIGHLIGHT to simulate light wrapping around a sphere */}
                    <div className="orb-crescent-highlight" />

                    {/* Triangles/almond shaped eyes pointing up, slightly lower-centered */}
                    <div className="flex gap-4 items-center justify-center mt-3 relative z-10">
                      <div className="nudge-eye animate-blink" />
                      <div className="nudge-eye animate-blink" />
                    </div>
                  </div>
                </div>

                {/* Floating Translucent Glass Cards at different depths */}
                {/* Card 1: Left-Top */}
                <motion.div
                  animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut" }}
                  className="absolute left-3 top-6 md:-left-12 md:top-6 glass-card-lavender px-4 py-2.5 rounded-2xl flex items-center gap-2 z-20 hover:scale-105 transition-transform"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-violet-200">Due in 3h</span>
                </motion.div>

                {/* Card 2: Right-Top */}
                <motion.div
                  animate={{ y: [0, 8, 0], x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 6.4, ease: "easeInOut", delay: 0.4 }}
                  className="absolute right-3 top-6 md:-right-12 md:top-6 glass-card-lavender px-4 py-2.5 rounded-2xl flex items-center gap-2 z-20 hover:scale-105 transition-transform"
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]"></span>
                  <span className="text-xs font-semibold tracking-wide text-indigo-200">Synced with Calendar</span>
                </motion.div>

                {/* Card 3: Left-Bottom */}
                <motion.div
                  animate={{ y: [0, 7, 0], x: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 1.1 }}
                  className="absolute left-3 bottom-6 md:-left-12 md:bottom-6 glass-card-lavender px-4 py-2.5 rounded-2xl flex items-center gap-2 z-20 hover:scale-105 transition-transform"
                >
                  <div className="flex -space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_4px_rgba(167,139,250,0.6)]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  </div>
                  <span className="text-xs font-semibold tracking-wide text-violet-200">4 tasks today</span>
                </motion.div>

                {/* Card 4: Right-Bottom */}
                <motion.div
                  animate={{ y: [0, -7, 0], x: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 5.8, ease: "easeInOut", delay: 1.6 }}
                  className="absolute right-3 bottom-6 md:-right-12 md:bottom-6 glass-card-lavender px-4 py-2.5 rounded-2xl flex items-center gap-2 z-20 hover:scale-105 transition-transform"
                >
                  <span className="h-2 w-2 rounded-full bg-violet-300 animate-pulse shadow-[0_0_8px_rgba(196,181,253,0.8)]"></span>
                  <span className="text-xs font-semibold tracking-wide text-indigo-200 font-mono">Guardian Active</span>
                </motion.div>
              </div>

              <div className="space-y-4 flex flex-col items-center">
                <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-white leading-tight">
                  Defeat Deadlines. Reclaim Time.
                </h2>
                {/* Thin glowing horizontal accent line under headline */}
                <div className="glowing-divider w-32"></div>
                <p className="text-indigo-200/70 text-sm leading-relaxed font-sans max-w-lg mx-auto pt-1">
                  Meet <strong className="text-violet-400 font-semibold">Nudge</strong>, a hyper-focused AI productivity assistant that captures deadlines automatically, syncs with Google Calendar, and creates time-blocked plans to keep you on schedule.
                </p>
              </div>

              {/* Premium Pill-shaped CTA button with lavender gradient */}
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="btn-pill-lavender text-white font-extrabold text-base tracking-wider px-10 py-4 shadow-[0_0_40px_rgba(167,139,250,0.8)] border-2 border-violet-400/40 hover:border-violet-300/60 transition-all z-10 cursor-pointer mt-4 flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                <Sparkles className="w-5 h-5 text-indigo-100 animate-pulse" />
                <span>{isLoggingIn ? 'Connecting...' : 'Secure Google Sign-In'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active App Workspace */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
            {/* Sidebar Column */}
            <TaskSidebar
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />

            {/* Chat Column */}
            <NudgeChat
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingChat}
              needsAuth={needsAuth}
              onLogin={handleLogin}
              isLoggingIn={isLoggingIn}
              criticalTasksCount={criticalTasks.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
