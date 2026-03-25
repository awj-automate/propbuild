"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Save, Shield, User, Key, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
  const { data: session } = useSession();

  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keySuccess, setKeySuccess] = useState(false);
  const [keyError, setKeyError] = useState("");

  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.anthropicKey) {
            setMaskedKey(data.anthropicKey);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    }
    fetchSettings();
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    setKeyError("");
    setKeySuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicKey: apiKey.trim() }),
      });

      if (res.ok) {
        setKeySuccess(true);
        setMaskedKey(apiKey.trim().slice(-4));
        setApiKey("");
        setTimeout(() => setKeySuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setKeyError(data.error || "Failed to save API key.");
      }
    } catch {
      setKeyError("An error occurred. Please try again.");
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827]">Settings</h1>
        <p className="text-[#6B7280] mt-1">
          Manage your account and API configuration.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#6B7280]" />
              <h2 className="text-base font-semibold text-[#111827]">
                Account
              </h2>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                Name
              </label>
              <p className="text-sm text-[#111827]">
                {session?.user?.name || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                Email
              </label>
              <p className="text-sm text-[#111827]">
                {session?.user?.email || "Not set"}
              </p>
            </div>
          </div>
        </Card>

        {/* API Key */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-[#6B7280]" />
              <h2 className="text-base font-semibold text-[#111827]">
                Anthropic API Key
              </h2>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Your API key is used to generate proposals with Claude. It is
              encrypted and stored securely.
            </p>

            {maskedKey && !apiKey && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-4 w-4 text-[#4A7C6F] shrink-0" />
                  <span className="text-sm text-[#6B7280] font-mono truncate">
                    {"••••••••••••" + maskedKey.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("Remove your API key? Template analysis and proposal generation will stop working.")) return;
                    const res = await fetch("/api/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ anthropicKey: "" }),
                    });
                    if (res.ok) {
                      setMaskedKey("");
                    }
                  }}
                  className="p-1.5 text-[#6B7280] hover:text-red-500 transition-colors rounded"
                  title="Remove API key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Input
                  label={maskedKey ? "Update API Key" : "API Key"}
                  type={showKey ? "text" : "password"}
                  placeholder="sk-ant-api03-..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyError("");
                    setKeySuccess(false);
                  }}
                  helperText="Get your key from console.anthropic.com"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-[34px] text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                variant="primary"
                onClick={saveApiKey}
                loading={savingKey}
                disabled={!apiKey.trim()}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>

            {keySuccess && (
              <p className="text-sm text-[#4A7C6F] font-medium">
                API key saved successfully.
              </p>
            )}
            {keyError && (
              <p className="text-sm text-red-500">{keyError}</p>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
