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
    color: '#3b82f6',
  },
  {
    id: 'planning',
    label: 'Planning Agent',
    description: 'Project planning and resource allocation',
    icon: Lightbulb,
    color: '#f59e0b',
  },
  {
    id: 'client_insights',
    label: 'Client Insights Agent',
    description: 'Client analysis and recommendations',
    icon: Users,
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
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)]">
      {/* Agent Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 shrink-0 touch-scroll sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {AGENT_TYPES.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            className={clsx(
              'card p-4 text-left transition-all shrink-0 sm:shrink min-w-[200px] sm:min-w-0',
              selectedAgent === agent.id
                ? 'ring-2 shadow-md'
                : 'hover:shadow-md opacity-70 hover:opacity-100'
            )}
            style={selectedAgent === agent.id ? { borderColor: agent.color, outlineColor: agent.color } : {}}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: agent.color + '15', color: agent.color }}
              >
                <agent.icon size={20} />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900">{agent.label}</p>
                <p className="text-xs text-slate-500">{agent.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const agentInfo = getAgentInfo(message.agentType);
            return (
              <div
                key={message.id}
                className={clsx(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                    style={{ backgroundColor: agentInfo.color + '15' }}
                  >
                    <Bot size={16} style={{ color: agentInfo.color }} />
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-800'
                  )}
                >
                  {message.role === 'assistant' && message.agentType && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: agentInfo.color + '20',
                          color: agentInfo.color,
                        }}
                      >
                        {agentInfo.label}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p
                    className={clsx(
                      'text-xs mt-1.5',
                      message.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-1">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: getAgentInfo(selectedAgent).color + '15' }}
              >
                <Bot size={16} style={{ color: getAgentInfo(selectedAgent).color }} />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask the ${getAgentInfo(selectedAgent).label}...`}
                className="input resize-none pr-4"
                rows={1}
                style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={clsx(
                'btn rounded-xl px-4 py-2.5 transition-all',
                input.trim() && !isLoading
                  ? 'btn-primary'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Sparkles size={12} />
            AI-powered insights based on your consulting data
          </p>
        </div>
      </div>
    </div>
  );
}
