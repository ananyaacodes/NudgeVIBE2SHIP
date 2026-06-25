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
  BrainCircuit,
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  Trash2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Custom Interactive Spectrogram Voice Player
const VoiceMessagePlayer: React.FC<{ audioUrl: string; duration?: string }> = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl || audioUrl === 'demo-audio-url') return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setMaxDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    // If it's a demo audio or placeholder
    if (audioUrl === 'demo-audio-url') {
      setIsPlaying(prev => !prev);
      if (!isPlaying) {
        // Simulate progress timer
        let start = Date.now();
        const interval = setInterval(() => {
          setCurrentTime(prev => {
            if (prev >= 4) {
              clearInterval(interval);
              setIsPlaying(false);
              return 0;
            }
            return (Date.now() - start) / 1000;
          });
        }, 100);
      } else {
        setCurrentTime(0);
      }
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Audio playback error:", err));
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 bg-violet-950/40 border border-violet-800/30 p-3 rounded-2xl w-full max-w-[280px] shadow-[0_4px_20px_rgba(139,92,246,0.15)]">
      <button
        onClick={togglePlay}
        type="button"
        className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md border border-violet-400/20"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-white text-white" />
        ) : (
          <Play className="w-4 h-4 fill-white text-white translate-x-[1px]" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        {/* Spectrogram / Spectrograph specter wave */}
        <div className="flex items-end gap-[3px] h-6 mb-1">
          {Array.from({ length: 22 }).map((_, i) => {
            // Pulsate heights live if audio playing
            const height = isPlaying 
              ? Math.abs(Math.sin(currentTime * 8 + i * 0.4)) * 16 + 4
              : Math.abs(Math.sin(i * 0.3)) * 10 + 4;
            return (
              <div 
                key={i} 
                className={`w-[2.5px] rounded-full transition-all duration-150 ${isPlaying ? 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]' : 'bg-violet-600/40'}`}
                style={{ height: `${Math.max(2, height)}px` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[9px] text-indigo-300/80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{duration || (maxDuration ? formatTime(maxDuration) : '0:05')}</span>
        </div>
      </div>
    </div>
  );
};

interface NudgeChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, audioUrl?: string, duration?: string) => Promise<void>;
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

  // Voice Integration State variables
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Voice-to-Text Speech Recognition Initializer
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          // If we are listening, add text to input
          setInputText(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        // Handle common non-fatal warnings
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.warn('Speech recognition warning:', event.error);
          return;
        }

        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError("Microphone permission was blocked. To grant access, click 'Open in New Tab' at the top right of the preview panel, or check your browser's site settings.");
        } else {
          setVoiceError(`Voice transcription issue: ${event.error}. Please check your browser's microphone permissions.`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    setVoiceError(null);
    if (!recognitionRef.current) {
      setVoiceError("Voice-to-text is not fully supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error("Failed to start SpeechRecognition:", err);
        setVoiceError(`Could not start speech recognition: ${err.message || err}`);
      }
    }
  };

  // Direct Voice Message Sending logic
  const startVoiceRecording = async () => {
    if (isRecording) return;
    setVoiceError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("navigator.mediaDevices not accessible");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const mins = Math.floor(recordingDuration / 60);
        const secs = recordingDuration % 60;
        const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Send Voice message to chat
        onSendMessage("🎙️ Voice Message", audioUrl, durationStr);
        
        // Cleanup streams
        stream.getTracks().forEach(track => track.stop());
        setRecordingDuration(0);
        setIsRecording(false);
      };

      setIsRecording(true);
      setRecordingDuration(0);
      mediaRecorder.start();

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn("Direct microphone unavailable (or sandboxed inside iframe). Initiating highly polished demo recorder:", err);
      // Fallback
      simulateDemoVoiceMsg();
      setVoiceError("Microphone input was restricted in the preview pane. We started a smart voice simulator fallback! To test real recording, click 'Open in New Tab' at the top right.");
    }
  };

  const stopVoiceRecording = () => {
    if (!isRecording) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Demo recording mode stop
      const mins = Math.floor(recordingDuration / 60);
      const secs = recordingDuration % 60;
      const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      onSendMessage("🎙️ [Voice Message] Hey Nudge, please review my schedule and add tasks.", "demo-audio-url", durationStr);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const cancelVoiceRecording = () => {
    if (!isRecording) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }

    setIsRecording(false);
    setRecordingDuration(0);
  };

  const simulateDemoVoiceMsg = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
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
    
    // 1. Audio Voice Message bubble block
    if (msg.audioUrl) {
      return (
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 font-bold font-mono uppercase">
            <Volume2 className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>Voice Record Transcript</span>
          </div>
          <VoiceMessagePlayer audioUrl={msg.audioUrl} duration={msg.duration} />
          {textPart && textPart !== "🎙️ Voice Message" && textPart !== "🎙️ [Voice Message]" && (
            <p className="text-xs text-indigo-200/95 leading-relaxed italic border-l-2 border-violet-500/30 pl-2 mt-1">
              "{textPart}"
            </p>
          )}
        </div>
      );
    }

    // 2. Schedule markdown table rendering
    if (textPart.includes('|') && textPart.toLowerCase().includes('time') && textPart.toLowerCase().includes('activity')) {
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
    <div id="nudge-chat" className="flex flex-col h-full bg-[#060413]/70 backdrop-blur-md text-zinc-100 relative overflow-hidden">
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
        <AnimatePresence>
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5 relative"
            >
              <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 pr-6 leading-relaxed">
                {voiceError}
              </div>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                className="absolute top-2 right-2 text-amber-400/70 hover:text-white transition-all cursor-pointer"
                title="Dismiss warning"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-[#0f0b2a]/90 border border-[#251e4d]/70 p-1.5 rounded-2xl relative min-w-0">
                {isRecording ? (
                  /* Recording Voice Message UI */
                  <div className="flex items-center justify-between w-full px-3 py-1.5 bg-violet-950/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      <span className="text-xs text-indigo-200 font-mono font-bold">
                        Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60) < 10 ? '0' : ''}{recordingDuration % 60}
                      </span>
                      {/* Spectrogram visualization wave */}
                      <div className="flex items-center gap-[2px] h-3">
                        <div className="w-[2.5px] h-2 bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-[2.5px] h-3.5 bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-[2.5px] h-1 bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <div className="w-[2.5px] h-2.5 bg-red-400 animate-bounce" style={{ animationDelay: '450ms' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="p-1 px-2.5 rounded-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-[10px] font-extrabold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="p-1 px-3 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 hover:scale-105 text-white text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-md"
                      >
                        <Send className="w-3 h-3 fill-white text-white" /> Send Msg
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Input / Voice-to-Text UI */
                  <>
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      placeholder={isLoading ? "Nudge is working..." : (isListening ? "Listening... Speak now..." : "Message Nudge...")}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm px-3 flex-grow text-zinc-100 placeholder:text-zinc-500 min-w-0"
                    />
                    
                    {/* Voice-to-Text Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      title="Voice-to-Text Transcription"
                      className={`p-1.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer ${isListening ? 'text-violet-400 bg-violet-950/40 animate-pulse border border-violet-800/30' : 'text-indigo-300/70 hover:text-white'}`}
                    >
                      {isListening ? <MicOff className="w-4 h-4 text-violet-400" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>

              {/* Record Voice Message toggle Button (visible when not recording) */}
              {!isRecording && (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  disabled={isLoading}
                  title="Send Voice Message directly"
                  className="w-10 h-10 rounded-2xl bg-[#0f0b2a]/90 border border-[#251e4d]/70 hover:border-violet-500/50 flex items-center justify-center text-indigo-300 hover:text-violet-300 transition-all cursor-pointer shrink-0 hover:bg-[#150e4a]"
                >
                  <Volume2 className="w-4 h-4 text-violet-400" />
                </button>
              )}

              {/* Main Text Send Button */}
              {!isRecording && (
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="btn-pill-lavender text-white w-10 h-10 flex items-center justify-center hover:scale-105 transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
