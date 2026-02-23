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
  { id: 'analytics', label: 'Analytics', description: 'Revenue & performance metrics', icon: BarChart3, color: '#2563eb', bg: 'bg-blue-50' },
  { id: 'planning', label: 'Planning', description: 'Project planning & resources', icon: Lightbulb, color: '#d97706', bg: 'bg-amber-50' },
  { id: 'client_insights', label: 'Client Insights', description: 'Client analysis & recommendations', icon: Users, color: '#059669', bg: 'bg-green-50' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: "Hello! I'm the ConsultPro AI Assistant. I can help you analyze data, plan projects, and gain client insights. Select an agent and ask anything!", agentType: 'analytics', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('analytics');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await getAgentResponse(trimmed, selectedAgent);
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: response.response, agentType: response.agent_type || selectedAgent, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', agentType: selectedAgent, timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const getAgent = (type?: string) => AGENT_TYPES.find((a) => a.id === type) || AGENT_TYPES[0];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] animate-fade-in">
      {/* Agent selector */}
      <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
        {AGENT_TYPES.map((agent) => {
          const isSelected = selectedAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={clsx(
                'card p-3 text-left transition-all',
                isSelected ? 'ring-2 ring-blue-500/30 border-blue-200' : 'opacity-60 hover:opacity-100'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={`icon-box icon-box-sm rounded-lg ${agent.bg}`}>
                  <agent.icon size={14} style={{ color: agent.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{agent.label}</p>
                  <p className="text-[11px] text-gray-500 hidden sm:block">{agent.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 shrink-0 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className={`icon-box icon-box-sm rounded-lg ${getAgent(selectedAgent).bg}`}>
              <Bot size={14} style={{ color: getAgent(selectedAgent).color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{getAgent(selectedAgent).label} Agent</p>
              <p className="text-[11px] text-gray-400">{isLoading ? 'Thinking...' : 'Ready'}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className={clsx('w-2 h-2 rounded-full', isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400')} />
              <span className="text-[11px] text-gray-400">{isLoading ? 'Processing' : 'Online'}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((msg) => {
            const agent = getAgent(msg.agentType);
            return (
              <div key={msg.id} className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${agent.bg}`}>
                    <Bot size={13} style={{ color: agent.color }} />
                  </div>
                )}
                <div className={clsx(
                  'max-w-[80%] px-4 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'
                )}>
                  {msg.role === 'assistant' && msg.agentType && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full mb-1.5 inline-block" style={{ background: `${agent.color}15`, color: agent.color }}>{agent.label}</span>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={clsx('text-[10px] mt-1.5', msg.role === 'user' ? 'text-blue-200' : 'text-gray-400')}>
                    {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
                    <User size={13} />
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${getAgent(selectedAgent).bg}`}>
                <Bot size={13} style={{ color: getAgent(selectedAgent).color }} />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the ${getAgent(selectedAgent).label} agent...`}
              className="input resize-none flex-1"
              rows={1}
              style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={clsx(
                'rounded-lg px-4 py-2.5 transition-all flex items-center justify-center',
                input.trim() && !isLoading ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            <Sparkles size={11} className="text-blue-400" /> AI-powered insights from your consulting data
          </p>
        </div>
      </div>
    </div>
  );
}
