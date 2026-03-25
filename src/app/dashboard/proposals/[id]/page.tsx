"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileText,
  RefreshCw,
  Trash2,
  ArrowLeft,
  Clock,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ProposalSection {
  heading: string;
  content: string;
}

interface Proposal {
  id: string;
  customerName: string;
  contactFirst?: string;
  contactLast?: string;
  scope: string;
  status: string;
  generatedHtml?: string;
  generatedJson?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  template?: { id: string; name: string } | null;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProposal() {
      try {
        const res = await fetch(`/api/proposals/${proposalId}`);
        if (res.ok) {
          const data = await res.json();
          setProposal(data);
        } else if (res.status === 404) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to fetch proposal:", error);
      } finally {
        setLoading(false);
      }
    }
    if (proposalId) fetchProposal();
  }, [proposalId, router]);

  const getSections = (): ProposalSection[] => {
    if (!proposal?.generatedJson) return [];
    try {
      const parsed = JSON.parse(proposal.generatedJson);
      return Array.isArray(parsed)
        ? parsed
        : parsed.sections || parsed.content || [];
    } catch {
      return [];
    }
  };

  const exportToWord = async () => {
    setExporting("docx");
    try {
      const res = await fetch(`/api/proposals/${proposalId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "docx" }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${proposal?.customerName || "proposal"}-proposal.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(null);
    }
  };

  const exportToPdf = async () => {
    if (!proposal) return;
    setExporting("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 56;
      const marginRight = 56;
      const maxWidth = pageWidth - marginLeft - marginRight;
      let y = 56;

      const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - 56) {
          doc.addPage();
          y = 56;
        }
      };

      const stripHtml = (html: string): string => {
        return html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?(p|div|section)[^>]*>/gi, "\n")
          .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
          .replace(/<li[^>]*>(.*?)<\/li>/gi, "  \u2022 $1\n")
          .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      };

      const writeText = (
        text: string,
        fontSize: number,
        options?: { bold?: boolean; color?: [number, number, number]; spacing?: number }
      ) => {
        const { bold, color, spacing } = options || {};
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        if (color) doc.setTextColor(...color);
        else doc.setTextColor(17, 24, 39);

        const lines = doc.splitTextToSize(text, maxWidth) as string[];
        const lineHeight = fontSize * 1.4;

        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, marginLeft, y);
          y += lineHeight;
        }
        y += spacing ?? 4;
      };

      // Parse sections
      const secs = getSections();
      let title = proposal.customerName + " - Proposal";
      if (proposal.generatedJson) {
        try {
          const parsed = JSON.parse(proposal.generatedJson);
          if (parsed.title) title = parsed.title;
        } catch {}
      }

      // Title
      writeText(title, 22, { bold: true, color: [74, 124, 111], spacing: 20 });

      // Customer info line
      const infoLine = [
        proposal.customerName,
        proposal.contactFirst || proposal.contactLast
          ? `Contact: ${proposal.contactFirst || ""} ${proposal.contactLast || ""}`.trim()
          : null,
        new Date(proposal.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      ]
        .filter(Boolean)
        .join("  |  ");
      writeText(infoLine, 9, { color: [107, 114, 128], spacing: 8 });

      // Divider line
      checkPageBreak(12);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 16;

      // Sections
      if (secs.length > 0) {
        for (const section of secs) {
          checkPageBreak(40);

          // Section heading
          if (section.heading) {
            writeText(section.heading, 14, { bold: true, spacing: 8 });
          }

          // Section content
          const text = stripHtml(section.content);
          const paragraphs = text.split("\n").filter((p) => p.trim());
          for (const para of paragraphs) {
            const trimmed = para.trim();
            if (trimmed.startsWith("\u2022")) {
              writeText(trimmed, 10, { spacing: 3 });
            } else {
              writeText(trimmed, 10, { spacing: 5 });
            }
          }
          y += 10;
        }
      } else if (proposal.generatedHtml) {
        const text = stripHtml(proposal.generatedHtml);
        writeText(text, 10);
      }

      const filename = `${proposal.customerName.replace(/[^a-zA-Z0-9]/g, "_")}_Proposal.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setExporting(null);
    }
  };


  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const statusBadge = (status: string) => {
    const styles =
      status === "final"
        ? "bg-[#4A7C6F]/10 text-[#4A7C6F]"
        : "bg-amber-50 text-amber-700";
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#4A7C6F] animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-20">
        <p className="text-[#6B7280]">Proposal not found.</p>
        <Link
          href="/dashboard"
          className="text-[#4A7C6F] hover:underline text-sm mt-2 inline-block"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const sections = getSections();

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-[#111827]">
              {proposal.customerName}
            </h1>
            {statusBadge(proposal.status)}
          </div>
          {(proposal.contactFirst || proposal.contactLast) && (
            <p className="text-sm text-[#6B7280]">
              Contact: {proposal.contactFirst} {proposal.contactLast}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-sm text-[#6B7280] mt-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(proposal.createdAt)}
            {proposal.template && (
              <>
                <span className="mx-1.5">&middot;</span>
                <FileText className="h-3.5 w-3.5" />
                {proposal.template.name}
              </>
            )}
          </div>
        </div>

        {proposal.logoUrl && (
          <img
            src={proposal.logoUrl}
            alt="Customer logo"
            className="h-14 w-auto object-contain rounded-lg border border-[#E5E7EB] p-1.5 bg-white"
          />
        )}
      </div>

      {/* Export Buttons */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={exportToWord}
          loading={exporting === "docx"}
        >
          <Download className="h-3.5 w-3.5" />
          Export to Word
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={exportToPdf}
          loading={exporting === "pdf"}
        >
          <Download className="h-3.5 w-3.5" />
          Export to PDF
        </Button>

        <div className="flex-1" />

        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            router.push(
              `/dashboard/proposals/new?regenerate=${proposalId}`
            )
          }
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={deleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {/* Proposal Content */}
      <div className="print:shadow-none">
        {/* Sections from generatedJson */}
        {sections.length > 0 ? (
          <div className="space-y-5">
            {sections.map((section, idx) => (
              <Card key={idx}>
                {section.heading && (
                  <h2 className="text-lg font-semibold text-[#111827] mb-3">
                    {section.heading}
                  </h2>
                )}
                <div
                  className="text-sm text-[#111827] leading-relaxed prose prose-sm max-w-none
                    prose-headings:text-[#111827] prose-p:text-[#111827] prose-li:text-[#111827]
                    prose-strong:text-[#111827] prose-a:text-[#4A7C6F]"
                  dangerouslySetInnerHTML={{
                    __html: section.content,
                  }}
                />
              </Card>
            ))}
          </div>
        ) : proposal.generatedHtml ? (
          <Card>
            <div
              className="text-sm text-[#111827] leading-relaxed prose prose-sm max-w-none
                prose-headings:text-[#111827] prose-p:text-[#111827] prose-li:text-[#111827]
                prose-strong:text-[#111827] prose-a:text-[#4A7C6F]"
              dangerouslySetInnerHTML={{
                __html: proposal.generatedHtml,
              }}
            />
          </Card>
        ) : (
          <Card>
            <div className="text-center py-10">
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
              <p className="text-sm text-[#6B7280]">
                No generated content yet. This proposal may still be
                processing.
              </p>
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}
