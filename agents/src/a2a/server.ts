import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { analyzeData } from '../agents/analytics.js';
import { generatePlan } from '../agents/planning.js';
import { getClientInsight } from '../agents/client-insights.js';

interface A2ATask {
  id: string;
  status: { state: 'submitted' | 'working' | 'completed' | 'failed' };
  artifacts: Array<{ parts: Array<{ type: string; text: string }> }>;
  createdAt: Date;
}

const taskStore = new Map<string, A2ATask>();

const agentCard = {
  name: 'ConsultPro AI',
  description: 'AI-powered consulting management assistant with analytics, planning, and client insight capabilities',
  url: 'http://172.168.1.95:3024/a2a/',
  version: '1.0.0',
  capabilities: { streaming: false, pushNotifications: false },
  skills: [
    { id: 'analytics', name: 'Business Analytics', description: 'Analyze revenue, project health, consultant performance, and client metrics', tags: ['analytics', 'revenue', 'performance'], examples: ['What is our total revenue?', 'Show consultant utilization'] },
    { id: 'planning', name: 'Project Planning', description: 'Resource allocation, timeline analysis, and project plan generation', tags: ['planning', 'resources', 'timeline'], examples: ['Suggest resource allocation', 'Analyze project timelines'] },
    { id: 'client-insights', name: 'Client Insights', description: 'Client health checks, churn risk analysis, and upsell opportunities', tags: ['clients', 'churn', 'upsell'], examples: ['Run client health check', 'Identify churn risks'] }
  ],
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain']
};

function detectSkill(text: string): string {
  const lower = text.toLowerCase();
  if (['plan', 'resource', 'allocat', 'timeline', 'schedule', 'capacity'].some(k => lower.includes(k))) return 'planning';
  if (['client', 'churn', 'health check', 'upsell', 'retention'].some(k => lower.includes(k))) return 'client-insights';
  return 'analytics';
}

async function processTask(message: string, db: Pool): Promise<string> {
  const skill = detectSkill(message);
  switch (skill) {
    case 'planning': return generatePlan(message, db);
    case 'client-insights': return getClientInsight(message, db);
    default: return analyzeData(message, db);
  }
}

export function setupA2ARoutes(app: import('express').Express, db: Pool): void {
  app.get('/.well-known/agent.json', (_req, res) => { res.json(agentCard); });

  app.post('/a2a/tasks/send', async (req, res) => {
    try {
      const { jsonrpc, id: rpcId, params } = req.body;
      if (jsonrpc !== '2.0') { res.status(400).json({ jsonrpc: '2.0', id: rpcId, error: { code: -32600, message: 'Invalid request' } }); return; }
      const taskId = params?.id || uuidv4();
      const message = params?.message;
      if (!message?.parts?.length) { res.status(400).json({ jsonrpc: '2.0', id: rpcId, error: { code: -32602, message: 'Message with parts required' } }); return; }
      const textPart = message.parts.find((p: { type: string }) => p.type === 'text');
      if (!textPart) { res.status(400).json({ jsonrpc: '2.0', id: rpcId, error: { code: -32602, message: 'No text part found' } }); return; }

      const task: A2ATask = { id: taskId, status: { state: 'working' }, artifacts: [], createdAt: new Date() };
      taskStore.set(taskId, task);

      try {
        const response = await processTask(textPart.text, db);
        task.status.state = 'completed';
        task.artifacts = [{ parts: [{ type: 'text', text: response }] }];
      } catch (err) {
        task.status.state = 'failed';
        task.artifacts = [{ parts: [{ type: 'text', text: `Error: ${(err as Error).message}` }] }];
      }
      taskStore.set(taskId, task);

      try { await db.query('INSERT INTO agent_conversations (agent_type, message, response, metadata) VALUES ($1, $2, $3, $4)', ['a2a', textPart.text, task.artifacts[0]?.parts[0]?.text || '', JSON.stringify({ task_id: taskId })]); } catch { /* non-critical */ }

      res.json({ jsonrpc: '2.0', id: rpcId, result: { id: taskId, status: task.status, artifacts: task.artifacts } });
    } catch (error) {
      console.error('A2A task error:', error);
      res.status(500).json({ jsonrpc: '2.0', id: req.body?.id, error: { code: -32603, message: 'Internal error' } });
    }
  });

  app.post('/a2a/tasks/get', (req, res) => {
    const { jsonrpc, id: rpcId, params } = req.body;
    if (jsonrpc !== '2.0') { res.status(400).json({ jsonrpc: '2.0', id: rpcId, error: { code: -32600, message: 'Invalid request' } }); return; }
    const task = taskStore.get(params?.id);
    if (!task) { res.json({ jsonrpc: '2.0', id: rpcId, error: { code: -32001, message: 'Task not found' } }); return; }
    res.json({ jsonrpc: '2.0', id: rpcId, result: { id: task.id, status: task.status, artifacts: task.artifacts } });
  });

  app.get('/a2a/tasks/:id', (req, res) => {
    const task = taskStore.get(req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json({ id: task.id, status: task.status, artifacts: task.artifacts, created_at: task.createdAt });
  });

  console.log(`  A2A Server: ${agentCard.skills.length} skills registered`);
}
