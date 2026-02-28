import { useState } from 'react';
import { useExpenses, useAddExpense } from '@/hooks/useSheetData';
import { formatCurrency } from '@/lib/format';
import { Plus, Loader2, TrendingDown } from 'lucide-react';
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from '@/types/school';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const addMutation = useAddExpense();
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const sorted = [...expenses].reverse();
  const total = expenses.reduce((s, e) => s + (Number(e.Amount) || 0), 0);

  const byCategory: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.Category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + (Number(e.Amount) || 0);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-float-in">
      {/* Total */}
      <div className="bg-card rounded-2xl p-5 neu-float animate-float-in text-center" style={{ animationDelay: '0ms' }}>
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-2xl font-extrabold text-destructive tracking-tight">{formatCurrency(total)}</p>
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Total Expenses</p>
      </div>

      {/* Category breakdown */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {Object.entries(byCategory).map(([cat, amt], i) => (
          <div key={cat} className="flex-shrink-0 bg-card rounded-2xl px-4 py-3 min-w-[110px] neu-raised-sm animate-float-in" style={{ animationDelay: `${(i + 1) * 60}ms` }}>
            <p className="text-[10px] text-muted-foreground truncate font-medium">{cat}</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(amt)}</p>
          </div>
        ))}
      </div>

      {/* Expense List */}
      <div className="space-y-2.5">
        {sorted.map((e, i) => (
          <div key={i} className="bg-card rounded-2xl p-4 neu-raised-sm flex items-center justify-between animate-float-in" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-destructive">{(e.Category || '?').charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{e.Description}</p>
                <p className="text-[10px] text-muted-foreground">
                  {e.Category} · {e['Payment Mode'] || 'N/A'} · {e.Date}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-destructive ml-3">{formatCurrency(Number(e.Amount))}</p>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="bg-card rounded-2xl p-8 neu-raised-sm text-center">
            <p className="text-sm text-muted-foreground">No expenses recorded</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 z-20 h-14 w-14 rounded-2xl bg-primary flex items-center justify-center neu-glow active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>

      <AddExpenseDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={async (data) => {
          try {
            await addMutation.mutateAsync(data);
            toast({ title: 'Expense added' });
            setShowAdd(false);
          } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
          }
        }}
        isLoading={addMutation.isPending}
      />
    </div>
  );
}

function AddExpenseDialog({ open, onClose, onAdd, isLoading }: {
  open: boolean; onClose: () => void;
  onAdd: (data: Record<string, any>) => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '', description: '', amount: '', paymentMode: 'Cash', approvedBy: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.amount || !form.approvedBy) return;
    onAdd({
      Date: form.date,
      Category: form.category,
      Description: form.description.trim(),
      Amount: Number(form.amount),
      'Payment Mode': form.paymentMode,
      'Approved By': form.approvedBy.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg font-extrabold">Add Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs font-semibold">Date *</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Category *</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Description *</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Amount (₹) *</Label>
            <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min={1} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Payment Mode</Label>
            <Select value={form.paymentMode} onValueChange={v => setForm(f => ({ ...f, paymentMode: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Approved By *</Label>
            <Input value={form.approvedBy} onChange={e => setForm(f => ({ ...f, approvedBy: e.target.value }))} required className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
