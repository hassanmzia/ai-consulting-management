import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// Generate invoice number: INV-YYYY-NNN
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT invoice_number FROM invoices
     WHERE invoice_number LIKE $1
     ORDER BY invoice_number DESC LIMIT 1`,
    [`INV-${year}-%`]
  );

  let nextNum = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].invoice_number;
    const parts = lastNumber.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `INV-${year}-${String(nextNum).padStart(3, '0')}`;
}

// GET /api/invoices - list with filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, client_id } = req.query;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`i.status = $${paramIndex++}`);
      params.push(status as string);
    }

    if (client_id) {
      conditions.push(`i.client_id = $${paramIndex++}`);
      params.push(parseInt(client_id as string, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT i.*,
              c.name AS client_name,
              p.name AS project_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       LEFT JOIN projects p ON i.project_id = p.id
       ${whereClause}
       ORDER BY i.issue_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices/:id - single invoice with line items
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invoiceResult = await pool.query(
      `SELECT i.*,
              c.name AS client_name,
              c.contact_name, c.contact_email, c.address, c.city, c.state, c.country,
              p.name AS project_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       LEFT JOIN projects p ON i.project_id = p.id
       WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const invoice = invoiceResult.rows[0];

    const lineItemsResult = await pool.query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id ASC',
      [id]
    );

    res.json({
      ...invoice,
      line_items: lineItemsResult.rows,
    });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invoices - create invoice with auto-generated number
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      client_id, project_id, status, issue_date, due_date,
      subtotal, tax_rate, tax_amount, total_amount, notes, line_items,
    } = req.body;

    if (!client_id || !due_date) {
      res.status(400).json({ error: 'client_id and due_date are required' });
      return;
    }

    const invoice_number = await generateInvoiceNumber();

    const invoiceResult = await pool.query(
      `INSERT INTO invoices (invoice_number, client_id, project_id, status, issue_date, due_date,
        subtotal, tax_rate, tax_amount, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        invoice_number, client_id, project_id, status || 'draft',
        issue_date || new Date(), due_date,
        subtotal || 0, tax_rate || 0, tax_amount || 0, total_amount || 0, notes,
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Insert line items if provided
    if (line_items && Array.isArray(line_items) && line_items.length > 0) {
      for (const item of line_items) {
        await pool.query(
          `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoice.id, item.description, item.quantity || 1, item.unit_price, item.total]
        );
      }
    }

    // Fetch the complete invoice with line items
    const lineItemsResult = await pool.query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id ASC',
      [invoice.id]
    );

    res.status(201).json({
      ...invoice,
      line_items: lineItemsResult.rows,
    });
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/invoices/:id - update invoice
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status, issue_date, due_date,
      subtotal, tax_rate, tax_amount, total_amount, notes, paid_date,
    } = req.body;

    const result = await pool.query(
      `UPDATE invoices SET
        status = COALESCE($1, status),
        issue_date = COALESCE($2, issue_date),
        due_date = COALESCE($3, due_date),
        subtotal = COALESCE($4, subtotal),
        tax_rate = COALESCE($5, tax_rate),
        tax_amount = COALESCE($6, tax_amount),
        total_amount = COALESCE($7, total_amount),
        notes = COALESCE($8, notes),
        paid_date = COALESCE($9, paid_date),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [status, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, notes, paid_date, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/invoices/:id - delete invoice
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
