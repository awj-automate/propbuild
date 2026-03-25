"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Key, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function SetupPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;

    if (!apiKey.trim().startsWith("sk-ant-")) {
      setError("That doesn't look like a valid Anthropic API key. Keys start with sk-ant-.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicKey: apiKey.trim() }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save API key.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          <h1 className="text-2xl font-semibold text-center text-[#111827] mb-2">
            One more step
          </h1>
          <p className="text-sm text-[#6B7280] text-center mb-8">
            PropBuild uses Claude to analyze your templates and generate
            proposals. Add your Anthropic API key to get started.
          </p>

          <div className="space-y-4">
            <div className="bg-[#4A7C6F]/5 border border-[#4A7C6F]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-[#4A7C6F] mt-0.5 shrink-0" />
                <div className="text-sm text-[#374151]">
                  <p className="font-medium mb-1">Where to get your API key</p>
                  <ol className="list-decimal list-inside space-y-1 text-[#6B7280]">
                    <li>
                      Go to{" "}
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4A7C6F] underline hover:text-[#3d6b5f]"
                      >
                        console.anthropic.com
                      </a>
                    </li>
                    <li>Create a new API key</li>
                    <li>Copy and paste it below</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Anthropic API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="sk-ant-api03-..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[var(--border)] bg-white text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4A7C6F]/20 focus:border-[#4A7C6F] transition-colors font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#6B7280]">
                Your key is stored securely and only used for API calls.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              onClick={saveApiKey}
              disabled={!apiKey.trim() || saving}
              className="w-full py-2.5 px-4 rounded-lg bg-[#4A7C6F] hover:bg-[#3d6b5f] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4A7C6F]/20 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  Continue to PropBuild
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-xs text-center text-[#9CA3AF]">
            You can update or remove your API key anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
