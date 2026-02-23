import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Mail, MapPin } from 'lucide-react';
import { getClients, createClient } from '@/lib/api';
import type { Client, CreateClientData } from '@/lib/api';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Energy', 'Real Estate', 'Media', 'Other',
];

const STATUSES = ['active', 'lead', 'on_hold', 'churned'];

const emptyForm: CreateClientData = {
  company_name: '',
  industry: 'Technology',
  status: 'lead',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  city: '',
  country: '',
  notes: '',
};

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateClientData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadClients = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (industryFilter) params.industry = industryFilter;
      if (search) params.search = search;
      const data = await getClients(params);
      setClients(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [statusFilter, industryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadClients();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createClient(form);
      setShowForm(false);
      setForm(emptyForm);
      loadClients();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title tracking-tight">Clients</h1>
          <p className="page-subtitle">Manage your client relationships and track engagement</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="card glass p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-10 rounded-xl"
              placeholder="Search clients by name, contact, or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <select
            className="input w-auto rounded-xl"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            className="input w-auto rounded-xl"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card animate-slide-up">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Building2 size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 text-lg font-bold tracking-tight">No clients found</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs">
              Add your first client to start managing relationships and tracking engagement.
            </p>
            <button className="btn btn-primary mt-5" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add Your First Client
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container animate-slide-up">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th className="hide-mobile">Industry</th>
                <th>Status</th>
                <th>Contact</th>
                <th className="hide-mobile">Location</th>
                <th className="hide-mobile">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="icon-box icon-box-sm rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                        }}
                      >
                        <Building2 size={16} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {client.company_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hide-mobile">
                    <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                      {client.industry}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${client.status}`}>
                      {client.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{client.contact_name}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {client.contact_email}
                      </span>
                    </div>
                  </td>
                  <td className="hide-mobile">
                    {(client.city || client.country) ? (
                      <span className="text-sm text-slate-500 flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-300" />
                        {client.city}{client.country ? `, ${client.country}` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">--</span>
                    )}
                  </td>
                  <td className="hide-mobile">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                      ${(client.total_revenue ?? 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Client Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div
              className="px-6 py-5 rounded-t-2xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5, #7c3aed)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Building2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Add New Client</h2>
                  <p className="text-indigo-200/70 text-xs mt-0.5">Fill in the details below to create a new client record</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="label">Company Name <span className="text-red-400">*</span></label>
                <input
                  className="input rounded-xl"
                  required
                  placeholder="Enter company name"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Industry</label>
                  <select
                    className="input rounded-xl"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  >
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input rounded-xl"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divider" />

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</p>
                <div className="space-y-4">
                  <div>
                    <label className="label">Contact Name <span className="text-red-400">*</span></label>
                    <input
                      className="input rounded-xl"
                      required
                      placeholder="Full name"
                      value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Email <span className="text-red-400">*</span></label>
                      <input
                        className="input rounded-xl"
                        type="email"
                        required
                        placeholder="email@company.com"
                        value={form.contact_email}
                        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input
                        className="input rounded-xl"
                        placeholder="+1 (555) 000-0000"
                        value={form.contact_phone}
                        onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Location</p>
                <div className="space-y-4">
                  <div>
                    <label className="label">Address</label>
                    <input
                      className="input rounded-xl"
                      placeholder="Street address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">City</label>
                      <input
                        className="input rounded-xl"
                        placeholder="City"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Country</label>
                      <input
                        className="input rounded-xl"
                        placeholder="Country"
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input rounded-xl"
                  rows={3}
                  placeholder="Additional notes about this client..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
