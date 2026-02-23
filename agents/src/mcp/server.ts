import { Pool } from 'pg';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
}

const tools: MCPTool[] = [
  {
    name: 'get_clients',
    description: 'List all clients with optional status filter',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: lead, active, on_hold, completed, churned' }
      }
    }
  },
  {
    name: 'get_client_details',
    description: 'Get detailed client info including projects, invoices, and KPIs',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'number', description: 'Client ID' }
      },
      required: ['client_id']
    }
  },
  {
    name: 'get_projects',
    description: 'List projects with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        client_id: { type: 'number', description: 'Filter by client' }
      }
    }
  },
  {
    name: 'get_project_details',
    description: 'Get project with time entries and budget information',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'number', description: 'Project ID' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'get_consultants',
    description: 'List consultants with utilization information',
    inputSchema: {
      type: 'object',
      properties: {
        is_active: { type: 'boolean', description: 'Filter by active status' }
      }
    }
  },
  {
    name: 'get_financial_summary',
    description: 'Get revenue, outstanding invoices, and billing summary',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_kpis',
    description: 'Get KPIs optionally filtered by client',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'number', description: 'Filter by client' }
      }
    }
  },
  {
    name: 'search_data',
    description: 'Search across clients, projects, and consultants by keyword',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword' }
      },
      required: ['query']
    }
  }
];

