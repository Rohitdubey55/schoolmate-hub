import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, IndianRupee, Receipt, UserCog, Bus, Settings, MessageCircle } from 'lucide-react';
import { useConfig } from '@/hooks/useSheetData';

const tabs = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/students', label: 'Students', icon: Users },
  { path: '/fees', label: 'Fees', icon: IndianRupee },
  { path: '/van', label: 'Van', icon: Bus },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/staff', label: 'Staff', icon: UserCog },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: config = [] } = useConfig();

  const schoolName = String(config.find(c => c.Key === 'school_name')?.Value || 'K D Memorial');
  const academicYear = String(config.find(c => c.Key === 'academic_year')?.Value || '2025-26');

  const hideNav = ['/settings', '/bulk-reminder'].some(p => location.pathname.startsWith(p)) ||
    location.pathname.match(/^\/students\/\d+/);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      {!hideNav && (
        <header className="sticky top-0 z-30 bg-primary px-5 py-4 safe-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-primary-foreground tracking-tight">{schoolName}</h1>
              <p className="text-[11px] text-primary-foreground/60 font-medium">{academicYear}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/bulk-reminder')}
                className="h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center active:bg-primary-foreground/20 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center active:bg-primary-foreground/20 transition-colors"
              >
                <Settings className="h-5 w-5 text-primary-foreground" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 overflow-y-auto ${hideNav ? '' : 'pb-24'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 safe-bottom">
          <div className="mx-3 mb-2 bg-card rounded-2xl neu-float">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
              {tabs.map(tab => {
                const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                    <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
