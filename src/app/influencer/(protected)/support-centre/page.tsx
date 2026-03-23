"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Megaphone,
  Wallet,
  FileText,
  Wrench,
  Search,
  ChevronRight,
  MessageCircle,
  Mail,
  BookOpen,
  AlertTriangle,
  Clock,
  Plus,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Zap,
  Shield,
  LifeBuoy,
  Scale,
  Sparkles,
} from "lucide-react";

/* ───── theme token ───── */
const Y = "#FBBF00";
const YL = "#FEF3C7";
const YD = "#D97706";

/* ───── types ───── */
type TicketStatus = "Open" | "Under Review" | "Resolved" | "Pending";

interface StatusBadgeProps {
  status: TicketStatus;
}

interface HelpCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  accent?: string;
}

interface FAQItemProps {
  question: string;
}

interface GuideCardProps {
  visual: ReactNode;
  title: string;
  description: string;
}

interface TicketRowProps {
  icon: LucideIcon;
  title: string;
  updated: string;
  status: TicketStatus;
}

interface DisputeRowProps {
  title: string;
  updated: string;
  status: TicketStatus;
}

interface ContactCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  iconBg: string;
  iconColor: string;
}

interface SectionTitleProps {
  children: ReactNode;
  action?: ReactNode;
}

interface HeroBannerProps {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
}

/* ───── Status Badge ───── */
const StatusBadge = ({ status }: StatusBadgeProps) => {
  const map: Record<TicketStatus, string> = {
    Open: "bg-blue-50 text-blue-600 border-blue-200",
    "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Pending: "bg-orange-50 text-orange-500 border-orange-200",
  };

  const dot: Record<TicketStatus, string> = {
    Open: "bg-blue-400",
    "Under Review": "bg-amber-400",
    Resolved: "bg-emerald-400",
    Pending: "bg-orange-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        map[status] ?? "bg-gray-50 text-gray-500 border-gray-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
};

/* ───── Help Category Card ───── */
const HelpCard = ({ Icon, title, description, accent }: HelpCardProps) => (
  <Card
    className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-[#FBBF00]/40 overflow-hidden relative"
    style={{ "--accent": accent } as React.CSSProperties}
  >
    <div
      className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: Y }}
    />
    <CardContent className="p-5 flex flex-col gap-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: YL }}
      >
        <Icon size={18} style={{ color: YD }} />
      </div>
      <div>
        <CardTitle className="text-sm font-semibold text-gray-800 mb-1">
          {title}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed text-gray-500">
          {description}
        </CardDescription>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: YD }}
      >
        Get Help <ArrowRight size={11} />
      </div>
    </CardContent>
  </Card>
);

/* ───── FAQ Item ───── */
const FAQItem = ({ question }: FAQItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full flex items-start gap-2.5 text-sm text-left text-gray-700 hover:text-gray-900 transition-colors group py-1"
    >
      <ChevronRight
        size={14}
        className="mt-0.5 flex-shrink-0 transition-transform duration-200"
        style={{ color: Y, transform: open ? "rotate(90deg)" : "none" }}
      />
      <span className="leading-snug">{question}</span>
    </button>
  );
};

