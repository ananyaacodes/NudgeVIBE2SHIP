import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { 
  Send, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  Layers, 
  Clock, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NudgeChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  needsAuth: boolean;
  onLogin: () => Promise<void>;
  isLoggingIn: boolean;
  criticalTasksCount?: number;
}

export const NudgeChat: React.FC<NudgeChatProps> = ({
  chatHistory,
  onSendMessage,
  isLoading,
  needsAuth,
  onLogin,
  isLoggingIn,
  criticalTasksCount = 0
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickAction = (actionText: string) => {
    if (isLoading) return;
    onSendMessage(actionText);
  };

  // Determine Nudge orb state based on parameters
  const orbState = isLoading 
    ? 'thinking' 
    : (criticalTasksCount > 0) 
      ? 'urgent' 
      : 'idle';

  const getOrbClass = (state: string) => {
    if (state === 'thinking') return 'nudge-orb-thinking';
    if (state === 'urgent') return 'nudge-orb-urgent';
    return 'nudge-orb-organic';
  };

  // Heuristics to detect custom JSON structures or schedule blocks inside Nudge text answers
  const renderMessageContent = (msg: ChatMessage) => {
    const textPart = msg.parts.find(p => p.text)?.text || '';
    
    // Check if the message contains a schedule table or list
    if (textPart.includes('|') && textPart.toLowerCase().includes('time') && textPart.toLowerCase().includes('activity')) {
      // It's a markdown table schedule, let's render it nicely!
      return (
        <div className="space-y-2">
          <p className="text-sm text-indigo-100 leading-relaxed font-sans">{textPart.split('|')[0]}</p>
          <div className="glass-card-lavender rounded-2xl p-4 border border-[#251e4d]/50 font-mono text-xs overflow-x-auto text-violet-200">
            {textPart}
          </div>
        </div>
      );
    }

    return (
      <p className="text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap font-sans">
        {textPart}
      </p>
    );
  };

  return (
    <div id="nudge-chat" className="flex flex-col h-full bg-[#060413]/70 backdrop-blur-md text-zinc-100 relative">
      {/* Nudge Chat Header */}
      <div className="p-4 border-b border-[#251e4d]/35 flex items-center justify-between bg-[#0c0824]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Animated Nudge Orb */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full bg-violet-600/20 blur-md ${isLoading ? 'animate-ping' : 'animate-pulse'}`}></div>
            <div className={`w-7 h-7 flex flex-col items-center justify-center relative ${getOrbClass(orbState)}`}>
              {/* Subtle Eyes */}
              <div className="flex gap-[3px] items-center justify-center">
                <div className="nudge-eye-small animate-blink" />
                <div className="nudge-eye-small animate-blink" />
              </div>
            </div>
            {/* Blinking indicator */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-violet-400 rounded-full border border-zinc-950 shadow-sm animate-ping"></div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-violet-400 rounded-full border border-zinc-950 shadow-sm"></div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-semibold text-sm tracking-wide text-white">Nudge</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 font-mono font-semibold border border-violet-500/20">Proactive Companion</span>
            </div>
            <span className="text-[11px] text-indigo-300/60">Monitoring deadlines & commitments</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-[#130f3a]/80 border border-[#251e4d]/50 px-2.5 py-1.5 rounded-full">
          <BrainCircuit className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">AI Guard Active</span>
        </div>
      </div>

      {/* Message List area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-5 py-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-600/15 blur-2xl scale-125 animate-pulse pointer-events-none"></div>
              <div className={`w-20 h-20 flex flex-col items-center justify-center z-10 relative ${getOrbClass(orbState)} shadow-[0_0_40px_rgba(139,92,246,0.35)]`}>
                {/* Character eyes */}
                <div className="flex gap-2.5 items-center justify-center mt-1">
                  <div className="nudge-eye-small animate-blink" />
                  <div className="nudge-eye-small animate-blink" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display font-extrabold text-xl text-white">Hi, I'm Nudge.</h1>
              <p className="text-xs text-indigo-200/60 leading-relaxed font-sans px-4">
                I capture task logs automatically, track deadlines, query Google Calendar, and plan time blocks so you actually finish your work before it's too late.
              </p>
            </div>

            {/* Quick Actions / Helpers */}
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              <button
                onClick={() => handleQuickAction("What are my current priorities? Get my tasks list.")}
                className="flex items-center gap-2.5 glass-card-lavender hover:bg-[#1a1547]/40 rounded-2xl p-3 text-left text-xs transition-all cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-violet-400 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-200">Review Urgent Priorities</div>
                  <div className="text-[10px] text-indigo-300/50">Pulls task registers, sorted by date</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction("Suggest a schedule for tomorrow.")}
                className="flex items-center gap-2.5 glass-card-lavender hover:bg-[#1a1547]/40 rounded-2xl p-3 text-left text-xs transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-200">Time-Block My Day</div>
                  <div className="text-[10px] text-indigo-300/50">Syncs calendar events and logs hourly work</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction("I have an organic chemistry exam due June 27th high priority")}
                className="flex items-center gap-2.5 glass-card-lavender hover:bg-[#1a1547]/40 rounded-2xl p-3 text-left text-xs transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-200">Log A New Deadline</div>
                  <div className="text-[10px] text-indigo-300/50">Say a date and details; I will record it</div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => {
              const isUser = msg.role === 'user';
              
              // Skip raw tool-only content blocks to keep the conversation clean
              const hasText = msg.parts.some(p => p.text);
              const isToolOnly = !hasText && msg.parts.some(p => p.functionCall || p.functionResponse);
              if (isToolOnly) return null;

              return (
                <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className={`w-7 h-7 flex items-center justify-center relative shrink-0 mt-0.5 ${getOrbClass(orbState)}`}>
                      <div className="flex gap-[2px] items-center justify-center">
                        <div className="nudge-eye-small" />
                        <div className="nudge-eye-small" />
                      </div>
                    </div>
                  )}

                  <div className="max-w-[85%] flex flex-col gap-1.5">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser 
                        ? 'chat-bubble-user rounded-br-none font-medium' 
                        : 'chat-bubble-nudge rounded-bl-none text-zinc-100'
                    }`}>
                      {renderMessageContent(msg)}
                    </div>

                    {/* Meta/Tool-execution notifications under message */}
                    {!isUser && msg.parts.some(p => p.text) && (
                      <div className="space-y-1">
                        {/* Display subtle indicators if the assistant completed functions behind the scenes */}
                        {chatHistory.filter(h => h.role === 'user' && h.parts.some(p => p.functionResponse)).map((h, index) => {
                          const resp = h.parts.find(p => p.functionResponse)?.functionResponse;
                          if (!resp) return null;

                          let label = '';
                          let details = '';

                          if (resp.name === 'add_task') {
                            label = 'Saved deadline';
                            details = resp.response?.task?.title || 'New target';
                          } else if (resp.name === 'get_priorities') {
                            label = 'Indexed urgency matrix';
                            details = `${resp.response?.tasks?.length || 0} tasks evaluated`;
                          } else if (resp.name === 'suggest_schedule') {
                            label = 'Merged calendar and allocated slots';
                            details = resp.response?.message || 'Schedule mapped';
                          } else {
                            return null;
                          }

                          return (
                            <div key={index} className="flex items-center gap-1.5 text-[9px] text-indigo-300/50 font-mono bg-[#110e30]/50 px-2 py-1 rounded-md border border-[#251e4d]/40">
                              <CheckCircle className="w-3 h-3 text-violet-400" />
                              <span className="font-bold text-indigo-200">{label}:</span>
                              <span className="text-indigo-300 truncate max-w-[200px]">{details}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading / Thinking bubble */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 flex flex-col items-center justify-center relative shrink-0 mt-0.5 nudge-orb-thinking">
                  {/* Subtle character eyes */}
                  <div className="flex gap-[2px] items-center justify-center">
                    <div className="nudge-eye-small" />
                    <div className="nudge-eye-small" />
                  </div>
                </div>
                <div className="chat-bubble-nudge rounded-2xl rounded-bl-none p-3.5 text-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-violet-300 font-mono font-medium animate-pulse">Nudge is analyzing</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input / Control Station */}
      <div className="p-4 bg-[#060413]/50 border-t border-[#251e4d]/35">
        {needsAuth ? (
          <div className="glass-card-lavender p-5 rounded-3xl flex flex-col items-center text-center gap-4">
            <Calendar className="w-9 h-9 text-violet-400 animate-pulse" />
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Sign-in Required to Enable Full Features</h4>
              <p className="text-[11px] text-indigo-200/50 mt-1 max-w-sm">Connect Google Calendar and sync logs with our high-integrity task store</p>
            </div>
            {/* Consistent Pill style Link button */}
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="btn-pill-lavender text-white font-bold px-6 py-2.5 shadow-[0_0_20px_rgba(167,139,250,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
              <span className="text-xs">
                {isLoggingIn ? 'Establishing connection...' : 'Link Google Account'}
              </span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative">
            <div className="flex items-center bg-[#0f0b2a]/90 border border-[#251e4d]/70 p-1 rounded-2xl">
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder={isLoading ? "Nudge is working..." : "Message Nudge..."}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm px-4 flex-grow text-zinc-100 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="btn-pill-lavender text-white w-10 h-10 flex items-center justify-center hover:scale-105 transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