async function executeTool(name: string, args: Record<string, unknown>, db: Pool): Promise<MCPToolResult> {
  switch (name) {
    case 'get_clients': {
      const status = args.status as string | undefined;
      let query = 'SELECT * FROM clients';
      const params: unknown[] = [];
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      query += ' ORDER BY name';
      const result = await db.query(query, params);
      return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
    }

    case 'get_client_details': {
      const clientId = args.client_id as number;
      const client = await db.query('SELECT * FROM clients WHERE id = $1', [clientId]);
      const projects = await db.query('SELECT id, name, status, budget FROM projects WHERE client_id = $1', [clientId]);
      const invoices = await db.query('SELECT invoice_number, status, total_amount, due_date FROM invoices WHERE client_id = $1', [clientId]);
      const kpis = await db.query('SELECT name, category, baseline_value, target_value, current_value, unit FROM kpis WHERE client_id = $1', [clientId]);
      const data = {
        client: client.rows[0] || null,
        projects: projects.rows,
        invoices: invoices.rows,
        kpis: kpis.rows
      };
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }

    case 'get_projects': {
      const conditions: string[] = [];
      const params: unknown[] = [];
      if (args.status) { conditions.push(`p.status = $${params.length + 1}`); params.push(args.status); }
      if (args.client_id) { conditions.push(`p.client_id = $${params.length + 1}`); params.push(args.client_id); }
      const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      const result = await db.query(
        `SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON p.client_id = c.id${where} ORDER BY p.created_at DESC`,
        params
      );
      return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
    }

    case 'get_project_details': {
      const projectId = args.project_id as number;
      const project = await db.query(
        `SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = $1`,
        [projectId]
      );
      const timeEntries = await db.query(
        `SELECT te.*, co.name as consultant_name FROM time_entries te JOIN consultants co ON te.consultant_id = co.id WHERE te.project_id = $1 ORDER BY te.date DESC`,
        [projectId]
      );
      const totalHours = await db.query('SELECT COALESCE(SUM(hours), 0) as total FROM time_entries WHERE project_id = $1', [projectId]);
      const data = {
        project: project.rows[0] || null,
        time_entries: timeEntries.rows,
        total_hours: parseFloat(totalHours.rows[0].total),
      };
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }

    case 'get_consultants': {
      const isActive = args.is_active as boolean | undefined;
      let query = `
        SELECT co.*,
          COALESCE(SUM(CASE WHEN te.date >= CURRENT_DATE - INTERVAL '30 days' THEN te.hours ELSE 0 END), 0) as monthly_hours,
          ROUND(COALESCE(SUM(CASE WHEN te.date >= CURRENT_DATE - INTERVAL '30 days' THEN te.hours ELSE 0 END), 0) / 160.0 * 100, 1) as utilization
        FROM consultants co
        LEFT JOIN time_entries te ON co.id = te.consultant_id
      `;
      const params: unknown[] = [];
      if (isActive !== undefined) {
        query += ' WHERE co.is_active = $1';
        params.push(isActive);
      }
      query += ' GROUP BY co.id ORDER BY co.name';
      const result = await db.query(query, params);
      return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
    }

    case 'get_financial_summary': {
      const revenue = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'paid'");
      const outstanding = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status IN ('sent', 'overdue')");
      const byMonth = await db.query(`
        SELECT TO_CHAR(paid_date, 'YYYY-MM') as month, SUM(total_amount) as revenue
        FROM invoices WHERE status = 'paid' AND paid_date IS NOT NULL
        GROUP BY TO_CHAR(paid_date, 'YYYY-MM') ORDER BY month DESC LIMIT 12
      `);
      const data = {
        total_revenue: parseFloat(revenue.rows[0].total),
        outstanding_amount: parseFloat(outstanding.rows[0].total),
        monthly_revenue: byMonth.rows
      };
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }

    case 'get_kpis': {
      const clientIdFilter = args.client_id as number | undefined;
      let query = `SELECT k.*, c.name as client_name FROM kpis k JOIN clients c ON k.client_id = c.id`;
      const params: unknown[] = [];
      if (clientIdFilter) {
        query += ' WHERE k.client_id = $1';
        params.push(clientIdFilter);
      }
      query += ' ORDER BY c.name, k.category';
      const result = await db.query(query, params);
      return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
    }

    case 'search_data': {
      const q = `%${args.query as string}%`;
      const clients = await db.query('SELECT id, name, status, industry FROM clients WHERE name ILIKE $1 OR contact_name ILIKE $1', [q]);
      const projects = await db.query('SELECT id, name, status FROM projects WHERE name ILIKE $1 OR description ILIKE $1', [q]);
      const consultants = await db.query('SELECT id, name, expertise, seniority FROM consultants WHERE name ILIKE $1 OR expertise ILIKE $1', [q]);
      const data = { clients: clients.rows, projects: projects.rows, consultants: consultants.rows };
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
  }
}

export function setupMCPRoutes(app: import('express').Express, db: Pool): void {
  app.get('/mcp/tools', (_req, res) => {
    res.json({ tools });
  });

  app.post('/mcp/tools/call', async (req, res) => {
    try {
      const { name, arguments: args } = req.body;
      if (!name) { res.status(400).json({ error: 'Tool name is required' }); return; }
      const tool = tools.find(t => t.name === name);
      if (!tool) { res.status(404).json({ error: `Tool '${name}' not found` }); return; }
      const result = await executeTool(name, args || {}, db);
      res.json(result);
    } catch (error) {
      console.error('MCP tool execution error:', error);
      res.status(500).json({ error: 'Tool execution failed' });
    }
  });

  app.get('/mcp/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const serverInfo = {
      jsonrpc: '2.0', method: 'notifications/initialized',
      params: { serverInfo: { name: 'ConsultPro MCP Server', version: '1.0.0' }, capabilities: { tools: { listChanged: false } } }
    };
    res.write(`data: ${JSON.stringify(serverInfo)}\n\n`);
    const toolList = { jsonrpc: '2.0', method: 'notifications/tools/list', params: { tools } };
    res.write(`data: ${JSON.stringify(toolList)}\n\n`);
    const keepAlive = setInterval(() => { res.write(': keepalive\n\n'); }, 30000);
    req.on('close', () => { clearInterval(keepAlive); });
  });

  app.post('/mcp/message', async (req, res) => {
    try {
      const { jsonrpc, id, method, params } = req.body;
      if (jsonrpc !== '2.0') { res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid JSON-RPC version' } }); return; }
      switch (method) {
        case 'initialize':
          res.json({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'ConsultPro MCP Server', version: '1.0.0' } } });
          break;
        case 'tools/list':
          res.json({ jsonrpc: '2.0', id, result: { tools } });
          break;
        case 'tools/call': {
          const { name, arguments: args } = params;
          const result = await executeTool(name, args || {}, db);
          res.json({ jsonrpc: '2.0', id, result });
          break;
        }
        default:
          res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
    } catch (error) {
      console.error('MCP message error:', error);
      res.status(500).json({ jsonrpc: '2.0', id: req.body?.id, error: { code: -32603, message: 'Internal error' } });
    }
  });

  console.log(`  MCP Server: ${tools.length} tools registered`);
}
