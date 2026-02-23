import { Pool } from 'pg';

// --- Resource Allocation ---
async function suggestResourceAllocation(db: Pool, projectId?: number): Promise<string> {
  // Get available consultants and their current workload
  const consultants = await db.query(
    `SELECT con.id, con.name, con.expertise, con.seniority, con.hourly_rate,
            COALESCE(SUM(CASE WHEN te.date >= CURRENT_DATE - INTERVAL '7 days' THEN te.hours ELSE 0 END), 0) AS hours_this_week,
            COALESCE(SUM(CASE WHEN te.date >= CURRENT_DATE - INTERVAL '30 days' THEN te.hours ELSE 0 END), 0) AS hours_this_month,
            COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) AS active_project_count
     FROM consultants con
     LEFT JOIN time_entries te ON con.id = te.consultant_id
     LEFT JOIN project_consultants pc ON con.id = pc.consultant_id
     LEFT JOIN projects p ON pc.project_id = p.id
     WHERE con.is_active = true
     GROUP BY con.id, con.name, con.expertise, con.seniority, con.hourly_rate
     ORDER BY hours_this_week ASC`
  );

  let response = `## Resource Allocation Recommendations\n\n`;

  if (projectId) {
    const project = await db.query(
      `SELECT p.name, p.description, p.budget, p.billing_type, p.priority,
              c.name AS client_name, c.industry
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (project.rows.length > 0) {
      const proj = project.rows[0];
      response += `### For Project: ${proj.name}\n`;
      response += `- Client: ${proj.client_name} (${proj.industry || 'N/A'})\n`;
      response += `- Priority: ${proj.priority} | Budget: $${Number(proj.budget || 0).toLocaleString()}\n`;
      response += `- Description: ${proj.description || 'N/A'}\n\n`;

      // Recommend based on industry and expertise match
      response += `### Recommended Team Composition\n`;
      const sorted = [...consultants.rows].sort((a, b) => {
        const aMatch = a.expertise === proj.industry ? 1 : 0;
        const bMatch = b.expertise === proj.industry ? 1 : 0;
        return bMatch - aMatch || Number(a.hours_this_week) - Number(b.hours_this_week);
      });

      let rank = 1;
      for (const con of sorted.slice(0, 3)) {
        const weeklyCapacity = 40 - Number(con.hours_this_week);
        response += `${rank}. **${con.name}** (${con.seniority} ${con.expertise})\n`;
        response += `   - Available Capacity: ~${weeklyCapacity.toFixed(0)}h/week\n`;
        response += `   - Active Projects: ${con.active_project_count}\n`;
        response += `   - Rate: $${Number(con.hourly_rate)}/hr\n`;
        rank++;
      }
      response += `\n`;
    }
  }

  response += `### Current Team Availability\n`;
  for (const con of consultants.rows) {
    const weeklyCapacity = 40 - Number(con.hours_this_week);
    const utilization = ((Number(con.hours_this_week) / 40) * 100).toFixed(0);
    const status = Number(con.hours_this_week) > 35 ? 'FULLY BOOKED' :
                   Number(con.hours_this_week) > 25 ? 'BUSY' : 'AVAILABLE';
    response += `- **${con.name}** (${con.seniority} ${con.expertise}) [${status}]\n`;
    response += `  - This Week: ${Number(con.hours_this_week).toFixed(1)}h (${utilization}% utilization)\n`;
    response += `  - This Month: ${Number(con.hours_this_month).toFixed(1)}h\n`;
    response += `  - Active Projects: ${con.active_project_count}\n`;
    response += `  - Available Capacity: ~${weeklyCapacity.toFixed(0)}h/week\n`;
  }

  response += `\n### Recommendations\n`;
  const overloaded = consultants.rows.filter(c => Number(c.hours_this_week) > 35);
  const underutilized = consultants.rows.filter(c => Number(c.hours_this_week) < 15);

  if (overloaded.length > 0) {
    response += `- **Overloaded consultants:** ${overloaded.map(c => c.name).join(', ')} - consider redistributing work\n`;
  }
  if (underutilized.length > 0) {
    response += `- **Available for new work:** ${underutilized.map(c => c.name).join(', ')} - have capacity for additional assignments\n`;
  }
  if (overloaded.length === 0 && underutilized.length === 0) {
    response += `- Team workload is well-balanced across all consultants.\n`;
  }

  return response;
}

