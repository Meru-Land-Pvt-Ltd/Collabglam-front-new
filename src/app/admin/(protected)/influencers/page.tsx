"use client";

import React from "react";
import Link from "next/link";
import { post } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  HiOutlineRefresh,
  HiOutlineEye,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineClipboardList,
} from "react-icons/hi";
import {
  Instagram,
  Youtube,
  Search,
  Users,
  BadgeCheck,
  Clock3,
  Sparkles,
  ArrowUpRight,
  Globe2,
  Layers3,
} from "lucide-react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

// ---------------- Types ----------------
interface NamedEntity {
  _id?: string;
  name: string;
}

interface SocialProfile {
  provider?: string;
  handle?: string;
  username?: string;
  followers?: number;
  url?: string;
  picture?: string;
}

interface PageCounts {
  page1?: number;
  page2?: number;
  page3?: number;
}

interface Onboarding {
  route?: string;
  page1Done?: boolean;
  page2Done?: boolean;
  page3Done?: boolean;
  ispage2Skip?: boolean;
  ispage3Skip?: boolean;
}

interface Influencer {
  _id: string;
  influencerId?: string;
  email: string;
  name: string;
  country?: NamedEntity | null;
  languages?: NamedEntity[];
  categories?: NamedEntity[];
  proxyEmail?: string;
  primaryPlatform?: string | null;
  socialProfiles?: SocialProfile[];
  pageCounts?: PageCounts;
  onboarding?: Onboarding;
  createdAt?: string;
  updatedAt?: string;
}

interface GetListResponse {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  count?: number;
  influencers: Influencer[];
}

type SortField = "name" | "email" | "primaryPlatform" | "createdAt" | "updatedAt";

// -------------- Constants --------------
const API_ENDPOINT = "/admin/influencer/list";
const DEFAULT_LIMIT = 10;
const ROW_OPTIONS = [10, 20, 50, 100] as const;

const HEADERS: {
  key: SortField | "country" | "categories" | "onboarding";
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}[] = [
    { key: "name", label: "Influencer", sortable: true, align: "left" },
    { key: "email", label: "Email", sortable: true, align: "left" },
    { key: "primaryPlatform", label: "Platform", sortable: true, align: "center" },
    { key: "country", label: "Country", sortable: false, align: "center" },
    { key: "categories", label: "Categories", sortable: false, align: "center" },
    { key: "onboarding", label: "Onboarding", sortable: false, align: "center" },
  ];

const ALLOWED_SORT = new Set<SortField>([
  "name",
  "email",
  "primaryPlatform",
  "createdAt",
  "updatedAt",
]);

// -------------- Helpers --------------
function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getInitials(name?: string) {
  return (name || "Influencer")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IN";
}

function normalizePlatform(platform?: string | null) {
  return String(platform || "").trim().toLowerCase();
}

function getCountryName(influencer: Influencer) {
  return influencer.country?.name || "—";
}

function getCategoryNames(influencer: Influencer) {
  return influencer.categories?.map((item) => item.name).filter(Boolean) || [];
}

function getLanguageNames(influencer: Influencer) {
  return influencer.languages?.map((item) => item.name).filter(Boolean) || [];
}

function getSocialProfileCount(influencer: Influencer) {
  return influencer.socialProfiles?.length || 0;
}

function getCompletedPages(influencer: Influencer) {
  const onboarding = influencer.onboarding;
  if (!onboarding) return 0;

  let count = 0;
  if (onboarding.page1Done) count += 1;
  if (onboarding.page2Done || onboarding.ispage2Skip) count += 1;
  if (onboarding.page3Done || onboarding.ispage3Skip) count += 1;
  return count;
}

function isFullyOnboarded(influencer: Influencer) {
  return getCompletedPages(influencer) === 3;
}

function getOnboardingTone(influencer: Influencer) {
  const completed = getCompletedPages(influencer);

  if (completed === 3) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (completed >= 1) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
}

