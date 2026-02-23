import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { analyzeData } from './agents/analytics.js';
import { generatePlan } from './agents/planning.js';
import { getClientInsight } from './agents/client-insights.js';
import { setupMCPRoutes } from './mcp/server.js';
import { setupA2ARoutes } from './a2a/server.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());

app.get('/agents/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', service: 'agents', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy', service: 'agents' });
  }
});

app.post('/agents/chat', async (req, res) => {
  try {
    const { message, agent_type } = req.body;
    if (!message) { res.status(400).json({ error: 'Message is required' }); return; }

    let response: string;
    let resolvedAgentType: string;

    if (agent_type) {
      resolvedAgentType = agent_type;
    } else {
      const lower = message.toLowerCase();
      if (['plan', 'resource', 'allocat', 'timeline', 'schedule', 'capacity', 'assign', 'staff'].some((k: string) => lower.includes(k))) {
        resolvedAgentType = 'planning';
      } else if (['client', 'churn', 'health', 'upsell', 'retention', 'relationship', 'account'].some((k: string) => lower.includes(k))) {
        resolvedAgentType = 'client-insights';
      } else {
        resolvedAgentType = 'analytics';
      }
    }

    switch (resolvedAgentType) {
      case 'analytics': response = await analyzeData(message, pool); break;
      case 'planning': response = await generatePlan(message, pool); break;
      case 'client-insights': response = await getClientInsight(message, pool); break;
      default: response = await analyzeData(message, pool); resolvedAgentType = 'analytics';
    }

    try { await pool.query('INSERT INTO agent_conversations (agent_type, message, response) VALUES ($1, $2, $3)', [resolvedAgentType, message, response]); } catch { /* non-critical */ }

    res.json({ response, agent_type: resolvedAgentType });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.get('/agents/list', (_req, res) => {
  res.json({
    agents: [
      { id: 'analytics', name: 'Business Analytics Agent', description: 'Analyzes revenue, project health, consultant performance, and business metrics', capabilities: ['revenue analysis', 'project health', 'consultant performance', 'client metrics'] },
      { id: 'planning', name: 'Project Planning Agent', description: 'Helps with resource allocation, timeline analysis, and project planning', capabilities: ['resource allocation', 'timeline analysis', 'project planning', 'capacity planning'] },
      { id: 'client-insights', name: 'Client Insights Agent', description: 'Provides client health checks, churn risk analysis, and upsell opportunities', capabilities: ['client health', 'churn risk', 'upsell opportunities', 'relationship analysis'] }
    ]
  });
});

app.get('/agents/conversations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await pool.query('SELECT * FROM agent_conversations ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('Conversation fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

setupMCPRoutes(app, pool);
setupA2ARoutes(app, pool);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ConsultPro AI Agents Service`);
  console.log(`  ============================`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Chat: POST /agents/chat`);
  console.log(`  MCP:  GET  /mcp/sse`);
  console.log(`  A2A:  GET  /.well-known/agent.json`);
  console.log(`  Ready!\n`);
});
