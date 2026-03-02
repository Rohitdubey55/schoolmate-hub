import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSheetData, postSheetData,
  type StudentRow, type BalanceRow, type TransactionRow,
  type ExpenseRow, type StaffRow, type ConfigRow
} from '@/lib/api';

export function useStudents() {
  return useQuery<StudentRow[]>({
    queryKey: ['students'],
    queryFn: () => getSheetData<StudentRow>('Student_Database'),
    staleTime: 60_000,
  });
}

export function useBalances() {
  return useQuery<BalanceRow[]>({
    queryKey: ['balances'],
    queryFn: () => getSheetData<BalanceRow>('Student_Balance'),
    staleTime: 60_000,
  });
}

export function useTransactions() {
  return useQuery<TransactionRow[]>({
    queryKey: ['transactions'],
    queryFn: () => getSheetData<TransactionRow>('Student_Transactions'),
    staleTime: 60_000,
  });
}

export function useExpenses() {
  return useQuery<ExpenseRow[]>({
    queryKey: ['expenses'],
    queryFn: () => getSheetData<ExpenseRow>('Expenses'),
    staleTime: 60_000,
  });
}

export function useStaff() {
  return useQuery<StaffRow[]>({
    queryKey: ['staff'],
    queryFn: () => getSheetData<StaffRow>('Staff'),
    staleTime: 60_000,
  });
}

export function useConfig() {
  return useQuery<ConfigRow[]>({
    queryKey: ['config'],
    queryFn: async () => {
      const rows = await getSheetData<ConfigRow>('Config');
      const byKey = new Map<string, ConfigRow>();
      rows.forEach((row) => {
        if (row?.Key) byKey.set(String(row.Key), row);
      });
      return Array.from(byKey.values());
    },
    staleTime: 300_000,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => postSheetData('Student_Transactions', 'create', { payload: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => {
      const { id, ...rest } = data;
      return postSheetData('Student_Transactions', 'update', { id, payload: rest });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => postSheetData('Expenses', 'create', { payload: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useAddStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => postSheetData('Student_Database', 'create', { payload: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => {
      const { id, ...rest } = data;
      return postSheetData('Student_Database', 'update', { id, payload: rest });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}

export function useAddStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => postSheetData('Staff', 'create', { payload: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => {
      const { id, ...rest } = data;
      return postSheetData('Staff', 'update', { id, payload: rest });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => {
      const { id, ...rest } = data;
      return postSheetData('Student_Balance', 'update', { id, payload: rest });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['balances'] }),
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const rows = await getSheetData<Array<ConfigRow & { id?: string; ID?: string }>[number]>('Config');
      const existing = [...rows].reverse().find((row) => String(row.Key) === String(data.Key));

      const id = existing?.id ?? existing?.ID ?? data.id ?? data.Key;
      const payload = {
        Key: data.Key,
        Value: data.Value,
        Description: existing?.Description ?? data.Description ?? '',
        Category: existing?.Category ?? data.Category ?? 'General',
        UpdatedAt: new Date().toISOString(),
      };

      return postSheetData('Config', 'update', { id, payload });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  });
}
