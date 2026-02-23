import { useEffect, useState } from 'react';
import { Plus, FileText, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { getInvoices, getClients, getProjects, createInvoice } from '@/lib/api';
import type { Invoice, Client, Project, CreateInvoiceData } from '@/lib/api';

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm: CreateInvoiceData = {
    client_id: 0,
    project_id: 0,
    amount: 0,
    tax_amount: 0,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
  };

  const [form, setForm] = useState<CreateInvoiceData>(emptyForm);

  const loadInvoices = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const data = await getInvoices(params);
      setInvoices(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    getClients().then(setClients).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createInvoice(form);
      setShowForm(false);
      setForm(emptyForm);
      loadInvoices();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
  const paidAmount = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
  const overdueAmount = invoices.filter((i) => i.status === 'overdue').reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mt-1">Manage invoices and track payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <DollarSign size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Invoiced</p>
            <p className="text-xl font-bold text-slate-900">${totalAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Paid</p>
            <p className="text-xl font-bold text-emerald-600">${paidAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Overdue</p>
            <p className="text-xl font-bold text-red-600">${overdueAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-3">
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg font-medium">No invoices found</p>
          <p className="text-slate-400 text-sm mt-1">Create your first invoice to get started</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th className="hide-mobile">Project</th>
                <th>Status</th>
                <th>Amount</th>
                <th className="hide-mobile">Tax</th>
                <th>Total</th>
                <th className="hide-mobile">Issue Date</th>
                <th className="hide-mobile">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium text-slate-900">{invoice.invoice_number}</td>
                  <td className="text-slate-600">{invoice.client_name}</td>
                  <td className="hide-mobile text-slate-600">{invoice.project_name}</td>
                  <td>
                    <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
                  </td>
                  <td className="text-slate-700">${(invoice.amount ?? 0).toLocaleString()}</td>
                  <td className="hide-mobile text-slate-500">${(invoice.tax_amount ?? 0).toLocaleString()}</td>
                  <td className="font-semibold text-slate-900">${(invoice.total_amount ?? 0).toLocaleString()}</td>
                  <td className="hide-mobile text-slate-500">{invoice.issue_date}</td>
                  <td className="hide-mobile text-slate-500">{invoice.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
                <select
                  className="input"
                  required
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}
                >
                  <option value={0}>Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project *</label>
                <select
                  className="input"
                  required
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}
                >
                  <option value={0}>Select a project</option>
                  {projects
                    .filter((p) => !form.client_id || p.client_id === form.client_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($) *</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tax_amount}
                    onChange={(e) => setForm({ ...form, tax_amount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date *</label>
                  <input
                    className="input"
                    type="date"
                    required
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
                  <input
                    className="input"
                    type="date"
                    required
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-700">${form.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">Tax</span>
                  <span className="text-slate-700">${form.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-900">Total</span>
                  <span className="font-bold text-slate-900">
                    ${(form.amount + form.tax_amount).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
