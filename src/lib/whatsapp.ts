export function getWhatsAppUrl(phone: string | number, message: string): string {
  const cleaned = String(phone).replace(/\D/g, '').slice(-10);
  if (cleaned.length !== 10) return '';
  const encoded = encodeURIComponent(message);
  return `https://wa.me/91${cleaned}?text=${encoded}`;
}

export function buildFeeReminderMessage(
  schoolName: string,
  studentName: string,
  fatherName: string,
  className: string,
  balance: number,
  academicYear: string
): string {
  return `Dear ${fatherName},

This is a reminder from *${schoolName}* regarding pending fee for your ward *${studentName}* (Class: ${className}).

Outstanding Balance: *₹${balance.toLocaleString('en-IN')}*
Academic Year: ${academicYear}

Kindly clear the dues at the earliest.

Thank you.`;
}

export function buildFinancialStatusMessage(
  schoolName: string,
  studentName: string,
  fatherName: string,
  className: string,
  rollNo: string | number,
  prevBalance: number,
  tuitionFee: number,
  vanFee: number,
  otherFee: number,
  total: number,
  received: number,
  balanceDue: number,
  academicYear: string
): string {
  return `*${schoolName}*

*Financial Statement — ${academicYear}*

Student: ${studentName}
Father: ${fatherName}
Class: ${className}
Roll No.: ${rollNo}

--- Fee Details ---
Previous Balance: ₹${prevBalance.toLocaleString('en-IN')}
Tuition Fee: ₹${tuitionFee.toLocaleString('en-IN')}
Van Fee: ₹${vanFee.toLocaleString('en-IN')}
Exam/Other: ₹${otherFee.toLocaleString('en-IN')}

*Total: ₹${total.toLocaleString('en-IN')}*
Received: ₹${received.toLocaleString('en-IN')}

*Balance Due: ₹${balanceDue.toLocaleString('en-IN')}*`;
}

export function buildLastReceiptMessage(
  schoolName: string,
  studentName: string,
  fatherName: string,
  className: string,
  rollNo: string | number,
  receiptNo: string | number,
  date: string,
  totalFees: number,
  totalReceived: number,
  amountPaid: number,
  mode: string,
  balanceDue: number,
  academicYear: string,
  remarks?: string
): string {
  let message = `*${schoolName}*

*Fee Receipt — ${academicYear}*

Receipt No.: ${String(receiptNo)}
Date: ${date}

Student: ${studentName}
Father: ${fatherName}
Class: ${className}
Roll No.: ${rollNo}

--- Payment Details ---
Total Fees: ₹${totalFees.toLocaleString('en-IN')}
Total Received: ₹${totalReceived.toLocaleString('en-IN')}

*Amount Paid: ₹${amountPaid.toLocaleString('en-IN')}*
Mode: ${mode}${remarks ? `\nRemarks: ${remarks}` : ''}

---
*Balance Due: ₹${balanceDue.toLocaleString('en-IN')}*`;

  return message;
}
