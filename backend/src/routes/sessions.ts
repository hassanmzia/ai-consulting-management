import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/sessions - list with optional filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { project_id, consultant_id, client_id, start_date, end_date } = req.query;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`s.project_id = $${paramIndex++}`);
      params.push(parseInt(project_id as string, 10));
    }

    if (consultant_id) {
      conditions.push(`s.consultant_id = $${paramIndex++}`);
      params.push(parseInt(consultant_id as string, 10));
    }

    if (client_id) {
      conditions.push(`s.client_id = $${paramIndex++}`);
      params.push(parseInt(client_id as string, 10));
    }

    if (start_date) {
      conditions.push(`s.date >= $${paramIndex++}`);
      params.push(start_date as string);
    }

    if (end_date) {
      conditions.push(`s.date <= $${paramIndex++}`);
      params.push(end_date as string);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT s.*,
              con.name AS consultant_name,
              c.name AS client_name,
              p.name AS project_name
       FROM sessions s
       JOIN consultants con ON s.consultant_id = con.id
       JOIN clients c ON s.client_id = c.id
       LEFT JOIN projects p ON s.project_id = p.id
       ${whereClause}
       ORDER BY s.date DESC, s.start_time DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sessions - create session
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      project_id, consultant_id, client_id,
      date, start_time, end_time,
      topics_covered, session_notes, action_items,
      client_satisfaction, follow_up_needed,
    } = req.body;

    if (!consultant_id || !client_id || !date || !start_time || !end_time || !topics_covered) {
      res.status(400).json({
        error: 'consultant_id, client_id, date, start_time, end_time, and topics_covered are required',
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO sessions (project_id, consultant_id, client_id, date, start_time, end_time,
        topics_covered, session_notes, action_items, client_satisfaction, follow_up_needed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        project_id || null, consultant_id, client_id,
        date, start_time, end_time,
        topics_covered, session_notes, action_items,
        client_satisfaction, follow_up_needed || false,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/sessions/:id - update session
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      project_id, consultant_id, client_id,
      date, start_time, end_time,
      topics_covered, session_notes, action_items,
      client_satisfaction, follow_up_needed,
    } = req.body;

    const result = await pool.query(
      `UPDATE sessions SET
        project_id = COALESCE($1, project_id),
        consultant_id = COALESCE($2, consultant_id),
        client_id = COALESCE($3, client_id),
        date = COALESCE($4, date),
        start_time = COALESCE($5, start_time),
        end_time = COALESCE($6, end_time),
        topics_covered = COALESCE($7, topics_covered),
        session_notes = COALESCE($8, session_notes),
        action_items = COALESCE($9, action_items),
        client_satisfaction = COALESCE($10, client_satisfaction),
        follow_up_needed = COALESCE($11, follow_up_needed)
       WHERE id = $12
       RETURNING *`,
      [
        project_id, consultant_id, client_id,
        date, start_time, end_time,
        topics_covered, session_notes, action_items,
        client_satisfaction, follow_up_needed,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
