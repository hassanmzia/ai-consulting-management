import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/consultants - list all with optional filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { expertise, seniority, is_active } = req.query;
    const conditions: string[] = [];
    const params: (string | boolean)[] = [];
    let paramIndex = 1;

    if (expertise) {
      conditions.push(`c.expertise = $${paramIndex++}`);
      params.push(expertise as string);
    }

    if (seniority) {
      conditions.push(`c.seniority = $${paramIndex++}`);
      params.push(seniority as string);
    }

    if (is_active !== undefined) {
      conditions.push(`c.is_active = $${paramIndex++}`);
      params.push(is_active === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT c.*
       FROM consultants c
       ${whereClause}
       ORDER BY c.name ASC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List consultants error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/consultants/:id - single consultant with utilization stats
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const consultantResult = await pool.query(
      'SELECT * FROM consultants WHERE id = $1',
      [id]
    );

    if (consultantResult.rows.length === 0) {
      res.status(404).json({ error: 'Consultant not found' });
      return;
    }

    const consultant = consultantResult.rows[0];

    // Get hours logged this month
    const hoursResult = await pool.query(
      `SELECT COALESCE(SUM(hours), 0) AS hours_this_month
       FROM time_entries
       WHERE consultant_id = $1
         AND date >= DATE_TRUNC('month', CURRENT_DATE)
         AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
      [id]
    );

    // Get total hours all time
    const totalHoursResult = await pool.query(
      `SELECT COALESCE(SUM(hours), 0) AS total_hours
       FROM time_entries
       WHERE consultant_id = $1`,
      [id]
    );

    // Get active projects count
    const projectsResult = await pool.query(
      `SELECT COUNT(DISTINCT p.id) AS active_projects
       FROM projects p
       JOIN project_consultants pc ON p.id = pc.project_id
       WHERE pc.consultant_id = $1 AND p.status = 'in_progress'`,
      [id]
    );

    // Also count projects where they are lead
    const leadProjectsResult = await pool.query(
      `SELECT COUNT(*) AS lead_projects
       FROM projects
       WHERE lead_consultant_id = $1 AND status = 'in_progress'`,
      [id]
    );

    const hoursThisMonth = parseFloat(hoursResult.rows[0].hours_this_month);
    const utilizationRate = Math.round((hoursThisMonth / 160) * 100);

    res.json({
      ...consultant,
      hours_this_month: hoursThisMonth,
      total_hours: parseFloat(totalHoursResult.rows[0].total_hours),
      active_projects: parseInt(projectsResult.rows[0].active_projects, 10),
      lead_projects: parseInt(leadProjectsResult.rows[0].lead_projects, 10),
      utilization_rate: utilizationRate,
    });
  } catch (err) {
    console.error('Get consultant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/consultants - create consultant
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      user_id, name, email, phone, expertise,
      seniority, hourly_rate, bio, is_active, date_joined,
    } = req.body;

    if (!name || !email || !expertise) {
      res.status(400).json({ error: 'name, email, and expertise are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO consultants (user_id, name, email, phone, expertise, seniority, hourly_rate, bio, is_active, date_joined)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user_id || null, name, email, phone, expertise,
        seniority || 'mid', hourly_rate || 150.00, bio, is_active !== false, date_joined || new Date(),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create consultant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/consultants/:id - update consultant
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      user_id, name, email, phone, expertise,
      seniority, hourly_rate, bio, is_active, date_joined,
    } = req.body;

    const result = await pool.query(
      `UPDATE consultants SET
        user_id = COALESCE($1, user_id),
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        expertise = COALESCE($5, expertise),
        seniority = COALESCE($6, seniority),
        hourly_rate = COALESCE($7, hourly_rate),
        bio = COALESCE($8, bio),
        is_active = COALESCE($9, is_active),
        date_joined = COALESCE($10, date_joined),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        user_id, name, email, phone, expertise,
        seniority, hourly_rate, bio, is_active, date_joined,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Consultant not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update consultant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/consultants/:id - delete consultant
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM consultants WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Consultant not found' });
      return;
    }

    res.json({ message: 'Consultant deleted successfully' });
  } catch (err) {
    console.error('Delete consultant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
