import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BarChart3, Lightbulb, Users } from 'lucide-react';
import { getAgentResponse } from '@/lib/api';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentType?: string;
  timestamp: Date;
}

const AGENT_TYPES = [
  {
    id: 'analytics',
    label: 'Analytics Agent',
    description: 'Revenue, utilization, and performance metrics',
    icon: BarChart3,
    gradient: 'from-indigo-500 to-indigo-600',
    lightBg: 'bg-indigo-50',
    color: '#6366f1',
  },
  {
    id: 'planning',
    label: 'Planning Agent',
    description: 'Project planning and resource allocation',
    icon: Lightbulb,
    gradient: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    color: '#f59e0b',
  },
  {
    id: 'client_insights',
    label: 'Client Insights Agent',
    description: 'Client analysis and recommendations',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-500',
    lightBg: 'bg-emerald-50',
    color: '#10b981',
  },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I\'m the ConsultPro AI Assistant. I can help you analyze your consulting data, plan projects, and gain insights about your clients. Select an agent type and ask me anything!',
      agentType: 'analytics',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('analytics');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAgentResponse(trimmed, selectedAgent);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        agentType: response.agent_type || selectedAgent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        agentType: selectedAgent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentInfo = (agentType?: string) => {
    return AGENT_TYPES.find((a) => a.id === agentType) || AGENT_TYPES[0];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] animate-fade-in">
      {/* Agent Type Selector */}
      <div className="flex gap-3 overflow-x-auto pb-3 mb-4 shrink-0 touch-scroll sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {AGENT_TYPES.map((agent) => {
          const isSelected = selectedAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={clsx(
                'card card-interactive p-4 text-left transition-all duration-200 shrink-0 sm:shrink min-w-[220px] sm:min-w-0',
                isSelected
                  ? 'ring-2 ring-indigo-500/30 shadow-lg border-indigo-200'
                  : 'hover:shadow-md opacity-70 hover:opacity-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'icon-box icon-box-md rounded-xl text-white shadow-md transition-transform duration-200',
                    `bg-gradient-to-br ${agent.gradient}`,
                    isSelected && 'scale-110'
                  )}
                >
                  <agent.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 tracking-tight">{agent.label}</p>
                  <p className="text-[11px] text-slate-500 leading-snug">{agent.description}</p>
                </div>
              </div>
              {isSelected && (
                <div className={`h-0.5 bg-gradient-to-r ${agent.gradient} rounded-full mt-3 -mx-1`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Chat Area */}
      <div className="flex-1 card flex flex-col overflow-hidden rounded-xl border border-slate-200">
        {/* Chat Header with Glass Effect */}
        <div className="glass px-5 py-3 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`icon-box icon-box-sm rounded-lg text-white bg-gradient-to-br ${getAgentInfo(selectedAgent).gradient}`}>
              <Bot size={14} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 tracking-tight">{getAgentInfo(selectedAgent).label}</p>
              <p className="text-[11px] text-slate-400">
                {isLoading ? 'Thinking...' : 'Ready to assist'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className={clsx(
                'w-2 h-2 rounded-full',
                isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              )} />
              <span className="text-[11px] font-semibold text-slate-400">
                {isLoading ? 'Processing' : 'Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-gradient-to-b from-slate-50/50 to-white">
          {messages.map((message) => {
            const agentInfo = getAgentInfo(message.agentType);
            return (
              <div
                key={message.id}
                className={clsx(
                  'flex gap-3 animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div
                    className={`icon-box icon-box-sm rounded-full text-white bg-gradient-to-br ${agentInfo.gradient} shadow-md shrink-0 mt-1`}
                  >
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-sm',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-md'
                  )}
                >
                  {message.role === 'assistant' && message.agentType && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${agentInfo.color}, ${agentInfo.color}cc)`,
                        }}
                      >
                        {agentInfo.label}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p
                    className={clsx(
                      'text-[11px] mt-2 font-medium',
                      message.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="icon-box icon-box-sm rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shrink-0 mt-1">
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div
                className={`icon-box icon-box-sm rounded-full text-white bg-gradient-to-br ${getAgentInfo(selectedAgent).gradient} shadow-md shrink-0`}
              >
                <Bot size={14} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area with Glass Effect */}
        <div className="glass p-4 border-t border-slate-200/80 shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask the ${getAgentInfo(selectedAgent).label}...`}
                className="input resize-none pr-4 rounded-xl border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                rows={1}
                style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={clsx(
                'rounded-xl px-4 py-2.5 transition-all duration-200 flex items-center justify-center shadow-md',
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              )}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1.5 font-medium">
            <Sparkles size={12} className="text-indigo-400" />
            AI-powered insights based on your consulting data
          </p>
        </div>
      </div>
    </div>
  );
}
