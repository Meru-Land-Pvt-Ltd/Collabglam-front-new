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
  ChevronRight,
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

function getPublishSummary(campaigns: CampaignItem[]) {
  return campaigns.reduce(
    (acc, item) => {
      const key = String(item.publishStatus || item.status || "draft").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

function getDashboardTitle(role?: AdminRole) {
  if (role === "super_admin") return "Super Admin Dashboard";
  if (role === "revenue_head") return "Revenue Head Dashboard";
  if (role === "bme") return "BME Dashboard";
  return "IME Dashboard";
}

function extractArray<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function extractObject<T = any>(payload: any): T | null {
  if (!payload) return null;
  if (payload?.data?.data && typeof payload.data.data === "object" && !Array.isArray(payload.data.data)) {
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

async function safeGet<T = any>(url: string, config?: any, fallbackLabel = "Request"): Promise<SafeResult<T>> {
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

function getQuickLinks(role?: AdminRole) {
  const common = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Overview and role-scoped summary",
    },
    {
      title: "Campaigns",
      href: "/admin/campaigns",
      icon: FolderKanban,
      description: "Open and manage visible campaigns",
    },
    {
      title: "Messages",
      href: "/admin/messages",
      icon: Mail,
      description: "Check communication and updates",
    },
  ];

  if (role === "super_admin") {
    return [
      ...common,
      {
        title: "Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "Platform-wide brand management",
      },
      {
        title: "Influencers",
        href: "/admin/influencers",
        icon: Users,
        description: "See all influencer operations",
      },
      {
        title: "Employees",
        href: "/admin/employees",
        icon: Shield,
        description: "Manage admins and executives",
      },
      {
        title: "Role Management",
        href: "/admin/role",
        icon: Crown,
        description: "Control permissions and access",
      },
    ];
  }

  if (role === "revenue_head") {
    return [
      ...common,
      {
        title: "Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "View and manage assigned brands",
      },
      {
        title: "Influencer Pipeline",
        href: "/admin/influencer-pipeline",
        icon: TrendingUp,
        description: "Track pipeline progress",
      },
      {
        title: "Subscriptions",
        href: "/admin/subscriptions",
        icon: Briefcase,
        description: "Review billing and plans",
      },
    ];
  }

  if (role === "bme") {
    return [
      ...common,
      {
        title: "Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "View assigned brands",
      },
      {
        title: "Inbound Emails",
        href: "/admin/inbound-emails",
        icon: Mail,
        description: "Monitor incoming leads and updates",
      },
      {
        title: "Documents",
        href: "/admin/documents",
        icon: Shield,
        description: "Open business documents and policies",
      },
    ];
  }

  return [
    ...common,
    {
      title: "Influencers",
      href: "/admin/influencers",
      icon: Users,
      description: "Manage influencer records",
    },
    {
      title: "Influencer Data",
      href: "/admin/influencer-data",
      icon: BarChart3,
      description: "View data and performance",
    },
    {
      title: "Influencer Pipeline",
      href: "/admin/influencer-pipeline",
      icon: TrendingUp,
      description: "Track outreach and progress",
    },
    {
      title: "Documents",
      href: "/admin/documents",
      icon: Shield,
      description: "Open reference content and policies",
    },
  ];
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  const [fatalError, setFatalError] = useState<string | null>(null);

  const role = state.me?.role;
  const quickLinks = useMemo(() => getQuickLinks(role), [role]);

  const publishSummary = useMemo(() => getPublishSummary(state.campaigns), [state.campaigns]);

  const totalBudget = useMemo(
    () =>
      state.campaigns.reduce(
        (sum, item) => sum + Number(item.campaignBudget || item.budget || item.influencerBudget || 0),
        0
      ),
    [state.campaigns]
  );

  const visibleErrorCount = useMemo(
    () => Object.values(sectionErrors).filter(Boolean).length,
    [sectionErrors]
  );

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
                    This usually means your login expired or the profile API is unavailable.
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
            <FallbackRedirectCard
              title="Campaigns"
              href="/admin/campaigns"
              description="Open campaign management directly"
              icon={FolderKanban}
            />
            <FallbackRedirectCard
              title="Brands"
              href="/admin/brands"
              description="Go to brand management"
              icon={Building2}
            />
            <FallbackRedirectCard
              title="Messages"
              href="/admin/messages"
              description="Open communication center"
              icon={Mail}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Shield className="h-3.5 w-3.5" />
                Role Scoped Overview
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {getDashboardTitle(role)}
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                This dashboard keeps working even if some APIs are unavailable. Each section loads independently,
                so admins still see the most important data and quick navigation for their role.
              </p>

              {visibleErrorCount > 0 ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {visibleErrorCount} section{visibleErrorCount > 1 ? "s" : ""} could not be loaded
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void loadDashboard("refresh")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Refresh
              </button>

              <Link
                href="/admin/campaigns"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
              >
                Open Campaigns
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  Logged In Admin
                </div>

                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  {state.me?.name || state.me?.email || "Admin User"}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", getRoleTone(role))}>
                    {titleCaseRole(role)}
                  </span>
                  <span>{state.me?.email || "-"}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileMiniInfo label="Status" value={state.me?.status || "-"} />
                <ProfileMiniInfo label="Joined" value={formatDate(state.me?.createdAt)} />
                <ProfileMiniInfo label="Last Login" value={formatDate(state.me?.lastLoginAt)} />
                <ProfileMiniInfo label="Proxy Email" value={state.me?.proxyEmail || "-"} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Quick Redirects</h3>
                <p className="mt-1 text-sm text-slate-500">Fast navigation based on role access</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-300" />
            </div>

            <div className="space-y-2">
              {quickLinks.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-white p-2 shadow-sm">
                        <Icon className="h-4 w-4 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="truncate text-xs text-slate-500">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Briefcase className="h-5 w-5" />}
            label={role === "super_admin" ? "Visible Campaigns" : "My / Scoped Campaigns"}
            value={String(state.campaigns.length)}
            helper={sectionErrors.campaigns ? "Campaign API unavailable" : "Role-scoped campaign visibility"}
            tone={sectionErrors.campaigns ? "warning" : "default"}
          />

          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Visible Budget"
            value={formatMoney(totalBudget)}
            helper={sectionErrors.campaigns ? "Budget derived from available records only" : "Combined visible campaign budget"}
            tone={sectionErrors.campaigns ? "warning" : "default"}
          />

          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label={role === "super_admin" ? "Managed Brands" : "Allocated Brands"}
            value={String(role === "super_admin" ? state.managedBrands.length : state.myAllocations.length)}
            helper={
              role === "super_admin"
                ? sectionErrors.managedBrands
                  ? "Managed brand API unavailable"
                  : "Across platform"
                : sectionErrors.allocations
                  ? "Allocation API unavailable"
                  : "Assigned to your scope"
            }
            tone={role === "super_admin" ? (sectionErrors.managedBrands ? "warning" : "default") : (sectionErrors.allocations ? "warning" : "default")}
          />

          <StatCard
            icon={role === "super_admin" ? <Crown className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            label={
              role === "super_admin"
                ? "Revenue Heads"
                : role === "revenue_head"
                  ? "My Team Size"
                  : "Active Permissions"
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
                  : "All active revenue heads"
                : role === "revenue_head"
                  ? sectionErrors.bmeTeam || sectionErrors.imeTeam
                    ? "Some team data unavailable"
                    : "BME + IME under you"
                  : "Granted access entries"
            }
            tone={
              role === "super_admin"
                ? sectionErrors.revenueHeads ? "warning" : "default"
                : role === "revenue_head"
                  ? sectionErrors.bmeTeam || sectionErrors.imeTeam ? "warning" : "default"
                  : "default"
            }
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card title="Profile Summary" subtitle="Role-aware details visible to every admin">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Name" value={state.me?.name || "-"} />
              <InfoRow label="Role" value={titleCaseRole(state.me?.role)} />
              <InfoRow label="Email" value={state.me?.email || "-"} />
              <InfoRow label="Proxy Email" value={state.me?.proxyEmail || "-"} />
              <InfoRow label="Status" value={state.me?.status || "-"} />
              <InfoRow label="Joined" value={formatDate(state.me?.createdAt)} />
            </div>
          </Card>

          <Card
            title="Campaign Status Mix"
            subtitle={sectionErrors.campaigns ? "Campaign summary unavailable right now" : "Summary of campaigns visible in this scope"}
          >
            {sectionErrors.campaigns ? (
              <SectionWarning text={sectionErrors.campaigns} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(publishSummary).length ? (
                  Object.entries(publishSummary).map(([key, count]) => (
                    <MiniStat key={key} label={key.replace(/_/g, " ")} value={String(count)} />
                  ))
                ) : (
                  <EmptyText text="No campaign summary available." />
                )}
              </div>
            )}
          </Card>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Popular Redirects</h3>
              <p className="mt-1 text-sm text-slate-500">Show most-used areas so everyone can move faster</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="inline-flex rounded-2xl bg-white p-3 shadow-sm">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {(role === "bme" || role === "ime") && (
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card
              title={role === "bme" ? "Assigned Brands" : "Assigned Brands"}
              subtitle="Only your allocated brand details are visible here"
            >
              {sectionErrors.allocations ? (
                <SectionWarning text={sectionErrors.allocations} />
              ) : (
                <SimpleTable
                  columns={["Brand", "Status", "Updated"]}
                  rows={state.myAllocations.map((item) => [
                    item.brandId?.brandName || item.brandId?.companyName || "-",
                    item.status || "-",
                    formatDate(item.updatedAt || item.createdAt),
                  ])}
                  emptyText="No allocated brands found."
                />
              )}
            </Card>

            <Card title="Visible Campaigns" subtitle="Only campaigns in your accessible scope">
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={["Campaign", "Brand", "Status", "Budget"]}
                  rows={state.campaigns.slice(0, 10).map((item) => [
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
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="BME Under Me"
                value={String(state.bmeTeam.length)}
                helper={sectionErrors.bmeTeam ? "BME team API unavailable" : "Team members with BME role"}
                tone={sectionErrors.bmeTeam ? "warning" : "default"}
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="IME Under Me"
                value={String(state.imeTeam.length)}
                helper={sectionErrors.imeTeam ? "IME team API unavailable" : "Team members with IME role"}
                tone={sectionErrors.imeTeam ? "warning" : "default"}
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                label="Scoped Campaigns"
                value={String(state.campaigns.length)}
                helper={sectionErrors.campaigns ? "Campaign API unavailable" : "Campaigns visible to your team"}
                tone={sectionErrors.campaigns ? "warning" : "default"}
              />
              <StatCard
                icon={<Mail className="h-5 w-5" />}
                label="Team Contacts"
                value={String(state.bmeTeam.length + state.imeTeam.length)}
                helper="Direct team strength"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="BME Team" subtitle="Visible only for your hierarchy">
                {sectionErrors.bmeTeam ? (
                  <SectionWarning text={sectionErrors.bmeTeam} />
                ) : (
                  <SimpleTable
                    columns={["Name", "Email", "Status", "Last Login"]}
                    rows={state.bmeTeam.map((item) => [
                      item.name || "-",
                      item.email,
                      item.status,
                      formatDate(item.lastLoginAt),
                    ])}
                    emptyText="No BME members found."
                  />
                )}
              </Card>

              <Card title="IME Team" subtitle="Visible only for your hierarchy">
                {sectionErrors.imeTeam ? (
                  <SectionWarning text={sectionErrors.imeTeam} />
                ) : (
                  <SimpleTable
                    columns={["Name", "Email", "Status", "Last Login"]}
                    rows={state.imeTeam.map((item) => [
                      item.name || "-",
                      item.email,
                      item.status,
                      formatDate(item.lastLoginAt),
                    ])}
                    emptyText="No IME members found."
                  />
                )}
              </Card>
            </div>

            <Card title="Revenue Head Campaign View" subtitle="Campaigns accessible to your hierarchy">
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={["Campaign", "Brand", "Publish", "Budget", "Created"]}
                  rows={state.campaigns.slice(0, 12).map((item) => [
                    item.campaignTitle || "-",
                    item.brandName || "-",
                    item.publishStatus || item.status || "-",
                    formatMoney(item.campaignBudget || item.budget || item.influencerBudget),
                    formatDate(item.createdAt),
                  ])}
                  emptyText="No campaigns visible for this revenue head."
                />
              )}
            </Card>
          </section>
        )}

        {role === "super_admin" && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
              <StatCard
                icon={<Crown className="h-5 w-5" />}
                label="Revenue Heads"
                value={String(state.allRevenueHeads.length)}
                helper={sectionErrors.revenueHeads ? "Revenue head API unavailable" : "All active RH accounts"}
                tone={sectionErrors.revenueHeads ? "warning" : "default"}
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="All BME"
                value={String(state.bmeTeam.length)}
                helper={sectionErrors.bmeTeam ? "BME team API unavailable" : "All active BME admins"}
                tone={sectionErrors.bmeTeam ? "warning" : "default"}
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="All IME"
                value={String(state.imeTeam.length)}
                helper={sectionErrors.imeTeam ? "IME team API unavailable" : "All active IME admins"}
                tone={sectionErrors.imeTeam ? "warning" : "default"}
              />
              <StatCard
                icon={<Building2 className="h-5 w-5" />}
                label="Managed Brands"
                value={String(state.managedBrands.length)}
                helper={sectionErrors.managedBrands ? "Managed brand API unavailable" : "Fully managed brands"}
                tone={sectionErrors.managedBrands ? "warning" : "default"}
              />
              <StatCard
                icon={<Briefcase className="h-5 w-5" />}
                label="Campaign Universe"
                value={String(state.campaigns.length)}
                helper={sectionErrors.campaigns ? "Campaign API unavailable" : "Admin-visible campaigns"}
                tone={sectionErrors.campaigns ? "warning" : "default"}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card title="Revenue Heads" subtitle="All active RH accounts">
                {sectionErrors.revenueHeads ? (
                  <SectionWarning text={sectionErrors.revenueHeads} />
                ) : (
                  <SimpleTable
                    columns={["Name", "Email", "Status"]}
                    rows={state.allRevenueHeads.map((item) => [
                      item.name || "-",
                      item.email,
                      item.status,
                    ])}
                    emptyText="No revenue heads found."
                  />
                )}
              </Card>

              <Card title="BME Overview" subtitle="Platform-level BME list">
                {sectionErrors.bmeTeam ? (
                  <SectionWarning text={sectionErrors.bmeTeam} />
                ) : (
                  <SimpleTable
                    columns={["Name", "Email", "Reports To"]}
                    rows={state.bmeTeam.map((item) => [
                      item.name || "-",
                      item.email,
                      item.parentAdmin?.name || item.parentAdmin?.email || "-",
                    ])}
                    emptyText="No BME records found."
                  />
                )}
              </Card>

              <Card title="IME Overview" subtitle="Platform-level IME list">
                {sectionErrors.imeTeam ? (
                  <SectionWarning text={sectionErrors.imeTeam} />
                ) : (
                  <SimpleTable
                    columns={["Name", "Email", "Reports To"]}
                    rows={state.imeTeam.map((item) => [
                      item.name || "-",
                      item.email,
                      item.parentAdmin?.name || item.parentAdmin?.email || "-",
                    ])}
                    emptyText="No IME records found."
                  />
                )}
              </Card>
            </div>

            <Card title="Managed Brands" subtitle="Visible only for super admin">
              {sectionErrors.managedBrands ? (
                <SectionWarning text={sectionErrors.managedBrands} />
              ) : (
                <SimpleTable
                  columns={["Brand", "Revenue Head", "BME", "IME", "Subscription"]}
                  rows={state.managedBrands.slice(0, 12).map((item) => [
                    item.brandName || item.companyName || "-",
                    item.assignedRm || "-",
                    item.assignedBm || "-",
                    item.assignedIm || "-",
                    item.subscription?.status || "-",
                  ])}
                  emptyText="No managed brands found."
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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
      {children}
    </div>
  );
}

function StatCard({
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-all text-sm font-medium text-slate-900">{value}</div>
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

function ProfileMiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function FallbackRedirectCard({
  title,
  href,
  description,
  icon: Icon,
}: {
  title: string;
  href: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-slate-50"
    >
      <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{description}</div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
        Open
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
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