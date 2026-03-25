"use client";

import React, { useEffect, useState, useCallback } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { extractDocxStyles } from "@/lib/extractDocxStyles";
import {
  Plus,
  FileText,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  File,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface UploadFile {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  systemPrompt: string;
  structure: string;
  createdAt: string;
  updatedAt: string;
  uploads: UploadFile[];
  _count?: { uploads: number };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || data || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTemplateName.trim() }),
      });
      if (res.ok) {
        setNewTemplateName("");
        setShowCreateForm(false);
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to create template:", error);
    } finally {
      setCreating(false);
    }
  };

  const extractText = async (arrayBuffer: ArrayBuffer, file: File): Promise<string> => {
    const ext = file.name.toLowerCase().split(".").pop();

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    if (ext === "pdf") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: any) => item.str)
          .join(" ");
        pages.push(text);
      }
      return pages.join("\n\n");
    }

    if (ext === "txt" || file.type.startsWith("text/")) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    }

    throw new Error(`Unsupported file type: .${ext}`);
  };

  const uploadFiles = async (templateId: string, files: FileList | File[]) => {
    setUploading(templateId);
    setUploadError("");
    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const ext = file.name.toLowerCase().split(".").pop();

        setUploadStatus(`Extracting text from ${file.name}...`);
        const arrayBuffer = await file.arrayBuffer();

        let contentText: string;
        try {
          contentText = await extractText(arrayBuffer, file);
        } catch (err: any) {
          setUploadError(
            err.message || `Could not extract text from "${file.name}".`
          );
          continue;
        }

        if (!contentText.trim()) {
          setUploadError(
            `No text could be extracted from "${file.name}". Try uploading as .txt or .docx.`
          );
          continue;
        }

        // Extract formatting styles from DOCX files
        let docxStyles = undefined;
        console.warn("[upload] File:", file.name, "ext:", ext, "type:", file.type);
        if (ext === "docx") {
          try {
            console.warn("[upload] Starting DOCX style extraction...");
            setUploadStatus(`Extracting formatting from ${file.name}...`);
            // Copy the buffer in case mammoth consumed/detached the original
            const styleBuf = arrayBuffer.slice(0);
            docxStyles = await extractDocxStyles(styleBuf);
            console.warn("[upload] Extracted styles:", docxStyles);
          } catch (err) {
            console.warn("[upload-err] Style extraction failed:", err);
          }
        }

        setUploadStatus(
          `Analyzing ${file.name}... This may take a moment.`
        );
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            filename: file.name,
            contentText,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            docxStyles,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setUploadError(data.error || `Failed to process "${file.name}".`);
        }
      }
      await fetchTemplates();
    } catch (error) {
      console.error("Failed to upload files:", error);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(null);
      setUploadStatus("");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template and all its uploads?")) return;
    setDeleting(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        if (expandedId === templateId) setExpandedId(null);
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    } finally {
      setDeleting(null);
    }
  };

  const deleteUpload = async (templateId: string, uploadId: string) => {
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to delete upload:", error);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    templateId: string
  ) => {
    e.preventDefault();
    setDragOver(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) uploadFiles(templateId, files);
  };

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    templateId: string
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) uploadFiles(templateId, files);
    e.target.value = "";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Templates</h1>
          <p className="text-[#6B7280] mt-1">
            Upload example proposals to train your templates.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4" />
          Create New Template
        </Button>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Template Name"
                placeholder="e.g., Web Development Proposal"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTemplate()}
              />
            </div>
            <Button
              variant="primary"
              onClick={createTemplate}
              loading={creating}
              disabled={!newTemplateName.trim()}
            >
              Create
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                setNewTemplateName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-xl border border-[#E5E7EB] animate-pulse"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-[#6B7280]" />
            </div>
            <h3 className="text-base font-medium text-[#111827] mb-1">
              No templates yet
            </h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Create a template and upload example proposals to get started.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4" />
              Create Your First Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => {
            const isExpanded = expandedId === template.id;
            const uploadCount =
              template._count?.uploads ?? template.uploads?.length ?? 0;

            return (
              <Card key={template.id} padding={false}>
                {/* Template Header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : template.id)
                  }
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#4A7C6F]/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#4A7C6F]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#111827]">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-0.5">
                        <span className="text-xs text-[#6B7280]">
                          {uploadCount} upload{uploadCount !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-[#6B7280] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created {formatDate(template.createdAt)}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          Updated {formatDate(template.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#6B7280]" />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] px-6 py-5 space-y-5">
                    {/* Upload Area */}
                    <div>
                      <h4 className="text-sm font-medium text-[#111827] mb-2">
                        Upload Example Proposals
                      </h4>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(template.id);
                        }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => handleDrop(e, template.id)}
                        className={`
                          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                          transition-colors duration-150
                          ${
                            dragOver === template.id
                              ? "border-[#4A7C6F] bg-[#4A7C6F]/5"
                              : "border-[#E5E7EB] hover:border-[#4A7C6F]/50 hover:bg-gray-50/50"
                          }
                        `}
                        onClick={() =>
                          document
                            .getElementById(`file-input-${template.id}`)
                            ?.click()
                        }
                      >
                        <input
                          type="file"
                          id={`file-input-${template.id}`}
                          className="hidden"
                          multiple
                          accept=".docx,.pdf,.txt"
                          onChange={(e) => handleFileInput(e, template.id)}
                        />
                        {uploading === template.id ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 border-2 border-[#4A7C6F] border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-[#6B7280]">
                              {uploadStatus || "Uploading..."}
                            </p>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-[#6B7280] mx-auto mb-2" />
                            <p className="text-sm text-[#111827] font-medium">
                              Drag and drop files here, or click to browse
                            </p>
                            <p className="text-xs text-[#6B7280] mt-1">
                              Supports .docx, .pdf, .txt files
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">{uploadError}</p>
                      </div>
                    )}

                    {/* Uploaded Files */}
                    {template.uploads && template.uploads.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-[#111827] mb-2">
                          Uploaded Files
                        </h4>
                        <div className="space-y-2">
                          {template.uploads.map((upload) => (
                            <div
                              key={upload.id}
                              className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <File className="h-4 w-4 text-[#6B7280]" />
                                <div>
                                  <p className="text-sm text-[#111827]">
                                    {upload.filename}
                                  </p>
                                  <p className="text-xs text-[#6B7280]">
                                    {formatFileSize(upload.fileSize)} &middot;{" "}
                                    {formatDate(upload.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  deleteUpload(template.id, upload.id)
                                }
                                className="p-1 text-[#6B7280] hover:text-red-500 transition-colors rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analysis Status */}
                    <div>
                      <h4 className="text-sm font-medium text-[#111827] mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#4A7C6F]" />
                        Analysis Status
                      </h4>
                      {template.systemPrompt ? (
                        <div className="bg-[#4A7C6F]/5 border border-[#4A7C6F]/20 rounded-lg p-4">
                          <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">
                            {template.systemPrompt.length > 400
                              ? template.systemPrompt.slice(0, 400) + "..."
                              : template.systemPrompt}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-amber-700">
                            No analysis yet. Upload example proposals and the
                            system will analyze them to build a generation
                            prompt.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Delete Template */}
                    <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                        loading={deleting === template.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Template
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
