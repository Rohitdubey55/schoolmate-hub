import { useState, useEffect } from 'react';
import { useConfig, useUpdateConfig, useBalances, useUpdateBalance } from '@/hooks/useSheetData';
import { ArrowLeft, Save, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CLASS_LIST } from '@/types/school';
import { formatCurrency } from '@/lib/format';

export default function SettingsPage() {
  const { data: config = [], isLoading } = useConfig();
  const { data: balances = [] } = useBalances();
  const updateConfig = useUpdateConfig();
  const updateBalance = useUpdateBalance();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getVal = (key: string) => String(config.find(c => c.Key === key)?.Value || '');

  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [feeTuition, setFeeTuition] = useState<Record<string, number>>({});
  const [feeVan, setFeeVan] = useState<Record<string, number>>({});
  const [feeExam, setFeeExam] = useState<Record<string, number>>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (config.length === 0) return;
    setSchoolName(getVal('school_name'));
    setSchoolAddress(getVal('school_address'));
    setAcademicYear(getVal('academic_year'));
    try { setFeeTuition(JSON.parse(getVal('fee_tuition') || '{}')); } catch { setFeeTuition({}); }
    try { setFeeVan(JSON.parse(getVal('fee_van') || '{}')); } catch { setFeeVan({}); }
    try { setFeeExam(JSON.parse(getVal('fee_exam') || '{}')); } catch { setFeeExam({}); }
  }, [config]);

  const handleSave = async (key: string, value: string) => {
    try {
      await updateConfig.mutateAsync({ Key: key, Value: value });
      toast({ title: `${key} updated` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleAutoUpdateBalances = async () => {
    if (!confirm('This will add monthly tuition + van fees to all student balances. Continue?')) return;
    setUpdating(true);
    let success = 0;
    let failed = 0;

    for (const bal of balances) {
      try {
        const cls = bal.Class || '';
        const vanRoute = bal['Van Route'] || '';
        const tuitionAdd = feeTuition[cls] || 0;
        const vanAdd = feeVan[vanRoute] || 0;
        const monthlyAdd = tuitionAdd + vanAdd;

        if (monthlyAdd === 0) continue;

        const currentFee = Number(bal['Fee\nDec. to\nMarch']) || 0;
        const currentVan = Number(bal['Van\nFee Upto\nMarch']) || 0;
        const currentTotal = Number(bal.Total) || 0;
        const currentRec = Number(bal['Rec.']) || 0;

        const newFee = currentFee + tuitionAdd;
        const newVan = currentVan + vanAdd;
        const newTotal = currentTotal + monthlyAdd;
        const newBalance = newTotal - currentRec;

        await updateBalance.mutateAsync({
          id: bal.id,
          'Fee\nDec. to\nMarch': newFee,
          'Van\nFee Upto\nMarch': newVan,
          Total: newTotal,
          Balance: newBalance,
          UpdatedAt: new Date().toISOString(),
        });
        success++;
      } catch {
        failed++;
      }
    }

    setUpdating(false);
    toast({
      title: 'Monthly Update Complete',
      description: `Updated ${success} students${failed > 0 ? `, ${failed} failed` : ''}`,
    });
  };

  const handleClearCache = () => {
    if (!confirm('This will clear all cached data and reload the app. Continue?')) return;
    // Clear localStorage
    localStorage.clear();
    // Clear sessionStorage
    sessionStorage.clear();
    // Reload the page
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-float-in">
      {/* Header */}
      <div className="bg-card mx-4 mt-4 rounded-2xl p-5 neu-float">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground text-sm mb-2 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Settings</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Clear Cache */}
        <section className="bg-card rounded-2xl p-4 space-y-3 neu-raised border border-destructive/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-destructive">Clear Cache & Restart</h3>
          <p className="text-[10px] text-muted-foreground">
            Clear all cached data and reload the app. This will refresh all data from the server.
          </p>
          <Button
            onClick={handleClearCache}
            variant="destructive"
            className="w-full rounded-xl h-11 font-bold"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear Cache & Restart
          </Button>
        </section>

        {/* General Settings */}
        <section className="bg-card rounded-2xl p-4 space-y-3 neu-raised">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General</h3>
          <SettingField label="School Name" value={schoolName} onChange={setSchoolName}
            onSave={() => handleSave('school_name', schoolName)} saving={updateConfig.isPending} />
          <SettingField label="School Address" value={schoolAddress} onChange={setSchoolAddress}
            onSave={() => handleSave('school_address', schoolAddress)} saving={updateConfig.isPending} />
          <SettingField label="Academic Year" value={academicYear} onChange={setAcademicYear}
            onSave={() => handleSave('academic_year', academicYear)} saving={updateConfig.isPending} placeholder="2025-26" />
        </section>

        {/* Auto Monthly Balance Update */}
        <section className="bg-card rounded-2xl p-4 space-y-3 neu-glow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Fee Update</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Add one month's tuition + van fee to all student balances
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-3 neu-inset bg-background">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2">Preview per student (based on class & van route):</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CLASS_LIST.slice(0, 4).map(c => (
                <div key={c} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{c}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(feeTuition[c] || 0)}/mo</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAutoUpdateBalances}
            disabled={updating}
            className="w-full rounded-xl h-11 font-bold"
            variant="default"
          >
            {updating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating {balances.length} students...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Apply Monthly Fees to All Students</>
            )}
          </Button>
        </section>

        {/* Tuition Fee Structure */}
        <section className="bg-card rounded-2xl p-4 space-y-3 neu-raised">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tuition Fee (per class)</h3>
            <Button size="sm" className="rounded-xl" onClick={() => handleSave('fee_tuition', JSON.stringify(feeTuition))} disabled={updateConfig.isPending}>
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CLASS_LIST.map(c => (
              <div key={c} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-semibold">{c}</span>
                <Input
                  type="number"
                  value={feeTuition[c] || ''}
                  onChange={e => setFeeTuition(f => ({ ...f, [c]: Number(e.target.value) }))}
                  className="h-8 text-xs rounded-xl"
                  placeholder="₹"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Van Fee Structure */}
        <section className="bg-card rounded-2xl p-4 space-y-3 neu-raised">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Van Fee (per route)</h3>
            <Button size="sm" className="rounded-xl" onClick={() => handleSave('fee_van', JSON.stringify(feeVan))} disabled={updateConfig.isPending}>
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
          {Object.entries(feeVan).map(([route, amount]) => (
            <div key={route} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0 font-semibold">{route}</span>
              <Input
                type="number"
                value={amount || ''}
                onChange={e => setFeeVan(f => ({ ...f, [route]: Number(e.target.value) }))}
                className="h-8 text-xs rounded-xl"
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input placeholder="New route name" className="h-8 text-xs rounded-xl" id="new-route" />
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
              const input = document.getElementById('new-route') as HTMLInputElement;
              if (input?.value) {
                setFeeVan(f => ({ ...f, [input.value]: 0 }));
                input.value = '';
              }
            }}>Add</Button>
          </div>
        </section>

        {/* Exam Fee Structure */}
        <section className="bg-card rounded-2xl p-4 space-y-3 neu-raised">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Fee (per class)</h3>
            <Button size="sm" className="rounded-xl" onClick={() => handleSave('fee_exam', JSON.stringify(feeExam))} disabled={updateConfig.isPending}>
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CLASS_LIST.map(c => (
              <div key={c} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-semibold">{c}</span>
                <Input
                  type="number"
                  value={feeExam[c] || ''}
                  onChange={e => setFeeExam(f => ({ ...f, [c]: Number(e.target.value) }))}
                  className="h-8 text-xs rounded-xl"
                  placeholder="₹"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingField({ label, value, onChange, onSave, saving, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  onSave: () => void; saving: boolean; placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl" />
        <Button size="sm" className="rounded-xl" onClick={onSave} disabled={saving}>
          <Save className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