// --- Timeline Analysis ---
async function analyzeTimeline(db: Pool, projectId?: number): Promise<string> {
  let response = `## Timeline Analysis\n\n`;

  if (projectId) {
    const project = await db.query(
      `SELECT p.*, c.name AS client_name, con.name AS lead_name,
              COALESCE(SUM(te.hours), 0) AS total_hours_logged
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       LEFT JOIN consultants con ON p.lead_consultant_id = con.id
       LEFT JOIN time_entries te ON p.id = te.project_id
       WHERE p.id = $1
       GROUP BY p.id, c.name, con.name`,
      [projectId]
    );

    if (project.rows.length > 0) {
      const proj = project.rows[0];
      const startDate = proj.start_date ? new Date(proj.start_date) : null;
      const deadline = proj.deadline ? new Date(proj.deadline) : null;
      const now = new Date();

      response += `### Project: ${proj.name}\n`;
      response += `- Client: ${proj.client_name}\n`;
      response += `- Status: ${proj.status}\n`;
      response += `- Lead: ${proj.lead_name || 'Unassigned'}\n\n`;

      if (startDate && deadline) {
        const totalDays = Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const progressPct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

        response += `### Timeline Details\n`;
        response += `- Start Date: ${startDate.toLocaleDateString()}\n`;
        response += `- Deadline: ${deadline.toLocaleDateString()}\n`;
        response += `- Total Duration: ${totalDays} days\n`;
        response += `- Days Elapsed: ${elapsedDays} (${progressPct.toFixed(0)}%)\n`;
        response += `- Days Remaining: ${remainingDays}\n`;
        response += `- Hours Logged: ${Number(proj.total_hours_logged).toFixed(1)}\n\n`;

        if (remainingDays < 0) {
          response += `**ALERT:** This project is ${Math.abs(remainingDays)} days past deadline!\n\n`;
        } else if (remainingDays < 14) {
          response += `**WARNING:** Only ${remainingDays} days until deadline. Ensure all deliverables are on track.\n\n`;
        }
      }

      return response;
    }
  }

  // General timeline analysis for all active projects
  const projects = await db.query(
    `SELECT p.name, p.status, p.start_date, p.deadline, p.priority,
            c.name AS client_name,
            con.name AS lead_name,
            COALESCE(SUM(te.hours), 0) AS total_hours
     FROM projects p
     JOIN clients c ON p.client_id = c.id
     LEFT JOIN consultants con ON p.lead_consultant_id = con.id
     LEFT JOIN time_entries te ON p.id = te.project_id
     WHERE p.status IN ('in_progress', 'proposal')
     GROUP BY p.id, p.name, p.status, p.start_date, p.deadline, p.priority, c.name, con.name
     ORDER BY p.deadline ASC NULLS LAST`
  );

  response += `### Active Projects Timeline\n\n`;

  for (const proj of projects.rows) {
    const deadline = proj.deadline ? new Date(proj.deadline) : null;
    const now = new Date();
    const remainingDays = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    let timeStatus = 'N/A';
    if (remainingDays !== null) {
      if (remainingDays < 0) timeStatus = `${Math.abs(remainingDays)} days OVERDUE`;
      else if (remainingDays < 14) timeStatus = `${remainingDays} days remaining (URGENT)`;
      else if (remainingDays < 30) timeStatus = `${remainingDays} days remaining`;
      else timeStatus = `${remainingDays} days remaining (on track)`;
    }

    response += `- **${proj.name}** [${proj.priority.toUpperCase()}]\n`;
    response += `  - Client: ${proj.client_name} | Lead: ${proj.lead_name || 'Unassigned'}\n`;
    response += `  - Status: ${proj.status} | Deadline: ${deadline ? deadline.toLocaleDateString() : 'TBD'}\n`;
    response += `  - Timeline: ${timeStatus}\n`;
    response += `  - Hours Logged: ${Number(proj.total_hours).toFixed(1)}\n`;
  }

  return response;
}

