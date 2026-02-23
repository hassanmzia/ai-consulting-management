import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Mail, MapPin } from 'lucide-react';
import { getClients, createClient } from '@/lib/api';
import type { Client, CreateClientData } from '@/lib/api';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm: CreateClientData = {
    company_name: '',
    industry: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    country: '',
    notes: '',
    status: 'lead',
  };
  const [form, setForm] = useState<CreateClientData>(emptyForm);

  const loadClients = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await getClients(params);
      setClients(data);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { loadClients(); }, [statusFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createClient(form);
      setShowForm(false);
      setForm(emptyForm);
      loadClients();
    } catch { /* */ } finally { setSubmitting(false); }
  };

  const filtered = clients.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.company_name.toLowerCase().includes(q) && !c.industry?.toLowerCase().includes(q) && !c.contact_email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your client relationships</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="on_hold">On Hold</option>
            <option value="churned">Churned</option>
          </select>
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><Building2 size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No clients found</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            {search || statusFilter ? 'Try different filters or search terms.' : 'Add your first client to get started.'}
          </p>
          {!search && !statusFilter && (
            <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}><Plus size={16} /> Add Client</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="card card-interactive p-5"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {client.company_name.slice(0, 2).toUpperCase()}
                </div>
                <span className={`badge badge-${client.status}`}>{client.status.replace('_', ' ')}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{client.company_name}</h3>
              {client.industry && <p className="text-xs text-gray-400 mb-3">{client.industry}</p>}
              <div className="space-y-1.5">
                {client.contact_email && (
                  <p className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} className="text-gray-400" /> {client.contact_email}</p>
                )}
                {client.city && (
                  <p className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={12} className="text-gray-400" /> {client.city}{client.country ? `, ${client.country}` : ''}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Client</h2>
              <p className="text-sm text-gray-500 mb-6">Enter the client details below</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Company Name *</label>
                  <input className="input" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Acme Corp" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Industry</label>
                    <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Technology" />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="lead">Lead</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Contact Name</label>
                  <input className="input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email *</label>
                    <input className="input" type="email" required value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="john@acme.com" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+1 234 567 890" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">City</label>
                    <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New York" />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="USA" />
                  </div>
                </div>
                <div className="divider" />
                <div className="flex justify-end gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner spinner-sm" /> Creating...</> : <><Plus size={16} /> Add Client</>}
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
