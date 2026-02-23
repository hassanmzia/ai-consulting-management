import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/dashboard/stats - overall platform statistics
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Total revenue from paid invoices
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM invoices WHERE status = 'paid'`
    );

    // Active projects count
    const projectsResult = await pool.query(
      `SELECT COUNT(*) AS active_projects
       FROM projects WHERE status = 'in_progress'`
    );

    // Active clients count
    const clientsResult = await pool.query(
      `SELECT COUNT(*) AS active_clients
       FROM clients WHERE status = 'active'`
    );

    // Total billable hours this month
    const hoursResult = await pool.query(
      `SELECT COALESCE(SUM(hours), 0) AS billable_hours_this_month
       FROM time_entries
       WHERE is_billable = true
         AND date >= DATE_TRUNC('month', CURRENT_DATE)
         AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`
    );

    // Outstanding invoices amount (sent + overdue)
    const outstandingResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS outstanding_amount
       FROM invoices WHERE status IN ('sent', 'overdue')`
    );

    // Average client satisfaction from sessions
    const satisfactionResult = await pool.query(
      `SELECT COALESCE(AVG(client_satisfaction), 0) AS avg_satisfaction
       FROM sessions WHERE client_satisfaction IS NOT NULL`
    );

    res.json({
      total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
      active_projects: parseInt(projectsResult.rows[0].active_projects, 10),
      active_clients: parseInt(clientsResult.rows[0].active_clients, 10),
      billable_hours_this_month: parseFloat(hoursResult.rows[0].billable_hours_this_month),
      outstanding_amount: parseFloat(outstandingResult.rows[0].outstanding_amount),
      avg_client_satisfaction: parseFloat(parseFloat(satisfactionResult.rows[0].avg_satisfaction).toFixed(1)),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/revenue-chart - monthly revenue for last 12 months
router.get('/revenue-chart', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('month', paid_date), 'YYYY-MM') AS month,
        COALESCE(SUM(total_amount), 0) AS revenue
       FROM invoices
       WHERE status = 'paid'
         AND paid_date IS NOT NULL
         AND paid_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
       GROUP BY DATE_TRUNC('month', paid_date)
       ORDER BY month ASC`
    );

    // Fill in missing months with 0 revenue
    const months: { month: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = result.rows.find((r: { month: string }) => r.month === monthStr);
      months.push({
        month: monthStr,
        revenue: found ? parseFloat(found.revenue) : 0,
      });
    }

    res.json(months);
  } catch (err) {
    console.error('Revenue chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/project-status - count of projects by status
router.get('/project-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM projects
       GROUP BY status
       ORDER BY count DESC`
    );

    res.json(result.rows.map((row: { status: string; count: string }) => ({
      status: row.status,
      count: parseInt(row.count, 10),
    })));
  } catch (err) {
    console.error('Project status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/consultant-utilization - consultant hours and utilization this month
router.get('/consultant-utilization', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
        c.id,
        c.name,
        c.expertise,
        c.seniority,
        COALESCE(SUM(te.hours), 0) AS hours_this_month
       FROM consultants c
       LEFT JOIN time_entries te ON c.id = te.consultant_id
         AND te.date >= DATE_TRUNC('month', CURRENT_DATE)
         AND te.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
       WHERE c.is_active = true
       GROUP BY c.id, c.name, c.expertise, c.seniority
       ORDER BY hours_this_month DESC`
    );

    const consultants = result.rows.map((row: {
      id: number;
      name: string;
      expertise: string;
      seniority: string;
      hours_this_month: string;
    }) => {
      const hours = parseFloat(row.hours_this_month);
      return {
        id: row.id,
        name: row.name,
        expertise: row.expertise,
        seniority: row.seniority,
        hours_this_month: hours,
        utilization_rate: Math.round((hours / 160) * 100),
      };
    });

    res.json(consultants);
  } catch (err) {
    console.error('Consultant utilization error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/recent-activity - recent time entries and sessions
router.get('/recent-activity', async (req: Request, res: Response): Promise<void> => {
  try {
    // Recent time entries
    const timeEntriesResult = await pool.query(
      `SELECT
        'time_entry' AS type,
        te.id,
        te.date AS activity_date,
        te.description,
        te.hours,
        con.name AS consultant_name,
        p.name AS project_name,
        te.created_at
       FROM time_entries te
       JOIN consultants con ON te.consultant_id = con.id
       JOIN projects p ON te.project_id = p.id
       ORDER BY te.date DESC, te.created_at DESC
       LIMIT 10`
    );

    // Recent sessions
    const sessionsResult = await pool.query(
      `SELECT
        'session' AS type,
        s.id,
        s.date AS activity_date,
        s.topics_covered AS description,
        EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 AS hours,
        con.name AS consultant_name,
        c.name AS client_name,
        s.created_at
       FROM sessions s
       JOIN consultants con ON s.consultant_id = con.id
       JOIN clients c ON s.client_id = c.id
       ORDER BY s.date DESC, s.created_at DESC
       LIMIT 10`
    );

    // Merge and sort by date, take top 10
    const activities = [...timeEntriesResult.rows, ...sessionsResult.rows]
      .sort((a, b) => {
        const dateA = new Date(a.activity_date).getTime();
        const dateB = new Date(b.activity_date).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    res.json(activities);
  } catch (err) {
    console.error('Recent activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
