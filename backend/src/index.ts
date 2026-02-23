import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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
