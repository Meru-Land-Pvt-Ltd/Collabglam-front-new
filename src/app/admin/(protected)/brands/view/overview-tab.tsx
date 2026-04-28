"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandDetail, BrandTab } from "./types";
import { formatDate, getOverviewTeam } from "./utils";
import { InfoRow, SectionCard, StatusPill } from "./shared";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableExpandable,
} from "../../../components/table";

type BrandInfoRow = {
  id: string;
  field: string;
  value: React.ReactNode;
};

type TeamRow = {
  id: string;
  role: string;
  assignedUser: string;
  status: "Assigned" | "Unassigned";
};

type OnboardingStatus = "Completed" | "Skipped" | "Pending";

type OnboardingItem = {
  question: string;
  answers: string[];
};

type OnboardingMetaRow = {
  id: string;
  page: "Page 1" | "Page 2" | "Page 3" | "Profile Picture";
  status: OnboardingStatus;
  skipped: boolean;
  skippedLabel: string;
  responsesCount: number;
  updatedAt: string;
  items: OnboardingItem[];
};

type OnboardingSection = {
  page: "Page 1" | "Page 2" | "Page 3";
  skipped: boolean;
  items: OnboardingItem[];
};

function getPageStatus(
  skipped: boolean,
  items: Array<{ question: string; answers: string[] }>
): OnboardingStatus {
  if (skipped) return "Skipped";
  if (items.length > 0) return "Completed";
  return "Pending";
}

function renderStatusPill(status: OnboardingStatus | "Assigned" | "Unassigned") {
  if (status === "Completed" || status === "Assigned") {
    return <StatusPill label={status} tone="success" />;
  }

  if (status === "Skipped") {
    return <StatusPill label="Skipped" tone="danger" />;
  }

  return <StatusPill label={status} tone="warning" />;
}

