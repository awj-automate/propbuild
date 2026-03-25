"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ImageIcon, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface Template {
  id: string;
  name: string;
}

export default function NewProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regenerateId = searchParams.get("regenerate");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingPrefill, setLoadingPrefill] = useState(!!regenerateId);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [templateId, setTemplateId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [scope, setScope] = useState("");
  const [customization, setCustomization] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!regenerateId) return;
    async function fetchProposal() {
      try {
        const res = await fetch(`/api/proposals/${regenerateId}`);
        if (res.ok) {
          const data = await res.json();
          setTemplateId(data.templateId || "");
          setCustomerName(data.customerName || "");
          setContactFirst(data.contactFirst || "");
          setContactLast(data.contactLast || "");
          setScope(data.scope || "");
          setCustomization(data.customization || "");
          if (data.logoUrl) {
            setLogoPreview(data.logoUrl);
          }
        }
      } catch (err) {
        console.error("Failed to fetch proposal for regeneration:", err);
      } finally {
        setLoadingPrefill(false);
      }
    }
    fetchProposal();
  }, [regenerateId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!scope.trim()) {
      setError("Scope & pricing description is required.");
      return;
    }

    setError("");
    setGenerating(true);

    try {
      const body: Record<string, string | undefined> = {
        templateId: templateId || undefined,
        customerName: customerName.trim(),
        contactFirst: contactFirst.trim() || undefined,
        contactLast: contactLast.trim() || undefined,
        scope: scope.trim(),
        customization: customization.trim() || undefined,
        logoUrl: logoPreview || undefined,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate proposal");
      }

      const data = await res.json();
      router.push(`/dashboard/proposals/${data.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the proposal.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827]">
          {regenerateId ? "Regenerate Proposal" : "Create New Proposal"}
        </h1>
        <p className="text-[#6B7280] mt-1">
          {regenerateId
            ? "Adjust the details below and regenerate."
            : "Fill in the details and let AI generate a professional proposal."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selector */}
        <Card>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Template
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A7C6F]/30 focus:border-[#4A7C6F]"
              >
                <option value="">
                  {loadingTemplates
                    ? "Loading templates..."
                    : "No template (free-form)"}
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[#6B7280]">
                Select a template to match its style and structure.
              </p>
            </div>

            {/* Customer Name */}
            <Input
              label="Customer Name"
              placeholder="Acme Corporation"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />

            {/* Contact Name */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact First Name"
                placeholder="Jane"
                value={contactFirst}
                onChange={(e) => setContactFirst(e.target.value)}
              />
              <Input
                label="Contact Last Name"
                placeholder="Doe"
                value={contactLast}
                onChange={(e) => setContactLast(e.target.value)}
              />
            </div>

            {/* Scope & Pricing */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Scope & Pricing
              </label>
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Describe the scope of work and pricing in plain language..."
                rows={6}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A7C6F]/30 focus:border-[#4A7C6F] resize-y"
                required
              />
            </div>

            {/* Customer Logo */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Customer Logo
              </label>
              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Customer logo preview"
                    className="h-20 w-auto rounded-lg border border-[#E5E7EB] object-contain p-2 bg-white"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() =>
                    document.getElementById("logo-input")?.click()
                  }
                  className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center cursor-pointer hover:border-[#4A7C6F]/50 hover:bg-gray-50/50 transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-[#6B7280] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280]">
                    Click to upload a logo image
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    PNG, JPG, SVG
                  </p>
                </div>
              )}
              <input
                type="file"
                id="logo-input"
                className="hidden"
                accept="image/*"
                onChange={handleLogoChange}
              />
            </div>

            {/* Customization */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Anything else to customize?
              </label>
              <textarea
                value={customization}
                onChange={(e) => setCustomization(e.target.value)}
                placeholder="Any additional notes, tone preferences, specific sections to include..."
                rows={3}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A7C6F]/30 focus:border-[#4A7C6F] resize-y"
              />
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={generating}
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating Proposal..." : "Generate Proposal"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.back()}
            disabled={generating}
          >
            Cancel
          </Button>
        </div>

        {/* Generating Overlay */}
        {generating && (
          <Card>
            <div className="flex items-center gap-4 py-2">
              <div className="h-10 w-10 rounded-full bg-[#4A7C6F]/10 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-[#4A7C6F] border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  Generating your proposal...
                </p>
                <p className="text-xs text-[#6B7280]">
                  This usually takes 15-30 seconds. Please do not navigate away.
                </p>
              </div>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}
