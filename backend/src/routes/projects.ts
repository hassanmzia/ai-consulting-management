import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/projects - list with filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, client_id, priority } = req.query;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(status as string);
    }

    if (client_id) {
      conditions.push(`p.client_id = $${paramIndex++}`);
      params.push(parseInt(client_id as string, 10));
    }

    if (priority) {
      conditions.push(`p.priority = $${paramIndex++}`);
      params.push(priority as string);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT p.*,
              c.name AS client_name,
              con.name AS lead_consultant_name
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN consultants con ON p.lead_consultant_id = con.id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id - single project with budget utilization
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const projectResult = await pool.query(
      `SELECT p.*,
              c.name AS client_name,
              con.name AS lead_consultant_name
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN consultants con ON p.lead_consultant_id = con.id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = projectResult.rows[0];

    // Get total hours and billable amount from time entries
    const timeResult = await pool.query(
      `SELECT
        COALESCE(SUM(te.hours), 0) AS total_hours,
        COALESCE(SUM(CASE WHEN te.is_billable THEN te.hours ELSE 0 END), 0) AS billable_hours,
        COALESCE(SUM(CASE WHEN te.is_billable THEN te.hours * COALESCE(p.hourly_rate, con.hourly_rate, 0) ELSE 0 END), 0) AS billable_amount
       FROM time_entries te
       JOIN projects p ON te.project_id = p.id
       JOIN consultants con ON te.consultant_id = con.id
       WHERE te.project_id = $1`,
      [id]
    );

    const totalHours = parseFloat(timeResult.rows[0].total_hours);
    const billableHours = parseFloat(timeResult.rows[0].billable_hours);
    const billableAmount = parseFloat(timeResult.rows[0].billable_amount);
    const budget = project.budget ? parseFloat(project.budget) : 0;
    const budgetUtilization = budget > 0 ? Math.round((billableAmount / budget) * 100) : 0;

    // Get assigned consultants
    const consultantsResult = await pool.query(
      `SELECT con.*
       FROM consultants con
       JOIN project_consultants pc ON con.id = pc.consultant_id
       WHERE pc.project_id = $1`,
      [id]
    );

    res.json({
      ...project,
      total_hours: totalHours,
      billable_hours: billableHours,
      billable_amount: billableAmount,
      budget_utilization: budgetUtilization,
      consultants: consultantsResult.rows,
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects - create project
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, client_id, status, priority, description,
      lead_consultant_id, start_date, end_date, deadline,
      billing_type, budget, hourly_rate,
    } = req.body;

    if (!name || !client_id) {
      res.status(400).json({ error: 'name and client_id are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO projects (name, client_id, status, priority, description,
        lead_consultant_id, start_date, end_date, deadline,
        billing_type, budget, hourly_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name, client_id, status || 'draft', priority || 'medium', description,
        lead_consultant_id, start_date, end_date, deadline,
        billing_type || 'hourly', budget, hourly_rate,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id - update project
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name, client_id, status, priority, description,
      lead_consultant_id, start_date, end_date, deadline,
      billing_type, budget, hourly_rate,
    } = req.body;

    const result = await pool.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        client_id = COALESCE($2, client_id),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        description = COALESCE($5, description),
        lead_consultant_id = COALESCE($6, lead_consultant_id),
        start_date = COALESCE($7, start_date),
        end_date = COALESCE($8, end_date),
        deadline = COALESCE($9, deadline),
        billing_type = COALESCE($10, billing_type),
        budget = COALESCE($11, budget),
        hourly_rate = COALESCE($12, hourly_rate),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        name, client_id, status, priority, description,
        lead_consultant_id, start_date, end_date, deadline,
        billing_type, budget, hourly_rate,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id - delete project
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
