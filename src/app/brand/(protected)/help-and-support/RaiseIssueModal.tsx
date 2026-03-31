"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { get, post, postFormData } from "@/lib/api";
import {
  Search,
  X,
  Upload,
  CircleAlert,
  FileText,
  Loader2,
  ChevronDown,
} from "lucide-react";

type Campaign = {
  _id: string;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
};

type Applicant = {
  influencerId: string;
  name?: string;
  handle?: string | null;
};

type SelectOption = {
  key?: string;
  label: string;
  value: string;
};

type RaiseIssueModalProps = {
  open: boolean;
  onClose: () => void;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
};

const issueTypeOptions: SelectOption[] = [
  { label: "Other", value: "other" },
  { label: "Payment", value: "payment" },
  { label: "Timeline", value: "timeline" },
  { label: "Content", value: "content" },
];

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
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="max-h-60 overflow-y-auto py-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.key}
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

export default function RaiseIssueModal({
  open,
  onClose,
}: RaiseIssueModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [brandId, setBrandId] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [campaignId, setCampaignId] = useState("");
  const [influencerId, setInfluencerId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [relatedType, setRelatedType] = useState("other");
  const [relatedId] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("brandId");
    setBrandId(id);
    if (!id) {
      setError("Missing brand id. Please log in again as a brand.");
    }
  }, []);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!open || !brandId) return;
      setLoadingCampaigns(true);
      setError(null);
      try {
        const data = await get<{ data: Campaign[] }>("/campaign/active", {
          brandId,
          page: 1,
          limit: 1000,
        });
        setCampaigns(data?.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load campaigns");
      } finally {
        setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, [brandId, open]);

  useEffect(() => {
    const loadApplicants = async () => {
      setApplicants([]);
      setInfluencerId("");
      if (!campaignId || !open) return;
      setLoadingApplicants(true);
      setError(null);
      try {
        const data = await post<{ influencers: Applicant[] }>("/apply/list", {
          campaignId,
          page: 1,
          limit: 1000,
        });
        setApplicants(data?.influencers || []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load applicants"
        );
      } finally {
        setLoadingApplicants(false);
      }
    };

    loadApplicants();
  }, [campaignId, open]);

  const campaignOptions: SelectOption[] = campaigns
    .filter((campaign) => String(campaign._id || "").trim() !== "")
    .map((campaign) => ({
      key: `campaign-${campaign._id}`,
      value: String(campaign._id),
      label:
        campaign.productOrServiceName ||
        campaign.campaignTitle ||
        campaign.campaignsId ||
        String(campaign._id),
    }));

  const applicantOptions: SelectOption[] = applicants
    .filter((applicant) => String(applicant.influencerId || "").trim() !== "")
    .map((applicant) => ({
      key: `influencer-${applicant.influencerId}`,
      value: String(applicant.influencerId),
      label: `${applicant.name || applicant.influencerId}${
        applicant.handle ? ` (${applicant.handle})` : ""
      }`,
    }));

  const resetForm = () => {
    setCampaignId("");
    setInfluencerId("");
    setSubject("");
    setDescription("");
    setRelatedType("other");
    setAttachments([]);
    setApplicants([]);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
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
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!brandId) {
      setError("Missing brand id. Please log in again as a brand.");
      return;
    }

    if (!influencerId || !subject.trim()) {
      setError("Applied influencer and subject are required.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("brandId", brandId);
      form.append("influencerId", influencerId);
      if (campaignId) form.append("campaignId", campaignId);
      form.append("subject", subject.trim());
      form.append("description", description.trim());
      form.append(
        "related",
        JSON.stringify({
          type: relatedType,
          id: relatedId || undefined,
        })
      );

      attachments.forEach((file) => {
        form.append("attachments", file);
      });

      const response = await postFormData<{ disputeId?: string }>(
        "/dispute/brand/create",
        form
      );

      handleClose();

      const disputeId = response?.disputeId;
      router.push(
        disputeId
          ? `/brand/help-and-support?disputeCreated=1&ticket=${disputeId}`
          : "/brand/help-and-support?disputeCreated=1"
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to create dispute"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-300 bg-[#f6f6f7] shadow-2xl [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-[28px] bg-black" />

        <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-4xl">
                  Raise an Issue
                </h2>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  New Ticket
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg">
                Report problems related to campaigns, payments, deliverables,
                contracts, or communication.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-black transition hover:bg-slate-200"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-600">
                Issue Type
              </label>
              <CustomSelect
                value={relatedType}
                onChange={setRelatedType}
                options={issueTypeOptions}
                placeholder="Select issue type"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-600">
                Campaign Name
              </label>
              <CustomSelect
                value={campaignId}
                onChange={setCampaignId}
                options={campaignOptions}
                placeholder={
                  loadingCampaigns ? "Loading campaigns..." : "Select a campaign"
                }
                disabled={loadingCampaigns}
              />
              <p className="mt-2 text-xs text-slate-500">
                Optional but recommended for linking the dispute to a specific
                campaign.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-600">
                Applied Influencer
              </label>
              <CustomSelect
                value={influencerId}
                onChange={setInfluencerId}
                options={applicantOptions}
                placeholder={
                  !campaignId
                    ? "Select a campaign first"
                    : loadingApplicants
                    ? "Loading applicants..."
                    : applicantOptions.length
                    ? "Select an influencer"
                    : "No applied influencers found"
                }
                disabled={!campaignId || loadingApplicants}
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-600">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary of the issue"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-800 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-black"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-600">
              Description
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-black"
            />
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-600">
              Evidence Upload
            </label>

            <input
              ref={fileInputRef}
              type="file"
              multiple
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
              className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center transition hover:border-black hover:bg-slate-50"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-black">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xl font-semibold text-slate-900">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-sm text-slate-500">
                PNG, JPG or PDF files supported
              </p>
            </div>

            {attachments.length > 0 ? (
              <div className="mt-4 space-y-3">
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3"
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

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-slate-700">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-black" />
            <p className="text-sm leading-6">
              Campaign selection is optional, but an applied influencer and
              subject are required. Attach screenshots, contracts, or other
              relevant evidence to speed up review.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-300 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-black transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Creating..." : "Submit Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}