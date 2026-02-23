import { Pool } from 'pg';

// --- Revenue Analysis ---
async function getRevenueAnalysis(db: Pool): Promise<string> {
  // Total revenue
  const totalResult = await db.query(
    `SELECT
       COALESCE(SUM(total_amount), 0) AS total_revenue,
       COUNT(*) AS invoice_count,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue,
       COALESCE(SUM(CASE WHEN status IN ('sent','overdue') THEN total_amount ELSE 0 END), 0) AS outstanding_revenue,
       COALESCE(SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END), 0) AS overdue_amount
     FROM invoices
     WHERE status != 'cancelled'`
  );

  // Revenue by client
  const clientRevenue = await db.query(
    `SELECT c.name AS client_name,
            COALESCE(SUM(i.total_amount), 0) AS total_revenue,
            COUNT(i.id) AS invoice_count
     FROM clients c
     LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'cancelled'
     GROUP BY c.id, c.name
     ORDER BY total_revenue DESC`
  );

  // Monthly revenue trend
  const monthlyRevenue = await db.query(
    `SELECT
       TO_CHAR(issue_date, 'YYYY-MM') AS month,
       COALESCE(SUM(total_amount), 0) AS revenue,
       COUNT(*) AS invoice_count
     FROM invoices
     WHERE status IN ('paid', 'sent', 'overdue')
     GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
     ORDER BY month DESC
     LIMIT 6`
  );

  // Revenue by billing type
  const billingRevenue = await db.query(
    `SELECT p.billing_type,
            COALESCE(SUM(i.total_amount), 0) AS revenue,
            COUNT(DISTINCT p.id) AS project_count
     FROM projects p
     JOIN invoices i ON p.id = i.project_id AND i.status != 'cancelled'
     GROUP BY p.billing_type
     ORDER BY revenue DESC`
  );

  const t = totalResult.rows[0];

  let response = `## Revenue Analysis\n\n`;
  response += `### Overview\n`;
  response += `- **Total Invoiced:** $${Number(t.total_revenue).toLocaleString()}\n`;
  response += `- **Collected (Paid):** $${Number(t.paid_revenue).toLocaleString()}\n`;
  response += `- **Outstanding:** $${Number(t.outstanding_revenue).toLocaleString()}\n`;
  response += `- **Overdue:** $${Number(t.overdue_amount).toLocaleString()}\n`;
  response += `- **Total Invoices:** ${t.invoice_count}\n\n`;

  response += `### Revenue by Client\n`;
  for (const row of clientRevenue.rows) {
    const rev = Number(row.total_revenue);
    if (rev > 0) {
      response += `- **${row.client_name}:** $${rev.toLocaleString()} (${row.invoice_count} invoice${row.invoice_count !== 1 ? 's' : ''})\n`;
    }
  }
  response += `\n`;

  if (monthlyRevenue.rows.length > 0) {
    response += `### Monthly Revenue Trend\n`;
    for (const row of monthlyRevenue.rows) {
      response += `- **${row.month}:** $${Number(row.revenue).toLocaleString()} (${row.invoice_count} invoice${row.invoice_count !== 1 ? 's' : ''})\n`;
    }
    response += `\n`;
  }

  if (billingRevenue.rows.length > 0) {
    response += `### Revenue by Billing Type\n`;
    for (const row of billingRevenue.rows) {
      response += `- **${row.billing_type}:** $${Number(row.revenue).toLocaleString()} across ${row.project_count} project${row.project_count !== 1 ? 's' : ''}\n`;
    }
  }

  return response;
}

