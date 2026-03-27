"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { get } from "@/lib/api";
import { resolveFileList } from "@/lib/files";
import {
  HiChevronLeft,
  HiOutlineFire,
  HiCheckCircle,
  HiXCircle,
  HiOutlinePhoto,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineGlobeAlt,
  HiOutlineSparkles,
  HiOutlineLink,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HiOutlinePhotograph, HiOutlineRefresh } from "react-icons/hi";

interface ProductImage {
  name?: string;
  type?: string;
  size?: number;
  dataUrl?: string;
  url?: string;
}

interface CampaignCategory {
  categoryName?: string;
  subcategoryName?: string;
}

interface GoalDetail {
  goal?: string;
}

interface InfluencerTierDetail {
  category?: string;
  value?: string;
}

interface ContentFormatDetail {
  format?: string;
}

interface ContentLanguageDetail {
  name?: string;
}

interface PreferredHashtagDetail {
  tag?: string;
}

interface TargetCountryDetail {
  countryName?: string;
  flag?: string;
}

interface TargetAgeRangeDetail {
  range?: string;
}

interface CreatedBy {
  name?: string;
  email?: string;
  role?: string;
  adminRole?: string;
}

interface CampaignData {
  _id?: string;
  brandName?: string;
  campaignTitle?: string;
  description?: string;
  campaignType?: string;
  campaignCategory?: string;
  campaignSubcategory?: string;
  productImages?: ProductImage[];
  images?: string[];
  productLink?: string;
  videoLink?: string;
  productServiceInfo?: string[];
  numberOfInfluencers?: number;
  minFollowers?: number;
  maxFollowers?: number;
  campaignBudget?: number;
  budget?: number;
  influencerBudget?: number;
  paymentType?: string;
  platformSelection?: string[];
  additionalNotes?: string;
  hashtags?: string[];
  campaignTimezone?: string;
  scheduledAt?: string | null;
  startAt?: string;
  endAt?: string;
  publishedAt?: string;
  endedAt?: string | null;
  categories?: CampaignCategory[];
  status?: string;
  publishStatus?: string;
  approvalMode?: string;
  isActive?: number;
  isDraft?: number;
  applicantCount?: number;
  hasApplied?: number;
  byAi?: number;
  createdBy?: CreatedBy;
  createdAt?: string;
  updatedAt?: string;

  subcategoryDetails?: { name?: string; categoryName?: string }[];
  campaignGoalDetails?: GoalDetail[];
  influencerTierDetails?: InfluencerTierDetail[];
  contentFormatDetails?: ContentFormatDetail[];
  contentLanguageDetails?: ContentLanguageDetail[];
  preferredHashtagDetails?: PreferredHashtagDetail[];
  targetCountryDetails?: TargetCountryDetail[];
  targetAgeRangeDetails?: TargetAgeRangeDetail[];
}

interface ApiResponse {
  message?: string;
  data?: CampaignData;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <div className="text-sm font-medium text-slate-900">{value || "—"}</div>
  </div>
);

const ListBadges = ({ items }: { items: string[] }) => {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No details available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Badge
          key={`${item}-${index}`}
          variant="secondary"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700"
        >
          {item}
        </Badge>
      ))}
    </div>
  );
};

