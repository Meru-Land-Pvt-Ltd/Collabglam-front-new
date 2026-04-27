"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { get, post } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FloatingInput } from "@/components/ui/floatingInput";
import { ProductCardUpload } from "@/components/ui/productCard-Image";
import { FloatingSelect, SelectItem } from "@/components/ui/selectComp";
import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { Button } from "@/components/ui/buttonComp";
import {
  XIcon,
  AlertCircle,
  Loader2,
  ChevronDownIcon,
  SearchIcon,
  FileIcon,
} from "lucide-react";

export type Campaign = {
  _id?: string;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
  status?: string;
  hasApplied?: number;
};

export type Applicant = {
  influencerId: string;
  name?: string;
  handle?: string | null;
};

export function getCampaignId(c: Campaign): string {
  return c.campaignsId || c._id || "";
}

export function getCampaignLabel(c: Campaign): string {
  return c.campaignTitle || c.productOrServiceName || getCampaignId(c);
}

export interface ExistingAttachment {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
}

export type DisputeFormValues = {
  campaignId: string;
  influencerId: string;
  subject: string;
  description: string;
  issueType: string[];
  attachments: File[];
};

type ViewerMode = "brand" | "influencer";

type InfluencerCampaignListResponse = {
  success?: boolean;
  data?: {
    items?: Campaign[];
    pagination?: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
  };
  requestId?: string;
};

