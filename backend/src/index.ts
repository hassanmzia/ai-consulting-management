import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import pool from './db.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import consultantRoutes from './routes/consultants.js';
import projectRoutes from './routes/projects.js';
import timeEntryRoutes from './routes/time-entries.js';
import invoiceRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';
import sessionRoutes from './routes/sessions.js';
import kpiRoutes from './routes/kpis.js';
import portfolioRoutes from './routes/portfolios.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Ensure admin user exists with correct password hash on startup
async function seedAdminUser() {
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@consulting.local']);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, 'Admin', 'User', 'admin')`,
        ['admin@consulting.local', hash]
      );
      console.log('Seeded admin user: admin@consulting.local / admin123');
    } else {
      // Update the hash in case it was a placeholder
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@consulting.local']);
      console.log('Admin user exists, password hash updated');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
}
seedAdminUser();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/consultants', consultantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/portfolios', portfolioRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Consulting Management API server running on port ${PORT}`);
});

export default app;
