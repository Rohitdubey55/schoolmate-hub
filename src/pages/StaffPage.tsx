import { useState } from 'react';
import { useStaff, useAddStaff, useUpdateStaff } from '@/hooks/useSheetData';
import { formatCurrency } from '@/lib/format';
import { Plus, Phone, Loader2, X, Save, Edit2, Users, Wallet } from 'lucide-react';
import { STAFF_ROLES } from '@/types/school';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { StaffRow } from '@/lib/api';

export default function StaffPage() {
  const { data: staff = [], isLoading } = useStaff();
  const addMutation = useAddStaff();
  const updateMutation = useUpdateStaff();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);
  const { toast } = useToast();

  const activeStaff = staff.filter(s => s.Status !== 'Left');
  const totalSalary = activeStaff.reduce((s, st) => s + (Number(st.Salary) || 0), 0);
  const totalAdvance = activeStaff.reduce((s, st) => s + (Number(st['Advance Taken']) || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-float-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 neu-raised animate-float-in" style={{ animationDelay: '0ms' }}>
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-extrabold text-primary tracking-tight">{formatCurrency(totalSalary)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Monthly Payroll</p>
        </div>
        <div className="bg-card rounded-2xl p-4 neu-raised animate-float-in" style={{ animationDelay: '80ms' }}>
          <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-extrabold text-accent tracking-tight">{formatCurrency(totalAdvance)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Total Advances</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{activeStaff.length} staff members</p>

      {/* Staff List */}
      <div className="space-y-2.5">
        {activeStaff.map((s, i) => (
          <button
            key={i}
            onClick={() => setSelectedStaff(s)}
            className="w-full bg-card rounded-2xl p-4 text-left neu-raised-sm neu-hover animate-float-in"
            style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{(s.Name || '?').charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.Name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.Role}</p>
                </div>
              </div>
              {s.Phone && (
                <a href={`tel:${s.Phone}`} onClick={e => e.stopPropagation()} className="h-9 w-9 rounded-xl bg-card flex items-center justify-center neu-raised-sm">
                  <Phone className="h-4 w-4 text-primary" />
                </a>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <p className="text-[10px] text-muted-foreground">Salary</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(Number(s.Salary) || 0)}</p>
              </div>
              {(Number(s['Advance Taken']) || 0) > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Advance</p>
                  <p className="text-sm font-bold text-accent">{formatCurrency(Number(s['Advance Taken']))}</p>
                </div>
              )}
            </div>
          </button>
        ))}
        {activeStaff.length === 0 && (
          <div className="bg-card rounded-2xl p-8 neu-raised-sm text-center">
            <p className="text-sm text-muted-foreground">No staff records</p>
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

      <AddStaffDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={async (data) => {
          try {
            await addMutation.mutateAsync(data);
            toast({ title: 'Staff added' });
            setShowAdd(false);
          } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
          }
        }}
        isLoading={addMutation.isPending}
      />

      {selectedStaff && (
        <StaffDetailSheet
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onUpdate={async (data) => {
            try {
              await updateMutation.mutateAsync(data);
              toast({ title: 'Staff updated' });
              setSelectedStaff(null);
            } catch (e: any) {
              toast({ title: 'Error', description: e.message, variant: 'destructive' });
            }
          }}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function StaffDetailSheet({ staff, onClose, onUpdate, isLoading }: {
  staff: StaffRow; onClose: () => void;
  onUpdate: (data: Record<string, any>) => void; isLoading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: staff.Name || '',
    role: staff.Role || '',
    salary: String(staff.Salary || ''),
    advanceTaken: String(staff['Advance Taken'] || '0'),
    phone: String(staff.Phone || ''),
    doj: staff.DOJ || '',
    status: staff.Status || 'Active',
  });

  const handleSave = () => {
    onUpdate({
      id: staff.id,
      Name: form.name.trim(),
      Role: form.role,
      Salary: Number(form.salary),
      'Advance Taken': Number(form.advanceTaken),
      Phone: form.phone,
      DOJ: form.doj,
      Status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground">{staff.Name}</h2>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="h-9 w-9 rounded-xl bg-card flex items-center justify-center neu-raised-sm"><X className="h-4 w-4 text-muted-foreground" /></button>
                <button onClick={handleSave} disabled={isLoading} className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center neu-raised-sm">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Save className="h-4 w-4 text-primary-foreground" />}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="h-9 w-9 rounded-xl bg-card flex items-center justify-center neu-raised-sm"><Edit2 className="h-4 w-4 text-muted-foreground" /></button>
                <button onClick={onClose} className="h-9 w-9 rounded-xl bg-card flex items-center justify-center neu-raised-sm"><X className="h-4 w-4 text-muted-foreground" /></button>
              </>
            )}
          </div>
        </div>
        <div className="space-y-1 text-sm">
          {[
            { label: 'Name', value: staff.Name, field: 'name' },
            { label: 'Role', value: staff.Role, field: 'role', type: 'select' },
            { label: 'Salary', value: formatCurrency(Number(staff.Salary) || 0), field: 'salary', type: 'number' },
            { label: 'Advance Taken', value: formatCurrency(Number(staff['Advance Taken']) || 0), field: 'advanceTaken', type: 'number' },
            { label: 'Phone', value: String(staff.Phone || '-'), field: 'phone', type: 'tel' },
            { label: 'Date of Joining', value: staff.DOJ || '-', field: 'doj', type: 'date' },
            { label: 'Status', value: staff.Status || 'Active', field: 'status' },
          ].map(d => (
            <div key={d.label} className="flex justify-between py-3 border-b border-border/50">
              <span className="text-muted-foreground">{d.label}</span>
              {editing ? (
                d.type === 'select' ? (
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger className="h-7 w-36 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{STAFF_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <input
                    type={d.type || 'text'}
                    value={(form as any)[d.field] || ''}
                    onChange={e => setForm(f => ({ ...f, [d.field]: e.target.value }))}
                    className="h-7 w-36 px-2 text-xs text-right rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                )
              ) : (
                <span className="font-semibold text-foreground text-right">{d.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddStaffDialog({ open, onClose, onAdd, isLoading }: {
  open: boolean; onClose: () => void;
  onAdd: (data: Record<string, any>) => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    name: '', role: '', salary: '', phone: '', doj: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.salary) return;
    onAdd({
      Name: form.name.trim(),
      Role: form.role,
      Salary: Number(form.salary),
      'Advance Taken': 0,
      Phone: form.phone,
      DOJ: form.doj,
      Status: 'Active',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg font-extrabold">Add Staff</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs font-semibold">Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Role *</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>{STAFF_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Monthly Salary (₹) *</Label>
            <Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} required min={0} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Phone</Label>
            <Input type="tel" maxLength={10} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Date of Joining</Label>
            <Input type="date" value={form.doj} onChange={e => setForm(f => ({ ...f, doj: e.target.value }))} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Staff
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