/* ───── Guide Card ───── */
const GuideCard = ({ visual, title, description }: GuideCardProps) => (
  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-[#FBBF00]/30">
    <div className="h-28 bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
      <div className="text-5xl z-10">{visual}</div>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 70% 50%, ${Y} 0%, transparent 60%)`,
        }}
      />
    </div>
    <CardContent className="p-4 flex flex-col gap-1.5">
      <CardTitle className="text-sm leading-snug font-semibold">{title}</CardTitle>
      <CardDescription className="text-xs leading-relaxed">
        {description}
      </CardDescription>
      <button
        type="button"
        className="flex items-center gap-1 text-xs font-semibold mt-1 group-hover:gap-2 transition-all"
        style={{ color: YD }}
      >
        Read Article <ArrowRight size={11} />
      </button>
    </CardContent>
  </Card>
);

/* ───── Ticket Row ───── */
const TicketRow = ({ icon: Icon, title, updated, status }: TicketRowProps) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group">
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: YL }}
      >
        <Icon size={15} style={{ color: YD }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">
          {title}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock size={10} /> {updated}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <StatusBadge status={status} />
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 h-7 hover:border-[#FBBF00] hover:text-amber-700 transition-colors"
      >
        <ExternalLink size={11} /> View Ticket
      </Button>
    </div>
  </div>
);

/* ───── Dispute Row ───── */
const DisputeRow = ({ title, updated, status }: DisputeRowProps) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
        <Scale size={15} className="text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock size={10} /> {updated}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <StatusBadge status={status} />
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-7 hover:border-[#FBBF00] hover:text-amber-700 transition-colors"
      >
        View Details
      </Button>
    </div>
  </div>
);

/* ───── Contact Card ───── */
const ContactCard = ({
  Icon,
  title,
  description,
  cta,
  iconBg,
  iconColor,
}: ContactCardProps) => (
  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-[#FBBF00]/40 text-center overflow-hidden relative">
    <div
      className="absolute inset-x-0 bottom-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ background: Y }}
    />
    <CardContent className="p-6 flex flex-col items-center gap-3">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${iconBg}`}
      >
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
        <CardDescription className="text-xs mt-1 leading-relaxed">
          {description}
        </CardDescription>
      </div>
      <Button
        size="sm"
        className="mt-1 text-xs h-7 gap-1.5 text-amber-800 hover:brightness-95 transition-all font-semibold"
        style={{ background: Y }}
      >
        {cta} <ArrowRight size={11} />
      </Button>
    </CardContent>
  </Card>
);

/* ───── Section Title ───── */
const SectionTitle = ({ children, action }: SectionTitleProps) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <div className="w-1 h-5 rounded-full" style={{ background: Y }} />
      <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">
        {children}
      </h2>
    </div>
    {action}
  </div>
);

