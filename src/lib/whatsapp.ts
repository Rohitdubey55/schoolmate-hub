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