// --- Project Health Analysis ---
async function getProjectHealthAnalysis(db: Pool): Promise<string> {
  // Overall project stats
  const stats = await db.query(
    `SELECT
       COUNT(*) AS total_projects,
       COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS active_projects,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_projects,
       COUNT(CASE WHEN status = 'on_hold' THEN 1 END) AS on_hold_projects,
       COUNT(CASE WHEN status = 'proposal' THEN 1 END) AS proposal_projects,
       COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_projects
     FROM projects`
  );

  // Projects at risk (overdue or near deadline)
  const atRisk = await db.query(
    `SELECT p.name, p.status, p.deadline, p.budget,
            c.name AS client_name,
            con.name AS lead_consultant,
            COALESCE(SUM(te.hours * COALESCE(p.hourly_rate, con.hourly_rate, 200)), 0) AS spent_amount,
            COALESCE(SUM(te.hours), 0) AS total_hours
     FROM projects p
     JOIN clients c ON p.client_id = c.id
     LEFT JOIN consultants con ON p.lead_consultant_id = con.id
     LEFT JOIN time_entries te ON p.id = te.project_id
     WHERE p.status = 'in_progress'
       AND (p.deadline < CURRENT_DATE OR p.deadline <= CURRENT_DATE + INTERVAL '14 days')
     GROUP BY p.id, p.name, p.status, p.deadline, p.budget, c.name, con.name
     ORDER BY p.deadline ASC`
  );

  // Budget utilization for active projects
  const budgetStatus = await db.query(
    `SELECT p.name, p.budget,
            c.name AS client_name,
            COALESCE(SUM(te.hours * COALESCE(p.hourly_rate, con.hourly_rate, 200)), 0) AS spent_amount,
            COALESCE(SUM(te.hours), 0) AS total_hours,
            CASE
              WHEN p.budget > 0 THEN ROUND(COALESCE(SUM(te.hours * COALESCE(p.hourly_rate, con.hourly_rate, 200)), 0) / p.budget * 100, 1)
              ELSE 0
            END AS budget_utilization_pct
     FROM projects p
     JOIN clients c ON p.client_id = c.id
     LEFT JOIN consultants con ON p.lead_consultant_id = con.id
     LEFT JOIN time_entries te ON p.id = te.project_id
     WHERE p.status = 'in_progress' AND p.budget > 0
     GROUP BY p.id, p.name, p.budget, c.name
     ORDER BY budget_utilization_pct DESC`
  );

  const s = stats.rows[0];

  let response = `## Project Health Analysis\n\n`;
  response += `### Project Portfolio Overview\n`;
  response += `- **Total Projects:** ${s.total_projects}\n`;
  response += `- **Active (In Progress):** ${s.active_projects}\n`;
  response += `- **Proposals:** ${s.proposal_projects}\n`;
  response += `- **Completed:** ${s.completed_projects}\n`;
  response += `- **On Hold:** ${s.on_hold_projects}\n`;
  response += `- **Cancelled:** ${s.cancelled_projects}\n\n`;

  if (atRisk.rows.length > 0) {
    response += `### Projects at Risk\n`;
    response += `_Projects past deadline or due within 14 days:_\n\n`;
    for (const row of atRisk.rows) {
      const deadlineStr = row.deadline ? new Date(row.deadline).toLocaleDateString() : 'N/A';
      const isPast = row.deadline && new Date(row.deadline) < new Date();
      response += `- **${row.name}** (${row.client_name})\n`;
      response += `  - Deadline: ${deadlineStr} ${isPast ? '-- OVERDUE' : '-- approaching'}\n`;
      response += `  - Lead: ${row.lead_consultant || 'Unassigned'}\n`;
      response += `  - Budget: $${Number(row.budget || 0).toLocaleString()} | Spent: $${Number(row.spent_amount).toLocaleString()}\n`;
    }
    response += `\n`;
  } else {
    response += `### Projects at Risk\nNo projects currently at risk. All deadlines are more than 14 days out.\n\n`;
  }

  if (budgetStatus.rows.length > 0) {
    response += `### Budget Utilization\n`;
    for (const row of budgetStatus.rows) {
      const pct = Number(row.budget_utilization_pct);
      const statusIcon = pct > 90 ? 'CRITICAL' : pct > 70 ? 'WARNING' : 'OK';
      response += `- **${row.name}** (${row.client_name}): ${pct}% of $${Number(row.budget).toLocaleString()} budget used (${Number(row.total_hours).toFixed(1)}h logged) [${statusIcon}]\n`;
    }
  }

  return response;
}

