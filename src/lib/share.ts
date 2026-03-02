import html2canvas from 'html2canvas';

// Convert HTML element to image data URL
export async function htmlToImage(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
  });
  return canvas.toDataURL('image/png');
}

// Share image via WhatsApp
export async function shareViaWhatsApp(phone: string, imageDataUrl: string, caption?: string): Promise<void> {
  // For native app sharing, we use the native-bridge
  if (navigator.userAgent.includes('Android') || /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    try {
      const { sendNativeAction } = await import('@/lib/native-bridge');
      sendNativeAction({ 
        action: 'whatsapp', 
        phone: `91${phone.replace(/\D/g, '').slice(-10)}`, 
        text: `Please find the receipt.\n\n${caption || ''}`
      });
      return;
    } catch (e) {
      console.log('Native sharing not available');
    }
  }
  
  // Fallback: Open WhatsApp Web with pre-filled message
  const encodedCaption = encodeURIComponent(caption || 'Please find your receipt');
  window.open(`https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodedCaption}`, '_blank');
}

// Create a hidden receipt element for printing/sharing
export function createReceiptElement(
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
): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = `
    <div style="font-family: -apple-system, sans-serif; padding: 20px; background: white; color: #1a1a1a; width: 400px;">
      <h1 style="font-size: 18px; text-align: center; margin-bottom: 4px;">${schoolName}</h1>
      <h2 style="font-size: 14px; text-align: center; margin-bottom: 2px; font-weight: 500;">Fee Receipt — ${academicYear}</h2>
      <div style="border-top: 1px dashed #ccc; margin: 12px 0;"></div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Receipt No.</span>
        <span style="font-weight: 600;">${receiptNo}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Date</span>
        <span style="font-weight: 600;">${date}</span>
      </div>
      <div style="border-top: 1px dashed #ccc; margin: 12px 0;"></div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Student</span>
        <span style="font-weight: 600;">${studentName}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Father</span>
        <span style="font-weight: 600;">${fatherName}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Class</span>
        <span style="font-weight: 600;">${className}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Roll No.</span>
        <span style="font-weight: 600;">${rollNo}</span>
      </div>
      <div style="border-top: 1px dashed #ccc; margin: 12px 0;"></div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Total Fees</span>
        <span style="font-weight: 600;">₹${totalFees.toLocaleString('en-IN')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Total Received</span>
        <span style="font-weight: 600; color: green;">₹${totalReceived.toLocaleString('en-IN')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; margin-top: 8px; border-top: 2px solid #333; font-size: 15px; font-weight: 700;">
        <span>Amount Paid</span>
        <span style="color: green;">₹${amountPaid.toLocaleString('en-IN')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="color: #666;">Mode</span>
        <span style="font-weight: 600;">${mode}</span>
      </div>
      ${remarks ? `<div style="display: flex; justify-content: space-between; padding: 4px 0;"><span style="color: #666;">Remarks</span><span style="font-weight: 600;">${remarks}</span></div>` : ''}
      <div style="border-top: 1px dashed #ccc; margin: 12px 0;"></div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; font-weight: 700;">
        <span>Balance Due</span>
        <span style="color: ${balanceDue > 0 ? 'red' : 'green'};">₹${balanceDue.toLocaleString('en-IN')}</span>
      </div>
    </div>
  `;
  return div;
}
