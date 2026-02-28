export function printContent(title: string, html: string) {
  // Remove any existing print overlay
  const existing = document.getElementById('__print_overlay__');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '__print_overlay__';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: white; z-index: 99999;
    overflow-y: auto; font-family: -apple-system, sans-serif;
    padding: 20px 20px 100px;
    font-size: 13px; color: #1a1a1a;
  `;

  overlay.innerHTML = `
    <style>
      #__print_overlay__ h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
      #__print_overlay__ h2 { font-size: 14px; text-align: center; margin-bottom: 2px; font-weight: 500; }
      #__print_overlay__ .subtitle { text-align: center; font-size: 11px; color: #666; margin-bottom: 16px; }
      #__print_overlay__ .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
      #__print_overlay__ .row { display: flex; justify-content: space-between; padding: 4px 0; }
      #__print_overlay__ .row .label { color: #666; }
      #__print_overlay__ .row .value { font-weight: 600; text-align: right; }
      #__print_overlay__ .total-row { font-size: 15px; font-weight: 700; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
      #__print_overlay__ .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; }
      #__print_overlay__ .action-bar {
        position: fixed; bottom: 0; left: 0; right: 0;
        display: flex; gap: 12px; padding: 16px 20px;
        background: white; border-top: 1px solid #eee;
      }
      #__print_overlay__ .btn {
        flex: 1; padding: 14px; border: none; border-radius: 12px;
        font-size: 15px; font-weight: 700; cursor: pointer;
      }
      #__print_overlay__ .btn-close { background: #f1f5f9; color: #1e3a5f; }
      #__print_overlay__ .btn-print { background: #1e3a5f; color: white; }
      @media print {
        #__print_overlay__ .action-bar { display: none; }
      }
    </style>
    ${html}
    <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
    <div class="action-bar">
      <button class="btn btn-close" id="__print_close__">✕ Close</button>
      <button class="btn btn-print" id="__print_now__">🖨️ Print</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('__print_close__')?.addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('__print_now__')?.addEventListener('click', () => {
    window.print();
  });

  // Scroll to top of overlay
  overlay.scrollTop = 0;
}
