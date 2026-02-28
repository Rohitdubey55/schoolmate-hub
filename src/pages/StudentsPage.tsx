import { useState } from 'react';
import { useStudents, useAddStudent } from '@/hooks/useSheetData';
import { Search, Plus, Loader2, ChevronRight } from 'lucide-react';
import { CLASS_LIST } from '@/types/school';
import type { StudentRow } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function StudentsPage() {
  const { data: students = [], isLoading } = useStudents();
  const addStudentMutation = useAddStudent();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const classes = [...new Set(students.map(s => s.Class).filter(Boolean))].sort((a, b) => {
    const order = CLASS_LIST as readonly string[];
    return order.indexOf(a) - order.indexOf(b);
  });

  const filtered = students
    .filter(s => filterClass === 'all' || s.Class === filterClass)
    .filter(s =>
      (s['Student Name'] || '').toLowerCase().includes(search.toLowerCase()) ||
      String(s['Roll No.']).includes(search) ||
      (s['Father Name'] || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a['Roll No.'] || 0) - (b['Roll No.'] || 0));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-float-in">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, roll no..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none neu-inset font-medium"
        />
      </div>

      {/* Class Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        <FilterChip label="All" count={students.length} active={filterClass === 'all'} onClick={() => setFilterClass('all')} />
        {classes.map(c => (
          <FilterChip key={c} label={c} count={students.filter(s => s.Class === c).length} active={filterClass === c} onClick={() => setFilterClass(c)} />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{filtered.length} students</p>

      {/* Student List */}
      <div className="space-y-2.5">
        {filtered.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              const rollValue = s['Roll No.'];
              navigate(`/students/${rollValue}`);
            }}
            className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 neu-raised-sm neu-hover text-left animate-float-in"
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{(s['Student Name'] || '?').charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{s['Student Name']}</p>
              <p className="text-[10px] text-muted-foreground">Roll #{s['Roll No.']} · {s.Class} · {s['Father Name']}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 z-20 h-14 w-14 rounded-2xl bg-primary flex items-center justify-center neu-glow active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>

      <AddStudentDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={async (data) => {
          try {
            await addStudentMutation.mutateAsync(data);
            toast({ title: 'Student added successfully' });
            setShowAdd(false);
          } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
          }
        }}
        isLoading={addStudentMutation.isPending}
      />
    </div>
  );
}

function FilterChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
        active ? 'bg-primary text-primary-foreground neu-raised-sm' : 'bg-card text-muted-foreground neu-raised-sm'
      }`}
    >
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  );
}

function AddStudentDialog({ open, onClose, onAdd, isLoading }: {
  open: boolean; onClose: () => void;
  onAdd: (data: Record<string, any>) => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    rollNo: '', class: '', studentName: '', fatherName: '', mobile: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rollNo || !form.class || !form.studentName || !form.fatherName) return;
    onAdd({
      'Roll No.': Number(form.rollNo),
      Class: form.class,
      'Student Name': form.studentName.trim(),
      'Father Name': form.fatherName.trim(),
      Mobile: form.mobile,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg font-extrabold">Add Student</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Roll No. *</Label>
              <Input type="number" value={form.rollNo} onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))} required className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Class *</Label>
              <Select value={form.class} onValueChange={v => setForm(f => ({ ...f, class: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CLASS_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">Student Name *</Label>
            <Input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} required className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Father's Name *</Label>
            <Input value={form.fatherName} onChange={e => setForm(f => ({ ...f, fatherName: e.target.value }))} required className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Mobile</Label>
            <Input type="tel" maxLength={10} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Student
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
