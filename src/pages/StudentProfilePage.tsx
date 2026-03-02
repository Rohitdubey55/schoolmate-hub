import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents, useBalances, useTransactions, useAddTransaction, useUpdateStudent, useConfig, useUpdateBalance } from '@/hooks/useSheetData';
import { formatCurrency } from '@/lib/format';
import { ArrowLeft, Printer, IndianRupee, MessageCircle, Edit2, Save, X, Loader2, Copy } from 'lucide-react';
import { PAYMENT_MODES, CLASS_LIST } from '@/types/school';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { buildFeeReminderMessage, buildFinancialStatusMessage, buildLastReceiptMessage } from '@/lib/whatsapp';
import { printContent } from '@/lib/print';
import { sendNativeAction } from '@/lib/native-bridge';
import { renderHtmlToJpegBase64 } from '@/lib/render-to-image';
import type { BalanceRow, TransactionRow, StudentRow } from '@/lib/api';

export default function StudentProfilePage() {
  const { rollNo } = useParams<{ rollNo: string }>();
  const navigate = useNavigate();
  const { data: students = [], isLoading: isStudentsLoading } = useStudents();
  const { data: balances = [] } = useBalances();
  const { data: transactions = [] } = useTransactions();
  const { data: config = [] } = useConfig();
  const addTxnMutation = useAddTransaction();
  const updateStudentMutation = useUpdateStudent();
  const updateBalanceMutation = useUpdateBalance();
  const [showCollect, setShowCollect] = useState(false);
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isSharingReceipt, setIsSharingReceipt] = useState(false);
  const [isSharingStatus, setIsSharingStatus] = useState(false);
  const { toast } = useToast();

  // Handle both numeric roll numbers (9014) and string roll numbers (UKG011)
  const roll = rollNo ? (isNaN(Number(rollNo)) ? rollNo : Number(rollNo)) : undefined;
  console.log('[StudentProfile] rollNo:', rollNo, 'roll:', roll, 'students:', students.length);
  const student = roll ? students.find(s => String(s['Roll No.']) === String(roll)) : undefined;
  const balance = roll ? balances.find(b => String(b['Roll No.']) === String(roll)) : undefined;
  const studentTxns = roll ? transactions
    .filter(t => String(t['Roll No.']) === String(roll))
    .sort((a, b) => new Date(b.Date || b.CreatedAt).getTime() - new Date(a.Date || a.CreatedAt).getTime()) : [];

  const schoolName = String(config.find(c => c.Key === 'school_name')?.Value || 'K D Memorial');
  const academicYear = String(config.find(c => c.Key === 'academic_year')?.Value || '2025-26');

  if (isStudentsLoading) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-primary mb-4 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="bg-card rounded-2xl p-8 neu-raised text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-primary mb-4 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="bg-card rounded-2xl p-8 neu-raised text-center">
          <p className="text-muted-foreground">Student not found</p>
        </div>
      </div>
    );
  }

  const outstanding = Number(balance?.Balance) || 0;
  const phone = String(student.Mobile || '');

  const handlePrintFinancial = () => {
    if (!balance) return;
    const html = `
      <h1>${schoolName}</h1>
      <div class="subtitle">Financial Statement — ${academicYear}</div>
      <div class="divider"></div>
      <div class="row"><span class="label">Student</span><span class="value">${student['Student Name']}</span></div>
      <div class="row"><span class="label">Father</span><span class="value">${student['Father Name']}</span></div>
      <div class="row"><span class="label">Class</span><span class="value">${student.Class}</span></div>
      <div class="row"><span class="label">Roll No.</span><span class="value">${student['Roll No.']}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Prev Balance</span><span class="value">${formatCurrency(Number(balance['Balance\nUpto\nDec 2025']) || 0)}</span></div>
      <div class="row"><span class="label">Tuition Fee</span><span class="value">${formatCurrency(Number(balance['Fee\nDec. to\nMarch']) || 0)}</span></div>
      <div class="row"><span class="label">Van Fee</span><span class="value">${formatCurrency(Number(balance['Van\nFee Upto\nMarch']) || 0)}</span></div>
      <div class="row"><span class="label">Exam/Other</span><span class="value">${formatCurrency(Number(balance['Ot\nExam-200\nR-Card-200']) || 0)}</span></div>
      <div class="row total-row"><span class="label">Total</span><span class="value">${formatCurrency(Number(balance.Total) || 0)}</span></div>
      <div class="row"><span class="label">Received</span><span class="value" style="color:green">${formatCurrency(Number(balance['Rec.']) || 0)}</span></div>
      <div class="row total-row"><span class="label">Balance Due</span><span class="value" style="color:${outstanding > 0 ? 'red' : 'green'}">${formatCurrency(outstanding)}</span></div>
    `;
    printContent(`Financial - ${student['Student Name']}`, html);
  };

  const handlePrintLastTxn = () => {
    const last = studentTxns[0];
    if (!last) { toast({ title: 'No transactions found' }); return; }
    printReceipt(last);
  };

  const printReceipt = (txn: TransactionRow) => {
    if (!balance) return;
    const balanceDue = Number(balance.Balance) || 0;
    const html = `
      <h1>${schoolName}</h1>
      <div class="subtitle">Fee Receipt — ${academicYear}</div>
      <div class="divider"></div>
      <div class="row"><span class="label">Receipt No.</span><span class="value">${txn['Receipt No.']}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${txn.Date}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Student</span><span class="value">${student['Student Name']}</span></div>
      <div class="row"><span class="label">Father</span><span class="value">${student['Father Name']}</span></div>
      <div class="row"><span class="label">Class</span><span class="value">${student.Class}</span></div>
      <div class="row"><span class="label">Roll No.</span><span class="value">${student['Roll No.']}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Total Fees</span><span class="value">${formatCurrency(Number(balance?.Total) || 0)}</span></div>
      <div class="row"><span class="label">Total Received</span><span class="value" style="color:green">${formatCurrency(Number(balance?.['Rec.']) || 0)}</span></div>
      <div class="row total-row"><span class="label">Amount Paid</span><span class="value" style="color:green">${formatCurrency(Number(txn.Amount))}</span></div>
      <div class="row"><span class="label">Mode</span><span class="value">${txn.Mode}</span></div>
      ${txn.Remarks ? `<div class="row"><span class="label">Remarks</span><span class="value">${txn.Remarks}</span></div>` : ''}
      <div class="divider"></div>
      <div class="row total-row"><span class="label">Balance Due</span><span class="value" style="color:${balanceDue > 0 ? 'red' : 'green'}">${formatCurrency(balanceDue)}</span></div>
    `;
    printContent(`Receipt - ${txn['Receipt No.']}`, html);
  };

  const handleWhatsApp = () => {
    if (!phone) { toast({ title: 'No mobile number available' }); return; }
    if (outstanding <= 0) { toast({ title: 'No pending dues' }); return; }
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) { toast({ title: 'Invalid phone number' }); return; }
    const msg = buildFeeReminderMessage(schoolName, student['Student Name'], student['Father Name'], student.Class, outstanding, academicYear);
    sendNativeAction({ action: 'whatsapp', phone: `91${cleaned}`, text: msg });
  };

  const handleWhatsAppStatus = async () => {
    if (!phone) { toast({ title: 'No mobile number available' }); return; }
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) { toast({ title: 'Invalid phone number' }); return; }
    if (!balance) { toast({ title: 'No balance data available' }); return; }
    if (isSharingStatus) return;

    setIsSharingStatus(true);
    toast({ title: '⏳ Generating status image…' });

    const prevBal = Number(balance['Balance\nUpto\nDec 2025']) || 0;
    const tuition = Number(balance['Fee\nDec. to\nMarch']) || 0;
    const vanFee = Number(balance['Van\nFee Upto\nMarch']) || 0;
    const other = Number(balance['Ot\nExam-200\nR-Card-200']) || 0;
    const total = Number(balance.Total) || 0;
    const received = Number(balance['Rec.']) || 0;

    const statusHtml = `
      <div class="r-school">${schoolName}</div>
      <div class="r-subtitle">Financial Status — ${academicYear}</div>
      <hr class="r-divider" />
      <div class="r-row"><span class="r-label">Student</span><span class="r-value">${student['Student Name']}</span></div>
      <div class="r-row"><span class="r-label">Father's Name</span><span class="r-value">${student['Father Name']}</span></div>
      <div class="r-row"><span class="r-label">Class</span><span class="r-value">${student.Class}</span></div>
      <div class="r-row"><span class="r-label">Roll No.</span><span class="r-value">${student['Roll No.']}</span></div>
      <hr class="r-divider" />
      <div class="r-row"><span class="r-label">Previous Balance</span><span class="r-value">${formatCurrency(prevBal)}</span></div>
      <div class="r-row"><span class="r-label">Tuition Fee</span><span class="r-value">${formatCurrency(tuition)}</span></div>
      <div class="r-row"><span class="r-label">Van Fee</span><span class="r-value">${formatCurrency(vanFee)}</span></div>
      <div class="r-row"><span class="r-label">Exam / Other</span><span class="r-value">${formatCurrency(other)}</span></div>
      <hr class="r-divider" />
      <div class="r-row r-total"><span class="r-label">Total Fees</span><span class="r-value">${formatCurrency(total)}</span></div>
      <div class="r-row"><span class="r-label">Amount Received</span><span class="r-value r-green">${formatCurrency(received)}</span></div>
      <div class="r-row r-total"><span class="r-label">Balance Due</span><span class="r-value ${outstanding > 0 ? 'r-red' : 'r-green'}">${formatCurrency(outstanding)}</span></div>
      <div style="text-align:center;margin-top:14px">
        <span class="r-stamp">${outstanding <= 0 ? '✓ CLEARED' : 'DUES PENDING'}</span>
      </div>
    `;

    try {
      const base64 = await renderHtmlToJpegBase64(statusHtml);
      if (base64) {
        const sent = sendNativeAction({
          action: 'shareImage',
          base64,
          mimeType: 'image/jpeg',
          fileName: 'financial-status.jpg',
          title: `Financial Status — ${student['Student Name']}`,
        });
        if (sent) {
          toast({ title: '✅ Status image sent!' });
          return;
        }
      }
      // Fallback: send as text
      const msg = buildFinancialStatusMessage(
        schoolName, student['Student Name'], student['Father Name'], student.Class,
        student['Roll No.'], prevBal, tuition, vanFee, other, total, received, outstanding, academicYear
      );
      sendNativeAction({ action: 'whatsapp', phone: `91${cleaned}`, text: msg });
      toast({ title: '📤 Status sent as text to WhatsApp' });
    } finally {
      setIsSharingStatus(false);
    }
  };

  const handleWhatsAppReceipt = () => {
    if (!phone) { toast({ title: 'No mobile number available' }); return; }
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) { toast({ title: 'Invalid phone number' }); return; }
    const last = studentTxns[0];
    if (!last) { toast({ title: 'No transactions found' }); return; }
    sendWhatsAppReceipt(last);
  };

  const handleWhatsAppReceiptSpecific = (txn: TransactionRow) => {
    if (!phone) { toast({ title: 'No mobile number available' }); return; }
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) { toast({ title: 'Invalid phone number' }); return; }
    sendWhatsAppReceipt(txn);
  };

  const sendWhatsAppReceipt = async (txn: TransactionRow) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) return;
    if (isSharingReceipt) return;

    setIsSharingReceipt(true);
    toast({ title: '⏳ Generating receipt image…' });

    const balanceDue = Number(balance?.Balance) || 0;

    const receiptHtml = `
      <div class="r-school">${schoolName}</div>
      <div class="r-subtitle">Fee Receipt — ${academicYear}</div>
      <hr class="r-divider" />
      <div class="r-row"><span class="r-label">Receipt No.</span><span class="r-value">${txn['Receipt No.']}</span></div>
      <div class="r-row"><span class="r-label">Date</span><span class="r-value">${txn.Date}</span></div>
      <hr class="r-divider" />
      <div class="r-row"><span class="r-label">Student</span><span class="r-value">${student['Student Name']}</span></div>
      <div class="r-row"><span class="r-label">Father's Name</span><span class="r-value">${student['Father Name']}</span></div>
      <div class="r-row"><span class="r-label">Class</span><span class="r-value">${student.Class}</span></div>
      <div class="r-row"><span class="r-label">Roll No.</span><span class="r-value">${student['Roll No.']}</span></div>
      <hr class="r-divider" />
      <div class="r-row"><span class="r-label">Total Fees</span><span class="r-value">${formatCurrency(Number(balance?.Total) || 0)}</span></div>
      <div class="r-row"><span class="r-label">Total Received</span><span class="r-value r-green">${formatCurrency(Number(balance?.['Rec.']) || 0)}</span></div>
      <div class="r-row r-total"><span class="r-label">Amount Paid</span><span class="r-value r-green">${formatCurrency(Number(txn.Amount))}</span></div>
      <div class="r-row"><span class="r-label">Payment Mode</span><span class="r-value">${txn.Mode}</span></div>
      ${txn.Remarks ? `<div class="r-row"><span class="r-label">Remarks</span><span class="r-value">${txn.Remarks}</span></div>` : ''}
      <hr class="r-divider" />
      <div class="r-row r-total"><span class="r-label">Balance Due</span><span class="r-value ${balanceDue > 0 ? 'r-red' : 'r-green'}">${formatCurrency(balanceDue)}</span></div>
      <div style="text-align:center;margin-top:14px">
        <span class="r-stamp">${balanceDue <= 0 ? '✓ PAID' : 'PARTIAL PAYMENT'}</span>
      </div>
    `;

    const fallbackMsg = buildLastReceiptMessage(
      schoolName, student['Student Name'], student['Father Name'], student.Class,
      student['Roll No.'], txn['Receipt No.'], txn.Date,
      Number(balance?.Total) || 0, Number(balance?.['Rec.']) || 0,
      Number(txn.Amount), txn.Mode, balanceDue, academicYear, txn.Remarks
    );

    try {
      const base64 = await renderHtmlToJpegBase64(receiptHtml);
      if (base64) {
        const sent = sendNativeAction({
          action: 'shareImage',
          base64,
          mimeType: 'image/jpeg',
          fileName: 'receipt.jpg',
          title: `Fee Receipt — ${student['Student Name']}`,
        });
        if (sent) {
          toast({ title: '✅ Receipt image sent!' });
          return;
        }
      }
      // Fallback: send as WhatsApp text
      sendNativeAction({ action: 'whatsapp', phone: `91${cleaned}`, text: fallbackMsg });
      toast({ title: '📤 Receipt sent as text to WhatsApp' });
    } finally {
      setIsSharingReceipt(false);
    }
  };

  return (
    <div className="animate-float-in">
      {/* Header */}
      <div className="bg-card mx-4 mt-4 rounded-2xl p-5 neu-float">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm mb-3 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{(student['Student Name'] || '?').charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">{student['Student Name']}</h1>
            <p className="text-[11px] text-muted-foreground">Roll #{student['Roll No.']} · {student.Class}</p>
            <p className="text-[10px] text-muted-foreground/70">S/o {student['Father Name']}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          <ActionButton icon={<Printer className="h-4 w-4" />} label="Print Status" onClick={handlePrintFinancial} />
          <ActionButton icon={<IndianRupee className="h-4 w-4" />} label="Collect Fee" onClick={() => setShowCollect(true)} color="success" />
          <ActionButton icon={<Printer className="h-4 w-4" />} label="Last Receipt" onClick={handlePrintLastTxn} />
          <ActionButton icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" onClick={() => setShowWhatsAppMenu(true)} color="success" />
        </div>

        {/* Financial Summary */}
        {balance && (
          <div className="bg-card rounded-2xl p-4 space-y-2 neu-raised">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Summary</h3>
            <div className="space-y-1 text-sm">
              <SummaryRow label="Previous Balance" value={formatCurrency(Number(balance['Balance\nUpto\nDec 2025']) || 0)} />
              <SummaryRow label="Tuition Fee" value={formatCurrency(Number(balance['Fee\nDec. to\nMarch']) || 0)} />
              <SummaryRow label="Van Fee" value={formatCurrency(Number(balance['Van\nFee Upto\nMarch']) || 0)} />
              <SummaryRow label="Exam/Other" value={formatCurrency(Number(balance['Ot\nExam-200\nR-Card-200']) || 0)} />
              <div className="border-t border-border/50 pt-1">
                <SummaryRow label="Total" value={formatCurrency(Number(balance.Total) || 0)} bold />
              </div>
              <SummaryRow label="Received" value={formatCurrency(Number(balance['Rec.']) || 0)} color="success" />
              <div className="border-t-2 border-foreground/20 pt-1">
                <SummaryRow label="Balance Due" value={formatCurrency(outstanding)} color={outstanding > 0 ? 'destructive' : 'success'} bold />
              </div>
            </div>
          </div>
        )}

        {/* Student Details */}
        <StudentDetails
          student={student}
          editing={editing}
          setEditing={setEditing}
          toast={toast}
          onUpdate={async (data) => {
            try {
              await updateStudentMutation.mutateAsync(data);
              toast({ title: 'Student updated' });
              setEditing(false);
            } catch (e: any) {
              toast({ title: 'Error', description: e.message, variant: 'destructive' });
            }
          }}
          isLoading={updateStudentMutation.isPending}
        />

        {/* Transaction History */}
        <div className="space-y-2">
          <h3
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-primary"
            onClick={() => setShowAllTransactions(!showAllTransactions)}
          >
            Payment History ({studentTxns.length}) {showAllTransactions ? '▲' : '▼'}
          </h3>
          {studentTxns.length === 0 && (
            <div className="bg-card rounded-2xl p-6 neu-raised-sm text-center">
              <p className="text-sm text-muted-foreground">No payments recorded</p>
            </div>
          )}
          {(showAllTransactions ? studentTxns : studentTxns.slice(0, 3)).map((txn, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-4 neu-raised-sm flex items-center justify-between animate-float-in cursor-pointer hover:bg-primary/5"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => {
                setSelectedTransaction(txn);
                setShowTransactionDialog(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{txn['Receipt No.']}</p>
                  <p className="text-[10px] text-muted-foreground">{txn.Date} · {txn.Mode}</p>
                  {txn.Remarks && <p className="text-[9px] text-muted-foreground/70">{txn.Remarks}</p>}
                </div>
              </div>
              <p className="text-sm font-bold text-success">{formatCurrency(Number(txn.Amount))}</p>
            </div>
          ))}
          {studentTxns.length > 3 && !showAllTransactions && (
            <button
              className="w-full text-center text-xs text-primary font-semibold py-2"
              onClick={() => setShowAllTransactions(true)}
            >
              Show All ({studentTxns.length - 3} more)
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp Options Dialog */}
      <Dialog open={showWhatsAppMenu} onOpenChange={setShowWhatsAppMenu}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">WhatsApp Options</DialogTitle>
            <DialogDescription className="text-xs">
              Choose an option to send to {student['Father Name']}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold justify-start"
              disabled={isSharingStatus}
              onClick={() => {
                setShowWhatsAppMenu(false);
                handleWhatsAppStatus();
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isSharingStatus ? 'Generating…' : 'Send Current Status'}
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold justify-start"
              onClick={() => {
                setShowWhatsAppMenu(false);
                handleWhatsApp();
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Fee Reminder
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold justify-start"
              onClick={() => {
                setShowWhatsAppMenu(false);
                handleWhatsAppReceipt();
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Last Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Options Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Transaction Options</DialogTitle>
            <DialogDescription className="text-xs">
              Receipt: {selectedTransaction?.['Receipt No.']} | Amount: {selectedTransaction ? formatCurrency(Number(selectedTransaction.Amount)) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold justify-start"
              onClick={() => {
                setShowTransactionDialog(false);
                if (selectedTransaction) printReceipt(selectedTransaction);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold justify-start"
              disabled={isSharingReceipt}
              onClick={() => {
                setShowTransactionDialog(false);
                if (selectedTransaction) handleWhatsAppReceiptSpecific(selectedTransaction);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isSharingReceipt ? 'Generating…' : 'Share on WhatsApp'}
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold justify-start"
              onClick={() => {
                setShowTransactionDialog(false);
                // Edit functionality - could open a dialog to edit this transaction
                toast({ title: 'Edit feature coming soon' });
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collect Fee Dialog */}
      <CollectFeeForStudentDialog
        open={showCollect}
        onClose={() => setShowCollect(false)}
        student={student}
        onAdd={async (data) => {
          try {
            await addTxnMutation.mutateAsync(data);
            if (balance?.id) {
              const currentRec = Number(balance['Rec.']) || 0;
              const currentTotal = Number(balance.Total) || 0;
              const newRec = currentRec + Number(data.Amount);
              const newBalance = currentTotal - newRec;
              await updateBalanceMutation.mutateAsync({
                id: balance.id,
                'Rec.': newRec,
                Balance: newBalance,
                'Last Payment': data.Date || new Date().toISOString().split('T')[0],
                UpdatedAt: new Date().toISOString(),
              });
            }
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

function ActionButton({ icon, label, onClick, color = 'primary' }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) {
  const bgMap: Record<string, string> = {
    primary: 'bg-primary/10',
    success: 'bg-success/10',
    destructive: 'bg-destructive/10',
  };
  const textMap: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-success',
    destructive: 'text-destructive',
  };
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card neu-raised-sm neu-hover">
      <div className={`h-8 w-8 rounded-xl ${bgMap[color] || bgMap.primary} flex items-center justify-center`}>
        <div className={textMap[color] || textMap.primary}>{icon}</div>
      </div>
      <span className="text-[9px] font-semibold text-foreground">{label}</span>
    </button>
  );
}

function SummaryRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className={`text-muted-foreground ${bold ? 'font-semibold text-foreground' : ''}`}>{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${color ? `text-${color}` : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function StudentDetails({ student, editing, setEditing, onUpdate, isLoading, toast }: {
  student: StudentRow; editing: boolean; setEditing: (v: boolean) => void;
  onUpdate: (data: Record<string, any>) => void; isLoading: boolean; toast?: any;
}) {
  const [form, setForm] = useState({
    studentName: student['Student Name'] || '',
    fatherName: student['Father Name'] || '',
    mobile: String(student.Mobile || ''),
    email: student.Email || '',
    address: student.Address || '',
    class: student.Class || '',
    dob: student['Date of Birth'] || '',
    admissionDate: student['Admission Date'] || '',
    status: student.Status || 'Active',
  });

  const handleSave = () => {
    onUpdate({
      id: student.id,
      'Roll No.': student['Roll No.'],
      'Student Name': form.studentName.trim(),
      'Father Name': form.fatherName.trim(),
      Mobile: form.mobile,
      Email: form.email,
      Address: form.address,
      Class: form.class,
      'Date of Birth': form.dob,
      'Admission Date': form.admissionDate,
      Status: form.status,
    });
  };

  const details = [
    { label: 'Class', value: student.Class, field: 'class', type: 'select' },
    { label: 'Father\'s Name', value: student['Father Name'], field: 'fatherName' },
    { label: 'Mobile', value: String(student.Mobile || '-'), field: 'mobile', type: 'tel', isPhone: true },
    { label: 'Email', value: student.Email || '-', field: 'email', type: 'email' },
    { label: 'Address', value: student.Address || '-', field: 'address' },
    { label: 'DOB', value: student['Date of Birth'] || '-', field: 'dob', type: 'date' },
    { label: 'Admission Date', value: student['Admission Date'] || '-', field: 'admissionDate', type: 'date' },
    { label: 'Route No.', value: student['Route No.'] || '-' },
    { label: 'Pickup Point', value: student['Pickup Point'] || '-' },
    { label: 'Status', value: student.Status || 'Active', field: 'status' },
  ];

  return (
    <div className="bg-card rounded-2xl p-4 neu-raised">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Details</h3>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="h-8 w-8 rounded-xl bg-card flex items-center justify-center neu-raised-sm"><X className="h-4 w-4 text-muted-foreground" /></button>
            <button onClick={handleSave} disabled={isLoading} className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Save className="h-4 w-4 text-primary-foreground" />}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="h-8 w-8 rounded-xl bg-card flex items-center justify-center neu-raised-sm"><Edit2 className="h-4 w-4 text-muted-foreground" /></button>
        )}
      </div>
      <div className="space-y-1 text-sm">
        {details.map(d => (
          <div key={d.label} className="flex justify-between py-2 border-b border-border/50 last:border-0">
            <span className="text-muted-foreground">{d.label}</span>
            {editing && d.field ? (
              d.type === 'select' && d.field === 'class' ? (
                <Select value={form.class} onValueChange={v => setForm(f => ({ ...f, class: v }))}>
                  <SelectTrigger className="h-7 w-32 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASS_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <input
                  type={d.type || 'text'}
                  value={(form as any)[d.field] || ''}
                  onChange={e => setForm(f => ({ ...f, [d.field!]: e.target.value }))}
                  className="h-7 w-32 px-2 text-xs text-right rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              )
            ) : (
              d.isPhone && d.value && d.value !== '-' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const phoneNum = String(d.value).replace(/\D/g, '');
                      sendNativeAction({ action: 'dial', phone: phoneNum });
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {d.value}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(d.value as string);
                      if (toast) toast({ title: 'Phone number copied!' });
                    }}
                    className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20"
                    title="Copy number"
                  >
                    <Copy className="h-3 w-3 text-primary" />
                  </button>
                </div>
              ) : (
                <span className="font-semibold text-foreground text-right">{d.value}</span>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectFeeForStudentDialog({ open, onClose, student, onAdd, isLoading }: {
  open: boolean; onClose: () => void; student: StudentRow;
  onAdd: (data: Record<string, any>) => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    amount: '', mode: 'Cash', remarks: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    onAdd({
      Date: form.date,
      'Roll No.': student['Roll No.'],
      Amount: Number(form.amount),
      Mode: form.mode,
      Remarks: form.remarks,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">
            Collect Fee — {student['Student Name']}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
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
