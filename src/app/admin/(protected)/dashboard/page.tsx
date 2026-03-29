"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Crown,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Mail,
  RefreshCcw,
  Shield,
  TrendingUp,
  UserCircle2,
  Users,
} from "lucide-react";

type AdminRole = "super_admin" | "revenue_head" | "ime" | "bme";

type AdminMeResponse = {
  _id: string;
  email: string;
  name?: string;
  role: AdminRole;
  status: string;
  proxyEmail?: string;
  permissions?: Array<{
    key: string;
    name?: string;
    isEdit?: boolean;
    isDelete?: boolean;
    isManager?: boolean;
  }>;
  lastLoginAt?: string;
  createdAt?: string;
};

type ExecutiveAdmin = {
  _id: string;
  name?: string;
  email: string;
  role: AdminRole;
  status: string;
  proxyEmail?: string;
  parentAdmin?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  createdAt?: string;
  lastLoginAt?: string;
};

type CampaignItem = {
  _id: string;
  brandName?: string;
  campaignTitle?: string;
  campaignType?: string;
  campaignCategory?: string;
  publishStatus?: string;
  status?: string;
  campaignBudget?: number;
  budget?: number;
  influencerBudget?: number;
  numberOfInfluencers?: number;
  startAt?: string;
  endAt?: string;
  createdAt?: string;
};

type BrandAllocation = {
  _id: string;
  brandId?: {
    _id?: string;
    brandName?: string;
    companyName?: string;
    website?: string;
  };
  RHId?: string;
  bdmId?: string;
  idmId?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

type ManagedBrand = {
  _id: string;
  brandName?: string;
  companyName?: string;
  website?: string;
  assignedRm?: string;
  assignedBm?: string;
  assignedIm?: string;
  subscription?: {
    status?: string;
  };
};

type DashboardState = {
  me: AdminMeResponse | null;
  campaigns: CampaignItem[];
  myAllocations: BrandAllocation[];
  bmeTeam: ExecutiveAdmin[];
  imeTeam: ExecutiveAdmin[];
  allRevenueHeads: ExecutiveAdmin[];
  managedBrands: ManagedBrand[];
};

type SectionErrorMap = {
  me?: string | null;
  campaigns?: string | null;
  allocations?: string | null;
  bmeTeam?: string | null;
  imeTeam?: string | null;
  revenueHeads?: string | null;
  managedBrands?: string | null;
};

type SafeResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

type ActionItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  description: string;
  priority: number;
};

const API = {
  me: "/admins/me",
  campaigns: "/admins/campaign/list",
  executives: "/admins/get-executive-list",
  revenueHeads: "/admins/get-rm-list",
  allocatedBrands: "/admins/get-brand-list",
  managedBrands: "/admins/fully-managed-brand-list",
};

