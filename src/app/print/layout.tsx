export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .print-page * { box-sizing: border-box; }
        .print-page { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #000; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: #fff !important; }
          .no-print { display: none !important; }
          nav, aside, header { display: none !important; }
          @page { margin: 15mm 15mm 15mm 20mm; size: A4; }
        }
        @media screen {
          body { background: #f5f5f5 !important; }
          .print-page { background: white; max-width: 210mm; margin: 24px auto; padding: 20mm 15mm 15mm 20mm; box-shadow: 0 0 12px rgba(0,0,0,.15); min-height: 297mm; }
        }
        .print-page table { width: 100%; border-collapse: collapse; }
        .print-page th, .print-page td { padding: 6px 8px; }
        .border-table th, .border-table td { border: 1px solid #333; }
        .border-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
        .print-page h1 { font-size: 18px; }
        .print-page h2 { font-size: 15px; }
        .print-page h3 { font-size: 13px; }
      `}</style>
      {children}
    </>
  );
}
