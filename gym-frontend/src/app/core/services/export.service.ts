import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {

  // ── Export to CSV ─────────────────────────────────
  exportCSV(data: any[], filename: string): void {
    if (!data?.length) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h] ?? '';
          // Escape commas and quotes
          return typeof val === 'string' && (val.includes(',') || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        }).join(',')
      )
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}_${this.dateStr()}.csv`);
  }

  // ── Export to HTML → Print as PDF ─────────────────
  exportPDF(title: string, data: any[], columns: { key: string; label: string }[]): void {
    const rows = data.map(row =>
      `<tr>${columns.map(c => `<td>${row[c.key] ?? '-'}</td>`).join('')}</tr>`
    ).join('');

    const html = `
      <!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Barlow', sans-serif; color: #111; padding: 32px; }
        h1 { font-size: 28px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
        .sub { font-size: 12px; color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #111; color: #fff; padding: 10px 12px; text-align: left;
             font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; }
        td { padding: 9px 12px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #f9f9f9; }
        .footer { margin-top: 24px; font-size: 10px; color: #999; }
        @media print { body { padding: 16px; } }
      </style>
      </head><body>
      <h1>${title}</h1>
      <div class="sub">Generated: ${new Date().toLocaleString('th-TH')} · FitPro Gym Management</div>
      <table>
        <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Total: ${data.length} records</div>
      </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private dateStr(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
