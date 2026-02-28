export interface Student {
  id: number;
  rollNo: number;
  class: string;
  studentName: string;
  fatherName: string;
  mobile: string;
  email?: string;
  address?: string;
  dob?: string;
  admissionDate: string;
  status: 'Active' | 'Alumni' | 'Left';
  createdAt: string;
  updatedAt: string;
}

export interface StudentBalance {
  id: number;
  rollNo: number;
  class: string;
  studentName: string;
  balanceUptoDec2025: number;
  feeDecToMarch: number;
  vanFeeUptoMarch: number;
  examFee: number;
  total: number;
  received: number;
  balance: number;
  vanRoute?: string;
  lastPayment?: string;
}

export interface Transaction {
  id: number;
  date: string;
  receiptNo: string;
  rollNo: number;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  remarks?: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: string;
  approvedBy: string;
  createdAt: string;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  salary: number;
  advanceTaken: number;
  phone: string;
  doj: string;
  status: 'Active' | 'Left';
  createdAt: string;
}

export const CLASS_LIST = [
  'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th',
  '6th', '7th', '8th', '9th', '10th', '11th', '12th'
] as const;

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as const;

export const EXPENSE_CATEGORIES = [
  'Salary', 'Transport (Fuel)', 'Transport (Maintenance)',
  'Office Supplies', 'Maintenance', 'Utilities', 'Events', 'Marketing', 'Insurance', 'Other'
] as const;

export const STAFF_ROLES = [
  'Principal', 'Teacher', 'Admin Staff', 'Driver', 'Helper', 'Guard', 'Cleaner', 'Other'
] as const;