// --- Consultant Performance ---
async function getConsultantPerformance(db: Pool): Promise<string> {
  // Consultant utilization
  const utilization = await db.query(
    `SELECT con.name, con.expertise, con.seniority, con.hourly_rate,
            COALESCE(SUM(te.hours), 0) AS total_hours,
            COALESCE(SUM(CASE WHEN te.is_billable THEN te.hours ELSE 0 END), 0) AS billable_hours,
            COALESCE(SUM(CASE WHEN te.date >= CURRENT_DATE - INTERVAL '30 days' THEN te.hours ELSE 0 END), 0) AS hours_last_30d,
            COUNT(DISTINCT te.project_id) AS project_count
     FROM consultants con
     LEFT JOIN time_entries te ON con.id = te.consultant_id
     WHERE con.is_active = true
     GROUP BY con.id, con.name, con.expertise, con.seniority, con.hourly_rate
     ORDER BY total_hours DESC`
  );

  // Revenue generated per consultant
  const revenuePerConsultant = await db.query(
    `SELECT con.name,
            COALESCE(SUM(te.hours * COALESCE(te.is_billable::int, 0) * con.hourly_rate), 0) AS potential_revenue,
            COALESCE(SUM(te.hours), 0) AS total_hours
     FROM consultants con
     LEFT JOIN time_entries te ON con.id = te.consultant_id
     WHERE con.is_active = true
     GROUP BY con.id, con.name
     ORDER BY potential_revenue DESC`
  );

  // Sessions and satisfaction
  const satisfaction = await db.query(
    `SELECT con.name,
            COUNT(s.id) AS session_count,
            ROUND(AVG(s.client_satisfaction), 2) AS avg_satisfaction,
            COUNT(CASE WHEN s.follow_up_needed THEN 1 END) AS follow_ups_pending
     FROM consultants con
     LEFT JOIN sessions s ON con.id = s.consultant_id
     WHERE con.is_active = true
     GROUP BY con.id, con.name
     HAVING COUNT(s.id) > 0
     ORDER BY avg_satisfaction DESC`
  );

  let response = `## Consultant Performance Analysis\n\n`;

  response += `### Utilization Summary\n`;
  for (const row of utilization.rows) {
    const billableRate = row.total_hours > 0
      ? ((Number(row.billable_hours) / Number(row.total_hours)) * 100).toFixed(1)
      : '0.0';
    response += `- **${row.name}** (${row.seniority} ${row.expertise}) - $${Number(row.hourly_rate)}/hr\n`;
    response += `  - Total Hours: ${Number(row.total_hours).toFixed(1)} | Billable: ${Number(row.billable_hours).toFixed(1)} (${billableRate}%)\n`;
    response += `  - Last 30 Days: ${Number(row.hours_last_30d).toFixed(1)}h | Active Projects: ${row.project_count}\n`;
  }
  response += `\n`;

  response += `### Revenue Potential by Consultant\n`;
  for (const row of revenuePerConsultant.rows) {
    response += `- **${row.name}:** $${Number(row.potential_revenue).toLocaleString()} (${Number(row.total_hours).toFixed(1)}h billed)\n`;
  }
  response += `\n`;

  if (satisfaction.rows.length > 0) {
    response += `### Client Satisfaction Ratings\n`;
    for (const row of satisfaction.rows) {
      const stars = Number(row.avg_satisfaction);
      response += `- **${row.name}:** ${stars.toFixed(1)}/5.0 avg across ${row.session_count} session${row.session_count !== 1 ? 's' : ''}`;
      if (Number(row.follow_ups_pending) > 0) {
        response += ` (${row.follow_ups_pending} follow-up${Number(row.follow_ups_pending) !== 1 ? 's' : ''} pending)`;
      }
      response += `\n`;
    }
  }

  return response;
}

