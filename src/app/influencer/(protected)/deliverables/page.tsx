"use client";

import React, { useState, useMemo, useRef } from "react";
import { ManualPreviewCard } from "@/components/ui/cardPreview";
import { FloatingSelect, SelectItem } from "@/components/ui/selectComp";
import {
  LayoutGrid, Clock, TrendingDown, TrendingUp, ArrowUpDown,
  FileVideo, FileImage, BookImage, Layers, Link2, Upload, X, LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/buttonComp";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
type ApprovalStatus =
  | "Pending Approval"
  | "Under Review"
  | "Revision Needed"
  | "Approved"
  | "Completed";

type SubmissionStatus =
  | "Pending Submission"
  | "Under Review"
  | "Revision Requested"
  | "Approved"
  | "Completed";

type DeliverableType = "Reel" | "Post" | "Story" | "Video";

type Tab =
  | "Pending Submission"
  | "Under Review"
  | "Revision Requested"
  | "Approved"
  | "Completed";

interface Deliverable {
  id: number;
  brand: string;
  campaign: string;
  type: DeliverableType;
  approvalStatus: ApprovalStatus;
  submissionStatus: SubmissionStatus;
  overdueDays: number | null;
  milestone: number;
  totalMilestones: number;
  tab: Tab;
  location: string;
}

interface PreviewForm {
  title: string;
  description: string;
  categoryName: string;
  targetAgeGroups: string[];
  goals: string[];
  targetCountry: string[];
  campaignBudget: number;
}

interface PreviewMeta {
  ageMap: Record<string, string>;
  goalsMap: Record<string, string>;
  countryMap: Record<string, string>;
  campaignBudget: number;
}

interface DeliverablePreview {
  form: PreviewForm;
  meta: PreviewMeta;
}

interface FilterOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

/* ─────────────────────────────────────────────
   Mock deliverables data
   ───────────────────────────────────────────── */
const mockDeliverables: Deliverable[] = [
  {
    id: 1,
    brand: "Radiant Beauty Co.",
    campaign: "Summer Glow",
    type: "Reel",
    approvalStatus: "Pending Approval",
    submissionStatus: "Pending Submission",
    overdueDays: 567,
    milestone: 1,
    totalMilestones: 3,
    tab: "Pending Submission",
    location: "Remote",
  },
  {
    id: 2,
    brand: "Sparkle Jewels",
    campaign: "Timeless",
    type: "Post",
    approvalStatus: "Pending Approval",
    submissionStatus: "Pending Submission",
    overdueDays: 558,
    milestone: 1,
    totalMilestones: 2,
    tab: "Pending Submission",
    location: "New York",
  },
  {
    id: 3,
    brand: "FitLife Co.",
    campaign: "30-Day Challenge",
    type: "Story",
    approvalStatus: "Under Review",
    submissionStatus: "Under Review",
    overdueDays: null,
    milestone: 2,
    totalMilestones: 3,
    tab: "Under Review",
    location: "Remote",
  },
  {
    id: 4,
    brand: "Brew Haven",
    campaign: "Morning Ritual",
    type: "Video",
    approvalStatus: "Revision Needed",
    submissionStatus: "Revision Requested",
    overdueDays: 12,
    milestone: 1,
    totalMilestones: 2,
    tab: "Revision Requested",
    location: "Los Angeles",
  },
  {
    id: 5,
    brand: "HealthyBite",
    campaign: "Snack Reviews",
    type: "Post",
    approvalStatus: "Approved",
    submissionStatus: "Approved",
    overdueDays: null,
    milestone: 3,
    totalMilestones: 3,
    tab: "Approved",
    location: "Remote",
  },
  {
    id: 6,
    brand: "Fashion Nova",
    campaign: "Summer Collection",
    type: "Reel",
    approvalStatus: "Completed",
    submissionStatus: "Completed",
    overdueDays: null,
    milestone: 2,
    totalMilestones: 2,
    tab: "Completed",
    location: "Miami",
  },
];

/* ─────────────────────────────────────────────
   Map a deliverable → ManualPreviewCard form + meta
   ───────────────────────────────────────────── */
function deliverableToPreview(d: Deliverable): DeliverablePreview {
  const overdueText =
    d.overdueDays != null ? `⚠ Overdue by ${d.overdueDays} days` : null;

  const description = [d.campaign, overdueText].filter(Boolean).join(" · ");

  const milestoneKey = `m_${d.milestone}_${d.totalMilestones}`;
  const milestoneLabel = `Milestone ${d.milestone} of ${d.totalMilestones}`;

  const locationKey = d.location;

  return {
    form: {
      title: d.brand,
      description,
      categoryName: d.type,
      targetAgeGroups: [milestoneKey],
      goals: [d.approvalStatus],
      targetCountry: [locationKey],
      campaignBudget: 0,
    },
    meta: {
      ageMap: { [milestoneKey]: milestoneLabel },
      goalsMap: { [d.approvalStatus]: d.approvalStatus },
      countryMap: { [locationKey]: locationKey },
      campaignBudget: 0,
    },
  };
}

/* ─────────────────────────────────────────────
   Filter / sort option lists
   ───────────────────────────────────────────── */
const campaignOptions: FilterOption[] = [
  { value: "all", label: "All Campaigns", icon: LayoutGrid },
  ...["Summer Glow", "Timeless", "30-Day Challenge", "Morning Ritual", "Snack Reviews", "Summer Collection"]
    .map((c): FilterOption => ({ value: c, label: c, icon: LayoutGrid })),
];

const typeOptions: FilterOption[] = [
  { value: "all",   label: "All Types", icon: Layers },
  { value: "Reel",  label: "Reel",      icon: FileVideo },
  { value: "Post",  label: "Post",      icon: FileImage },
  { value: "Story", label: "Story",     icon: BookImage },
  { value: "Video", label: "Video",     icon: FileVideo },
];

const statusOptions: FilterOption[] = [
  { value: "all",              label: "All Statuses",     icon: LayoutGrid },
  { value: "Pending Approval", label: "Pending Approval", icon: Clock },
  { value: "Under Review",     label: "Under Review",     icon: Clock },
  { value: "Revision Needed",  label: "Revision Needed",  icon: TrendingDown },
  { value: "Approved",         label: "Approved",         icon: TrendingUp },
  { value: "Completed",        label: "Completed",        icon: TrendingUp },
];

const deadlineOptions: FilterOption[] = [
  { value: "all",     label: "Anytime", icon: Clock },
  { value: "overdue", label: "Overdue", icon: Clock },
];

const sortOptions: FilterOption[] = [
  { value: "latest", label: "Latest", icon: ArrowUpDown },
  { value: "oldest", label: "Oldest", icon: ArrowUpDown },
];

/* ─────────────────────────────────────────────
   Submit Deliverable Modal
   ───────────────────────────────────────────── */
interface SubmitDeliverableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SubmitDeliverableModal({ open, onOpenChange }: SubmitDeliverableModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFile = (f: File | undefined): void => {
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleClose = (): void => {
    setFile(null);
    setExternalLink("");
    setCaption("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-8 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Submit Deliverable
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Upload your content or provide an external link along with any notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Content File (Image/Video/Document)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={[
                "relative flex flex-col items-center justify-center gap-2",
                "border-2 border-dashed rounded-xl cursor-pointer px-6 py-8 transition-colors",
                isDragging
                  ? "border-[#FFBF00] bg-[#FFF9E6]"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100",
              ].join(" ")}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFile(e.target.files?.[0])
                }
              />
              {file ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Upload className="h-4 w-4 text-[#FFBF00]" />
                    <span className="truncate max-w-[260px]">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="absolute top-2.5 right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Click to upload</span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">Image, Video, or Document</p>
                </>
              )}
            </div>
          </div>

          {/* External Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">External Link</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="https://your-content-link.com"
                value={externalLink}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExternalLink(e.target.value)
                }
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          {/* Caption / Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Caption / Notes</label>
            <Textarea
              placeholder="Add any specific captions, hashtags, or notes for the brand..."
              value={caption}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCaption(e.target.value)
              }
              className="rounded-xl resize-none min-h-[100px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-7">
          <Button variant="outline" className="flex-1 rounded-lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="flex-1 rounded-lg !bg-[#FFBF00] !text-[#1A1A1A]" onClick={handleClose}>
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   TABS
   ───────────────────────────────────────────── */
const TABS: Tab[] = [
  "Pending Submission",
  "Under Review",
  "Revision Requested",
  "Approved",
  "Completed",
];

/* ─────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────── */
export default function DeliverablesPage() {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>("Pending Submission");
  const [campaign,  setCampaign]  = useState<string>("all");
  const [delivType, setDelivType] = useState<string>("all");
  const [status,    setStatus]    = useState<string>("all");
  const [deadline,  setDeadline]  = useState<string>("all");
  const [sortBy,    setSortBy]    = useState<string>("latest");

  const filtered = useMemo<Deliverable[]>(() => {
    let list = mockDeliverables.filter((d) => d.tab === activeTab);
    if (campaign  !== "all")    list = list.filter((d) => d.campaign       === campaign);
    if (delivType !== "all")    list = list.filter((d) => d.type           === delivType);
    if (status    !== "all")    list = list.filter((d) => d.approvalStatus === status);
    if (deadline === "overdue") list = list.filter((d) => d.overdueDays    != null);
    if (sortBy === "oldest")    list = [...list].reverse();
    return list;
  }, [activeTab, campaign, delivType, status, deadline, sortBy]);

  const tabCount = (tab: Tab): number =>
    mockDeliverables.filter((d) => d.tab === tab).length;

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <SubmitDeliverableModal open={modalOpen} onOpenChange={setModalOpen} />
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-0">

          {/* ── HEADER ── */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deliverables</h1>
              <p className="text-gray-500 text-sm mt-1">
                Submit content, track approvals, and manage deadlines.
              </p>
            </div>
            <Button className="!bg-[#FFBF00] !text-[#1A1A1A]" onClick={() => setModalOpen(true)}>
              Submit Deliverable
            </Button>
          </div>

          <div className="h-px w-full bg-gray-200" />

          {/* ── TABS ── */}
          <div className="flex overflow-x-auto border-b border-gray-200">
            {TABS.map((tab) => {
              const active = tab === activeTab;
              const count  = tabCount(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap border-b-4 transition-colors",
                    active
                      ? "border-[#FFBF00] font-bold text-[#FFBF00]"
                      : "border-transparent font-medium text-[#1A1A1A]",
                  ].join(" ")}
                >
                  {tab}
                  {count > 0 && (
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        active
                          ? "bg-[#FFF9E6] border border-[#FFBF00] text-amber-700"
                          : "bg-gray-100 border border-gray-200 text-gray-500",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── FILTERS ── */}
          <div className="flex items-end justify-between gap-4 py-6 flex-wrap">
            <div className="flex items-end gap-3 flex-wrap">
              {(
                [
                  { label: "Campaign",          value: campaign,  onChange: setCampaign,  options: campaignOptions,  searchable: true,  width: "w-[200px]" },
                  { label: "Deliverable Type",  value: delivType, onChange: setDelivType, options: typeOptions,      searchable: false, width: "w-[180px]" },
                  { label: "Status",            value: status,    onChange: setStatus,    options: statusOptions,    searchable: false, width: "w-[180px]" },
                  { label: "Deadline Proximity",value: deadline,  onChange: setDeadline,  options: deadlineOptions,  searchable: false, width: "w-[180px]" },
                ] as {
                  label: string;
                  value: string;
                  onChange: (v: string) => void;
                  options: FilterOption[];
                  searchable: boolean;
                  width: string;
                }[]
              ).map(({ label, value, onChange, options, searchable, width }) => (
                <div key={label} className={`${width} shrink-0`}>
                  <FloatingSelect
                    label={label}
                    value={value}
                    onValueChange={onChange}
                    searchable={searchable}
                    size="small"
                  >
                    {options.map((o) => {
                      const Icon = o.icon;
                      return (
                        <SelectItem key={o.value} value={o.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-400" />
                            {o.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </FloatingSelect>
                </div>
              ))}
            </div>

            {/* Right: Sort By */}
            <div className="w-[160px] shrink-0">
              <FloatingSelect
                label="Sort By"
                value={sortBy}
                onValueChange={setSortBy}
                searchable={false}
                size="small"
              >
                {sortOptions.map((o) => {
                  const Icon = o.icon;
                  return (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-400" />
                        {o.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>
          </div>

          {/* ── CARD GRID ── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
              <span className="text-5xl">📭</span>
              <p className="text-base font-semibold text-gray-500">No deliverables found</p>
              <p className="text-sm">Try adjusting your filters or switching tabs.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => {
                const { form, meta } = deliverableToPreview(item);
                return <ManualPreviewCard key={item.id} form={form} meta={meta} />;
              })}
            </div>
          )}

        </div>
      </div>
    </TooltipProvider>
  );
}