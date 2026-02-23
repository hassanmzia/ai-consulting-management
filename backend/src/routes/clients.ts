import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/clients - list all clients with optional filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, industry, search } = req.query;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status as string);
    }

    if (industry) {
      conditions.push(`c.industry = $${paramIndex++}`);
      params.push(industry as string);
    }

    if (search) {
      conditions.push(`(c.name ILIKE $${paramIndex} OR c.contact_name ILIKE $${paramIndex} OR c.contact_email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT c.*,
              u.first_name AS manager_first_name,
              u.last_name AS manager_last_name
       FROM clients c
       LEFT JOIN users u ON c.account_manager_id = u.id
       ${whereClause}
       ORDER BY c.created_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List clients error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/clients/:id - single client with stats
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const clientResult = await pool.query(
      `SELECT c.*,
              u.first_name AS manager_first_name,
              u.last_name AS manager_last_name
       FROM clients c
       LEFT JOIN users u ON c.account_manager_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (clientResult.rows.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const client = clientResult.rows[0];

    // Get total revenue from paid invoices
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM invoices
       WHERE client_id = $1 AND status = 'paid'`,
      [id]
    );

    // Get active projects count
    const projectsResult = await pool.query(
      `SELECT COUNT(*) AS active_projects
       FROM projects
       WHERE client_id = $1 AND status IN ('in_progress', 'proposal')`,
      [id]
    );

    res.json({
      ...client,
      total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
      active_projects: parseInt(projectsResult.rows[0].active_projects, 10),
    });
  } catch (err) {
    console.error('Get client error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/clients - create client
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, status, industry, company_size, website,
      contact_name, contact_email, contact_phone,
      address, city, state, country,
      annual_revenue, account_manager_id, notes,
    } = req.body;

    if (!name || !contact_name || !contact_email) {
      res.status(400).json({ error: 'name, contact_name, and contact_email are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO clients (name, status, industry, company_size, website,
        contact_name, contact_email, contact_phone,
        address, city, state, country,
        annual_revenue, account_manager_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        name, status || 'lead', industry, company_size, website,
        contact_name, contact_email, contact_phone,
        address, city, state, country || 'United States',
        annual_revenue, account_manager_id, notes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/clients/:id - update client
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name, status, industry, company_size, website,
      contact_name, contact_email, contact_phone,
      address, city, state, country,
      annual_revenue, account_manager_id, notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE clients SET
        name = COALESCE($1, name),
        status = COALESCE($2, status),
        industry = COALESCE($3, industry),
        company_size = COALESCE($4, company_size),
        website = COALESCE($5, website),
        contact_name = COALESCE($6, contact_name),
        contact_email = COALESCE($7, contact_email),
        contact_phone = COALESCE($8, contact_phone),
        address = COALESCE($9, address),
        city = COALESCE($10, city),
        state = COALESCE($11, state),
        country = COALESCE($12, country),
        annual_revenue = COALESCE($13, annual_revenue),
        account_manager_id = COALESCE($14, account_manager_id),
        notes = COALESCE($15, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [
        name, status, industry, company_size, website,
        contact_name, contact_email, contact_phone,
        address, city, state, country,
        annual_revenue, account_manager_id, notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/clients/:id - delete client
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
