"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Inbox,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CalendarDays,
  MessageCircle,
  Target,
  ArrowUpRight,
  MapPin,
  BriefcaseBusiness,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/buttonComp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  apiGetAllInvitationsByInfluencer,
  getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ApiInviteStatus = "sent" | "accepted" | "reject";

interface Deliverable {
  quantity: number;
  type: string;
}

interface CampaignInvite {
  id: string;
  brandId?: string;
  campaignId?: string;
  brandName: string;
  brandAvatar?: string;
  invitedAt: string;
  respondBy: string;
  status: ApiInviteStatus;

  title: string;
  description: string;
  category: string;
  location: string;
  platform: string;
  budgetMin: number;
  budgetMax: number;
  goals: string[];
  ageGroups: string[];

  overview: string;
  deliverables: Deliverable[];
  paymentMethod: string;
  paymentSchedule: string;
  brandMessage: string;
  contentSubmission: string;
  publishDate: string;
  campaignEnd: string;
}

/* -------------------------------------------------------------------------- */
/* AVATAR COLORS                                                              */
/* -------------------------------------------------------------------------- */

const AVATAR_PALETTES = [
  { bg: "from-rose-400 to-pink-600" },
  { bg: "from-amber-400 to-orange-500" },
  { bg: "from-emerald-400 to-teal-600" },
  { bg: "from-blue-400 to-indigo-600" },
  { bg: "from-violet-400 to-purple-600" },
  { bg: "from-cyan-400 to-sky-600" },
  { bg: "from-fuchsia-400 to-rose-600" },
  { bg: "from-lime-500 to-emerald-600" },
];

function getAvatarGradient(name: string) {
  const code = (name || "B").charCodeAt(0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length].bg;
}

