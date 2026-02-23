import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// List portfolios
router.get('/', async (req: Request, res: Response) => {
  try {
    const { client_id, status } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (client_id) { conditions.push(`p.client_id = $${params.length + 1}`); params.push(client_id); }
    if (status) { conditions.push(`p.status = $${params.length + 1}`); params.push(status); }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT p.*, c.name as client_name, pr.name as project_name
       FROM portfolios p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN projects pr ON p.project_id = pr.id
       ${where} ORDER BY p.updated_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

// Get single portfolio
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as client_name, c.contact_name, c.industry,
              pr.name as project_name, pr.description as project_description,
              u.first_name || ' ' || u.last_name as created_by_name
       FROM portfolios p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN projects pr ON p.project_id = pr.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Create portfolio
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      client_id, project_id, title, status, brand_name, brand_color,
      font_choice, theme, logo_url, executive_summary, strategic_opportunities,
      risk_assessment, scenario_analysis, professional_insights, case_study
    } = req.body;

    const result = await pool.query(
      `INSERT INTO portfolios (client_id, project_id, title, status, brand_name, brand_color,
        font_choice, theme, logo_url, executive_summary, strategic_opportunities,
        risk_assessment, scenario_analysis, professional_insights, case_study)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [client_id || null, project_id || null, title, status || 'draft', brand_name, brand_color || '#1E3A8A',
       font_choice || 'Helvetica', theme || 'light', logo_url, executive_summary,
       strategic_opportunities, risk_assessment,
       scenario_analysis ? JSON.stringify(scenario_analysis) : null,
       professional_insights, case_study]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

// Update portfolio
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const {
      client_id, project_id, title, status, brand_name, brand_color,
      font_choice, theme, logo_url, executive_summary, strategic_opportunities,
      risk_assessment, scenario_analysis, professional_insights, case_study
    } = req.body;

    const result = await pool.query(
      `UPDATE portfolios SET
        client_id=$1, project_id=$2, title=$3, status=$4, brand_name=$5, brand_color=$6,
        font_choice=$7, theme=$8, logo_url=$9, executive_summary=$10, strategic_opportunities=$11,
        risk_assessment=$12, scenario_analysis=$13, professional_insights=$14, case_study=$15,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=$16 RETURNING *`,
      [client_id || null, project_id || null, title, status, brand_name, brand_color,
       font_choice, theme, logo_url, executive_summary, strategic_opportunities,
       risk_assessment, scenario_analysis ? JSON.stringify(scenario_analysis) : null,
       professional_insights, case_study, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

// Delete portfolio
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM portfolios WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }
    res.json({ message: 'Portfolio deleted' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

export default router;
