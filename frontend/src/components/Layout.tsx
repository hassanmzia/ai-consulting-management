import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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

  // Prevent body scrolling when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
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
          'fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: '#1e293b' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
               style={{ backgroundColor: '#3b82f6' }}>
            CP
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">ConsultPro</span>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} className="transition-transform duration-200" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-500/20 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={isActive ? 'text-blue-400' : ''} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10 sticky bottom-0 bg-inherit shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                 style={{ backgroundColor: '#3b82f6' }}>
              {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AU'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name || 'Admin User'}</p>
              <p className="text-xs text-slate-400 truncate">{user.role || 'Administrator'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 sticky top-0 z-30">
          <button
            className="lg:hidden mr-4 text-slate-600 hover:text-slate-900 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} className="transition-transform duration-200" />
          </button>
          <h1 className="text-xl font-semibold text-slate-900 truncate min-w-0">{getPageTitle()}</h1>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{user.email || 'admin@consultpro.com'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#f8fafc' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
