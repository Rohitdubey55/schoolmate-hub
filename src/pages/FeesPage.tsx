import { useState } from 'react';
import { useStudents, useBalances, useTransactions, useAddTransaction } from '@/hooks/useSheetData';
import { formatCurrency } from '@/lib/format';
import { Search, IndianRupee, Loader2, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { PAYMENT_MODES, CLASS_LIST } from '@/types/school';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function FeesPage() {
  const { data: students = [] } = useStudents();
  const { data: balances = [], isLoading } = useBalances();
  const { data: transactions = [] } = useTransactions();
  const addTxnMutation = useAddTransaction();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showCollect, setShowCollect] = useState(false);
  const [tab, setTab] = useState<'balances' | 'history'>('balances');
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalCollected = transactions.reduce((s, t) => s + (Number(t.Amount) || 0), 0);
  const totalOutstanding = balances.reduce((s, b) => s + Math.max(0, Number(b.Balance) || 0), 0);

  const classes = [...new Set(balances.map(b => b.Class).filter(Boolean))].sort((a, b) => {
    const order = CLASS_LIST as readonly string[];
    return order.indexOf(a) - order.indexOf(b);
  });

  const filteredBalances = balances
    .filter(b => filterClass === 'all' || b.Class === filterClass)
    .filter(b =>
      (b['Student Name'] || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b['Roll No.']).includes(search)
    )
    .sort((a, b) => (Number(b.Balance) || 0) - (Number(a.Balance) || 0));

  const sortedTxns = [...transactions].reverse();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading fees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-float-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 neu-raised animate-float-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-success tracking-tight">{formatCurrency(totalCollected)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Collected</p>
        </div>
        <div className="bg-card rounded-2xl p-4 neu-raised animate-float-in" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-destructive tracking-tight">{formatCurrency(totalOutstanding)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Outstanding</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-card rounded-2xl p-1.5 neu-inset">
        <button
          onClick={() => setTab('balances')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${tab === 'balances' ? 'bg-card text-foreground neu-raised-sm' : 'text-muted-foreground'}`}
        >
          Balances ({balances.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${tab === 'history' ? 'bg-card text-foreground neu-raised-sm' : 'text-muted-foreground'}`}
        >
          History ({transactions.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search student..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none neu-inset font-medium"
        />
      </div>

      {/* Class Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        <FilterChip label="All" active={filterClass === 'all'} onClick={() => setFilterClass('all')} />
        {classes.map(c => (
          <FilterChip key={c} label={c} active={filterClass === c} onClick={() => setFilterClass(c)} />
        ))}
      </div>

      {tab === 'balances' ? (
        <div className="space-y-2.5">
          {filteredBalances.map((b, i) => {
            const bal = Number(b.Balance) || 0;
            const total = Number(b.Total) || 0;
            const rec = Number(b['Rec.']) || 0;
            const pct = total > 0 ? Math.min(100, (rec / total) * 100) : 0;
            return (
              <button
                key={i}
                onClick={() => navigate(`/students/${b['Roll No.']}`)}
                className="w-full bg-card rounded-2xl p-4 text-left neu-raised-sm neu-hover animate-float-in"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{(b['Student Name'] || '?').charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b['Student Name']}</p>
                      <p className="text-[10px] text-muted-foreground">Roll #{b['Roll No.']} · {b.Class}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${bal > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(bal)}
                  </p>
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
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-success font-medium">Paid: {formatCurrency(rec)}</span>
                  <span className="text-[10px] text-muted-foreground">of {formatCurrency(total)}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedTxns.map((txn, i) => {
            const student = students.find(s => s['Roll No.'] === txn['Roll No.']);
            return (
              <div
                key={i}
                className="bg-card rounded-2xl p-4 neu-raised-sm flex items-center justify-between animate-float-in"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
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
          {transactions.length === 0 && (
            <div className="bg-card rounded-2xl p-8 neu-raised-sm text-center">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCollect(true)}
        className="fixed bottom-20 right-4 z-20 h-14 px-5 rounded-2xl bg-primary flex items-center gap-2 neu-glow active:scale-95 transition-transform"
      >
        <IndianRupee className="h-5 w-5 text-primary-foreground" />
        <span className="text-sm font-bold text-primary-foreground">Collect</span>
      </button>

      <CollectFeeDialog
        open={showCollect}
        onClose={() => setShowCollect(false)}
        students={students}
        onAdd={async (data) => {
          try {
            await addTxnMutation.mutateAsync(data);
            toast({ title: 'Payment recorded' });
            setShowCollect(false);
          } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
          }
        }}
        isLoading={addTxnMutation.isPending}
      />
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
        active ? 'bg-primary text-primary-foreground neu-raised-sm' : 'bg-card text-muted-foreground neu-raised-sm'
      }`}
    >
      {label}
    </button>
  );
}

function CollectFeeDialog({ open, onClose, students, onAdd, isLoading }: {
  open: boolean; onClose: () => void;
  students: { 'Roll No.': number; 'Student Name': string; Class: string }[];
  onAdd: (data: Record<string, any>) => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    rollNo: '', amount: '', mode: 'Cash', remarks: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [classFilter, setClassFilter] = useState('all');

  const classes = [...new Set(students.map(s => s.Class).filter(Boolean))].sort((a, b) => {
    const order = CLASS_LIST as readonly string[];
    return order.indexOf(a) - order.indexOf(b);
  });

  const filteredStudents = classFilter === 'all' ? students : students.filter(s => s.Class === classFilter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rollNo || !form.amount) return;
    onAdd({
      Date: form.date,
      'Roll No.': Number(form.rollNo),
      Amount: Number(form.amount),
      Mode: form.mode,
      Remarks: form.remarks,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg font-extrabold">Collect Fee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs font-semibold">Filter by Class</Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Student *</Label>
            <Select value={form.rollNo} onValueChange={v => setForm(f => ({ ...f, rollNo: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {filteredStudents.map((s, i) => (
                  <SelectItem key={i} value={String(s['Roll No.'])}>
                    {s['Student Name']} (#{s['Roll No.']} · {s.Class})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Amount (₹) *</Label>
            <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min={1} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Mode</Label>
            <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Remarks</Label>
            <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Record Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
