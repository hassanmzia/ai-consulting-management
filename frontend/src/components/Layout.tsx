import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCog,
  Clock,
  FileText,
  BarChart3,
  Briefcase,
  Bot,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/consultants', label: 'Consultants', icon: UserCog },
  { path: '/time-tracking', label: 'Time Tracking', icon: Clock },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/kpis', label: 'KPIs', icon: BarChart3 },
  { path: '/portfolios', label: 'Portfolios', icon: Briefcase },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/projects': 'Projects',
  '/consultants': 'Consultants',
  '/time-tracking': 'Time Tracking',
  '/invoices': 'Invoices',
  '/kpis': 'KPI Tracking',
  '/portfolios': 'Consulting Portfolios',
  '/ai-assistant': 'AI Assistant',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Admin User","email":"admin@consultpro.com","role":"admin"}');

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    if (path.startsWith('/clients/')) return 'Client Detail';
    if (path.startsWith('/projects/')) return 'Project Detail';
    return 'ConsultPro';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AU';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            CP
          </div>
          <div>
            <span className="text-gray-900 text-sm font-semibold">ConsultPro</span>
            <span className="block text-[10px] text-gray-400 font-medium">Management Platform</span>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Menu</p>
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Admin User'}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user.role || 'Admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 shrink-0 z-30">
          <button
            className="lg:hidden mr-3 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                {initials}
              </div>
              <span className="text-sm text-gray-600">{user.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
