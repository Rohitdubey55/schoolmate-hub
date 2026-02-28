import { useState, useMemo } from 'react';
import { useBalances, useStudents } from '@/hooks/useSheetData';
import { formatCurrency } from '@/lib/format';
import { Search, Loader2, ChevronRight, Filter, SortAsc, SortDesc, Bus, Users, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SortKey = 'name' | 'vanFee' | 'class' | 'roll';

export default function VanStudentsPage() {
  const { data: balances = [], isLoading } = useBalances();
  const { data: students = [] } = useStudents();
  const [search, setSearch] = useState('');
  const [filterRoute, setFilterRoute] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const vanStudents = useMemo(() =>
    balances.filter(b => (Number(b['Van\nFee Upto\nMarch']) || 0) > 0),
    [balances]
  );

  const routes = useMemo(() =>
    [...new Set(vanStudents.map(b => {
      const student = students.find(s => s['Roll No.'] === b['Roll No.']);
      return student?.['Route No.'] || b['Van Route'] || 'Unknown';
    }).filter(Boolean))].sort(),
    [vanStudents, students]
  );

  const classes = useMemo(() =>
    [...new Set(vanStudents.map(b => b.Class).filter(Boolean))].sort(),
    [vanStudents]
  );

  const getRoute = (b: typeof vanStudents[0]) => {
    const student = students.find(s => s['Roll No.'] === b['Roll No.']);
    return student?.['Route No.'] || b['Van Route'] || 'Unknown';
  };

  const filtered = useMemo(() => {
    let list = vanStudents
      .filter(b => filterRoute === 'all' || getRoute(b) === filterRoute)
      .filter(b => filterClass === 'all' || b.Class === filterClass)
      .filter(b =>
        (b['Student Name'] || '').toLowerCase().includes(search.toLowerCase()) ||
        String(b['Roll No.']).includes(search)
      );

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = (a['Student Name'] || '').localeCompare(b['Student Name'] || ''); break;
        case 'vanFee': cmp = (Number(a['Van\nFee Upto\nMarch']) || 0) - (Number(b['Van\nFee Upto\nMarch']) || 0); break;
        case 'class': cmp = (a.Class || '').localeCompare(b.Class || ''); break;
        case 'roll': cmp = (a['Roll No.'] || 0) - (b['Roll No.'] || 0); break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [vanStudents, filterRoute, filterClass, search, sortBy, sortAsc, students]);

  const totalVanFee = filtered.reduce((s, b) => s + (Number(b['Van\nFee Upto\nMarch']) || 0), 0);
  const totalBalance = filtered.reduce((s, b) => s + (Number(b.Balance) || 0), 0);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(true); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl neu-raised bg-card flex items-center justify-center animate-pulse-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading van students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-float-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-card rounded-2xl p-3 text-center neu-raised animate-float-in" style={{ animationDelay: '0ms' }}>
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xl font-extrabold text-primary">{filtered.length}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Students</p>
        </div>
        <div className="bg-card rounded-2xl p-3 text-center neu-raised animate-float-in" style={{ animationDelay: '60ms' }}>
          <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-1.5">
            <Bus className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-sm font-extrabold text-accent">{formatCurrency(totalVanFee)}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Van Fee</p>
        </div>
        <div className="bg-card rounded-2xl p-3 text-center neu-raised animate-float-in" style={{ animationDelay: '120ms' }}>
          <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          </div>
          <p className="text-sm font-extrabold text-destructive">{formatCurrency(totalBalance)}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Total Due</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none neu-inset font-medium"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${showFilters ? 'bg-primary text-primary-foreground neu-glow' : 'bg-card text-muted-foreground neu-raised-sm'}`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-card rounded-2xl p-4 space-y-3 neu-raised-sm animate-float-in">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Class</p>
            <div className="flex gap-1.5 flex-wrap">
              <ChipButton active={filterClass === 'all'} onClick={() => setFilterClass('all')}>All</ChipButton>
              {classes.map(c => (
                <ChipButton key={c} active={filterClass === c} onClick={() => setFilterClass(c)}>{c}</ChipButton>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sort By</p>
            <div className="flex gap-1.5 flex-wrap">
              {([['name', 'Name'], ['roll', 'Roll No'], ['class', 'Class'], ['vanFee', 'Van Fee']] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl text-[11px] font-semibold transition-all ${sortBy === key ? 'bg-primary text-primary-foreground neu-raised-sm' : 'bg-card text-muted-foreground neu-raised-sm'}`}
                >
                  {label}
                  {sortBy === key && (sortAsc ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Route Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        <ChipButton active={filterRoute === 'all'} onClick={() => setFilterRoute('all')}>
          All Routes ({vanStudents.length})
        </ChipButton>
        {routes.map(r => (
          <ChipButton key={r} active={filterRoute === r} onClick={() => setFilterRoute(r)}>
            {r} ({vanStudents.filter(b => getRoute(b) === r).length})
          </ChipButton>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{filtered.length} students</p>

      {/* Student List */}
      <div className="space-y-2.5">
        {filtered.map((b, i) => {
          const student = students.find(s => s['Roll No.'] === b['Roll No.']);
          return (
            <button
              key={i}
              onClick={() => navigate(`/students/${b['Roll No.']}`)}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 neu-raised-sm neu-hover text-left animate-float-in"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-accent">{(b['Student Name'] || '?').charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{b['Student Name']}</p>
                <p className="text-[10px] text-muted-foreground">
                  Roll #{b['Roll No.']} · {b.Class} · {getRoute(b)}
                </p>
                {student?.['Pickup Point'] && (
                  <p className="text-[9px] text-muted-foreground/70">📍 {student['Pickup Point']}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-foreground">{formatCurrency(Number(b['Van\nFee Upto\nMarch']) || 0)}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[11px] font-semibold transition-all ${active ? 'bg-primary text-primary-foreground neu-raised-sm' : 'bg-card text-muted-foreground neu-raised-sm'}`}
    >
      {children}
    </button>
  );
}