function PlatformBadge({ platform }: { platform?: string | null }) {
  const normalized = normalizePlatform(platform);

  if (normalized === "instagram") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">
        <Instagram className="h-3.5 w-3.5" />
        Instagram
      </span>
    );
  }

  if (normalized === "youtube") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        <Youtube className="h-3.5 w-3.5" />
        YouTube
      </span>
    );
  }

  if (normalized === "tiktok") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
        <Sparkles className="h-3.5 w-3.5" />
        TikTok
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
      —
    </span>
  );
}

function OnboardingBadge({ influencer }: { influencer: Influencer }) {
  const completed = getCompletedPages(influencer);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-bold",
        getOnboardingTone(influencer)
      )}
    >
      {completed === 3 ? "Completed" : `${completed}/3 Done`}
    </Badge>
  );
}

function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: HEADERS.length + 1 }).map((_, index) => (
        <TableCell key={index}>
          <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// -------------- Page Component --------------
const AdminInfluencersPage = () => {
  const [rows, setRows] = React.useState<Influencer[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  const [search, setSearch] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");

  const [sortBy, setSortBy] = React.useState<SortField>("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      };

      const res = await post<GetListResponse>(API_ENDPOINT, params);

      setRows(res.influencers || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || Math.max(1, Math.ceil((res.total || 0) / limit)));
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load influencers.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sortBy, sortOrder]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSort = (field: SortField, sortable?: boolean) => {
    if (!sortable || !ALLOWED_SORT.has(field)) return;

    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }

    setPage(1);
  };

  const stats = React.useMemo(() => {
    const completed = rows.filter((item) => isFullyOnboarded(item)).length;
    const withPlatform = rows.filter((item) => Boolean(item.primaryPlatform)).length;
    const withSocialProfile = rows.filter((item) => getSocialProfileCount(item) > 0).length;
    const withCategories = rows.filter((item) => (item.categories?.length || 0) > 0).length;

    return {
      completed,
      withPlatform,
      withSocialProfile,
      withCategories,
    };
  }, [rows]);

  const showingFrom = rows.length ? (page - 1) * limit + 1 : 0;
  const showingTo = Math.min(page * limit, total);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                  <Users className="h-3.5 w-3.5" />
                  Creator Administration
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  Influencer Management
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                  View all creators, inspect onboarding progress, and access profile or campaign
                  activity from one clean admin table.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full min-w-[280px] sm:w-[340px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, platform..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm font-medium shadow-none focus-visible:ring-0"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={fetchData}
                  disabled={loading}
                  className="h-11 rounded-2xl border-slate-200 px-4"
                >
                  <HiOutlineRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Visible Influencers"
              value={rows.length}
              hint="Current page result count"
              icon={Users}
            />
            <SummaryCard
              title="Onboarding Complete"
              value={stats.completed}
              hint="Creators with all pages completed"
              icon={BadgeCheck}
            />
            <SummaryCard
              title="With Platform"
              value={stats.withPlatform}
              hint="Creators who selected a primary platform"
              icon={Sparkles}
            />
            <SummaryCard
              title="With Social Profile"
              value={stats.withSocialProfile}
              hint="Creators who connected at least one profile"
              icon={Clock3}
            />
          </div>

          <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    Influencer Directory
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Searchable list of creators from the admin panel API.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    {stats.withCategories} with categories
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    {total} total
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    {HEADERS.map(({ key, label, sortable, align = "left" }) => (
                      <TableHead
                        key={String(key)}
                        onClick={() =>
                          ALLOWED_SORT.has(key as SortField)
                            ? toggleSort(key as SortField, sortable)
                            : undefined
                        }
                        className={cn(
                          "py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500",
                          sortable && ALLOWED_SORT.has(key as SortField)
                            ? "cursor-pointer select-none"
                            : "",
                          align === "center"
                            ? "text-center"
                            : align === "right"
                              ? "text-right"
                              : "text-left"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            align === "center"
                              ? "justify-center"
                              : align === "right"
                                ? "justify-end"
                                : "justify-start"
                          )}
                        >
                          {label}
                          {sortBy === key && sortable ? (
                            sortOrder === "asc" ? (
                              <HiChevronUp className="h-4 w-4" />
                            ) : (
                              <HiChevronDown className="h-4 w-4" />
                            )
                          ) : null}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: Math.min(limit, 10) }).map((_, idx) => (
                      <SkeletonRow key={idx} />
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={HEADERS.length + 1} className="py-14 text-center">
                        <div className="mx-auto max-w-md space-y-2">
                          <h3 className="text-lg font-black text-slate-900">No influencers found</h3>
                          <p className="text-sm font-medium text-slate-500">
                            Try adjusting your search or refreshing the list.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((inf) => {
                      const categoryNames = getCategoryNames(inf);
                      const languageNames = getLanguageNames(inf);
                      const socialProfileCount = getSocialProfileCount(inf);
                      const completedPages = getCompletedPages(inf);
                      const profilePicture = inf.socialProfiles?.find((profile) => profile.picture)?.picture;
                      return (
                        <TableRow
                          key={inf._id}
                          className={cn(
                            "border-slate-100 transition-colors hover:bg-slate-50/80",
                            isFullyOnboarded(inf) && "bg-emerald-50/20"
                          )}
                        >
                          <TableCell className="py-4">
                            <div className="flex min-w-[260px] items-center gap-3">
                              {profilePicture ? (
                                <img
                                  src={profilePicture}
                                  alt={inf.name || "Influencer"}
                                  className="h-11 w-11 rounded-2xl object-cover border border-slate-200 bg-slate-100"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (next) next.style.display = "flex";
                                  }}
                                />
                              ) : null}

                              <div
                                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-800"
                                style={{ display: profilePicture ? "none" : "flex" }}
                              >
                                {getInitials(inf.name)}
                              </div>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-extrabold text-slate-900">
                                  {inf.name || "—"}
                                </div>
                                <div className="mt-1 truncate text-xs font-medium text-slate-500">
                                  {inf.proxyEmail || "Creator profile"}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="min-w-[220px]">
                              <div className="truncate text-sm font-semibold text-slate-700">
                                {inf.email || "—"}
                              </div>
                              <div className="mt-1 truncate text-xs font-medium text-slate-500">
                                {languageNames.length ? languageNames.join(", ") : "No languages"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 text-center">
                            <PlatformBadge platform={inf.primaryPlatform} />
                          </TableCell>

                          <TableCell className="py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                                <Globe2 className="h-3.5 w-3.5" />
                                {getCountryName(inf)}
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                Updated {formatDate(inf.updatedAt)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                                <Layers3 className="h-3.5 w-3.5" />
                                {categoryNames.length} categories
                              </span>
                              <span className="max-w-[220px] truncate text-xs font-medium text-slate-500">
                                {categoryNames.length ? categoryNames.join(", ") : "No categories"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <OnboardingBadge influencer={inf} />
                              <span className="text-xs font-medium text-slate-500">
                                {completedPages}/3 pages • {socialProfileCount} social profile
                                {socialProfileCount === 1 ? "" : "s"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/admin/influencers/view?influencerId=${inf._id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    >
                                      <HiOutlineEye className="h-5 w-5" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>View details</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/admin/influencers/campaigns?influencerId=${inf._id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    >
                                      <HiOutlineClipboardList className="h-5 w-5" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Campaigns</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/admin/influencers/view?influencerId=${inf._id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    >
                                      <ArrowUpRight className="h-4.5 w-4.5" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Open profile</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {!loading && rows.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm font-semibold text-slate-500">
                  Showing <span className="font-extrabold text-slate-800">{showingFrom}</span>–
                  <span className="font-extrabold text-slate-800">{showingTo}</span> of{" "}
                  <span className="font-extrabold text-slate-800">{total}</span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">Rows</span>
                    <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      {ROW_OPTIONS.map((n) => (
                        <Button
                          key={n}
                          size="sm"
                          variant={limit === n ? "default" : "ghost"}
                          className={cn(
                            "h-8 rounded-xl px-3 text-xs font-bold",
                            limit === n
                              ? "bg-[#ef2f5b] text-white hover:bg-[#ef2f5b]"
                              : "text-slate-600 hover:bg-white"
                          )}
                          onClick={() => {
                            setLimit(n);
                            setPage(1);
                          }}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-full"
                    >
                      <HiChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[110px] text-center text-sm font-extrabold text-slate-700">
                      Page {page} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-full"
                    >
                      <HiChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminInfluencersPage;