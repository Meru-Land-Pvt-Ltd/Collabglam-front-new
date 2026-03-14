"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { post, postFormData } from "@/lib/api";
import {
  Search,
  MessageSquareText,
  History,
  Headphones,
  PlusCircle,
  HelpCircle,
  Megaphone,
  FileText,
  CreditCard,
  ShieldAlert,
  ChevronDown,
  Mail,
  MessageCircle,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import RaiseIssueModal from "./RaiseIssueModal";
import DisputeHistorySection from "./DisputeHistorySection";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQSection = {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
};

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
};

type AppliedCampaign = {
  _id?: string;
  campaignId?: string;
  campaignName?: string;
  brandId?: string;
  brandName?: string;
  isActive?: number;
  applicantCount?: number;
  hasApplied?: number;
  isDraft?: number;
  createdAt?: string;
  isContracted?: number;
  isAccepted?: number;
  contractId?: string | null;
  contractStatus?: string | null;
};

type SelectOption = {
  key?: string;
  label: string;
  value: string;
};

type SupportPopupState = {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
};

const faqSections: FAQSection[] = [
  {
    title: "Campaigns",
    icon: <Megaphone className="h-4 w-4" />,
    items: [
      {
        question: "How do I apply to a campaign?",
        answer:
          "Browse campaigns in the marketplace, open the campaign brief, check eligibility, then click Apply to submit your application for brand review.",
      },
      {
        question: "How do I receive campaign invitations?",
        answer:
          "Brands may invite influencers directly. You’ll receive a dashboard notification and email. Open the invitation, review the brief, and accept.",
      },
      {
        question: "Can I edit a campaign after publishing?",
        answer:
          "Influencers cannot edit campaigns. Only brands manage campaign details. Influencers can update deliverables or communicate with brands if changes are needed.",
      },
    ],
  },
  {
    title: "Deliverables",
    icon: <FileText className="h-4 w-4" />,
    items: [
      {
        question: "How do I review influencer deliverables?",
        answer:
          "Open the active campaign, go to the Deliverables section, upload your content or link, then submit it for brand review.",
      },
      {
        question: "Can I request revisions?",
        answer:
          "Yes. If brands request revisions, update the deliverable according to feedback and resubmit the content through the Deliverables section.",
      },
    ],
  },
  {
    title: "Payments",
    icon: <CreditCard className="h-4 w-4" />,
    items: [
      {
        question: "When are payments released?",
        answer:
          "Payments are released after deliverables are approved and any platform holding period is completed, depending on campaign payment terms.",
      },
      {
        question: "How do milestone payments work?",
        answer:
          "Milestone payments are released after completing specific campaign stages like draft approval, content submission, or final campaign completion.",
      },
    ],
  },
  {
    title: "Disputes",
    icon: <ShieldAlert className="h-4 w-4" />,
    items: [
      {
        question: "How do I raise an issue?",
        answer:
          "Open the campaign, navigate to the dispute section, click Raise Issue, provide details and evidence, and submit for review.",
      },
      {
        question: "What evidence should I provide?",
        answer:
          "Provide screenshots, content links, campaign brief references, communication records, or proof of submission supporting your dispute claim.",
      },
      {
        question: "How long does dispute resolution take?",
        answer:
          "Disputes are typically reviewed within 3–7 business days depending on complexity, evidence provided, and responses from both influencer and brand.",
      },
    ],
  },
];

const supportCategoryOptions: SelectOption[] = [
  { label: "Campaign support", value: "Campaign support" },
  { label: "Payment support", value: "Payment support" },
  { label: "Deliverables support", value: "Deliverables support" },
  { label: "Account support", value: "Account support" },
  { label: "Technical issue", value: "Technical issue" },
  { label: "Contract or legal", value: "Contract or legal" },
  { label: "General inquiry", value: "General inquiry" },
];

function ActionCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}: ActionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-black">
        {icon}
      </div>
      <h3 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mx-auto mt-4 max-w-sm text-center text-base leading-7 text-slate-600">
        {description}
      </p>
      <button
        onClick={onClick}
        className="mt-8 w-full rounded-xl border border-black bg-white px-4 py-3 text-base font-medium text-black transition hover:bg-slate-50"
      >
        {buttonText}
      </button>
    </div>
  );
}

function FAQAccordion({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-slate-700">
        <span className="text-black">{section.icon}</span>
        <h3 className="text-2xl font-semibold tracking-tight">
          {section.title}
        </h3>
      </div>

      <div className="space-y-3">
        {section.items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={item.question}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-lg font-medium text-slate-900">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-black transition-transform ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-base leading-7 text-slate-600">
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPopup({
  open,
  type,
  title,
  message,
  onClose,
}: {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {type === "success" ? "Success" : "Error"}
        </div>

        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-left text-base text-slate-800 shadow-sm outline-none transition hover:border-slate-400 focus:border-black disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <span className={selected ? "text-slate-800" : "text-slate-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="max-h-60 overflow-y-auto py-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.key || option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-3 text-left text-sm transition ${
                      isSelected
                        ? "bg-slate-100 font-medium text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500">
                No options available
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContactSupportSection({
  onSuccess,
  onError,
}: {
  onSuccess: (ticketId?: string | null) => void;
  onError: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<AppliedCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [category, setCategory] = useState("");
  const [relatedCampaignId, setRelatedCampaignId] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedInfluencerId = localStorage.getItem("influencerId");
    setInfluencerId(storedInfluencerId);
  }, []);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!influencerId) return;

      setLoadingCampaigns(true);
      try {
        const data = await post<{ campaigns?: AppliedCampaign[] }>(
          "/dispute/influencer/applied",
          {
            influencerId,
            page: 1,
            limit: 1000,
          }
        );
        setCampaigns(data?.campaigns || []);
      } catch {
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, [influencerId]);

  const campaignOptions: SelectOption[] = useMemo(() => {
    const usable = campaigns.filter((campaign) => {
      const id = String(campaign.campaignId || campaign._id || "").trim();
      const label = String(campaign.campaignName || "").trim();
      return id !== "" && label !== "";
    });

    return [
      { label: "No related campaign", value: "" },
      ...usable.map((campaign) => ({
        key: `campaign-${campaign.campaignId || campaign._id}`,
        value: String(campaign.campaignId || campaign._id),
        label: String(campaign.campaignName).trim(),
      })),
    ];
  }, [campaigns]);

  const resetForm = () => {
    setCategory("");
    setRelatedCampaignId("");
    setDescription("");
    setAttachments([]);
    setError(null);
  };

  const handleAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxSize = 10 * 1024 * 1024;
    const invalidFile = files.find((file) => file.size > maxSize);

    if (invalidFile) {
      setError(`"${invalidFile.name}" is larger than 10MB.`);
      return;
    }

    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    const maxSize = 10 * 1024 * 1024;
    const invalidFile = files.find((file) => file.size > maxSize);

    if (invalidFile) {
      setError(`"${invalidFile.name}" is larger than 10MB.`);
      return;
    }

    setAttachments((prev) => [...prev, ...files]);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!influencerId) {
      const message = "Missing influencer id. Please log in again.";
      setError(message);
      onError(message);
      return;
    }

    if (!category) {
      const message = "Please select an issue category.";
      setError(message);
      onError(message);
      return;
    }

    if (!description.trim()) {
      const message = "Please enter a detailed description.";
      setError(message);
      onError(message);
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("influencerId", influencerId);
      form.append("category", category);
      form.append("description", description.trim());

      if (relatedCampaignId) {
        form.append("relatedCampaignId", relatedCampaignId);
      }

      attachments.forEach((file) => {
        form.append("attachments", file);
      });

      const response = await postFormData<{ ticketId?: string }>(
        "/support/influencer/create",
        form
      );

      const createdTicketId = response?.ticketId || null;
      resetForm();
      onSuccess(createdTicketId);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to submit support request";
      setError(message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact-support" className="mt-16">
      <div className="mb-6 flex items-center gap-2">
        <Headphones className="h-6 w-6 text-black" />
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">
          Contact Support
        </h2>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col justify-between bg-black px-8 py-10 text-white">
            <div>
              <h3 className="text-4xl font-bold tracking-tight">Direct Help</h3>
              <p className="mt-6 max-w-xs text-lg leading-9 text-white/75">
                Our dedicated support experts are available Monday to Friday,
                9:00 AM – 6:00 PM EST.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Email Address</p>
                    <p className="mt-1 text-xl font-semibold">
                      support@collabglam.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Live Chat</p>
                    <p className="mt-1 text-xl font-semibold">
                      Available in-app for Pro users
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-lg italic leading-8 text-white/80">
                “The resolution time was much faster than expected. The team
                understood my issue clearly and kept the process smooth from
                start to finish.”
              </p>
              <p className="mt-6 text-sm font-semibold text-white">
                — Ava Martin, Creator
              </p>
            </div>
          </div>

          <div className="bg-[#f7f7f8] px-6 py-8 sm:px-10 sm:py-10">
            {error ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-sm font-bold text-slate-700">
                  Issue Category
                </label>
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  options={supportCategoryOptions}
                  placeholder="Select a category"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-slate-700">
                  Related Campaign (Optional)
                </label>
                <CustomSelect
                  value={relatedCampaignId}
                  onChange={setRelatedCampaignId}
                  options={campaignOptions}
                  placeholder={
                    loadingCampaigns
                      ? "Loading campaigns..."
                      : "Select a campaign"
                  }
                  disabled={loadingCampaigns || submitting}
                />
              </div>
            </div>

            <div className="mt-8">
              <label className="mb-3 block text-sm font-bold text-slate-700">
                Detailed Description
              </label>
              <textarea
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide as much detail as possible about the issue you're facing..."
                className="w-full rounded-[22px] border border-slate-300 bg-white px-4 py-4 text-base text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-black"
              />
            </div>

            <div className="mt-8">
              <label className="mb-3 block text-sm font-bold text-slate-700">
                Attachments
              </label>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.zip"
                className="hidden"
                onChange={handleAttachmentChange}
              />

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="cursor-pointer rounded-[24px] border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center transition hover:border-black hover:bg-slate-50"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-black">
                  <Paperclip className="h-6 w-6" />
                </div>
                <p className="mt-5 text-2xl font-semibold text-slate-900">
                  Click to upload or drag and drop
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  PDF, JPG, PNG or ZIP (max. 10MB)
                </p>
              </div>

              {attachments.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-black">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {file.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-black"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="rounded-xl px-5 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-8 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Upload className="h-4 w-4 animate-pulse" /> : null}
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchParamsHandler({
  onDisputeCreated,
}: {
  onDisputeCreated: (ticket: string | null) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const disputeCreated = searchParams.get("disputeCreated");
    const ticket = searchParams.get("ticket");

    if (disputeCreated === "1") {
      onDisputeCreated(ticket);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("disputeCreated");
      params.delete("ticket");

      const nextUrl = params.toString()
        ? `/influencer/support-centre?${params.toString()}`
        : "/influencer/support-centre";

      router.replace(nextUrl, { scroll: false });
    }
  }, [searchParams, router, onDisputeCreated]);

  return null;
}

export default function SupportPage() {
  const [isRaiseIssueOpen, setIsRaiseIssueOpen] = useState(false);
  const [popup, setPopup] = useState<SupportPopupState | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler
          onDisputeCreated={(ticket) => {
            setPopup({
              open: true,
              type: "success",
              title: "Issue submitted successfully",
              message: ticket
                ? `Your dispute has been created successfully. Ticket ID: ${ticket}.`
                : "Your dispute has been created successfully. Our team will review it shortly.",
            });
          }}
        />
      </Suspense>

      <div className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
          <section>
            <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Help &amp; Support
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              Find quick answers, browse our documentation, or raise an issue
              related to your campaigns and payments.
            </p>

            {/* <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm sm:flex-row">
              <div className="flex min-h-[56px] flex-1 items-center gap-3 rounded-2xl bg-white px-4">
                <Search className="h-5 w-5 text-black" />
                <input
                  type="text"
                  placeholder="Search help topics, FAQs, or dispute IDs..."
                  className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <button className="rounded-2xl bg-black px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800">
                Search
              </button>
            </div> */}
          </section>

          <section className="mt-16">
            <div className="mb-6 flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-black" />
              <h2 className="text-3xl font-bold tracking-tight">
                Quick Actions
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <ActionCard
                icon={<MessageSquareText className="h-8 w-8 text-black" />}
                title="Raise an Issue"
                description="Report problems related to campaigns, payments, or deliverables directly to our team."
                buttonText="Open Ticket"
                onClick={() => setIsRaiseIssueOpen(true)}
              />
              <ActionCard
                icon={<History className="h-8 w-8 text-black" />}
                title="Dispute History"
                description="Track the status of previously raised issues and view resolution outcomes."
                buttonText="View History"
                onClick={() => scrollToSection("dispute-history")}
              />
              <ActionCard
                icon={<Headphones className="h-8 w-8 text-black" />}
                title="Contact Support"
                description="Reach out to the CollabGlam support team for direct assistance with your account."
                buttonText="Send Message"
                onClick={() => scrollToSection("contact-support")}
              />
            </div>
          </section>

          <section className="mt-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-black" />
                <h2 className="text-3xl font-bold tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <button className="text-sm font-semibold text-black transition hover:text-slate-700">
                Browse full documentation
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <FAQAccordion section={faqSections[0]} />
              <FAQAccordion section={faqSections[1]} />
              <FAQAccordion section={faqSections[2]} />
              <FAQAccordion section={faqSections[3]} />
            </div>
          </section>

          <DisputeHistorySection />

          <ContactSupportSection
            onSuccess={(ticketId) => {
              setPopup({
                open: true,
                type: "success",
                title: "Support request submitted successfully",
                message: ticketId
                  ? `Your support request has been created successfully. Ticket ID: ${ticketId}.`
                  : "Your support request has been created successfully. Our team will review it shortly.",
              });
            }}
            onError={(message) => {
              setPopup({
                open: true,
                type: "error",
                title: "Unable to submit request",
                message,
              });
            }}
          />
        </div>
      </div>

      <RaiseIssueModal
        open={isRaiseIssueOpen}
        onClose={() => setIsRaiseIssueOpen(false)}
      />

      <StatusPopup
        open={!!popup?.open}
        type={popup?.type || "success"}
        title={popup?.title || ""}
        message={popup?.message || ""}
        onClose={() => setPopup(null)}
      />
    </>
  );
}