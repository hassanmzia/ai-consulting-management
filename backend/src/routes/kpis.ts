import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/kpis - list, optionally filter by client_id
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id, project_id, category } = req.query;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (client_id) {
      conditions.push(`k.client_id = $${paramIndex++}`);
      params.push(parseInt(client_id as string, 10));
    }

    if (project_id) {
      conditions.push(`k.project_id = $${paramIndex++}`);
      params.push(parseInt(project_id as string, 10));
    }

    if (category) {
      conditions.push(`k.category = $${paramIndex++}`);
      params.push(category as string);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT k.*,
              c.name AS client_name,
              p.name AS project_name
       FROM kpis k
       JOIN clients c ON k.client_id = c.id
       LEFT JOIN projects p ON k.project_id = p.id
       ${whereClause}
       ORDER BY k.measured_at DESC, k.created_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List KPIs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kpis - create KPI
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      client_id, project_id, category, name, description,
      baseline_value, target_value, current_value, unit, measured_at,
    } = req.body;

    if (!client_id || !category || !name || baseline_value === undefined || target_value === undefined || current_value === undefined) {
      res.status(400).json({
        error: 'client_id, category, name, baseline_value, target_value, and current_value are required',
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO kpis (client_id, project_id, category, name, description,
        baseline_value, target_value, current_value, unit, measured_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        client_id, project_id || null, category, name, description,
        baseline_value, target_value, current_value, unit, measured_at || new Date(),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create KPI error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/kpis/:id - update KPI
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      client_id, project_id, category, name, description,
      baseline_value, target_value, current_value, unit, measured_at,
    } = req.body;

    const result = await pool.query(
      `UPDATE kpis SET
        client_id = COALESCE($1, client_id),
        project_id = COALESCE($2, project_id),
        category = COALESCE($3, category),
        name = COALESCE($4, name),
        description = COALESCE($5, description),
        baseline_value = COALESCE($6, baseline_value),
        target_value = COALESCE($7, target_value),
        current_value = COALESCE($8, current_value),
        unit = COALESCE($9, unit),
        measured_at = COALESCE($10, measured_at)
       WHERE id = $11
       RETURNING *`,
      [
        client_id, project_id, category, name, description,
        baseline_value, target_value, current_value, unit, measured_at,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'KPI not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update KPI error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/kpis/:id - delete KPI
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM kpis WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'KPI not found' });
      return;
    }

    res.json({ message: 'KPI deleted successfully' });
  } catch (err) {
    console.error('Delete KPI error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
