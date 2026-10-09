import { jsPDF } from "jspdf";

// Singapore Dollar formatting for display only (DB stores raw numbers).
export function formatSGD(n) {
  const num = Number(n) || 0;
  return (
    "S$" +
    num.toLocaleString("en-SG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Builds and downloads a PDF snapshot of the job sheet for the admin to review.
// `lines` items: { supervisorname, trade, scope, cost(formatted string) }
// `totalcost` is a formatted string.
export function downloadJobsheetPdf({
  jobsheetno,
  team,
  projectName,
  prefix,
  assignedPEName,
  assignedManagerName,
  assignedDirectorName,
  lines,
  totalcost,
}) {
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Job Sheet", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 30;
  const rows = [
    ["Job Sheet No", jobsheetno || "—"],
    ["Team", team || "—"],
    ["Project Name", projectName || "—"],
    ["Project Prefix", prefix || "—"],
    ["Assigned PE", assignedPEName || "—"],
    ["Assigned Manager", assignedManagerName || "—"],
    ["Director", assignedDirectorName || "—"],
  ];
  rows.forEach(([k, v]) => {
    doc.text(`${k}:`, 14, y);
    doc.text(String(v), 60, y);
    y += 6;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Lines", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.text("Supervisor", 14, y);
  doc.text("Trade", 80, y);
  doc.text("Scope", 120, y);
  doc.text("Cost", 170, y);
  y += 5;
  doc.setFont("helvetica", "normal");

  (lines || []).forEach((l) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(l.supervisorname || "—"), 14, y, { maxWidth: 60 });
    doc.text(String(l.trade || "—"), 80, y, { maxWidth: 35 });
    doc.text(String(l.scope || "—"), 120, y, { maxWidth: 45 });
    doc.text(String(l.cost ?? "—"), 170, y);
    y += 6;
  });

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Cost: ${totalcost ?? formatSGD(0)}`, 14, y);

  doc.save(`JobSheet-${jobsheetno || "draft"}.pdf`);
}