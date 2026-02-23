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
  ChevronRight,
  Sparkles,
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

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AU';

  return (
    <div className="flex h-screen overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-[272px] flex flex-col transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-[72px] border-b border-white/[0.06]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            CP
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-white text-[15px] font-bold tracking-tight">ConsultPro</span>
            <span className="block text-[10px] text-indigo-300/60 font-medium tracking-wider uppercase">Enterprise</span>
          </div>
          <button
            className="ml-auto lg:hidden text-white/50 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Navigation</p>
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                      isActive
                        ? 'bg-indigo-500/15 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                        isActive ? 'bg-indigo-500/20' : 'bg-transparent group-hover:bg-white/[0.04]'
                      )}>
                        <item.icon size={18} className={clsx(isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300')} />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {item.path === '/ai-assistant' && (
                        <Sparkles size={12} className="text-indigo-400 opacity-60" />
                      )}
                      {isActive && (
                        <ChevronRight size={14} className="text-indigo-400/50" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/[0.06] sticky bottom-0 bg-inherit shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{user.name || 'Admin User'}</p>
              <p className="text-[11px] text-slate-500 truncate capitalize">{user.role || 'Administrator'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
        <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center px-6 shrink-0 sticky top-0 z-30">
          <button
            className="lg:hidden mr-4 w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all -ml-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate tracking-tight">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block">{user.email || 'admin@consultpro.com'}</span>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm hidden sm:flex"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#f1f5f9' }}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