const VALID_ROLES: AdminRole[] = ["super_admin", "revenue_head", "ime", "bme"];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatMoney(value?: number) {
  if (value == null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function titleCaseRole(role?: string) {
  if (!role) return "-";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRoleTone(role?: AdminRole) {
  if (role === "super_admin") return "bg-violet-100 text-violet-700";
  if (role === "revenue_head") return "bg-blue-100 text-blue-700";
  if (role === "bme") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function getDashboardTitle(role?: AdminRole) {
  if (role === "super_admin") return "Super Admin Dashboard";
  if (role === "revenue_head") return "Revenue Head Dashboard";
  if (role === "bme") return "BME Dashboard";
  return "IME Dashboard";
}

function getDashboardSubtitle(role?: AdminRole) {
  if (role === "super_admin") {
    return "See platform-wide teams, brands, campaigns, and management visibility in one place.";
  }
  if (role === "revenue_head") {
    return "Track your team, monitor campaigns, and move quickly to high-priority workflows.";
  }
  if (role === "bme") {
    return "Focus on assigned brands, campaigns, and communication without extra clutter.";
  }
  return "Manage influencer work, campaign visibility, and important operational actions.";
}

function getPublishSummary(campaigns: CampaignItem[]) {
  return campaigns.reduce((acc, item) => {
    const key = String(item.publishStatus || item.status || "draft").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function extractArray<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function extractObject<T = any>(payload: any): T | null {
  if (!payload) return null;
  if (
    payload?.data?.data &&
    typeof payload.data.data === "object" &&
    !Array.isArray(payload.data.data)
  ) {
    return payload.data.data as T;
  }
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data as T;
  }
  return null;
}

function getErrorMessage(error: any, fallback: string) {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.message;
  const genericMessage = error?.message;

  if (status === 404) return `${fallback} endpoint not available yet`;
  if (status === 403) return `${fallback} access denied`;
  if (status === 401) return `${fallback} unauthorized`;
  return apiMessage || genericMessage || fallback;
}

async function safeGet<T = any>(
  url: string,
  config?: any,
  fallbackLabel = "Request"
): Promise<SafeResult<T>> {
  try {
    const response = await api.get(url, config);
    return {
      ok: true,
      data: response?.data as T,
      error: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      data: null,
      error: getErrorMessage(error, fallbackLabel),
    };
  }
}

function getPriorityActions(role?: AdminRole): ActionItem[] {
  const common: ActionItem[] = [
    {
      title: "Open Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Go to your admin overview",
      priority: 1,
    },
    {
      title: "Open Campaigns",
      href: "/admin/campaigns",
      icon: FolderKanban,
      description: "View and manage campaigns",
      priority: 2,
    },
    {
      title: "Open Messages",
      href: "/admin/messages",
      icon: Mail,
      description: "Check communication and updates",
      priority: 6,
    },
  ];

  if (role === "super_admin") {
    return [
      ...common,
      {
        title: "Manage Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "Platform-wide brand control",
        priority: 3,
      },
      {
        title: "Manage Employees",
        href: "/admin/employees",
        icon: Shield,
        description: "See admins and executive users",
        priority: 4,
      },
      {
        title: "Manage Roles",
        href: "/admin/role",
        icon: Crown,
        description: "Access and permission control",
        priority: 5,
      },
      {
        title: "View Influencers",
        href: "/admin/influencers",
        icon: Users,
        description: "Open influencer operations",
        priority: 7,
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  if (role === "revenue_head") {
    return [
      ...common,
      {
        title: "Manage Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "See assigned brands",
        priority: 3,
      },
      {
        title: "Track Pipeline",
        href: "/admin/influencer-pipeline",
        icon: TrendingUp,
        description: "Follow team progress",
        priority: 4,
      },
      {
        title: "Subscriptions",
        href: "/admin/subscriptions",
        icon: Briefcase,
        description: "Billing and plans",
        priority: 5,
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  if (role === "bme") {
    return [
      ...common,
      {
        title: "Manage Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "Open assigned brands",
        priority: 3,
      },
      {
        title: "Inbound Emails",
        href: "/admin/inbound-emails",
        icon: Mail,
        description: "Check lead communication",
        priority: 4,
      },
      {
        title: "Documents",
        href: "/admin/documents",
        icon: Shield,
        description: "Reference docs and policies",
        priority: 5,
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  return [
    ...common,
    {
      title: "Influencers",
      href: "/admin/influencers",
      icon: Users,
      description: "Manage influencer records",
      priority: 3,
    },
    {
      title: "Influencer Data",
      href: "/admin/influencer-data",
      icon: BarChart3,
      description: "Open performance data",
      priority: 4,
    },
    {
      title: "Track Pipeline",
      href: "/admin/influencer-pipeline",
      icon: TrendingUp,
      description: "Manage outreach flow",
      priority: 5,
    },
    {
      title: "Documents",
      href: "/admin/documents",
      icon: Shield,
      description: "Reference operational docs",
      priority: 6,
    },
  ].sort((a, b) => a.priority - b.priority);
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [state, setState] = useState<DashboardState>({
    me: null,
    campaigns: [],
    myAllocations: [],
    bmeTeam: [],
    imeTeam: [],
    allRevenueHeads: [],
    managedBrands: [],
  });

  const [sectionErrors, setSectionErrors] = useState<SectionErrorMap>({});

  const role = state.me?.role;
  const actions = useMemo(() => getPriorityActions(role), [role]);
  const publishSummary = useMemo(() => getPublishSummary(state.campaigns), [state.campaigns]);

  const visibleErrorCount = useMemo(
    () => Object.values(sectionErrors).filter(Boolean).length,
    [sectionErrors]
  );

  const totalBudget = useMemo(() => {
    return state.campaigns.reduce((sum, item) => {
      return sum + Number(item.campaignBudget || item.budget || item.influencerBudget || 0);
    }, 0);
  }, [state.campaigns]);

  const topActions = useMemo(() => actions.slice(0, 4), [actions]);

  const loadDashboard = async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setFatalError(null);
      setSectionErrors({});

      const meResult = await safeGet<any>(API.me, undefined, "Profile");

      if (!meResult.ok || !meResult.data) {
        const message = meResult.error || "Unable to verify admin profile";
        setFatalError(message);

        if (
          String(message).toLowerCase().includes("unauthorized") ||
          String(message).toLowerCase().includes("access denied")
        ) {
          router.replace("/admin/login");
        }
        return;
      }

      const me = extractObject<AdminMeResponse>(meResult.data) || (meResult.data as AdminMeResponse);

      if (!me?.role || !VALID_ROLES.includes(me.role)) {
        router.replace("/admin/login");
        return;
      }

      const nextState: DashboardState = {
        me,
        campaigns: [],
        myAllocations: [],
        bmeTeam: [],
        imeTeam: [],
        allRevenueHeads: [],
        managedBrands: [],
      };

      const nextErrors: SectionErrorMap = {
        me: null,
        campaigns: null,
        allocations: null,
        bmeTeam: null,
        imeTeam: null,
        revenueHeads: null,
        managedBrands: null,
      };

      const requestEntries: Array<{
        key: keyof SectionErrorMap;
        request: Promise<SafeResult<any>>;
      }> = [
        {
          key: "campaigns",
          request: safeGet<any>(API.campaigns, undefined, "Campaigns"),
        },
      ];

      if (me.role === "bme" || me.role === "ime") {
        requestEntries.push({
          key: "allocations",
          request: safeGet<any>(API.allocatedBrands, undefined, "Allocated brands"),
        });
      }

      if (me.role === "revenue_head" || me.role === "super_admin") {
        requestEntries.push({
          key: "bmeTeam",
          request: safeGet<any>(API.executives, { params: { role: "bme" } }, "BME team"),
        });
        requestEntries.push({
          key: "imeTeam",
          request: safeGet<any>(API.executives, { params: { role: "ime" } }, "IME team"),
        });
      }

      if (me.role === "super_admin") {
        requestEntries.push({
          key: "revenueHeads",
          request: safeGet<any>(API.revenueHeads, undefined, "Revenue heads"),
        });
        requestEntries.push({
          key: "managedBrands",
          request: safeGet<any>(API.managedBrands, undefined, "Managed brands"),
        });
      }

      const resolved = await Promise.all(requestEntries.map((item) => item.request));

      requestEntries.forEach((entry, index) => {
        const result = resolved[index];

        if (!result.ok) {
          nextErrors[entry.key] = result.error;
          return;
        }

        if (entry.key === "campaigns") {
          nextState.campaigns = extractArray<CampaignItem>(result.data);
        }
        if (entry.key === "allocations") {
          nextState.myAllocations = extractArray<BrandAllocation>(result.data);
        }
        if (entry.key === "bmeTeam") {
          nextState.bmeTeam = extractArray<ExecutiveAdmin>(result.data);
        }
        if (entry.key === "imeTeam") {
          nextState.imeTeam = extractArray<ExecutiveAdmin>(result.data);
        }
        if (entry.key === "revenueHeads") {
          nextState.allRevenueHeads = extractArray<ExecutiveAdmin>(result.data);
        }
        if (entry.key === "managedBrands") {
          nextState.managedBrands = extractArray<any>(result.data).map((item: any) => ({
            _id: item._id,
            brandName: item.brandName,
            companyName: item.companyName,
            website: item.website,
            assignedRm: item.assignedRm,
            assignedBm: item.assignedBm,
            assignedIm: item.assignedIm,
            subscription: item.subscription,
          }));
        }
      });

      setState(nextState);
      setSectionErrors(nextErrors);
    } catch (error: any) {
      setFatalError(error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard("initial");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-[28px] border border-rose-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Unable to open dashboard</h1>
                  <p className="mt-2 text-sm text-slate-600">{fatalError}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Your login may have expired or the profile API is unavailable.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void loadDashboard("refresh")}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                >
                  <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  Retry
                </button>

                <button
                  onClick={() => router.replace("/admin/login")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Go to Login
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getPriorityActions("super_admin").slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-slate-50"
                >
                  <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                  <Shield className="h-3.5 w-3.5" />
                  Priority Overview
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {getDashboardTitle(role)}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {getDashboardSubtitle(role)}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">
                    {titleCaseRole(role)}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                    {state.me?.email || "-"}
                  </span>
                  {visibleErrorCount > 0 && (
                    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-200">
                      {visibleErrorCount} section{visibleErrorCount > 1 ? "s" : ""} unavailable
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void loadDashboard("refresh")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  Refresh
                </button>

                <Link
                  href={topActions[1]?.href || "/admin/campaigns"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Priority Action
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
            <KpiCard
              icon={<Briefcase className="h-5 w-5" />}
              label={role === "super_admin" ? "Visible Campaigns" : "Scoped Campaigns"}
              value={String(state.campaigns.length)}
              helper={sectionErrors.campaigns ? "Campaign API unavailable" : "Campaigns visible in your scope"}
              tone={sectionErrors.campaigns ? "warning" : "default"}
            />

            <KpiCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Visible Budget"
              value={formatMoney(totalBudget)}
              helper="Budget based on available campaign records"
            />

            <KpiCard
              icon={<Building2 className="h-5 w-5" />}
              label={role === "super_admin" ? "Managed Brands" : "Allocated Brands"}
              value={String(role === "super_admin" ? state.managedBrands.length : state.myAllocations.length)}
              helper={
                role === "super_admin"
                  ? sectionErrors.managedBrands
                    ? "Managed brands API unavailable"
                    : "Platform-level visibility"
                  : sectionErrors.allocations
                    ? "Allocation API unavailable"
                    : "Assigned to your access scope"
              }
              tone={
                role === "super_admin"
                  ? sectionErrors.managedBrands
                    ? "warning"
                    : "default"
                  : sectionErrors.allocations
                    ? "warning"
                    : "default"
              }
            />

            <KpiCard
              icon={role === "super_admin" ? <Crown className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              label={
                role === "super_admin"
                  ? "Revenue Heads"
                  : role === "revenue_head"
                    ? "Team Size"
                    : "Permissions"
              }
              value={
                role === "super_admin"
                  ? String(state.allRevenueHeads.length)
                  : role === "revenue_head"
                    ? String(state.bmeTeam.length + state.imeTeam.length)
                    : String(state.me?.permissions?.length || 0)
              }
              helper={
                role === "super_admin"
                  ? sectionErrors.revenueHeads
                    ? "Revenue head API unavailable"
                    : "Active leadership accounts"
                  : role === "revenue_head"
                    ? "BME + IME under your visibility"
                    : "Current granted access items"
              }
              tone={
                role === "super_admin" && sectionErrors.revenueHeads ? "warning" : "default"
              }
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card title="Priority Actions" subtitle="Important routes first, without repeated navigation cards">
            <div className="grid gap-3 sm:grid-cols-2">
              {topActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex rounded-2xl bg-white p-3 shadow-sm">
                        <Icon className="h-5 w-5 text-slate-700" />
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
                    </div>
                    <div className="mt-4 text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card title="Admin Profile" subtitle="Important account details only">
            <div className="space-y-3">
              <CompactInfo
                icon={<UserCircle2 className="h-4 w-4" />}
                label="Name"
                value={state.me?.name || "Admin User"}
              />
              <CompactInfo
                icon={<Shield className="h-4 w-4" />}
                label="Role"
                value={titleCaseRole(role)}
                badgeClass={getRoleTone(role)}
              />
              <CompactInfo
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={state.me?.email || "-"}
              />
              <CompactInfo
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Status"
                value={state.me?.status || "-"}
              />
              <CompactInfo
                icon={<Briefcase className="h-4 w-4" />}
                label="Last Login"
                value={formatDate(state.me?.lastLoginAt)}
              />
              <CompactInfo
                icon={<Building2 className="h-4 w-4" />}
                label="Joined"
                value={formatDate(state.me?.createdAt)}
              />
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card
            title="Campaign Status Mix"
            subtitle={
              sectionErrors.campaigns
                ? "Summary unavailable right now"
                : "Quick breakdown of visible campaign statuses"
            }
          >
            {sectionErrors.campaigns ? (
              <SectionWarning text={sectionErrors.campaigns} />
            ) : Object.entries(publishSummary).length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(publishSummary).map(([key, count]) => (
                  <MiniStat key={key} label={key.replace(/_/g, " ")} value={String(count)} />
                ))}
              </div>
            ) : (
              <EmptyText text="No campaign summary available." />
            )}
          </Card>

          <Card title="Recent Visibility Notes" subtitle="Useful status feedback without clutter">
            <div className="space-y-3">
              <NoteRow
                label="Campaigns"
                value={
                  sectionErrors.campaigns
                    ? sectionErrors.campaigns
                    : `${state.campaigns.length} campaign records visible`
                }
                warning={Boolean(sectionErrors.campaigns)}
              />
              <NoteRow
                label={role === "super_admin" ? "Managed Brands" : "Allocated Brands"}
                value={
                  role === "super_admin"
                    ? sectionErrors.managedBrands || `${state.managedBrands.length} managed brands loaded`
                    : sectionErrors.allocations || `${state.myAllocations.length} allocated brands loaded`
                }
                warning={Boolean(role === "super_admin" ? sectionErrors.managedBrands : sectionErrors.allocations)}
              />
              {role === "revenue_head" || role === "super_admin" ? (
                <>
                  <NoteRow
                    label="BME Team"
                    value={sectionErrors.bmeTeam || `${state.bmeTeam.length} BME records loaded`}
                    warning={Boolean(sectionErrors.bmeTeam)}
                  />
                  <NoteRow
                    label="IME Team"
                    value={sectionErrors.imeTeam || `${state.imeTeam.length} IME records loaded`}
                    warning={Boolean(sectionErrors.imeTeam)}
                  />
                </>
              ) : (
                <NoteRow
                  label="Access"
                  value={`${state.me?.permissions?.length || 0} permission items available`}
                />
              )}
            </div>
          </Card>
        </section>

        {(role === "bme" || role === "ime") && (
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card title="Assigned Brands" subtitle="Priority brand visibility for your role">
              {sectionErrors.allocations ? (
                <SectionWarning text={sectionErrors.allocations} />
              ) : (
                <SimpleTable
                  columns={["Brand", "Status", "Updated"]}
                  rows={state.myAllocations.slice(0, 8).map((item) => [
                    item.brandId?.brandName || item.brandId?.companyName || "-",
                    item.status || "-",
                    formatDate(item.updatedAt || item.createdAt),
                  ])}
                  emptyText="No allocated brands found."
                />
              )}
            </Card>

            <Card title="Visible Campaigns" subtitle="Top campaign records in your access scope">
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={["Campaign", "Brand", "Status", "Budget"]}
                  rows={state.campaigns.slice(0, 8).map((item) => [
                    item.campaignTitle || "-",
                    item.brandName || "-",
                    item.publishStatus || item.status || "-",
                    formatMoney(item.campaignBudget || item.budget || item.influencerBudget),
                  ])}
                  emptyText="No campaigns visible for your role."
                />
              )}
            </Card>
          </section>
        )}

        {role === "revenue_head" && (
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card title="Team Overview" subtitle="Your main operational visibility">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniStat label="BME" value={String(state.bmeTeam.length)} />
                <MiniStat label="IME" value={String(state.imeTeam.length)} />
                <MiniStat label="Campaigns" value={String(state.campaigns.length)} />
                <MiniStat label="Total Team" value={String(state.bmeTeam.length + state.imeTeam.length)} />
              </div>
            </Card>

            <Card title="Revenue Head Campaign View" subtitle="Highest priority campaign list for your hierarchy">
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={["Campaign", "Brand", "Publish", "Budget"]}
                  rows={state.campaigns.slice(0, 8).map((item) => [
                    item.campaignTitle || "-",
                    item.brandName || "-",
                    item.publishStatus || item.status || "-",
                    formatMoney(item.campaignBudget || item.budget || item.influencerBudget),
                  ])}
                  emptyText="No campaigns visible for this revenue head."
                />
              )}
            </Card>

            <Card title="BME Team" subtitle="Visible members under your hierarchy">
              {sectionErrors.bmeTeam ? (
                <SectionWarning text={sectionErrors.bmeTeam} />
              ) : (
                <SimpleTable
                  columns={["Name", "Email", "Status"]}
                  rows={state.bmeTeam.slice(0, 8).map((item) => [
                    item.name || "-",
                    item.email,
                    item.status,
                  ])}
                  emptyText="No BME members found."
                />
              )}
            </Card>

            <Card title="IME Team" subtitle="Visible members under your hierarchy">
              {sectionErrors.imeTeam ? (
                <SectionWarning text={sectionErrors.imeTeam} />
              ) : (
                <SimpleTable
                  columns={["Name", "Email", "Status"]}
                  rows={state.imeTeam.slice(0, 8).map((item) => [
                    item.name || "-",
                    item.email,
                    item.status,
                  ])}
                  emptyText="No IME members found."
                />
              )}
            </Card>
          </section>
        )}

        {role === "super_admin" && (
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card title="Leadership & Team Snapshot" subtitle="Top-level operational overview">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniStat label="Revenue Heads" value={String(state.allRevenueHeads.length)} />
                <MiniStat label="BME" value={String(state.bmeTeam.length)} />
                <MiniStat label="IME" value={String(state.imeTeam.length)} />
                <MiniStat label="Managed Brands" value={String(state.managedBrands.length)} />
              </div>
            </Card>

            <Card title="Managed Brands" subtitle="Top managed brands first">
              {sectionErrors.managedBrands ? (
                <SectionWarning text={sectionErrors.managedBrands} />
              ) : (
                <SimpleTable
                  columns={["Brand", "Revenue Head", "BME", "IME"]}
                  rows={state.managedBrands.slice(0, 8).map((item) => [
                    item.brandName || item.companyName || "-",
                    item.assignedRm || "-",
                    item.assignedBm || "-",
                    item.assignedIm || "-",
                  ])}
                  emptyText="No managed brands found."
                />
              )}
            </Card>

            <Card title="Revenue Heads" subtitle="Leadership visibility">
              {sectionErrors.revenueHeads ? (
                <SectionWarning text={sectionErrors.revenueHeads} />
              ) : (
                <SimpleTable
                  columns={["Name", "Email", "Status"]}
                  rows={state.allRevenueHeads.slice(0, 8).map((item) => [
                    item.name || "-",
                    item.email,
                    item.status,
                  ])}
                  emptyText="No revenue heads found."
                />
              )}
            </Card>

            <Card title="Platform Campaign View" subtitle="Main campaign view without repeated extra sections">
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={["Campaign", "Brand", "Status", "Budget"]}
                  rows={state.campaigns.slice(0, 8).map((item) => [
                    item.campaignTitle || "-",
                    item.brandName || "-",
                    item.publishStatus || item.status || "-",
                    formatMoney(item.campaignBudget || item.budget || item.influencerBudget),
                  ])}
                  emptyText="No campaigns available."
                />
              )}
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  helper,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border bg-white p-4 shadow-sm",
        tone === "warning" ? "border-amber-200" : "border-slate-200"
      )}
    >
      <div
        className={cn(
          "inline-flex rounded-2xl p-3",
          tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
        )}
      >
        {icon}
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className={cn("mt-1 text-sm", tone === "warning" ? "text-amber-700" : "text-slate-500")}>
        {helper}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function CompactInfo({
  icon,
  label,
  value,
  badgeClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
        {badgeClass ? (
          <div className={cn("mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", badgeClass)}>
            {value}
          </div>
        ) : (
          <div className="mt-1 truncate text-sm font-medium text-slate-900">{value}</div>
        )}
      </div>
    </div>
  );
}

function NoteRow({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        warning ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-1 text-sm", warning ? "text-amber-800" : "text-slate-700")}>{value}</div>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function SectionWarning({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
      {text}
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
  emptyText,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
  emptyText: string;
}) {
  if (!rows.length) {
    return <EmptyText text={emptyText} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-slate-700">
                    {cell || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}