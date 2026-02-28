import { useStudents, useBalances, useTransactions, useExpenses, useStaff, useConfig } from '@/hooks/useSheetData';
import { formatCurrency } from '@/lib/format';
import { Users, IndianRupee, TrendingDown, AlertTriangle, ArrowUpRight, Loader2, Wallet, UserCog, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: balances = [], isLoading: loadingBalances } = useBalances();
  const { data: transactions = [], isLoading: loadingTxns } = useTransactions();
  const { data: expenses = [] } = useExpenses();
  const { data: staff = [] } = useStaff();
  const { data: config = [] } = useConfig();
  const navigate = useNavigate();

  const isLoading = loadingStudents || loadingBalances || loadingTxns;

  const schoolName = config.find(c => c.Key === 'school_name')?.Value || 'K D Memorial';
  const academicYear = config.find(c => c.Key === 'academic_year')?.Value || '2025-26';

  const activeStudents = students.length;
  const totalCollected = transactions.reduce((s, t) => s + (Number(t.Amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.Amount) || 0), 0);
  const totalOutstanding = balances.reduce((s, b) => s + Math.max(0, Number(b.Balance) || 0), 0);
  const studentsWithDues = balances.filter(b => (Number(b.Balance) || 0) > 0).length;
  const activeStaff = staff.filter(s => s.Status !== 'Left').length;
  const netIncome = totalCollected - totalExpenses;

  // Monthly chart data
  const monthlyData = getMonthlyData(transactions, expenses);

  // Class-wise fee summary
  const classSummary = getClassSummary(balances);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const topDues = [...balances]
    .filter(b => (Number(b.Balance) || 0) > 0)
    .sort((a, b) => (Number(b.Balance) || 0) - (Number(a.Balance) || 0))
    .slice(0, 5);

  return (
    <div className="p-4 space-y-4">
      {/* Hero KPI Bento Grid */}
      <div className="bento-grid">
        {/* Net Income — spans full width */}
        <div
          className="bento-span-2 bg-card rounded-2xl p-5 neu-float animate-float-in cursor-pointer"
          onClick={() => navigate('/fees')}
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Net Income</span>
          </div>
          <p className={`text-3xl font-extrabold tracking-tight ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(netIncome)}
          </p>
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Collected</p>
              <p className="text-sm font-bold text-success">{formatCurrency(totalCollected)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Expenses</p>
              <p className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        {/* Students */}
        <BentoKpi
          icon={<Users className="h-5 w-5" />}
          label="Students"
          value={String(activeStudents)}
          color="primary"
          onClick={() => navigate('/students')}
          delay={80}
        />

        {/* Outstanding */}
        <BentoKpi
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle={`${studentsWithDues} pending`}
          color="accent"
          onClick={() => navigate('/fees')}
          delay={160}
        />

        {/* Staff */}
        <BentoKpi
          icon={<UserCog className="h-5 w-5" />}
          label="Active Staff"
          value={String(activeStaff)}
          color="primary"
          onClick={() => navigate('/staff')}
          delay={240}
        />

        {/* Transactions */}
        <BentoKpi
          icon={<CalendarDays className="h-5 w-5" />}
          label="Transactions"
          value={String(transactions.length)}
          color="success"
          onClick={() => navigate('/fees')}
          delay={320}
        />
      </div>

      {/* Monthly Collection Chart */}
      {monthlyData.length > 0 && (
        <section className="bg-card rounded-2xl p-4 neu-raised animate-float-in" style={{ animationDelay: '200ms' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Monthly Overview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: 'var(--shadow-neu-raised)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="collected" name="Collected" radius={[6, 6, 0, 0]} fill="hsl(var(--success))" />
                <Bar dataKey="expenses" name="Expenses" radius={[6, 6, 0, 0]} fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <span className="text-[10px] text-muted-foreground font-medium">Collected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="text-[10px] text-muted-foreground font-medium">Expenses</span>
            </div>
          </div>
        </section>
      )}

      {/* Class-wise Fee Summary */}
      {classSummary.length > 0 && (
        <section className="bg-card rounded-2xl p-4 neu-raised animate-float-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fee by Class</h3>
          </div>
          <div className="space-y-2">
            {classSummary.map((cs) => {
              const pct = cs.total > 0 ? Math.min(100, (cs.collected / cs.total) * 100) : 0;
              return (
                <div key={cs.className} className="rounded-xl p-3 neu-raised-sm bg-card">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{cs.className}</span>
                    <span className="text-[10px] text-muted-foreground">{cs.count} students</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct > 75 ? 'hsl(var(--success))' : pct > 40 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-success font-medium">{formatCurrency(cs.collected)}</span>
                    <span className="text-[10px] text-destructive font-medium">{formatCurrency(cs.pending)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Outstanding Dues */}
      <section className="animate-float-in" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Outstanding</h3>
          <button onClick={() => navigate('/fees')} className="text-xs text-primary font-semibold flex items-center gap-0.5">
            View all <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {topDues.map((b, i) => (
            <button
              key={i}
              onClick={() => navigate(`/students/${b['Roll No.']}`)}
              className="w-full bg-card rounded-xl p-3 neu-raised-sm neu-hover text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-destructive">{(b['Student Name'] || '?').charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b['Student Name']}</p>
                    <p className="text-[10px] text-muted-foreground">Roll #{b['Roll No.']} · {b.Class}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-destructive">{formatCurrency(Number(b.Balance))}</p>
              </div>
            </button>
          ))}
          {topDues.length === 0 && (
            <div className="bg-card rounded-xl p-6 neu-raised-sm text-center">
              <p className="text-sm text-success font-medium">All fees collected! 🎉</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Payments */}
      {transactions.length > 0 && (
        <section className="animate-float-in" style={{ animationDelay: '500ms' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Payments</h3>
          <div className="space-y-2">
            {transactions.slice(-5).reverse().map((txn, i) => {
              const student = students.find(s => s['Roll No.'] === txn['Roll No.']);
              return (
                <div key={i} className="bg-card rounded-xl p-3 neu-raised-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                      <IndianRupee className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{student?.['Student Name'] || `Roll #${txn['Roll No.']}`}</p>
                      <p className="text-[10px] text-muted-foreground">{txn['Receipt No.']} · {txn.Mode} · {txn.Date}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-success">{formatCurrency(Number(txn.Amount))}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function BentoKpi({ icon, label, value, subtitle, color, onClick, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string; subtitle?: string;
  color: 'primary' | 'success' | 'destructive' | 'accent'; onClick?: () => void; delay?: number;
}) {
  const bgMap = {
    primary: 'bg-primary/10',
    success: 'bg-success/10',
    destructive: 'bg-destructive/10',
    accent: 'bg-accent/10',
  };
  const textMap = {
    primary: 'text-primary',
    success: 'text-success',
    destructive: 'text-destructive',
    accent: 'text-accent',
  };

  return (
    <button
      onClick={onClick}
      className="bg-card rounded-2xl p-4 text-left neu-raised neu-hover animate-float-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`h-10 w-10 rounded-xl ${bgMap[color]} flex items-center justify-center mb-3`}>
        <div className={textMap[color]}>{icon}</div>
      </div>
      <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground font-medium mt-1">{label}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </button>
  );
}