// --- Generate Project Plan ---
async function generateProjectPlan(db: Pool, clientId?: number, description?: string): Promise<string> {
  let response = `## Project Plan Outline\n\n`;

  // Get client info if provided
  let clientInfo = null;
  if (clientId) {
    const client = await db.query(
      `SELECT c.*, COUNT(p.id) AS past_projects
       FROM clients c
       LEFT JOIN projects p ON c.id = p.client_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [clientId]
    );
    if (client.rows.length > 0) {
      clientInfo = client.rows[0];
    }
  }

  // Look at similar past projects for estimation
  const pastProjects = await db.query(
    `SELECT p.name, p.billing_type, p.budget, p.start_date, p.end_date, p.deadline,
            c.industry,
            COALESCE(SUM(te.hours), 0) AS actual_hours,
            COUNT(DISTINCT te.consultant_id) AS team_size
     FROM projects p
     JOIN clients c ON p.client_id = c.id
     LEFT JOIN time_entries te ON p.id = te.project_id
     WHERE p.status IN ('completed', 'in_progress')
     GROUP BY p.id, p.name, p.billing_type, p.budget, p.start_date, p.end_date, p.deadline, c.industry
     ORDER BY p.created_at DESC
     LIMIT 5`
  );

  // Get available team
  const team = await db.query(
    `SELECT name, expertise, seniority, hourly_rate
     FROM consultants
     WHERE is_active = true
     ORDER BY seniority DESC, hourly_rate DESC`
  );

  if (clientInfo) {
    response += `### Client: ${clientInfo.name}\n`;
    response += `- Industry: ${clientInfo.industry || 'N/A'}\n`;
    response += `- Company Size: ${clientInfo.company_size || 'N/A'}\n`;
    response += `- Past Projects: ${clientInfo.past_projects}\n`;
    response += `- Status: ${clientInfo.status}\n\n`;
  }

  if (description) {
    response += `### Project Description\n${description}\n\n`;
  }

  response += `### Recommended Project Structure\n\n`;
  response += `**Phase 1: Discovery & Assessment (Weeks 1-2)**\n`;
  response += `1. Stakeholder interviews and requirements gathering\n`;
  response += `2. Current state analysis and documentation\n`;
  response += `3. Gap analysis and opportunity identification\n`;
  response += `4. Deliverable: Discovery report and recommendations\n\n`;

  response += `**Phase 2: Strategy & Design (Weeks 3-5)**\n`;
  response += `1. Solution architecture and design\n`;
  response += `2. Roadmap development with milestones\n`;
  response += `3. Stakeholder alignment workshops\n`;
  response += `4. Deliverable: Strategic plan and implementation roadmap\n\n`;

  response += `**Phase 3: Implementation (Weeks 6-12)**\n`;
  response += `1. Phased implementation of recommendations\n`;
  response += `2. Weekly progress reviews and adjustments\n`;
  response += `3. Knowledge transfer and training\n`;
  response += `4. Deliverable: Implementation milestones and documentation\n\n`;

  response += `**Phase 4: Review & Handover (Weeks 13-14)**\n`;
  response += `1. Results measurement against KPIs\n`;
  response += `2. Final report and recommendations\n`;
  response += `3. Transition planning and support handover\n`;
  response += `4. Deliverable: Final report and transition plan\n\n`;

  // Estimate based on past projects
  if (pastProjects.rows.length > 0) {
    const avgHours = pastProjects.rows.reduce((sum: number, p: { actual_hours: string }) => sum + Number(p.actual_hours), 0) / pastProjects.rows.length;
    const avgTeamSize = pastProjects.rows.reduce((sum: number, p: { team_size: string }) => sum + Number(p.team_size), 0) / pastProjects.rows.length;
    const avgBudget = pastProjects.rows.reduce((sum: number, p: { budget: string | null }) => sum + Number(p.budget || 0), 0) / pastProjects.rows.length;

    response += `### Estimates (Based on ${pastProjects.rows.length} Similar Projects)\n`;
    response += `- **Estimated Hours:** ${avgHours.toFixed(0)}h\n`;
    response += `- **Recommended Team Size:** ${Math.ceil(avgTeamSize)} consultants\n`;
    response += `- **Budget Range:** $${(avgBudget * 0.8).toLocaleString(undefined, { maximumFractionDigits: 0 })} - $${(avgBudget * 1.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`;
    response += `- **Estimated Duration:** 10-14 weeks\n\n`;
  }

  response += `### Available Team Members\n`;
  for (const con of team.rows) {
    response += `- **${con.name}** - ${con.seniority} ${con.expertise} ($${Number(con.hourly_rate)}/hr)\n`;
  }

  return response;
}

// --- Main entry point ---
export async function generatePlan(query: string, db: Pool): Promise<string> {
  const lowerQuery = query.toLowerCase();

  try {
    // Extract project ID if mentioned
    const projectIdMatch = query.match(/project\s*(?:id\s*)?#?(\d+)/i);
    const projectId = projectIdMatch ? parseInt(projectIdMatch[1], 10) : undefined;

    // Extract client ID if mentioned
    const clientIdMatch = query.match(/client\s*(?:id\s*)?#?(\d+)/i);
    const clientId = clientIdMatch ? parseInt(clientIdMatch[1], 10) : undefined;

    if (
      lowerQuery.includes('resource') ||
      lowerQuery.includes('allocat') ||
      lowerQuery.includes('assign') ||
      lowerQuery.includes('team') ||
      lowerQuery.includes('availability') ||
      lowerQuery.includes('who')
    ) {
      return await suggestResourceAllocation(db, projectId);
    }

    if (
      lowerQuery.includes('timeline') ||
      lowerQuery.includes('schedule') ||
      lowerQuery.includes('deadline') ||
      lowerQuery.includes('when') ||
      lowerQuery.includes('duration')
    ) {
      return await analyzeTimeline(db, projectId);
    }

    if (
      lowerQuery.includes('plan') ||
      lowerQuery.includes('proposal') ||
      lowerQuery.includes('scope') ||
      lowerQuery.includes('estimate') ||
      lowerQuery.includes('new project')
    ) {
      return await generateProjectPlan(db, clientId, query);
    }

    // Default: show resource allocation and timelines
    const resources = await suggestResourceAllocation(db, projectId);
    const timelines = await analyzeTimeline(db, projectId);

    return `${resources}\n\n---\n\n${timelines}`;
  } catch (error) {
    console.error('Planning agent error:', error);
    return `## Planning Error\n\nSorry, I encountered an error while generating the plan. Please try again or refine your query.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
