const BASE_URL = window.location.origin + '/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function fetchApi<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || errorData.detail || errorData.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Dashboard
export const getDashboardStats = () =>
  fetchApi<DashboardStats>('/dashboard/stats');

export const getRevenueChart = () =>
  fetchApi<RevenueChartData[]>('/dashboard/revenue-chart');

export const getProjectStatus = () =>
  fetchApi<ProjectStatusData[]>('/dashboard/project-status');

export const getConsultantUtilization = () =>
  fetchApi<ConsultantUtilizationData[]>('/dashboard/consultant-utilization');

export const getRecentActivity = () =>
  fetchApi<ActivityItem[]>('/dashboard/recent-activity');

// Clients
export const getClients = (params?: Record<string, string | number | boolean | undefined>) =>
  fetchApi<Client[]>('/clients', { params });

export const getClient = (id: number | string) =>
  fetchApi<ClientDetail>(`/clients/${id}`);

export const createClient = (data: CreateClientData) =>
  fetchApi<Client>('/clients', { method: 'POST', body: JSON.stringify(data) });

export const updateClient = (id: number | string, data: Partial<CreateClientData>) =>
  fetchApi<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteClient = (id: number | string) =>
  fetchApi(`/clients/${id}`, { method: 'DELETE' });

// Projects
export const getProjects = (params?: Record<string, string | number | boolean | undefined>) =>
  fetchApi<Project[]>('/projects', { params });

export const getProject = (id: number | string) =>
  fetchApi<ProjectDetail>(`/projects/${id}`);

export const createProject = (data: CreateProjectData) =>
  fetchApi<Project>('/projects', { method: 'POST', body: JSON.stringify(data) });

export const updateProject = (id: number | string, data: Partial<CreateProjectData>) =>
  fetchApi<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Consultants
export const getConsultants = (params?: Record<string, string | number | boolean | undefined>) =>
  fetchApi<Consultant[]>('/consultants', { params });

export const getConsultant = (id: number | string) =>
  fetchApi<Consultant>(`/consultants/${id}`);

export const createConsultant = (data: CreateConsultantData) =>
  fetchApi<Consultant>('/consultants', { method: 'POST', body: JSON.stringify(data) });

// Time Entries
export const getTimeEntries = (params?: Record<string, string | number | boolean | undefined>) =>
  fetchApi<TimeEntry[]>('/time-entries', { params });

export const createTimeEntry = (data: CreateTimeEntryData) =>
  fetchApi<TimeEntry>('/time-entries', { method: 'POST', body: JSON.stringify(data) });

// Invoices
export const getInvoices = (params?: Record<string, string | number | boolean | undefined>) =>
  fetchApi<Invoice[]>('/invoices', { params });

export const getInvoice = (id: number | string) =>
  fetchApi<Invoice>(`/invoices/${id}`);

export const createInvoice = (data: CreateInvoiceData) =>
  fetchApi<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) });

// Sessions
export const getSessions = (params?: Record<string, string | number | boolean | undefined>) =>
  fetchApi<Session[]>('/sessions', { params });

// KPIs
export const getKpis = (params?: Record<string, string | number | boolean | undefined>) =>
  fetchApi<KPI[]>('/kpis', { params });

// Auth
export const login = (email: string, password: string) =>
  fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (data: { email: string; password: string; first_name: string; last_name: string }) =>
  fetchApi<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// AI Agent
export const getAgentResponse = (message: string, agentType?: string) => {
  const agentUrl = window.location.origin + '/agents/chat';
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(agentUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, agent_type: agentType }),
  }).then(res => {
    if (!res.ok) throw new ApiError('Agent request failed', res.status);
    return res.json() as Promise<AgentResponse>;
  });
};

// Types
export interface DashboardStats {
  total_revenue: number;
  active_projects: number;
  active_clients: number;
  billable_hours_this_month: number;
  outstanding_invoices: number;
  avg_satisfaction: number;
  revenue_trend: number;
  projects_trend: number;
  clients_trend: number;
  hours_trend: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  target: number;
}

export interface ProjectStatusData {
  status: string;
  count: number;
}

export interface ConsultantUtilizationData {
  name: string;
  billable_hours: number;
  total_hours: number;
  utilization: number;
}

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface Client {
  id: number;
  company_name: string;
  industry: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  country: string;
  total_revenue: number;
  created_at: string;
}

export interface ClientDetail extends Client {
  address: string;
  notes: string;
  projects: Project[];
  invoices: Invoice[];
  kpis: KPI[];
  sessions: Session[];
}

export interface CreateClientData {
  company_name: string;
  industry: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
}

export interface Project {
  id: number;
  name: string;
  client_id: number;
  client_name: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  description: string;
  created_at: string;
}

export interface ProjectDetail extends Project {
  time_entries: TimeEntry[];
  invoices: Invoice[];
  consultants: Consultant[];
}

export interface CreateProjectData {
  name: string;
  client_id: number;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  budget: number;
  description: string;
}

export interface Consultant {
  id: number;
  name: string;
  email: string;
  expertise: string;
  seniority: string;
  hourly_rate: number;
  is_active: boolean;
  utilization: number;
  total_hours: number;
  billable_hours: number;
  created_at: string;
}

export interface CreateConsultantData {
  name: string;
  email: string;
  expertise: string;
  seniority: string;
  hourly_rate: number;
  is_active: boolean;
}

export interface TimeEntry {
  id: number;
  project_id: number;
  project_name: string;
  consultant_id: number;
  consultant_name: string;
  date: string;
  hours: number;
  description: string;
  is_billable: boolean;
  created_at: string;
}

export interface CreateTimeEntryData {
  project_id: number;
  consultant_id: number;
  date: string;
  hours: number;
  description: string;
  is_billable: boolean;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name: string;
  project_id: number;
  project_name: string;
  status: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
}

export interface CreateInvoiceData {
  client_id: number;
  project_id: number;
  amount: number;
  tax_amount: number;
  issue_date: string;
  due_date: string;
}

export interface Session {
  id: number;
  client_id: number;
  client_name: string;
  project_id: number;
  project_name: string;
  consultant_id: number;
  consultant_name: string;
  session_date: string;
  duration_hours: number;
  session_type: string;
  notes: string;
  satisfaction_rating: number | null;
}

export interface KPI {
  id: number;
  client_id: number;
  client_name: string;
  name: string;
  category: string;
  baseline_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  measurement_date: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface AgentResponse {
  response: string;
  agent_type: string;
  metadata?: Record<string, unknown>;
}