function formatPlatform(value?: string) {
  if (!value) return "Unknown Platform";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* -------------------------------------------------------------------------- */
/* CAMPAIGN DETAILS MODAL                                                     */
/* -------------------------------------------------------------------------- */

type Section = "overview" | "deliverables" | "payment" | "message" | "timeline";

function AccordionSection({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: Section;
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100/80 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3.5 text-left group transition-all duration-200 px-3 rounded-2xl hover:bg-gray-50/80"
      >
        <span className="flex items-center gap-3 font-semibold text-[14px] text-gray-800">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/60 flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </span>
          {title}
        </span>

        <span className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-all duration-200 shrink-0">
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          )}
        </span>
      </button>

      {open && (
        <div className="pb-4 px-3 pl-14 text-sm text-gray-600 leading-relaxed animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

function CampaignDetailsModal({
  invite,
  open,
  onClose,
  onAccept,
  onDecline,
}: {
  invite: CampaignInvite;
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [openSections, setOpenSections] = useState<Set<Section>>(
    new Set(["overview", "deliverables", "payment", "message", "timeline"])
  );

  const toggle = (section: Section) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });

  const isPending = invite.status === "sent";
  const isAccepted = invite.status === "accepted";
  const isDeclined = invite.status === "reject";

  const statusBadge = isAccepted ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Accepted
    </span>
  ) : isDeclined ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/60 px-3 py-1 text-xs font-semibold text-red-600 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Declined
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Pending
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="w-full !max-w-[820px] max-h-[90vh] overflow-hidden rounded-[28px] border border-gray-200/70 p-0 shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300" />

        <div className="flex-none px-6 pt-5 pb-5 border-b border-gray-100 bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-[18px] font-bold text-gray-900 leading-snug pr-8">
              {invite.title}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-gray-500">
              Review the full campaign details and collaboration terms below.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(
                  invite.brandName
                )} flex items-center justify-center text-white font-bold text-sm shadow-md`}
              >
                {invite.brandName?.[0] ?? "B"}
              </div>

              <div>
                <div className="font-semibold text-gray-900 text-sm">{invite.brandName}</div>
                <div className="text-xs text-gray-400">Invited {invite.invitedAt}</div>
              </div>
            </div>

            {statusBadge}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-amber-600" />
              {invite.category || "General"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
              {invite.location || "Remote"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
              <DollarSign className="h-3.5 w-3.5 text-amber-600" />
              ₹{invite.budgetMin.toLocaleString()} - ₹{invite.budgetMax.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 max-h-[52vh]">
          <AccordionSection
            id="overview"
            title="Campaign Overview"
            icon={<Target className="h-3.5 w-3.5 text-amber-600" />}
            open={openSections.has("overview")}
            onToggle={() => toggle("overview")}
          >
            <p className="leading-relaxed text-gray-600">{invite.overview}</p>
          </AccordionSection>

          <AccordionSection
            id="deliverables"
            title="Deliverables"
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />}
            open={openSections.has("deliverables")}
            onToggle={() => toggle("deliverables")}
          >
            <ul className="space-y-2.5 mt-1">
              {invite.deliverables.length > 0 ? (
                invite.deliverables.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 bg-gray-50/90 rounded-xl px-3 py-2.5 border border-gray-100"
                  >
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-white border border-amber-200/50 flex items-center justify-center text-[12px] font-bold text-amber-700 shadow-sm">
                      {d.quantity}
                    </span>
                    <span className="text-gray-700 text-[13px]">{d.type}</span>
                  </li>
                ))
              ) : (
                <div className="text-sm text-gray-400">No deliverables shared yet.</div>
              )}
            </ul>
          </AccordionSection>

          <AccordionSection
            id="payment"
            title="Payment Details"
            icon={<DollarSign className="h-3.5 w-3.5 text-amber-600" />}
            open={openSections.has("payment")}
            onToggle={() => toggle("payment")}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-50/90 to-orange-50/60 rounded-xl px-4 py-3 border border-amber-100/50">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget Range
                </span>
                <span className="font-bold text-gray-900 text-base">
                  ₹{invite.budgetMin.toLocaleString()} – ₹{invite.budgetMax.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50/80 rounded-xl px-3 py-3 border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
                    Method
                  </span>
                  <span className="text-sm text-gray-700 font-medium">
                    {invite.paymentMethod}
                  </span>
                </div>

                <div className="bg-gray-50/80 rounded-xl px-3 py-3 border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
                    Schedule
                  </span>
                  <span className="text-sm text-gray-700 font-medium">
                    {invite.paymentSchedule}
                  </span>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            id="message"
            title="Brand Message"
            icon={<MessageCircle className="h-3.5 w-3.5 text-amber-600" />}
            open={openSections.has("message")}
            onToggle={() => toggle("message")}
          >
            <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl px-4 py-4 border border-amber-100/40">
              <p className="italic text-gray-600 leading-relaxed text-[13px]">
                “{invite.brandMessage}”
              </p>
            </div>
          </AccordionSection>

          <AccordionSection
            id="timeline"
            title="Timeline & Deadlines"
            icon={<CalendarDays className="h-3.5 w-3.5 text-amber-600" />}
            open={openSections.has("timeline")}
            onToggle={() => toggle("timeline")}
          >
            <div className="space-y-2">
              {[
                { label: "Response Deadline", value: invite.respondBy, highlight: true },
                { label: "Content Submission", value: invite.contentSubmission, highlight: false },
                { label: "Publish Date", value: invite.publishDate, highlight: false },
                { label: "Campaign End", value: invite.campaignEnd, highlight: false },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50/80 rounded-xl px-3 py-3 border border-gray-100"
                >
                  <span className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      item.highlight ? "text-red-500" : "text-gray-700"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>

        <div className="flex-none px-6 py-4 border-t border-gray-100 bg-white/90 backdrop-blur-sm flex items-center justify-end gap-3">
          {isPending ? (
            <>
              <Button
                type="button"
                onClick={() => {
                  onDecline();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
              >
                Decline
              </Button>

              <Button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white shadow-md shadow-amber-200/50 hover:shadow-lg hover:shadow-amber-200/60 transition-all duration-200"
              >
                Accept Invite
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(value: unknown): ApiInviteStatus {
  const v = String(value || "").toLowerCase();
  if (v === "accepted") return "accepted";
  if (v === "reject") return "reject";
  return "sent";
}

function mapApiInviteToUi(inv: any): CampaignInvite {
  const singleBudget =
    Number(inv?.campaignBudget ?? inv?.budget ?? inv?.budgetMax ?? inv?.budgetMin ?? 0) || 0;

  const budgetMin =
    Number(inv?.budgetMin ?? inv?.campaignBudgetMin ?? inv?.minBudget ?? singleBudget) || 0;

  const budgetMax =
    Number(inv?.budgetMax ?? inv?.campaignBudgetMax ?? inv?.maxBudget ?? singleBudget) || 0;

  const deliverables: Deliverable[] = Array.isArray(inv?.deliverables)
    ? inv.deliverables.map((d: any) => ({
        quantity: Number(d?.quantity ?? 1) || 1,
        type: String(d?.type ?? d?.title ?? "Deliverable"),
      }))
    : [];

  return {
    id: String(inv?._id ?? ""),
    brandId: inv?.brandId ? String(inv.brandId) : undefined,
    campaignId: inv?.campaignId ? String(inv.campaignId) : undefined,
    brandName: String(inv?.brandName ?? "Brand"),
    brandAvatar: String(inv?.brandName?.[0] ?? "B"),
    invitedAt: formatDate(inv?.createdAt ?? inv?.sentAt),
    respondBy: formatDate(inv?.respondBy ?? inv?.endAt ?? inv?.updatedAt),
    status: normalizeStatus(inv?.status),

    title: String(inv?.campaignTitle ?? "Untitled Campaign"),
    description: String(inv?.description ?? ""),
    category: String(inv?.category?.name ?? inv?.categoryName ?? inv?.category ?? "General"),
    location: String(
      inv?.location ?? inv?.targetCountries?.[0]?.name ?? inv?.targetCountry ?? "Remote"
    ),
    platform: formatPlatform(inv?.platform),
    budgetMin,
    budgetMax,
    goals: Array.isArray(inv?.goals)
      ? inv.goals.map((g: any) => String(g?.goal ?? g?.name ?? g))
      : [],
    ageGroups: Array.isArray(inv?.targetAgeRangesDetails)
      ? inv.targetAgeRangesDetails.map((a: any) => String(a?.range ?? ""))
      : Array.isArray(inv?.targetAgeRanges)
      ? inv.targetAgeRanges.map((a: any) => String(a))
      : [],

    overview: String(inv?.description ?? ""),
    deliverables,
    paymentMethod: String(inv?.paymentType ?? inv?.paymentMethod ?? "To be discussed"),
    paymentSchedule: String(inv?.paymentSchedule ?? "To be discussed"),
    brandMessage: String(inv?.brandMessage ?? "No message provided."),
    contentSubmission: formatDate(inv?.contentSubmission ?? inv?.submissionDate),
    publishDate: formatDate(inv?.publishDate ?? inv?.startAt),
    campaignEnd: formatDate(inv?.campaignEnd ?? inv?.endAt),
  };
}

function formatBudget(min: number, max: number) {
  if (min === max) return `₹${max.toLocaleString()}`;
  return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
}

/* -------------------------------------------------------------------------- */
/* STAT CARD                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  count,
  colorClass,
  borderClass,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  colorClass: string;
  borderClass: string;
}) {
  return (
    <div
      className={`bg-white rounded-[24px] border ${borderClass} p-4 flex items-center gap-3.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-default`}
    >
      <div
        className={`w-11 h-11 rounded-2xl ${colorClass} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-none">{count}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SKELETON LOADER                                                            */
/* -------------------------------------------------------------------------- */

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-gray-200/60 bg-white shadow-sm">
      <div className="bg-gray-50/80 border-b border-gray-200/60 px-6 py-4 flex items-center gap-8">
        {["w-28", "w-40", "w-24", "w-20", "w-32"].map((w, i) => (
          <div key={i} className={`h-3 bg-gray-200 rounded-full ${w} animate-pulse`} />
        ))}
      </div>

      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-6 px-6 py-5 border-b border-gray-100/60 last:border-0"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded-full w-32 animate-pulse" />
            <div className="h-2.5 bg-gray-100 rounded-full w-24 animate-pulse" />
          </div>
          <div className="h-3.5 bg-gray-200 rounded-full w-40 animate-pulse hidden md:block" />
          <div className="h-3.5 bg-gray-200 rounded-full w-20 animate-pulse hidden md:block" />
          <div className="h-7 bg-gray-200 rounded-full w-24 animate-pulse" />
          <div className="h-9 bg-gray-200 rounded-full w-32 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function InvitesPage() {
  const [search, setSearch] = useState("");
  const [invites, setInvites] = useState<CampaignInvite[]>([]);
  const [detailsInvite, setDetailsInvite] = useState<CampaignInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId") || localStorage.getItem("userId") || ""
          : "";

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

      if (!influencerId) {
        setInvites([]);
        setError("Influencer ID not found. Please log in again.");
        return;
      }

      const res = await apiGetAllInvitationsByInfluencer(
        {
          influencerId,
          status: undefined,
        },
        token || undefined
      );

      const mapped = Array.isArray(res?.invitations)
        ? res.invitations.map(mapApiInviteToUi)
        : [];

      setInvites(mapped);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load campaign invites"));
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleAccept = (id: string) => {
    setInvites((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "accepted" } : inv))
    );
  };

  const handleDecline = (id: string) => {
    setInvites((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "reject" } : inv))
    );
  };

  const filtered = useMemo(() => {
    return invites.filter((inv) => {
      const term = search.toLowerCase();
      return inv.title.toLowerCase().includes(term) || inv.brandName.toLowerCase().includes(term);
    });
  }, [invites, search]);

  const counts = useMemo(() => {
    const c = {
      all: invites.length,
      sent: 0,
      accepted: 0,
      reject: 0,
    };

    invites.forEach((inv) => {
      c[inv.status] += 1;
    });

    return c;
  }, [invites]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_28%),_#F7F8FA]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="relative overflow-hidden rounded-[30px] border border-white/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50/60 via-transparent to-orange-50/40 pointer-events-none" />
            <div className="relative px-6 py-6 sm:px-7 sm:py-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Campaign Invites
                </h1>
                <p className="text-gray-500 text-sm mt-1.5 font-medium max-w-2xl">
                  Review, accept, and manage collaboration opportunities from brands in one clean
                  dashboard.
                </p>
              </div>

              {counts.sent > 0 && (
                <div className="shrink-0 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-2.5 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                  <span className="text-sm font-semibold text-amber-700">
                    {counts.sent} pending {counts.sent === 1 ? "invite" : "invites"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Inbox className="h-5 w-5 text-white" />}
              label="Total"
              count={counts.all}
              colorClass="bg-gray-900"
              borderClass="border-gray-200/60"
            />
            <StatCard
              icon={<Clock className="h-5 w-5 text-amber-600" />}
              label="Pending"
              count={counts.sent}
              colorClass="bg-amber-50"
              borderClass="border-amber-100"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              label="Accepted"
              count={counts.accepted}
              colorClass="bg-emerald-50"
              borderClass="border-emerald-100"
            />
            <StatCard
              icon={<XCircle className="h-5 w-5 text-red-500" />}
              label="Declined"
              count={counts.reject}
              colorClass="bg-red-50"
              borderClass="border-red-100"
            />
          </div>

          <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-sm p-3 sm:p-4">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-gray-200/60">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 bg-gray-900 text-white shadow-sm"
                >
                  <span>All Invites</span>
                  <span className="inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-white/20 text-white/90">
                    {counts.all}
                  </span>
                </button>
              </div>

              <div className="relative w-full xl:w-auto xl:min-w-[360px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns or brands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 pr-10 h-11 rounded-full bg-gray-50 border-gray-200/70 shadow-none focus:ring-2 focus:ring-amber-200/50 focus:border-amber-300 transition-all duration-200"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition"
                  >
                    <X className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[26px] border border-gray-200/60 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-gray-900 font-semibold text-base">Unable to load invites</p>
              <p className="text-gray-400 text-sm mt-1 max-w-sm">{error}</p>
              <Button
                type="button"
                onClick={fetchInvites}
                className="mt-5 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all duration-200"
              >
                Try Again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[26px] border border-gray-200/60 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold text-base">No invites found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters or search term.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-gray-200/60 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200/60">
                      <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100/80">
                    {filtered.map((inv) => (
                      <tr
                        key={inv.id}
                        className="group hover:bg-gradient-to-r hover:from-amber-50/40 hover:to-transparent transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(
                                inv.brandName
                              )} flex items-center justify-center text-sm font-bold text-white shadow-sm group-hover:shadow-md transition-shadow duration-200`}
                            >
                              {inv.brandName?.[0] ?? "B"}
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-[13px] truncate">
                                {inv.brandName}
                              </p>
                              <p className="text-[11px] text-gray-400">{inv.invitedAt}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 max-w-[320px]">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-[13px] truncate">
                              {inv.title}
                            </p>
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {inv.description || "No description available"}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-200 px-2.5 py-1 text-[10px] font-medium text-black">
                                {inv.platform}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-[13px] whitespace-nowrap">
                              {formatBudget(inv.budgetMin, inv.budgetMax)}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5">
                              Response by {inv.respondBy}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {inv.status === "accepted" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Accepted
                            </span>
                          ) : inv.status === "reject" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/60 px-2.5 py-1 text-[11px] font-semibold text-red-600 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Declined
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              onClick={() => {
                                if (inv.campaignId) {
                                  router.push(
                                    `/influencer/invitations/${inv.campaignId}?invitationId=${inv.id}`
                                  );
                                } else {
                                  setDetailsInvite(inv);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-2 text-[12px] font-medium text-white hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Campaign
                            </Button>

                            {inv.status === "accepted" && (
                              <Button
                                type="button"
                                onClick={() => {
                                  router.push("/influencer/my-campaigns/view-milestone");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                View Milestones
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailsInvite && (
        <CampaignDetailsModal
          invite={detailsInvite}
          open={!!detailsInvite}
          onClose={() => setDetailsInvite(null)}
          onAccept={() => handleAccept(detailsInvite.id)}
          onDecline={() => handleDecline(detailsInvite.id)}
        />
      )}
    </TooltipProvider>
  );
}