"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FileText,
  Upload,
  Plus,
  ChevronRight,
  Clock,
  BarChart3,
  Layers,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Proposal {
  id: string;
  customerName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  template?: { name: string } | null;
}

interface DashboardStats {
  totalProposals: number;
  activeTemplates: number;
  generatedThisMonth: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalProposals: 0,
    activeTemplates: 0,
    generatedThisMonth: 0,
  });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, proposalsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/proposals?limit=5"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (proposalsRes.ok) {
          const proposalsData = await proposalsRes.json();
          setProposals(proposalsData.proposals || proposalsData || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: "Total Proposals",
      value: stats.totalProposals,
      icon: FileText,
      color: "text-[#4A7C6F]",
      bg: "bg-[#4A7C6F]/10",
    },
    {
      label: "Active Templates",
      value: stats.activeTemplates,
      icon: Layers,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Generated This Month",
      value: stats.generatedThisMonth,
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    const styles =
      status === "final"
        ? "bg-[#4A7C6F]/10 text-[#4A7C6F]"
        : "bg-amber-50 text-amber-700";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827]">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-[#6B7280] mt-1">
          Here is an overview of your proposal activity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link href="/dashboard/proposals/new">
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </Link>
        <Link href="/dashboard/templates">
          <Button variant="secondary" size="md">
            <Upload className="h-4 w-4" />
            Upload Template
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center gap-4">
                <div
                  className={`h-11 w-11 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-[#6B7280]">{stat.label}</p>
                  <p className="text-2xl font-semibold text-[#111827]">
                    {loading ? (
                      <span className="inline-block h-7 w-10 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Proposals */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#111827]">
              Recent Proposals
            </h2>
            <Link
              href="/dashboard/proposals"
              className="text-sm text-[#4A7C6F] hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
        padding={false}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-10 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-[#6B7280]" />
            </div>
            <p className="text-sm text-[#6B7280] mb-3">
              No proposals yet. Create your first one!
            </p>
            <Link href="/dashboard/proposals/new">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                New Proposal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Template
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {proposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#111827]">
                        {proposal.customerName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#6B7280]">
                        {proposal.template?.name || "No template"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(proposal.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {statusBadge(proposal.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/proposals/${proposal.id}`}
                        className="text-sm text-[#4A7C6F] hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
