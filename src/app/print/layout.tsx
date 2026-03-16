export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #000; background: #fff; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 15mm 15mm 15mm 20mm; size: A4; }
          }
          @media screen {
            body { background: #f5f5f5; }
            .print-page { background: white; max-width: 210mm; margin: 24px auto; padding: 20mm 15mm 15mm 20mm; box-shadow: 0 0 12px rgba(0,0,0,.15); min-height: 297mm; }
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 6px 8px; }
          .border-table th, .border-table td { border: 1px solid #333; }
          .border-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
          h1 { font-size: 18px; }
          h2 { font-size: 15px; }
          h3 { font-size: 13px; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
