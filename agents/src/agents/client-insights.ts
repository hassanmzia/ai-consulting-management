import { Pool } from 'pg';

// --- Client Health Check ---
async function clientHealthCheck(db: Pool, clientId?: number): Promise<string> {
  let response = `## Client Health Check\n\n`;

  const whereClause = clientId ? 'WHERE c.id = $1' : '';
  const params = clientId ? [clientId] : [];

  const clients = await db.query(
    `SELECT c.id, c.name, c.status, c.industry, c.annual_revenue, c.created_at,
            COUNT(DISTINCT p.id) AS total_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) AS active_projects,
            COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) AS completed_projects,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) AS paid_revenue,
            COALESCE(SUM(CASE WHEN i.status IN ('sent','overdue') THEN i.total_amount ELSE 0 END), 0) AS outstanding_amount,
            COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.total_amount ELSE 0 END), 0) AS overdue_amount,
            COUNT(DISTINCT s.id) AS session_count,
            ROUND(AVG(s.client_satisfaction), 2) AS avg_satisfaction,
            MAX(s.date) AS last_session_date,
            COUNT(DISTINCT k.id) AS kpi_count,
            ROUND(AVG(CASE WHEN k.target_value > 0 THEN k.current_value / k.target_value * 100 END), 1) AS avg_kpi_progress
     FROM clients c
     LEFT JOIN projects p ON c.id = p.client_id
     LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'cancelled'
     LEFT JOIN sessions s ON c.id = s.client_id
     LEFT JOIN kpis k ON c.id = k.client_id
     ${whereClause}
     GROUP BY c.id, c.name, c.status, c.industry, c.annual_revenue, c.created_at
     ORDER BY paid_revenue DESC`,
    params
  );

  if (clients.rows.length === 0) {
    return response + `No clients found${clientId ? ` with ID ${clientId}` : ''}.\n`;
  }

  for (const client of clients.rows) {
    // Calculate health score (0-100)
    let healthScore = 50; // base

    // Satisfaction factor (up to +25)
    if (client.avg_satisfaction) {
      healthScore += (Number(client.avg_satisfaction) - 3) * 12.5;
    }

    // Activity factor (+10 if active projects)
    if (Number(client.active_projects) > 0) healthScore += 10;

    // Revenue factor (+10 if paying)
    if (Number(client.paid_revenue) > 0) healthScore += 10;

    // Overdue penalty (-15)
    if (Number(client.overdue_amount) > 0) healthScore -= 15;

    // Engagement recency
    if (client.last_session_date) {
      const daysSinceSession = Math.ceil(
        (new Date().getTime() - new Date(client.last_session_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceSession > 30) healthScore -= 10;
      else if (daysSinceSession <= 7) healthScore += 5;
    } else {
      healthScore -= 10;
    }

    // KPI progress factor
    if (client.avg_kpi_progress) {
      if (Number(client.avg_kpi_progress) >= 70) healthScore += 5;
      else if (Number(client.avg_kpi_progress) < 30) healthScore -= 5;
    }

    healthScore = Math.max(0, Math.min(100, healthScore));
    const healthLabel = healthScore >= 80 ? 'EXCELLENT' :
                        healthScore >= 60 ? 'GOOD' :
                        healthScore >= 40 ? 'FAIR' :
                        healthScore >= 20 ? 'AT RISK' : 'CRITICAL';

    response += `### ${client.name}\n`;
    response += `**Health Score: ${healthScore.toFixed(0)}/100 (${healthLabel})**\n\n`;
    response += `| Metric | Value |\n`;
    response += `|--------|-------|\n`;
    response += `| Status | ${client.status} |\n`;
    response += `| Industry | ${client.industry || 'N/A'} |\n`;
    response += `| Projects | ${client.total_projects} total (${client.active_projects} active, ${client.completed_projects} completed) |\n`;
    response += `| Revenue Collected | $${Number(client.paid_revenue).toLocaleString()} |\n`;
    response += `| Outstanding | $${Number(client.outstanding_amount).toLocaleString()} |\n`;
    response += `| Overdue | $${Number(client.overdue_amount).toLocaleString()} |\n`;
    response += `| Sessions | ${client.session_count} |\n`;
    response += `| Avg Satisfaction | ${client.avg_satisfaction ? `${Number(client.avg_satisfaction).toFixed(1)}/5.0` : 'N/A'} |\n`;
    response += `| Last Session | ${client.last_session_date ? new Date(client.last_session_date).toLocaleDateString() : 'N/A'} |\n`;
    response += `| KPI Progress | ${client.avg_kpi_progress ? `${Number(client.avg_kpi_progress).toFixed(0)}%` : 'N/A'} |\n`;
    response += `\n`;

    // Recommendations
    const recommendations: string[] = [];
    if (Number(client.overdue_amount) > 0) {
      recommendations.push(`Follow up on $${Number(client.overdue_amount).toLocaleString()} in overdue invoices`);
    }
    if (!client.last_session_date || (new Date().getTime() - new Date(client.last_session_date).getTime()) > 14 * 24 * 60 * 60 * 1000) {
      recommendations.push('Schedule a check-in session - engagement is low');
    }
    if (client.avg_kpi_progress && Number(client.avg_kpi_progress) < 40) {
      recommendations.push('Review KPI targets - progress is below expectations');
    }
    if (Number(client.active_projects) === 0 && client.status === 'active') {
      recommendations.push('Explore new project opportunities - no active projects');
    }

    if (recommendations.length > 0) {
      response += `**Recommendations:**\n`;
      for (const rec of recommendations) {
        response += `- ${rec}\n`;
      }
      response += `\n`;
    }
  }

  return response;
}

// --- Churn Risk Analysis ---
async function churnRiskAnalysis(db: Pool): Promise<string> {
  const clients = await db.query(
    `SELECT c.id, c.name, c.status, c.industry,
            COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) AS active_projects,
            MAX(s.date) AS last_session,
            MAX(i.issue_date) AS last_invoice,
            ROUND(AVG(s.client_satisfaction), 2) AS avg_satisfaction,
            COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.total_amount ELSE 0 END), 0) AS overdue_amount,
            COUNT(DISTINCT CASE WHEN s.date >= CURRENT_DATE - INTERVAL '60 days' THEN s.id END) AS recent_sessions,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) AS lifetime_revenue
     FROM clients c
     LEFT JOIN projects p ON c.id = p.client_id
     LEFT JOIN sessions s ON c.id = s.client_id
     LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'cancelled'
     WHERE c.status NOT IN ('churned', 'lead')
     GROUP BY c.id, c.name, c.status, c.industry
     ORDER BY c.name`
  );

  let response = `## Churn Risk Analysis\n\n`;

  const riskClients: { name: string; risk: string; score: number; reasons: string[] }[] = [];

  for (const client of clients.rows) {
    let riskScore = 0;
    const reasons: string[] = [];

    // No active projects
    if (Number(client.active_projects) === 0) {
      riskScore += 25;
      reasons.push('No active projects');
    }

    // Low satisfaction
    if (client.avg_satisfaction && Number(client.avg_satisfaction) < 3.5) {
      riskScore += 25;
      reasons.push(`Low satisfaction rating (${Number(client.avg_satisfaction).toFixed(1)}/5.0)`);
    }

    // No recent sessions
    if (Number(client.recent_sessions) === 0) {
      riskScore += 20;
      reasons.push('No sessions in the last 60 days');
    }

    // Overdue invoices
    if (Number(client.overdue_amount) > 0) {
      riskScore += 15;
      reasons.push(`$${Number(client.overdue_amount).toLocaleString()} in overdue invoices`);
    }

    // On hold status
    if (client.status === 'on_hold') {
      riskScore += 15;
      reasons.push('Account is on hold');
    }

    const riskLevel = riskScore >= 60 ? 'HIGH' :
                      riskScore >= 35 ? 'MEDIUM' : 'LOW';

    riskClients.push({
      name: client.name,
      risk: riskLevel,
      score: riskScore,
      reasons
    });
  }

  // Sort by risk score descending
  riskClients.sort((a, b) => b.score - a.score);

  const high = riskClients.filter(c => c.risk === 'HIGH');
  const medium = riskClients.filter(c => c.risk === 'MEDIUM');
  const low = riskClients.filter(c => c.risk === 'LOW');

  response += `### Summary\n`;
  response += `- **High Risk:** ${high.length} client${high.length !== 1 ? 's' : ''}\n`;
  response += `- **Medium Risk:** ${medium.length} client${medium.length !== 1 ? 's' : ''}\n`;
  response += `- **Low Risk:** ${low.length} client${low.length !== 1 ? 's' : ''}\n\n`;

  if (high.length > 0) {
    response += `### High Risk Clients\n`;
    for (const c of high) {
      response += `- **${c.name}** (Risk Score: ${c.score}/100)\n`;
      for (const r of c.reasons) {
        response += `  - ${r}\n`;
      }
    }
    response += `\n`;
  }

  if (medium.length > 0) {
    response += `### Medium Risk Clients\n`;
    for (const c of medium) {
      response += `- **${c.name}** (Risk Score: ${c.score}/100)\n`;
      for (const r of c.reasons) {
        response += `  - ${r}\n`;
      }
    }
    response += `\n`;
  }

  if (low.length > 0) {
    response += `### Low Risk Clients\n`;
    for (const c of low) {
      response += `- **${c.name}** (Risk Score: ${c.score}/100)\n`;
    }
    response += `\n`;
  }

  response += `### Retention Recommendations\n`;
  if (high.length > 0) {
    response += `1. **Immediate action required** for high-risk clients - schedule executive check-ins within the next week\n`;
  }
  response += `2. Review pricing and value proposition for clients with no active projects\n`;
  response += `3. Implement quarterly business reviews for all active clients\n`;
  response += `4. Address overdue invoices promptly - billing issues often precede churn\n`;

  return response;
}

// --- Upsell Opportunities ---
async function upsellOpportunities(db: Pool): Promise<string> {
  const clients = await db.query(
    `SELECT c.id, c.name, c.status, c.industry, c.annual_revenue, c.company_size,
            COUNT(DISTINCT p.id) AS project_count,
            COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) AS completed_projects,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) AS lifetime_revenue,
            ROUND(AVG(s.client_satisfaction), 2) AS avg_satisfaction,
            COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) AS active_projects,
            ARRAY_AGG(DISTINCT p.billing_type) FILTER (WHERE p.billing_type IS NOT NULL) AS billing_types,
            ARRAY_AGG(DISTINCT con.expertise) FILTER (WHERE con.expertise IS NOT NULL) AS expertise_used
     FROM clients c
     LEFT JOIN projects p ON c.id = p.client_id
     LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'cancelled'
     LEFT JOIN sessions s ON c.id = s.client_id
     LEFT JOIN project_consultants pc ON p.id = pc.project_id
     LEFT JOIN consultants con ON pc.consultant_id = con.id
     WHERE c.status = 'active'
     GROUP BY c.id, c.name, c.status, c.industry, c.annual_revenue, c.company_size
     ORDER BY avg_satisfaction DESC NULLS LAST, lifetime_revenue DESC`
  );

  // Get all available expertise areas
  const expertiseAreas = await db.query(
    `SELECT DISTINCT expertise FROM consultants WHERE is_active = true`
  );
  const allExpertise = expertiseAreas.rows.map(r => r.expertise);

  let response = `## Upsell & Cross-sell Opportunities\n\n`;

  if (clients.rows.length === 0) {
    return response + `No active clients found for upsell analysis.\n`;
  }

  response += `### Opportunities by Client\n\n`;

  for (const client of clients.rows) {
    const opportunities: string[] = [];
    const usedExpertise: string[] = client.expertise_used || [];
    const unusedExpertise = allExpertise.filter(e => !usedExpertise.includes(e));

    // High satisfaction = ready for more
    if (client.avg_satisfaction && Number(client.avg_satisfaction) >= 4.0) {
      opportunities.push('High satisfaction - ideal candidate for expanded engagement');
    }

    // Only hourly billing - suggest retainer
    const billingTypes: string[] = client.billing_types || [];
    if (billingTypes.length > 0 && !billingTypes.includes('retainer')) {
      opportunities.push('Consider proposing a retainer agreement for ongoing advisory services');
    }

    // Unused expertise areas
    if (unusedExpertise.length > 0) {
      opportunities.push(`Cross-sell opportunity: ${unusedExpertise.join(', ')} services not yet utilized`);
    }

    // Large company but low spend
    if (client.annual_revenue && Number(client.annual_revenue) > 5000000 && Number(client.lifetime_revenue) < 50000) {
      opportunities.push('Large company with relatively low consulting spend - room for growth');
    }

    // Completed projects - time for follow-up
    if (Number(client.completed_projects) > 0 && Number(client.active_projects) === 0) {
      opportunities.push('Previous projects completed - propose follow-up engagement or Phase 2');
    }

    if (opportunities.length > 0) {
      response += `#### ${client.name}\n`;
      response += `- Industry: ${client.industry || 'N/A'} | Revenue: $${Number(client.annual_revenue || 0).toLocaleString()}\n`;
      response += `- Lifetime Consulting Revenue: $${Number(client.lifetime_revenue).toLocaleString()}\n`;
      response += `- Satisfaction: ${client.avg_satisfaction ? `${Number(client.avg_satisfaction).toFixed(1)}/5.0` : 'N/A'}\n`;
      response += `- Active Projects: ${client.active_projects}\n\n`;
      response += `**Opportunities:**\n`;
      for (const opp of opportunities) {
        response += `- ${opp}\n`;
      }
      response += `\n`;
    }
  }

  response += `### Strategic Recommendations\n`;
  response += `1. Focus on clients with high satisfaction scores for expansion conversations\n`;
  response += `2. Package cross-functional offerings (e.g., strategy + technology + analytics)\n`;
  response += `3. Propose retainer models for clients with recurring needs\n`;
  response += `4. Schedule account planning sessions for top revenue clients\n`;
  response += `5. Develop industry-specific solutions for your largest verticals\n`;

  return response;
}

// --- Main entry point ---
export async function getClientInsight(query: string, db: Pool): Promise<string> {
  const lowerQuery = query.toLowerCase();

  try {
    // Extract client ID if mentioned
    const clientIdMatch = query.match(/client\s*(?:id\s*)?#?(\d+)/i);
    const clientId = clientIdMatch ? parseInt(clientIdMatch[1], 10) : undefined;

    if (
      lowerQuery.includes('churn') ||
      lowerQuery.includes('risk') ||
      lowerQuery.includes('retain') ||
      lowerQuery.includes('losing') ||
      lowerQuery.includes('attrition')
    ) {
      return await churnRiskAnalysis(db);
    }

    if (
      lowerQuery.includes('upsell') ||
      lowerQuery.includes('cross-sell') ||
      lowerQuery.includes('expand') ||
      lowerQuery.includes('grow') ||
      lowerQuery.includes('opportunity') ||
      lowerQuery.includes('more services')
    ) {
      return await upsellOpportunities(db);
    }

    if (
      lowerQuery.includes('health') ||
      lowerQuery.includes('check') ||
      lowerQuery.includes('status') ||
      lowerQuery.includes('how') ||
      clientId
    ) {
      return await clientHealthCheck(db, clientId);
    }

    // Default: provide health check for all clients
    return await clientHealthCheck(db);
  } catch (error) {
    console.error('Client insights agent error:', error);
    return `## Client Insights Error\n\nSorry, I encountered an error while generating client insights. Please try again or refine your query.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
