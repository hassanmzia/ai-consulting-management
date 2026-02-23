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
    client_id: 0, project_id: 0, amount: 0, tax_amount: 0,
    issue_date: new Date().toISOString().split('T')[0], due_date: '',
  };
  const [form, setForm] = useState<CreateInvoiceData>(emptyForm);

  const loadInvoices = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const data = await getInvoices(params);
      setInvoices(data);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => {
    loadInvoices();
    getClients().then(setClients).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []);
  useEffect(() => { loadInvoices(); }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createInvoice(form);
      setShowForm(false);
      setForm(emptyForm);
      loadInvoices();
    } catch { /* */ } finally { setSubmitting(false); }
  };

  const totalAmount = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const paidAmount = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const overdueAmount = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + (i.total_amount ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage billing and track payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Create Invoice</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-blue-50"><FileText size={18} className="text-blue-600" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invoiced</p>
              <p className="text-xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-green-50"><CheckCircle size={18} className="text-green-600" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</p>
              <p className="text-xl font-bold text-green-600">${paidAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-red-50"><AlertCircle size={18} className="text-red-600" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</p>
              <p className="text-xl font-bold text-red-600">${overdueAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : invoices.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><FileText size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No invoices found</h3>
          <p className="text-sm text-gray-400">{statusFilter ? 'Try a different status filter.' : 'Create your first invoice.'}</p>
          {!statusFilter && <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}><Plus size={16} /> Create Invoice</button>}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th><th>Client</th><th className="hide-mobile">Project</th><th>Status</th>
                <th>Amount</th><th className="hide-mobile">Tax</th><th>Total</th>
                <th className="hide-mobile">Issue Date</th><th className="hide-mobile">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><span className="font-medium text-gray-900">{inv.invoice_number}</span></td>
                  <td><span className="text-gray-700">{inv.client_name}</span></td>
                  <td className="hide-mobile"><span className="text-gray-500">{inv.project_name}</span></td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                  <td><span className="text-gray-700">${(inv.amount ?? 0).toLocaleString()}</span></td>
                  <td className="hide-mobile"><span className="text-gray-400">${(inv.tax_amount ?? 0).toLocaleString()}</span></td>
                  <td><span className="font-semibold text-gray-900">${(inv.total_amount ?? 0).toLocaleString()}</span></td>
                  <td className="hide-mobile"><span className="text-gray-500 text-xs">{inv.issue_date}</span></td>
                  <td className="hide-mobile">
                    <span className={`text-xs font-medium ${inv.status === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>{inv.due_date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Create Invoice</h2>
              <p className="text-sm text-gray-500 mb-6">Enter billing details</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Client *</label>
                  <select className="input" required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}>
                    <option value={0}>Select a client</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Project *</label>
                  <select className="input" required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}>
                    <option value={0}>Select a project</option>
                    {projects.filter((p) => !form.client_id || p.client_id === form.client_id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Amount ($) *</label>
                    <input className="input" type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label">Tax ($)</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Issue Date *</label>
                    <input className="input" type="date" required value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Due Date *</label>
                    <input className="input" type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">${form.amount.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Tax</span><span className="font-medium">${form.tax_amount.toLocaleString()}</span></div>
                  <div className="divider" style={{ margin: '0.5rem 0' }} />
                  <div className="flex justify-between"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-blue-600">${(form.amount + form.tax_amount).toLocaleString()}</span></div>
                </div>
                <div className="divider" />
                <div className="flex justify-end gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner spinner-sm" /> Creating...</> : <><Plus size={16} /> Create Invoice</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
