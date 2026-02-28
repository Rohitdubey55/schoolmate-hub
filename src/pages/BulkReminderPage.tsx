import { useState, useMemo } from 'react';
import { useBalances, useStudents, useConfig } from '@/hooks/useSheetData';
import { formatCurrency } from '@/lib/format';
import { ArrowLeft, MessageCircle, CheckSquare, Square, Loader2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWhatsAppUrl, buildFeeReminderMessage } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CLASS_LIST } from '@/types/school';

export default function BulkReminderPage() {
  const { data: balances = [], isLoading: loadingBal } = useBalances();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: config = [] } = useConfig();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filterClass, setFilterClass] = useState('all');
  const [sending, setSending] = useState(false);

  const schoolName = String(config.find(c => c.Key === 'school_name')?.Value || 'K D Memorial');
  const academicYear = String(config.find(c => c.Key === 'academic_year')?.Value || '2025-26');

  const eligibleStudents = useMemo(() => {
    return balances
      .filter(b => (Number(b.Balance) || 0) > 0)
      .map(b => {
        const student = students.find(s => s['Roll No.'] === b['Roll No.']);
        const phone = String(student?.Mobile || '').replace(/\D/g, '');
        return {
          rollNo: b['Roll No.'],
          name: b['Student Name'],
          className: b.Class,
          balance: Number(b.Balance) || 0,
          fatherName: student?.['Father Name'] || '',
          phone: phone.length === 10 ? phone : '',
          hasPhone: phone.length === 10,
        };
      })
      .filter(s => s.hasPhone)
      .filter(s => filterClass === 'all' || s.className === filterClass)
      .sort((a, b) => b.balance - a.balance);
  }, [balances, students, filterClass]);

  const classes = [...new Set(balances.filter(b => (Number(b.Balance) || 0) > 0).map(b => b.Class).filter(Boolean))].sort((a, b) => {
    const order = CLASS_LIST as readonly string[];
    return order.indexOf(a) - order.indexOf(b);
  });

  const toggleAll = () => {
    if (selected.size === eligibleStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligibleStudents.map(s => s.rollNo)));
    }
  };

  const toggle = (rollNo: number) => {
    const next = new Set(selected);
    if (next.has(rollNo)) next.delete(rollNo);
    else next.add(rollNo);
    setSelected(next);
  };

  const handleSendBulk = async () => {
    const toSend = eligibleStudents.filter(s => selected.has(s.rollNo));
    if (toSend.length === 0) { toast({ title: 'Select at least one student' }); return; }
    
    setSending(true);
    let sent = 0;
    for (const s of toSend) {
      const msg = buildFeeReminderMessage(schoolName, s.name, s.fatherName, s.className, s.balance, academicYear);
      const url = getWhatsAppUrl(s.phone, msg);
      if (url) {
        window.open(url, '_blank');
        sent++;
        await new Promise(r => setTimeout(r, 800));
      }
    }
    setSending(false);
    toast({ title: `Opened ${sent} WhatsApp reminders` });
  };

  if (loadingBal || loadingStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-float-in">
      {/* Header */}
      <div className="bg-card mx-4 mt-4 rounded-2xl p-5 neu-float">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm mb-3 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">Bulk Reminders</h1>
            <p className="text-[10px] text-muted-foreground">Students with pending fees & phone numbers</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Class Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
          <ChipButton active={filterClass === 'all'} onClick={() => setFilterClass('all')}>All</ChipButton>
          {classes.map(c => (
            <ChipButton key={c} active={filterClass === c} onClick={() => setFilterClass(c)}>{c}</ChipButton>
          ))}
        </div>

        {/* Select All */}
        <div className="flex items-center justify-between bg-card rounded-2xl p-3 neu-raised-sm">
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {selected.size === eligibleStudents.length && eligibleStudents.length > 0 ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : (
              <Square className="h-5 w-5 text-muted-foreground" />
            )}
            Select All ({eligibleStudents.length})
          </button>
          <span className="text-xs text-muted-foreground font-medium">{selected.size} selected</span>
        </div>

        {/* Student List */}
        <div className="space-y-2.5">
          {eligibleStudents.map((s, i) => (
            <button
              key={s.rollNo}
              onClick={() => toggle(s.rollNo)}
              className={`w-full bg-card rounded-2xl p-4 flex items-center gap-3 text-left transition-all neu-raised-sm animate-float-in ${selected.has(s.rollNo) ? 'neu-glow' : ''}`}
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              {selected.has(s.rollNo) ? (
                <CheckSquare className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">Roll #{s.rollNo} · {s.className} · {s.fatherName}</p>
              </div>
              <p className="text-sm font-bold text-destructive flex-shrink-0">{formatCurrency(s.balance)}</p>
            </button>
          ))}
          {eligibleStudents.length === 0 && (
            <div className="bg-card rounded-2xl p-8 neu-raised-sm text-center">
              <p className="text-sm text-muted-foreground">No eligible students found</p>
            </div>
          )}
        </div>

        {/* Send Button */}
        {selected.size > 0 && (
          <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
            <Button onClick={handleSendBulk} disabled={sending} className="w-full h-12 text-base font-bold rounded-2xl neu-glow">
              {sending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
              Send to {selected.size} Students
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${active ? 'bg-primary text-primary-foreground neu-raised-sm' : 'bg-card text-muted-foreground neu-raised-sm'}`}
    >
      {children}
    </button>
  );
}
