import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/time-entries - list with filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { project_id, consultant_id, start_date, end_date } = req.query;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`te.project_id = $${paramIndex++}`);
      params.push(parseInt(project_id as string, 10));
    }

    if (consultant_id) {
      conditions.push(`te.consultant_id = $${paramIndex++}`);
      params.push(parseInt(consultant_id as string, 10));
    }

    if (start_date) {
      conditions.push(`te.date >= $${paramIndex++}`);
      params.push(start_date as string);
    }

    if (end_date) {
      conditions.push(`te.date <= $${paramIndex++}`);
      params.push(end_date as string);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT te.*,
              p.name AS project_name,
              con.name AS consultant_name
       FROM time_entries te
       JOIN projects p ON te.project_id = p.id
       JOIN consultants con ON te.consultant_id = con.id
       ${whereClause}
       ORDER BY te.date DESC, te.created_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List time entries error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/time-entries - create time entry
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { project_id, consultant_id, date, hours, description, is_billable } = req.body;

    if (!project_id || !consultant_id || !date || !hours || !description) {
      res.status(400).json({ error: 'project_id, consultant_id, date, hours, and description are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO time_entries (project_id, consultant_id, date, hours, description, is_billable)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [project_id, consultant_id, date, hours, description, is_billable !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create time entry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/time-entries/:id - update time entry
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { project_id, consultant_id, date, hours, description, is_billable } = req.body;

    const result = await pool.query(
      `UPDATE time_entries SET
        project_id = COALESCE($1, project_id),
        consultant_id = COALESCE($2, consultant_id),
        date = COALESCE($3, date),
        hours = COALESCE($4, hours),
        description = COALESCE($5, description),
        is_billable = COALESCE($6, is_billable)
       WHERE id = $7
       RETURNING *`,
      [project_id, consultant_id, date, hours, description, is_billable, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Time entry not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update time entry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/time-entries/:id - delete time entry
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM time_entries WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Time entry not found' });
      return;
    }

    res.json({ message: 'Time entry deleted successfully' });
  } catch (err) {
    console.error('Delete time entry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