// --- Client Insights (for analytics agent) ---
async function getClientInsightsAnalytics(db: Pool): Promise<string> {
  const clients = await db.query(
    `SELECT c.name, c.status, c.industry, c.annual_revenue,
            COUNT(DISTINCT p.id) AS project_count,
            COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) AS active_projects,
            COALESCE(SUM(i.total_amount), 0) AS total_invoiced,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) AS paid_amount,
            ROUND(AVG(s.client_satisfaction), 2) AS avg_satisfaction,
            COUNT(DISTINCT s.id) AS session_count
     FROM clients c
     LEFT JOIN projects p ON c.id = p.client_id
     LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'cancelled'
     LEFT JOIN sessions s ON c.id = s.client_id
     GROUP BY c.id, c.name, c.status, c.industry, c.annual_revenue
     ORDER BY total_invoiced DESC`
  );

  let response = `## Client Portfolio Insights\n\n`;

  const statusCounts: Record<string, number> = {};
  for (const row of clients.rows) {
    statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
  }

  response += `### Portfolio Overview\n`;
  response += `- **Total Clients:** ${clients.rows.length}\n`;
  for (const [status, count] of Object.entries(statusCounts)) {
    response += `- **${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}:** ${count}\n`;
  }
  response += `\n`;

  response += `### Client Details\n`;
  for (const row of clients.rows) {
    response += `- **${row.name}** (${row.status} | ${row.industry || 'N/A'})\n`;
    response += `  - Annual Revenue: $${Number(row.annual_revenue || 0).toLocaleString()}\n`;
    response += `  - Projects: ${row.project_count} total, ${row.active_projects} active\n`;
    response += `  - Invoiced: $${Number(row.total_invoiced).toLocaleString()} | Paid: $${Number(row.paid_amount).toLocaleString()}\n`;
    if (row.avg_satisfaction) {
      response += `  - Satisfaction: ${Number(row.avg_satisfaction).toFixed(1)}/5.0 (${row.session_count} sessions)\n`;
    }
  }

  return response;
}

// --- Main entry point ---
export async function analyzeData(query: string, db: Pool): Promise<string> {
  const lowerQuery = query.toLowerCase();

  try {
    // Determine which analysis to run based on keywords
    if (
      lowerQuery.includes('revenue') ||
      lowerQuery.includes('invoice') ||
      lowerQuery.includes('billing') ||
      lowerQuery.includes('financial') ||
      lowerQuery.includes('money') ||
      lowerQuery.includes('income') ||
      lowerQuery.includes('payment')
    ) {
      return await getRevenueAnalysis(db);
    }

    if (
      lowerQuery.includes('project') ||
      lowerQuery.includes('health') ||
      lowerQuery.includes('risk') ||
      lowerQuery.includes('deadline') ||
      lowerQuery.includes('budget') ||
      lowerQuery.includes('overdue') ||
      lowerQuery.includes('status')
    ) {
      return await getProjectHealthAnalysis(db);
    }

    if (
      lowerQuery.includes('consultant') ||
      lowerQuery.includes('performance') ||
      lowerQuery.includes('utilization') ||
      lowerQuery.includes('team') ||
      lowerQuery.includes('staff') ||
      lowerQuery.includes('hours')
    ) {
      return await getConsultantPerformance(db);
    }

    if (
      lowerQuery.includes('client') ||
      lowerQuery.includes('customer') ||
      lowerQuery.includes('satisfaction') ||
      lowerQuery.includes('portfolio')
    ) {
      return await getClientInsightsAnalytics(db);
    }

    // Default: provide a comprehensive summary
    const revenue = await getRevenueAnalysis(db);
    const projects = await getProjectHealthAnalysis(db);
    const consultants = await getConsultantPerformance(db);

    return `## Comprehensive Business Analytics\n\n${revenue}\n\n---\n\n${projects}\n\n---\n\n${consultants}`;
  } catch (error) {
    console.error('Analytics agent error:', error);
    return `## Analytics Error\n\nSorry, I encountered an error while analyzing the data. Please try again or refine your query.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