function getMonthlyData(transactions: any[], expenses: any[]) {
  const months: Record<string, { collected: number; expenses: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  transactions.forEach(t => {
    const d = new Date(t.Date || t.CreatedAt);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!months[key]) months[key] = { collected: 0, expenses: 0 };
    months[key].collected += Number(t.Amount) || 0;
  });

  expenses.forEach(e => {
    const d = new Date(e.Date || e.CreatedAt);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!months[key]) months[key] = { collected: 0, expenses: 0 };
    months[key].expenses += Number(e.Amount) || 0;
  });

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => {
      const [, m] = key.split('-');
      return { month: monthNames[parseInt(m)], ...val };
    });
}

function getClassSummary(balances: any[]) {
  const map: Record<string, { total: number; collected: number; pending: number; count: number }> = {};
  balances.forEach(b => {
    const cls = b.Class || 'Unknown';
    if (!map[cls]) map[cls] = { total: 0, collected: 0, pending: 0, count: 0 };
    map[cls].total += Number(b.Total) || 0;
    map[cls].collected += Number(b['Rec.']) || 0;
    map[cls].pending += Math.max(0, Number(b.Balance) || 0);
    map[cls].count += 1;
  });
  return Object.entries(map)
    .map(([className, data]) => ({ className, ...data }))
    .sort((a, b) => b.pending - a.pending);
}
