export function printContent(title: string, html: string) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; padding: 20px; font-size: 13px; color: #1a1a1a; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
        h2 { font-size: 14px; text-align: center; margin-bottom: 2px; font-weight: 500; }
        .subtitle { text-align: center; font-size: 11px; color: #666; margin-bottom: 16px; }
        .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .row .label { color: #666; }
        .row .value { font-weight: 600; text-align: right; }
        .total-row { font-size: 15px; font-weight: 700; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; }
        .close-btn { 
          position: fixed; 
          bottom: 20px; 
          left: 50%; 
          transform: translateX(-50%);
          background: #1e3a5f; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 8px; 
          font-size: 14px; 
          cursor: pointer;
        }
        @media print { 
          body { padding: 10px; } 
          .close-btn { display: none; }
        }
      </style>
    </head>
    <body>
      ${html}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      <button class="close-btn" onclick="window.close()">Close</button>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}