export default function ViewCampaignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMoney = (value?: number | string | null) => {
    const amount = Number(value ?? 0);
    if (Number.isNaN(amount)) return "—";
    return amount.toLocaleString();
  };

  const prettify = (value?: string | null) => {
    if (!value) return "—";
    return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const loadCampaign = async () => {
    if (!id) {
      setError("No campaign ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await get<ApiResponse | CampaignData>(`/admin/campaign/getById?id=${id}`);
      const normalized = (response as ApiResponse)?.data ?? (response as CampaignData);
      setCampaign(normalized);
    } catch {
      setError("Failed to load campaign details.");
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const imageUrls = useMemo(() => {
    const productImageUrls = (campaign?.productImages ?? [])
      .map((image) => image.dataUrl || image.url)
      .filter(Boolean) as string[];

    if (productImageUrls.length) return productImageUrls;
    return resolveFileList(campaign?.images ?? []);
  }, [campaign?.productImages, campaign?.images]);

  const campaignGoals = useMemo(
    () => (campaign?.campaignGoalDetails ?? []).map((item) => item.goal).filter(Boolean) as string[],
    [campaign?.campaignGoalDetails]
  );

  const influencerTiers = useMemo(
    () =>
      (campaign?.influencerTierDetails ?? [])
        .map((item) => [item.category, item.value].filter(Boolean).join(" • "))
        .filter(Boolean) as string[],
    [campaign?.influencerTierDetails]
  );

  const contentFormats = useMemo(
    () => (campaign?.contentFormatDetails ?? []).map((item) => item.format).filter(Boolean) as string[],
    [campaign?.contentFormatDetails]
  );

  const contentLanguages = useMemo(
    () => (campaign?.contentLanguageDetails ?? []).map((item) => item.name).filter(Boolean) as string[],
    [campaign?.contentLanguageDetails]
  );

  const hashtags = useMemo(
    () => (campaign?.preferredHashtagDetails ?? []).map((item) => item.tag).filter(Boolean) as string[],
    [campaign?.preferredHashtagDetails]
  );

  const countries = useMemo(
    () =>
      (campaign?.targetCountryDetails ?? [])
        .map((item) => [item.flag, item.countryName].filter(Boolean).join(" "))
        .filter(Boolean) as string[],
    [campaign?.targetCountryDetails]
  );

  const ageRanges = useMemo(
    () => (campaign?.targetAgeRangeDetails ?? []).map((item) => item.range).filter(Boolean) as string[],
    [campaign?.targetAgeRangeDetails]
  );

  const categoryNames = useMemo(() => {
    if (campaign?.subcategoryDetails?.length) {
      return campaign.subcategoryDetails
        .map((item) => [item.categoryName, item.name].filter(Boolean).join(" • "))
        .filter(Boolean) as string[];
    }

    return (campaign?.categories ?? [])
      .map((item) => [item.categoryName, item.subcategoryName].filter(Boolean).join(" • "))
      .filter(Boolean) as string[];
  }, [campaign?.subcategoryDetails, campaign?.categories]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <Skeleton className="h-12 w-56 rounded-xl" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-700">
          {error || "Campaign not found."}
        </p>
      </div>
    );
  }

  const c = campaign;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 md:px-6">
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Back">
                  <HiChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={loadCampaign} aria-label="Refresh" disabled={loading}>
                  <HiOutlineRefresh className="h-5 w-5" />
                </Button>
              </div>

              <div>
                <p className="text-sm text-slate-500">Campaign Details</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {c.campaignTitle || "Untitled Campaign"}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {c.description || "No campaign description available."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={c.isActive === 1 ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-rose-100 text-rose-800 hover:bg-rose-100"}>
                  {c.isActive === 1 ? <HiCheckCircle className="mr-1 h-4 w-4" /> : <HiXCircle className="mr-1 h-4 w-4" />}
                  {c.isDraft === 1 ? "Draft" : prettify(c.status)}
                </Badge>
                <Badge variant="secondary">{prettify(c.publishStatus)}</Badge>
                <Badge variant="secondary">{prettify(c.campaignType)}</Badge>
                <Badge variant="secondary">{prettify(c.approvalMode)}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-[320px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Budget</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">${formatMoney(c.budget ?? c.campaignBudget)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Platforms</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{c.platformSelection?.length ?? 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <HiOutlineBriefcase className="h-5 w-5 text-indigo-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailItem label="Brand Name" value={c.brandName || "—"} />
          <DetailItem label="Campaign Type" value={prettify(c.campaignType)} />
          <DetailItem label="Category" value={c.campaignCategory || "—"} />
          <DetailItem label="Payment Type" value={prettify(c.paymentType)} />
          <div className="md:col-span-2">
            <DetailItem label="Description" value={<span className="whitespace-pre-wrap">{c.description || "—"}</span>} />
          </div>
          <DetailItem
            label="Product Link"
            value={
              c.productLink ? (
                <a href={c.productLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:underline break-all">
                  <HiOutlineLink className="h-4 w-4" />
                  {c.productLink}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailItem
            label="Video Link"
            value={
              c.videoLink ? (
                <a href={c.videoLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:underline break-all">
                  <HiOutlineVideoCamera className="h-4 w-4" />
                  {c.videoLink}
                </a>
              ) : (
                "—"
              )
            }
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <HiOutlinePhotograph className="h-5 w-5 text-indigo-600" />
            Product Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imageUrls.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={url}
                      alt={`Campaign image ${index + 1}`}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
                    {c.productImages?.[index]?.name || `Image ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No product images available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <HiOutlineSparkles className="h-5 w-5 text-indigo-600" />
            Categories, Goals & Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Categories</p>
            <ListBadges items={categoryNames} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign Goals</p>
            <ListBadges items={campaignGoals} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Content Formats</p>
            <ListBadges items={contentFormats} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Content Languages</p>
            <ListBadges items={contentLanguages} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred Hashtags</p>
            <ListBadges items={hashtags} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <HiOutlineUserGroup className="h-5 w-5 text-indigo-600" />
            Influencer Targeting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailItem label="Number of Influencers" value={c.numberOfInfluencers ?? 0} />
            <DetailItem label="Followers Range" value={`${(c.minFollowers ?? 0).toLocaleString()} - ${(c.maxFollowers ?? 0).toLocaleString()}`} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Influencer Tiers</p>
            <ListBadges items={influencerTiers} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Target Countries</p>
            <ListBadges items={countries} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Target Age Ranges</p>
            <ListBadges items={ageRanges} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <HiOutlineCurrencyDollar className="h-5 w-5 text-indigo-600" />
            Budget & Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailItem label="Campaign Budget" value={`$${formatMoney(c.campaignBudget ?? c.budget)}`} />
          <DetailItem label="Influencer Budget" value={`$${formatMoney(c.influencerBudget)}`} />
          <DetailItem label="Timezone" value={c.campaignTimezone || "—"} />
          <DetailItem label="Scheduled At" value={formatDate(c.scheduledAt)} />
          <DetailItem label="Start Date" value={formatDate(c.startAt)} />
          <DetailItem label="End Date" value={formatDate(c.endAt)} />
          <DetailItem label="Published At" value={formatDate(c.publishedAt)} />
          <DetailItem label="Ended At" value={formatDate(c.endedAt)} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <HiOutlineGlobeAlt className="h-5 w-5 text-indigo-600" />
            Platform & Status Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Platforms</p>
            <ListBadges items={(c.platformSelection ?? []).map((item) => prettify(item))} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Extra Product / Service Info</p>
            <ListBadges items={c.productServiceInfo ?? []} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Extra Hashtags</p>
            <ListBadges items={c.hashtags ?? []} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailItem label="Publish Status" value={prettify(c.publishStatus)} />
            <DetailItem label="Approval Mode" value={prettify(c.approvalMode)} />
            <DetailItem label="Applicants" value={c.applicantCount ?? 0} />
            <DetailItem label="Has Applied" value={c.hasApplied === 1 ? "Yes" : "No"} />
            <DetailItem label="Created By AI" value={c.byAi === 1 ? "Yes" : "No"} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <HiOutlineDocumentText className="h-5 w-5 text-indigo-600" />
            Admin & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailItem label="Created By" value={c.createdBy?.name || "—"} />
            <DetailItem label="Admin Email" value={c.createdBy?.email || "—"} />
            <DetailItem label="Role" value={prettify(c.createdBy?.role)} />
            <DetailItem label="Admin Role" value={prettify(c.createdBy?.adminRole)} />
            <DetailItem label="Created At" value={formatDate(c.createdAt)} />
            <DetailItem label="Updated At" value={formatDate(c.updatedAt)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Additional Notes</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <span className="whitespace-pre-wrap">{c.additionalNotes || "No additional notes available."}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