type CampaignBrandResponse = {
  message?: string;
  brand?: {
    _id?: string;
    brandId?: string;
    brandName?: string;
    name?: string;
    email?: string;
    proxyEmail?: string;
    industry?: string;
    companySize?: string;
    profilePic?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

type SelectedBrand = {
  brandId: string;
  brandName: string;
};

type DisputeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title: string;
  submitLabel: string;
  disputeId?: string;
  lockedCampaignId?: string;
  disableCampaign?: boolean;
  disableInfluencer?: boolean;
  influencerDisplayName?: string;
  initialValues?: Partial<DisputeFormValues>;
  existingAttachments?: ExistingAttachment[];
  mode?: ViewerMode;
  onSubmit: (payload: {
    brandId?: string;
    influencerId?: string;
    values: DisputeFormValues;
    removedExistingUrls: string[];
  }) => Promise<void>;
};

const DEFAULT_DISPUTE_FORM_VALUES: DisputeFormValues = {
  campaignId: "",
  influencerId: "",
  subject: "",
  description: "",
  issueType: [],
  attachments: [],
};

const DISPUTE_CATEGORIES = [
  { value: "content_not_as_expected", label: "Content Not as Expected" },
  { value: "delay_or_missed_deadline", label: "Delay or Missed Deadline" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "revision_issue", label: "Revision Issue" },
  { value: "agreement_issue", label: "Agreement Issue" },
  { value: "scope_change", label: "Scope Change" },
  { value: "no_response", label: "No Response" },
  { value: "other", label: "Other" },
];

function buildDisputeFormValues(
  initialValues?: Partial<DisputeFormValues>,
  lockedCampaignId?: string
): DisputeFormValues {
  return {
    ...DEFAULT_DISPUTE_FORM_VALUES,
    ...initialValues,
    campaignId: lockedCampaignId || initialValues?.campaignId || "",
    influencerId: initialValues?.influencerId || "",
    subject: initialValues?.subject || "",
    description: initialValues?.description || "",
    issueType:
      initialValues?.issueType && initialValues.issueType.length > 0
        ? initialValues.issueType
        : [],
    attachments: initialValues?.attachments || [],
  };
}

function isImageUrl(attachment: ExistingAttachment): boolean {
  if (attachment.mimeType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(
    attachment.url.split("?")[0] ?? ""
  );
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeInfluencerCampaignsResponse(
  response: InfluencerCampaignListResponse | Campaign[] | undefined | null
): Campaign[] {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response.filter((item) => Boolean(getCampaignId(item)));
  }

  const items = Array.isArray(response.data?.items) ? response.data.items : [];
  return items.filter((item) => Boolean(getCampaignId(item)));
}

function ExistingAttachmentsList({
  attachments,
  removedUrls,
  onToggleRemove,
}: {
  attachments: ExistingAttachment[];
  removedUrls: Set<string>;
  onToggleRemove: (url: string) => void;
}) {
  if (attachments.length === 0) return null;

  const images = attachments.filter(isImageUrl);
  const files = attachments.filter((a) => !isImageUrl(a));

  return (
    <div className="mt-3 space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => {
            const removed = removedUrls.has(img.url);

            return (
              <div
                key={img.url}
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-visible rounded-lg border bg-[#f5f5f5] transition-all",
                  removed
                    ? "border-red-300 opacity-40 grayscale"
                    : "border-[#e8e8e8]"
                )}
              >
                <img
                  src={img.url}
                  alt={img.originalName ?? "attachment"}
                  className="h-full w-full rounded-lg object-cover"
                />

                <button
                  type="button"
                  onClick={() => onToggleRemove(img.url)}
                  title={removed ? "Restore" : "Remove"}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-black !bg-white shadow-md"
                >
                  <XIcon className="size-3" />
                </button>

                {removed ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Removed
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.map((file) => {
            const removed = removedUrls.has(file.url);

            return (
              <div
                key={file.url}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-all",
                  removed
                    ? "border-red-200 bg-red-50 opacity-60"
                    : "border-[#e8e8e8] bg-[#fafafa]"
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileIcon className="size-3.5 shrink-0 text-[#aaa]" />
                  <span className="truncate text-xs text-[#555]">
                    {file.originalName ?? "File"}
                  </span>
                  {file.size ? (
                    <span className="shrink-0 text-[10px] text-[#bbb]">
                      {formatBytes(file.size)}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => onToggleRemove(file.url)}
                  title={removed ? "Restore" : "Remove"}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-white transition-colors"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DisputeFormDialog({
  open,
  onOpenChange,
  onSuccess,
  title,
  submitLabel,
  disputeId: _disputeId,
  lockedCampaignId,
  disableCampaign = false,
  disableInfluencer = false,
  influencerDisplayName,
  initialValues,
  existingAttachments = [],
  mode = "brand",
  onSubmit,
}: DisputeFormDialogProps) {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [viewerInfluencerId, setViewerInfluencerId] = useState<string | null>(
    null
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<SelectedBrand | null>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingBrandDetails, setLoadingBrandDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [removedExistingUrls, setRemovedExistingUrls] = useState<Set<string>>(
    new Set()
  );

  const normalizedInitialValues = useMemo(
    () => buildDisputeFormValues(initialValues, lockedCampaignId),
    [initialValues, lockedCampaignId]
  );

  const [values, setValues] = useState<DisputeFormValues>(
    normalizedInitialValues
  );

  const isCampaignLocked = Boolean(lockedCampaignId) || disableCampaign;
  const isInfluencerMode = mode === "influencer";

  const readStoredInfluencerId = useCallback(() => {
    if (typeof window === "undefined") return "";

    return String(
      localStorage.getItem("influencerId") ||
        localStorage.getItem("influencer_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("user_id") ||
        ""
    ).trim();
  }, []);

  const getActiveInfluencerId = useCallback(() => {
    return String(
      values.influencerId ||
        initialValues?.influencerId ||
        viewerInfluencerId ||
        readStoredInfluencerId() ||
        ""
    ).trim();
  }, [
    values.influencerId,
    initialValues?.influencerId,
    viewerInfluencerId,
    readStoredInfluencerId,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setBrandId(localStorage.getItem("brandId"));
    setViewerInfluencerId(readStoredInfluencerId());
  }, [readStoredInfluencerId]);

  useEffect(() => {
    if (!open) return;

    const next = buildDisputeFormValues(initialValues, lockedCampaignId);

    if (isInfluencerMode && !next.influencerId) {
      next.influencerId = String(
        initialValues?.influencerId ||
          viewerInfluencerId ||
          readStoredInfluencerId() ||
          ""
      ).trim();
    }

    setValues(next);
    setRemovedExistingUrls(new Set());
    setApplicants([]);
    setSelectedBrand(null);
    setError(null);
  }, [
    open,
    initialValues,
    lockedCampaignId,
    isInfluencerMode,
    viewerInfluencerId,
    readStoredInfluencerId,
  ]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadCampaigns = async () => {
      setLoadingCampaigns(true);

      try {
        if (isInfluencerMode) {
          const activeInfluencerId = getActiveInfluencerId();

          if (!activeInfluencerId) {
            if (!cancelled) {
              setCampaigns([]);
              setError("Missing influencer ID. Please log in again.");
            }
            return;
          }

          const res = await post<InfluencerCampaignListResponse>(
            "/campaign/influencer/get-all-active",
            {
              influencerId: activeInfluencerId,
              page: 1,
              limit: 1000,
            }
          );

          if (!cancelled) {
            setCampaigns(normalizeInfluencerCampaignsResponse(res));
          }

          return;
        }

        if (!brandId) {
          if (!cancelled) setCampaigns([]);
          return;
        }

        const res = await get<{ data: Campaign[] }>("/campaign/active", {
          brandId,
          page: 1,
          limit: 1000,
        });

        if (!cancelled) {
          setCampaigns(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setCampaigns([]);
      } finally {
        if (!cancelled) setLoadingCampaigns(false);
      }
    };

    void loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, [open, isInfluencerMode, brandId, getActiveInfluencerId]);

  useEffect(() => {
    if (isInfluencerMode) {
      setApplicants([]);
      return;
    }

    if (!values.campaignId) {
      setApplicants([]);
      return;
    }

    let cancelled = false;
    setLoadingApplicants(true);

    post<{ influencers: Applicant[] }>("/apply/list", {
      campaignId: values.campaignId,
      page: 1,
      limit: 1000,
    })
      .then((res) => {
        if (!cancelled) setApplicants(res?.influencers ?? []);
      })
      .catch(() => {
        if (!cancelled) setApplicants([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingApplicants(false);
      });

    return () => {
      cancelled = true;
    };
  }, [values.campaignId, isInfluencerMode]);

  useEffect(() => {
    if (!open || !isInfluencerMode) {
      setSelectedBrand(null);
      return;
    }

    const activeInfluencerId = getActiveInfluencerId();

    if (!values.campaignId || !activeInfluencerId) {
      setSelectedBrand(null);
      return;
    }

    let cancelled = false;
    setLoadingBrandDetails(true);

    const loadBrandDetails = async () => {
      try {
        const res = await get<CampaignBrandResponse>("/campaign/brand-list", {
          campaignId: values.campaignId,
          influencerId: activeInfluencerId,
        });

        if (cancelled) return;

        const nextBrandId = res?.brand?.brandId || res?.brand?._id || "";
        const nextBrandName = res?.brand?.brandName || res?.brand?.name || "";

        setSelectedBrand(
          nextBrandId || nextBrandName
            ? {
                brandId: nextBrandId,
                brandName: nextBrandName,
              }
            : null
        );
      } catch {
        if (!cancelled) {
          setSelectedBrand(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingBrandDetails(false);
        }
      }
    };

    void loadBrandDetails();

    return () => {
      cancelled = true;
    };
  }, [open, isInfluencerMode, values.campaignId, getActiveInfluencerId]);

  const campaignOptions = useMemo(
    () => campaigns.filter((c) => Boolean(getCampaignId(c))),
    [campaigns]
  );

  const selectedCampaignExists = campaignOptions.some(
    (c) => getCampaignId(c) === values.campaignId
  );

  const selectedApplicantExists = applicants.some(
    (a) => a.influencerId === values.influencerId
  );

  const updateField = useCallback(
    <K extends keyof DisputeFormValues>(key: K, value: DisputeFormValues[K]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };

        if (
          key === "campaignId" &&
          prev.campaignId !== value &&
          !isInfluencerMode
        ) {
          next.influencerId = "";
        }

        return next;
      });
    },
    [isInfluencerMode]
  );

  const handleToggleRemoveExisting = useCallback((url: string) => {
    setRemovedExistingUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const resetAndClose = useCallback(() => {
    const next = buildDisputeFormValues(initialValues, lockedCampaignId);

    if (isInfluencerMode && !next.influencerId) {
      next.influencerId = String(
        initialValues?.influencerId ||
          viewerInfluencerId ||
          readStoredInfluencerId() ||
          ""
      ).trim();
    }

    setValues(next);
    setRemovedExistingUrls(new Set());
    setApplicants([]);
    setSelectedBrand(null);
    setError(null);
    onOpenChange(false);
  }, [
    initialValues,
    lockedCampaignId,
    onOpenChange,
    isInfluencerMode,
    viewerInfluencerId,
    readStoredInfluencerId,
  ]);

  const validate = useCallback((): string | null => {
    if (isInfluencerMode) {
      if (!getActiveInfluencerId()) {
        return "Missing influencer ID — please log in again.";
      }
    } else {
      if (!brandId) return "Missing brand ID — please log in again.";
    }

    if (!values.subject.trim()) return "Dispute title is required.";
    if (!values.campaignId) return "Campaign name is required.";
    if (!values.issueType.length) return "Issue type is required.";

    if (!isInfluencerMode && !values.influencerId) {
      return "Influencer name is required.";
    }

    return null;
  }, [brandId, values, isInfluencerMode, getActiveInfluencerId]);

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedValues: DisputeFormValues = {
      ...values,
      influencerId: isInfluencerMode
        ? getActiveInfluencerId()
        : values.influencerId,
      subject: values.subject.trim(),
      description: values.description.trim(),
    };

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        brandId: isInfluencerMode
          ? selectedBrand?.brandId || undefined
          : brandId ?? undefined,
        influencerId: isInfluencerMode
          ? getActiveInfluencerId()
          : values.influencerId,
        values: normalizedValues,
        removedExistingUrls: Array.from(removedExistingUrls),
      });

      resetAndClose();
      onSuccess?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit dispute.");
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    values,
    onSubmit,
    isInfluencerMode,
    brandId,
    selectedBrand,
    removedExistingUrls,
    resetAndClose,
    onSuccess,
    getActiveInfluencerId,
  ]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!flex !flex-col w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:w-full !max-w-[43.0625rem] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[min(54.25rem,calc(100dvh-3rem))] overflow-hidden rounded-xl sm:rounded-2xl p-0 gap-0"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
      >
        <div className="flex shrink-0 items-center justify-between">
          <DialogTitle className="text-[1.15rem] font-semibold tracking-tight text-[#1a1a1a]">
            {title}
          </DialogTitle>

          <button
            type="button"
            onClick={resetAndClose}
            className="flex size-7 items-center justify-center rounded-lg text-[#888] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <hr />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <FloatingInput
              label="Dispute Title"
              required
              value={values.subject}
              onChange={(e) => updateField("subject", e.target.value)}
            />

            <FloatingSelect
              label={loadingCampaigns ? "Loading campaigns…" : "Campaign name"}
              value={values.campaignId}
              onValueChange={(v) => updateField("campaignId", v)}
              disabled={isCampaignLocked || loadingCampaigns}
              searchable={!isCampaignLocked}
              searchPlaceholder="Search campaigns…"
              safeBottom={80}
              icon={Boolean(values.campaignId)}
              required
            >
              {!selectedCampaignExists && values.campaignId ? (
                <SelectItem value={values.campaignId}>
                  {values.campaignId}
                </SelectItem>
              ) : null}

              {campaignOptions.length > 0 ? (
                campaignOptions.map((c) => (
                  <SelectItem key={getCampaignId(c)} value={getCampaignId(c)}>
                    {getCampaignLabel(c)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty__" disabled>
                  No active campaigns
                </SelectItem>
              )}
            </FloatingSelect>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {isInfluencerMode ? (
              <FloatingSelect
                label={
                  !values.campaignId
                    ? "Select a campaign first"
                    : loadingBrandDetails
                      ? "Loading brand…"
                      : "Brand name"
                }
                value={selectedBrand?.brandId || ""}
                onValueChange={(v) => {
                  if (!selectedBrand) return;
                  setSelectedBrand({ ...selectedBrand, brandId: v });
                }}
                disabled={!values.campaignId || loadingBrandDetails}
                searchable={false}
                safeBottom={80}
                icon={Boolean(selectedBrand?.brandId)}
                required
              >
                {selectedBrand?.brandId ? (
                  <SelectItem value={selectedBrand.brandId}>
                    {selectedBrand.brandName || "Brand"}
                  </SelectItem>
                ) : (
                  <SelectItem value="__empty__" disabled>
                    {!values.campaignId
                      ? "Select a campaign first"
                      : loadingBrandDetails
                        ? "Loading brand…"
                        : "No brand found for this campaign"}
                  </SelectItem>
                )}
              </FloatingSelect>
            ) : (
              <FloatingSelect
                label={
                  !values.campaignId
                    ? "Select a campaign first"
                    : loadingApplicants
                      ? "Loading influencers…"
                      : "Influencer name"
                }
                required
                value={values.influencerId}
                onValueChange={(v) => updateField("influencerId", v)}
                disabled={!values.campaignId || loadingApplicants || disableInfluencer}
                searchable={applicants.length > 5}
                searchPlaceholder="Search influencers…"
                safeBottom={80}
                icon={Boolean(values.influencerId)}
              >
                {!selectedApplicantExists && values.influencerId ? (
                  <SelectItem value={values.influencerId}>
                    {influencerDisplayName ?? values.influencerId}
                  </SelectItem>
                ) : null}

                {applicants.length > 0 ? (
                  applicants.map((a) => (
                    <SelectItem key={a.influencerId} value={a.influencerId}>
                      {a.name ?? a.influencerId}
                      {a.handle ? ` (${a.handle})` : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__empty__" disabled>
                    No influencers in this campaign
                  </SelectItem>
                )}
              </FloatingSelect>
            )}

            <LabeledTextarea
              label="Description"
              value={values.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe the issue in detail…"
              maxLength={500}
              rows={4}
              className="min-h-28!"
            />

            <IssueTypeSelect
              value={values.issueType}
              onChange={(v) => updateField("issueType", v)}
            />

            <ProductCardUpload
              files={values.attachments}
              onFilesChange={(files) => updateField("attachments", files)}
              title="Upload Attachments"
              helperTypes="SVG, PNG, JPG or PDF (max 5 MB each)"
            />

            <ExistingAttachmentsList
              attachments={existingAttachments}
              removedUrls={removedExistingUrls}
              onToggleRemove={handleToggleRemoveExisting}
            />
          </div>
        </div>

        <div className="mt-auto flex shrink-0 items-center justify-end gap-3 bg-white">
          <Button
            onClick={resetAndClose}
            disabled={submitting}
            className="h-9 rounded-lg px-5 text-sm font-medium !bg-white !text-[#1a1a1a] !shadow-none transition-colors hover:!bg-[#f5f5f5] disabled:opacity-50"
          >
            Discard
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#1a1a1a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IssueTypeSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }

      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const filtered = DISPUTE_CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabels = DISPUTE_CATEGORIES.filter((c) =>
    value.includes(c.value)
  ).map((c) => c.label);

  return (
    <div className="relative mt-2 w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex h-14 w-full items-center rounded-lg border bg-white px-4 pr-12 text-left transition-all",
          open
            ? "border-[#bfc6d4] ring-2 ring-[#e9edf5]"
            : "border-[#d9d9d9] hover:border-[#c7c7c7]"
        )}
      >
        <span
          className={cn(
            "truncate text-[15px] leading-none",
            value.length > 0 ? "text-[#1a1a1a]" : "text-[#707070]"
          )}
        >
          {value.length > 0 ? (
            selectedLabels.join(", ")
          ) : (
            <>
              Issue Type <span className="text-red-500">*</span>
            </>
          )}
        </span>

        <ChevronDownIcon
          className={cn(
            "absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-[#f1f1f1] px-4 py-3">
            <SearchIcon className="size-4 shrink-0 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search issue types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-[#9ca3af]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[#9ca3af] transition-colors hover:text-[#6b7280]"
              >
                <XIcon className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="max-h-56 overflow-y-auto py-2">
            {filtered.length > 0 ? (
              filtered.map((cat) => {
                const checked = value.includes(cat.value);

                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggle(cat.value)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#f8f8f8]",
                      checked && "bg-[#fafafa]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-all",
                        checked
                          ? "border-[#1a1a1a] bg-[#1a1a1a]"
                          : "border-[#d1d5db] bg-white"
                      )}
                    >
                      {checked ? (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          />
                        </svg>
                      ) : null}
                    </div>

                    <span className="text-sm text-[#1f2937]">
                      {cat.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[#9ca3af]">
                No matching issue types found
              </div>
            )}
          </div>

          {value.length > 0 ? (
            <div className="flex items-center justify-between border-t border-[#f1f1f1] bg-[#fafafa] px-4 py-2">
              <span className="text-xs text-[#6b7280]">
                {value.length} selected
              </span>

              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-[#6b7280] transition-colors hover:text-[#374151]"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}