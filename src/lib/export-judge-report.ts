/**
 * Export Judge Report as PDF.
 * Includes: mock Opik dashboard, A/B stats, AI provider timeline, sample traces.
 */

import { jsPDF } from "jspdf";
import type { DemoDerivedMetrics } from "./admin-demo-utils";
import type { MockTraceEntry } from "./mock-opik";


const DEMO_LABEL = "— DEMO DATA —";

function addPageNumber(doc: jsPDF, page: number, total: number) {
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Page ${page} of ${total}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);
}

export function exportJudgeReportPdf(
  demoMetrics: DemoDerivedMetrics,
  traces: MockTraceEntry[],
  demoDataExists: boolean
): void {
  const doc = new jsPDF();
  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BloomFlow Judge Report", margin, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 8;

  if (demoDataExists) {
    doc.setTextColor(180, 120, 0);
    doc.setFont("helvetica", "bold");
    doc.text(DEMO_LABEL, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += 12;
  }

  // 1. Mock Opik Dashboard Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("1. Opik Dashboard (Mock)", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("This section represents a mock Opik observability dashboard. In production, this would show live trace visualization from Opik/Comet.", margin, y, { maxWidth: contentWidth });
  y += 12;

  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 40);
  doc.setFontSize(9);
  doc.text("Mock Opik Dashboard placeholder — traces logged to localStorage in demo mode.", margin + 5, y + 15, { maxWidth: contentWidth - 10 });
  doc.text("Workout by phase, A/B comparison, and AI acceptance metrics displayed above.", margin + 5, y + 25, { maxWidth: contentWidth - 10 });
  y += 50;

  // 2. Statistical Analysis of A/B Test
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("2. Statistical Analysis — A/B Test", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const ab = demoMetrics.abComparison;
  const rateA = ab.motivation_A.total > 0 ? ((ab.motivation_A.withWorkout / ab.motivation_A.total) * 100).toFixed(1) : "0";
  const rateB = ab.motivation_B.total > 0 ? ((ab.motivation_B.withWorkout / ab.motivation_B.total) * 100).toFixed(1) : "0";
  doc.text(`Group A: ${ab.motivation_A.withWorkout}/${ab.motivation_A.total} workouts (${rateA}% completion)`, margin, y);
  y += 6;
  doc.text(`Group B: ${ab.motivation_B.withWorkout}/${ab.motivation_B.total} workouts (${rateB}% completion)`, margin, y);
  y += 6;
  doc.text(`p-value: ${demoMetrics.abTestPValue.toFixed(2)} — ${demoMetrics.abTestPValue < 0.05 ? "Statistically significant" : "Not significant"}`, margin, y);
  y += 6;
  doc.text("Finding: Group B outperformed by 32% in luteal phase (demo fixture).", margin, y, { maxWidth: contentWidth });
  y += 20;

  // 3. Timeline of AI Provider Usage
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("3. AI Provider Usage Timeline", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`OpenAI: ${demoMetrics.aiProviderTimeline.openai} traces`, margin, y);
  y += 6;
  doc.text(`Gemini Fallback: ${demoMetrics.aiProviderTimeline.gemini} traces (simulated quota exceed)`, margin, y);
  y += 6;
  doc.text(`Fallback: ${demoMetrics.aiProviderTimeline.fallback} traces`, margin, y);
  y += 6;
  doc.text("Timeline: OpenAI (days 1–10) → Gemini (days 11–20) → Fallback (days 21–30)", margin, y, { maxWidth: contentWidth });
  y += 20;

  // 4. Sample Raw Opik Trace Data
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("4. Sample Raw Opik Trace Data", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const sampleTraces = traces.slice(0, 5);
  if (sampleTraces.length === 0) {
    doc.text("No demo traces in localStorage. Generate Opik Evidence on /demo first.", margin, y, { maxWidth: contentWidth });
    y += 10;
  } else {
    for (const t of sampleTraces) {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${t.name} — ${t.timestamp || ""}`, margin, y);
      doc.setFont("helvetica", "normal");
      y += 5;
      const str = JSON.stringify({ ...t, timestamp: t.timestamp }).slice(0, 200) + "...";
      doc.text(str, margin + 5, y, { maxWidth: contentWidth - 10 });
      y += 10;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addPageNumber(doc, p, totalPages);
  }

  doc.save(`BloomFlow-Judge-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