function OverviewMetric({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-[24px] border border-black/10 bg-white shadow-none">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
            {title}
          </p>
          <div className="mt-2 text-[22px] font-black leading-none text-[#1a1a1a]">
            {value}
          </div>
          <p className="mt-2 text-xs font-medium text-black/50">{hint}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.04] text-black/65">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BrandOverviewTab({
  brand,
  onAddTeam,
  onManageTeam,
}: {
  brand: BrandDetail;
  onTabChange: (tab: BrandTab) => void;
  onRefresh: () => void;
  onCreateCampaign: () => void;
  onAddTeam?: () => void;
  onManageTeam?: () => void;
}) {
  const [expandedOnboardingRowId, setExpandedOnboardingRowId] = useState<string | null>("Page 1");

  const currentPlanName = brand.subscription?.planName || brand.planName || "—";
  const teamRowsRaw = getOverviewTeam(brand);

  const onboardingSections = useMemo<OnboardingSection[]>(
    () => [
      {
        page: "Page 1",
        skipped: Boolean(brand.ispage1Skip),
        items: (brand.page1 || []).map((item) => ({
          question: item.question || "",
          answers: item.answers || [],
        })),
      },
      {
        page: "Page 2",
        skipped: Boolean(brand.ispage2Skip),
        items: (brand.page2 || []).map((item) => ({
          question: item.question || "",
          answers: item.answers || [],
        })),
      },
      {
        page: "Page 3",
        skipped: Boolean(brand.ispage3Skip),
        items: (brand.page3 || []).map((item) => ({
          question: item.question || "",
          answers: item.answers || [],
        })),
      },
    ],
    [brand]
  );

  const completedPagesCount = onboardingSections.filter(
    (section) => getPageStatus(section.skipped, section.items) === "Completed"
  ).length;

  const totalOnboardingQuestions = onboardingSections.reduce(
    (sum, section) => sum + section.items.length,
    0
  );

  const totalOnboardingAnswers = onboardingSections.reduce(
    (sum, section) =>
      sum + section.items.reduce((inner, item) => inner + (item.answers?.length || 0), 0),
    0
  );

  const assignedTeamCount = useMemo(
    () => teamRowsRaw.filter((item) => item.value !== "Unassigned").length,
    [teamRowsRaw]
  );

  const profilePictureStatus: OnboardingStatus = brand.isProfilePicSkip
    ? "Skipped"
    : brand.profilePic
      ? "Completed"
      : "Pending";

  const onboardingMetaRows = useMemo<OnboardingMetaRow[]>(
    () => [
      ...onboardingSections.map((section) => {
        const status = getPageStatus(section.skipped, section.items);

        return {
          id: section.page,
          page: section.page,
          status,
          skipped: section.skipped,
          skippedLabel: section.skipped ? "Yes" : "No",
          responsesCount: section.items.length,
          updatedAt: status === "Pending" ? "—" : formatDate(brand.updatedAt),
          items: section.items,
        };
      }),
      {
        id: "profile-picture",
        page: "Profile Picture",
        status: profilePictureStatus,
        skipped: Boolean(brand.isProfilePicSkip),
        skippedLabel: brand.isProfilePicSkip ? "Yes" : "No",
        responsesCount: brand.profilePic ? 1 : 0,
        updatedAt:
          brand.isProfilePicSkip || brand.profilePic ? formatDate(brand.updatedAt) : "—",
        items: [],
      },
    ],
    [brand, onboardingSections, profilePictureStatus]
  );

  const brandInfoRows = useMemo<BrandInfoRow[]>(
    () => [
      { id: "brandName", field: "Brand Name", value: brand.brandName || "—" },
      { id: "contactName", field: "Contact Name", value: brand.name || "—" },
      { id: "email", field: "Contact Email", value: brand.email || "—" },
      { id: "proxyEmail", field: "Proxy Email", value: brand.proxyEmail || "—" },
      { id: "industry", field: "Industry", value: brand.industry || "—" },
      { id: "companySize", field: "Company Size", value: brand.companySize || "—" },
      {
        id: "accountStatus",
        field: "Account Status",
        value: brand.subscriptionExpired ? (
          <StatusPill label="Expired" tone="danger" />
        ) : (
          <StatusPill label={brand.subscription?.status || "Active"} tone="success" />
        ),
      },
      {
        id: "assignmentStatus",
        field: "Assignment Status",
        value: brand.assignmentStatus || (brand.subscriptionExpired ? "Expired" : "Active"),
      },
      {
        id: "subscriptionPlan",
        field: "Subscription Plan",
        value: (
          <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-black text-[#1a1a1a]">
            {currentPlanName}
          </span>
        ),
      },
      {
        id: "billingCycle",
        field: "Billing Cycle",
        value: brand.subscription?.billingCycle || "—",
      },
      {
        id: "subscriptionStarted",
        field: "Subscription Started",
        value: formatDate(brand.subscription?.startedAt),
      },
      {
        id: "subscriptionExpires",
        field: "Subscription Expires",
        value: formatDate(brand.subscription?.expiresAt || brand.expiresAt),
      },
    ],
    [brand, currentPlanName]
  );

  const teamRows = useMemo<TeamRow[]>(
    () =>
      teamRowsRaw.map((item) => ({
        id: item.role,
        role: item.role,
        assignedUser: item.value,
        status: item.value === "Unassigned" ? "Unassigned" : "Assigned",
      })),
    [teamRowsRaw]
  );

  const commonHeaderClass =
    "text-[11px] font-black uppercase tracking-[0.14em] text-black/45";

  const brandInfoColumns = useMemo<AdminTableColumn<BrandInfoRow>[]>(
    () => [
      {
        id: "field",
        header: "Field",
        widthClassName: "w-[34%]",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-bold text-black/45",
        render: (row) => row.field,
      },
      {
        id: "value",
        header: "Value",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-semibold text-[#1a1a1a]",
        render: (row) => row.value,
      },
    ],
    []
  );

  const onboardingMetaColumns = useMemo<AdminTableColumn<OnboardingMetaRow>[]>(
    () => [
      {
        id: "page",
        header: "Section",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-extrabold text-[#1a1a1a]",
        render: (row) => row.page,
      },
      {
        id: "status",
        header: "Status",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center",
        render: (row) => renderStatusPill(row.status),
      },
      {
        id: "skipped",
        header: "Skipped",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center text-sm font-semibold text-[#1a1a1a]",
        render: (row) => row.skippedLabel,
      },
      {
        id: "responsesCount",
        header: "Responses",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center text-sm font-semibold text-[#1a1a1a]",
        render: (row) => row.responsesCount,
      },
      {
        id: "updatedAt",
        header: "Updated",
        align: "right",
        headerClassName: commonHeaderClass,
        cellClassName: "text-right text-sm font-semibold text-black/55",
        render: (row) => row.updatedAt,
      },
    ],
    []
  );

  const teamColumns = useMemo<AdminTableColumn<TeamRow>[]>(
    () => [
      {
        id: "role",
        header: "Role",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-extrabold text-[#1a1a1a]",
        render: (row) => row.role,
      },
      {
        id: "assignedUser",
        header: "Assigned User",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-semibold text-[#1a1a1a]",
        render: (row) =>
          row.assignedUser === "Unassigned" ? (
            <span className="italic text-black/35">— Unassigned —</span>
          ) : (
            row.assignedUser
          ),
      },
      {
        id: "status",
        header: "Status",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center",
        render: (row) => renderStatusPill(row.status),
      },
    ],
    []
  );

  const onboardingExpandable = useMemo<AdminTableExpandable<OnboardingMetaRow>>(
    () => ({
      expandedRowId: expandedOnboardingRowId,
      onToggle: (rowId) => {
        setExpandedOnboardingRowId((prev) => (prev === rowId ? null : rowId));
      },
      canExpand: (row) => row.page !== "Profile Picture",
      expandedRowClassName: "bg-black/[0.02]",
      expandedCellClassName: "px-6 py-5",
      renderExpandedRow: (row) => {
        if (row.skipped) {
          return (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm font-medium text-black/55">
              This onboarding page was skipped.
            </div>
          );
        }

        if (!row.items.length) {
          return (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm font-medium text-black/55">
              No questions or answers are available for this page yet.
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {row.items.map((item, index) => (
              <div
                key={`${row.id}-question-${index}`}
                className="rounded-[20px] border border-black/8 bg-white p-4"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/40">
                  Question {index + 1}
                </p>

                <p className="mt-2 text-sm font-semibold text-[#1a1a1a]">
                  {item.question || "No question available"}
                </p>

                <div className="mt-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/40">
                    Answers
                  </p>

                  {item.answers?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.answers.map((answer, answerIndex) => (
                        <span
                          key={`${row.id}-answer-${index}-${answerIndex}`}
                          className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a]"
                        >
                          {answer}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-black/55">
                      No answer recorded.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      },
    }),
    [expandedOnboardingRowId]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric
          title="Plan"
          value={currentPlanName}
          hint="Current subscription plan"
          icon={CreditCard}
        />
        <OverviewMetric
          title="Wallet"
          value={`$${Number(brand.walletBalance || 0).toFixed(2)}`}
          hint="Available brand balance"
          icon={Wallet}
        />
        <OverviewMetric
          title="Team Assigned"
          value={`${assignedTeamCount}/${teamRowsRaw.length || 0}`}
          hint="Assigned team roles"
          icon={Users}
        />
        <OverviewMetric
          title="Onboarding"
          value={`${completedPagesCount}/3`}
          hint={`${totalOnboardingAnswers} answers across ${totalOnboardingQuestions} questions`}
          icon={ShieldCheck}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr,0.95fr]">
        <div className="space-y-6">
          <SectionCard
            title="Brand Profile"
            description="Core account, billing, and contact details."
          >
            <AdminTable<BrandInfoRow>
              data={brandInfoRows}
              columns={brandInfoColumns}
              rowKey={(row) => row.id}
              tableClassName="min-w-full"
              headerRowClassName="border-black/6"
              bodyClassName="[&_tr:last-child]:border-b-0"
              emptyTitle="No brand info found"
              emptyDescription="Brand details are not available right now."
              rowClassName={() => "hover:bg-black/[0.02]"}
            />
          </SectionCard>

          <SectionCard
            title="Onboarding Overview"
            description="Expandable onboarding summary with questions and answers inside the admin table."
          >
            <AdminTable<OnboardingMetaRow>
              data={onboardingMetaRows}
              columns={onboardingMetaColumns}
              rowKey={(row) => row.id}
              expandable={onboardingExpandable}
              tableClassName="min-w-full"
              headerRowClassName="border-black/6"
              bodyClassName="[&_tr:last-child]:border-b-0"
              emptyTitle="No onboarding summary found"
              emptyDescription="Onboarding summary data is not available."
              rowClassName={(_, __, isExpanded) =>
                isExpanded ? "bg-black/[0.02]" : "hover:bg-black/[0.02]"
              }
            />
          </SectionCard>

          <SectionCard
            title="Assigned Team"
            description="Team ownership and assignment status managed directly from Overview."
            action={
              <div className="flex flex-wrap gap-2">
                <Button
                  className="rounded-full bg-[#1a1a1a] text-white hover:bg-black"
                  onClick={onAddTeam}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-black/10 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                  onClick={onManageTeam}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </div>
            }
          >
            <AdminTable<TeamRow>
              data={teamRows}
              columns={teamColumns}
              rowKey={(row) => row.id}
              tableClassName="min-w-full"
              headerRowClassName="border-black/6"
              bodyClassName="[&_tr:last-child]:border-b-0"
              emptyTitle="No team members found"
              emptyDescription="No team assignments are available yet. Use Add Team to assign owners directly from Overview."
              rowClassName={() => "hover:bg-black/[0.02]"}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Status Center"
            description="A concise operational snapshot without repeating the full profile."
          >
            <div className="grid gap-3 p-5">
              <InfoRow
                label="Plan Health"
                value={
                  brand.subscriptionExpired ? (
                    <StatusPill label="Expired" tone="danger" />
                  ) : (
                    <StatusPill label="Healthy" tone="success" />
                  )
                }
                icon={ShieldCheck}
              />
              <InfoRow
                label="Auto Renew"
                value={brand.subscription?.autoRenew ? "Enabled" : "Disabled"}
                icon={RefreshCw}
              />
              <InfoRow
                label="Profile Picture"
                value={renderStatusPill(profilePictureStatus)}
                icon={ImageIcon}
              />
              <InfoRow
                label="Failed Login Attempts"
                value={brand.failedLoginAttempts ?? 0}
                icon={Activity}
              />
              <InfoRow
                label="Created Date"
                value={formatDate(brand.createdAt)}
                icon={FileText}
              />
              <InfoRow
                label="Last Updated"
                value={formatDate(brand.updatedAt)}
                icon={Activity}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}