/* ───── Hero Search Banner ───── */
const HeroBanner = ({ search, setSearch }: HeroBannerProps) => (
  <div
    className="rounded-2xl p-8 mb-8 relative overflow-hidden"
    style={{ background: "linear-gradient(135deg, #1C1917 0%, #292524 100%)" }}
  >
    <div
      className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{ background: Y, transform: "translate(30%, -30%)" }}
    />
    <div
      className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
      style={{ background: Y, transform: "translate(-20%, 30%)" }}
    />
    <div className="relative z-10 flex flex-col items-center gap-5 text-center">
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold"
        style={{
          borderColor: `${Y}40`,
          color: Y,
          background: `${Y}10`,
        }}
      >
        <Sparkles size={12} /> Support Center
      </div>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          How can we help you?
        </h1>
        <p className="text-sm text-gray-400">
          Search our knowledge base or browse categories below
        </p>
      </div>

      <div className="relative w-full max-w-lg">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="Search help articles, FAQs, guides..."
          className="pl-11 h-11 bg-white/10 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/15 focus:border-[#FBBF00]/50 text-sm backdrop-blur-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Popular:</span>
        {["Payment issues", "Contract help", "Profile setup"].map((t) => (
          <button
            key={t}
            type="button"
            className="px-2 py-0.5 rounded-full border border-white/10 hover:border-[#FBBF00]/40 text-gray-400 hover:text-[#FBBF00] transition-colors"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ───── Main ───── */
export default function SupportCenter() {
  const [search, setSearch] = useState<string>("");

  return (
    <div className="min-h-screen bg-gray-50/80 font-sans">
      {/* Topbar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: Y }}
            >
              <LifeBuoy size={14} className="text-amber-900" />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-none">
                Support Center
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Get help, resolve issues, raise disputes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8 font-semibold text-amber-900 hover:brightness-95"
              style={{ background: Y }}
            >
              <MessageCircle size={13} /> Contact Support
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 font-semibold border-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <AlertTriangle size={13} /> Raise Dispute
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <HeroBanner search={search} setSearch={setSearch} />

        <div className="space-y-10">
          <section>
            <SectionTitle>Help Categories</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              <HelpCard
                Icon={User}
                title="Account & Profile Help"
                description="Manage your profile, settings, and account security."
              />
              <HelpCard
                Icon={Megaphone}
                title="Campaign Issues"
                description="Resolve problems related to your ongoing campaigns."
              />
              <HelpCard
                Icon={Wallet}
                title="Payments & Wallet"
                description="Review transactions, payouts, and wallet balance."
              />
              <HelpCard
                Icon={FileText}
                title="Contracts & Deliverables"
                description="Help with agreement terms and current submissions."
              />
              <HelpCard
                Icon={Wrench}
                title="Technical Support"
                description="Troubleshoot technical issues and platform errors."
              />
              <HelpCard
                Icon={Shield}
                title="Safety & Trust"
                description="Report abuse, fraud, or policy violations."
              />
            </div>
          </section>

          <section>
            <SectionTitle>Knowledge Base & FAQs</SectionTitle>
            <div className="grid grid-cols-5 gap-5">
              <Card className="col-span-3 border border-gray-100">
                <CardHeader className="pb-3 pt-5 px-5 border-b border-gray-50">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: YL }}
                    >
                      <HelpCircle size={13} style={{ color: YD }} />
                    </div>
                    Popular FAQs
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 py-4 flex flex-col gap-3">
                  {[
                    "How do I update my profile information?",
                    "What should I do if a campaign payment is delayed?",
                    "How can I dispute a campaign outcome?",
                    "Where can I find my current contracts?",
                    "How to connect my social media accounts?",
                  ].map((q) => (
                    <FAQItem key={q} question={q} />
                  ))}
                </CardContent>
              </Card>

              <div className="col-span-2 flex flex-col gap-3">
                <p className="text-sm font-bold text-gray-700">Help Guides</p>
                <GuideCard
                  visual="🚀"
                  title="Getting Started with CollabStars"
                  description="A comprehensive guide for new users to navigate the platform and create their first campaigns."
                />
                <GuideCard
                  visual="📊"
                  title="Maximizing Your Campaign Reach"
                  description="Tips and tricks to optimize your content and reach a wider audience on CollabStars."
                />
              </div>
            </div>
          </section>

          <section>
            <SectionTitle
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1.5 border-gray-200 hover:border-amber-300 hover:text-amber-700"
                >
                  <Plus size={11} /> New Ticket
                </Button>
              }
            >
              Active Support Tickets
            </SectionTitle>

            <Card className="border border-gray-100 overflow-hidden">
              <div className="px-1 py-1">
                <div className="px-4 py-2 grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span>Issue</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                <Separator />
                <CardContent className="p-4 pt-2">
                  <TicketRow
                    icon={Wallet}
                    title="Campaign payment discrepancy"
                    updated="Last updated: 2 hours ago"
                    status="Open"
                  />
                  <TicketRow
                    icon={User}
                    title="Profile verification pending"
                    updated="Last updated: 1 day ago"
                    status="Under Review"
                  />
                  <TicketRow
                    icon={FileText}
                    title="Deliverable submission issue"
                    updated="Last updated: 3 days ago"
                    status="Resolved"
                  />
                </CardContent>
              </div>
            </Card>
          </section>

          <section>
            <SectionTitle
              action={
                <Button
                  size="sm"
                  className="text-xs h-7 gap-1.5 font-semibold text-amber-900 hover:brightness-95"
                  style={{ background: Y }}
                >
                  <Plus size={11} /> Raise New Dispute
                </Button>
              }
            >
              Dispute Management
            </SectionTitle>

            <Card className="border border-gray-100">
              <CardContent className="p-4">
                <DisputeRow
                  title="Dispute over campaign brief changes"
                  updated="Last updated: 1 week ago"
                  status="Pending"
                />
                <DisputeRow
                  title="Dispute on content quality"
                  updated="Last updated: 2 weeks ago"
                  status="Resolved"
                />
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionTitle>Contact Support Options</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              <ContactCard
                Icon={Zap}
                title="Chat Support"
                description="Get instant help from our live support team. Average response: 2 min."
                cta="Start Chat"
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
              />
              <ContactCard
                Icon={Mail}
                title="Email Support"
                description="Send us a detailed message and we'll respond within 24 hours."
                cta="Send Email"
                iconBg="bg-violet-50"
                iconColor="text-violet-500"
              />
              <ContactCard
                Icon={BookOpen}
                title="Help Documentation"
                description="Browse our extensive library of self-serve guides and tutorials."
                cta="Browse Docs"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
              />
            </div>
          </section>

          <div className="text-center pt-2 pb-6">
            <Separator className="mb-6" />
            <p className="text-xs text-muted-foreground">
              © 2026 CollabStars. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}