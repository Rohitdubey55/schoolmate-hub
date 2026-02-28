const GAS_URL = 'https://script.google.com/macros/s/AKfycbyUoAiu6xNd6DMIplcynrg3QzwZI0pWKuazkGqifCAumCYfQKYvif4-PMecM_xvx3DXnQ/exec';

export type SheetName = 'Student_Database' | 'Student_Balance' | 'Student_Transactions' | 'Expenses' | 'Staff' | 'Config';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T[];
  message?: string;
}

export async function getSheetData<T = any>(sheet: SheetName): Promise<T[]> {
  const res = await fetch(`${GAS_URL}?action=get&sheet=${encodeURIComponent(sheet)}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch data');
  return json.data || [];
}

export async function postSheetData(sheet: SheetName, action: string, payload: Record<string, any> = {}): Promise<any> {
  const body = JSON.stringify({ action, sheet, ...payload });
  console.log('[API POST]', { action, sheet, payload, body });
  
  // Append query params to allow GAS router to see action/sheet even in POST
  // This helps when GAS is deployed as a Web App
  const url = `${GAS_URL}?action=${encodeURIComponent(action)}&sheet=${encodeURIComponent(sheet)}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // GAS requires text/plain for CORS
    body,
  });
  
  const text = await res.text();
  console.log('[API Response]', text);
  
  let json: any;
  try { 
    json = JSON.parse(text); 
  } catch { 
    console.error('[API Parse Error]', text);
    throw new Error('Invalid response from server. Check GAS script logs or deployment.'); 
  }
  
  if (!json.success) throw new Error(json.message || 'Operation failed');
  return json;
}

// Typed interfaces matching actual sheet column names
export interface StudentRow {
  id: string;
  'Roll No.': number;
  Class: string;
  'Student Name': string;
  'Father Name': string;
  Mobile: string | number;
  Email: string;
  Address: string;
  'Date of Birth': string;
  'Admission Date': string;
  Date: string;
  Status: string;
  CreatedAt: string;
  UpdatedAt: string;
  'Route No.': string;
  'Pickup Point': string;
  'Last Payment Date': string;
  'Last Reminder': string;
  'Receipt No.': number;
}

export interface BalanceRow {
  id: string;
  'Roll No.': number;
  Class: string;
  'Student Name': string;
  'Balance\nUpto\nDec 2025': number;
  'Fee\nDec. to\nMarch': number;
  'Van\nFee Upto\nMarch': number;
  'Ot\nExam-200\nR-Card-200': number;
  Total: number;
  'Rec.': number | string;
  Balance: number;
  'Van Route': string;
  'Last Payment': string;
  UpdatedAt: string;
}

export interface TransactionRow {
  id: string;
  Date: string;
  'Receipt No.': string | number;
  'Roll No.': number;
  Amount: number;
  Mode: string;
  Remarks: string;
  CreatedAt: string;
}

export interface ExpenseRow {
  id: string;
  Date: string;
  Category: string;
  Description: string;
  Amount: number;
  'Payment Mode': string;
  'Approved By': string;
  CreatedAt: string;
}

export interface StaffRow {
  id: string;
  Name: string;
  Role: string;
  Salary: number;
  'Advance Taken': number;
  Phone: string | number;
  DOJ: string;
  Status: string;
  CreatedAt: string;
}

export interface ConfigRow {
  Key: string;
  Value: string | boolean;
  Description: string;
  Category: string;
  UpdatedAt: string;
}
