// services/brandApi.ts
import axios from "axios";
import * as Api from "@/lib/api";
import { post as libPost } from "@/lib/api";

const BRAND_BASE = "/brand";
const LIST_BASE = "/list";
const CAMPAIGN_BASE = "/campaign";
const WALLET_BASE = "/wallet";
const INVITATION_BASE = "/invitation";
const APPLY_BASE = "/apply-campaign";
const MILESTONE_BASE = "/milestone";
const DELIVERABLE_BASE = "/deliverable";
const CAMPAIGN_INVITATION_BASE = "/campaign-invitation";
const Apply_Base = "/apply";
const CONTRACT_BASE = "/contract";

/** -------------------------
 *  ✅ Response Unwrap Helpers
 *  ------------------------*/
export type ApiEnvelope<T> =
  | T
  | { data?: T; result?: T; message?: string }
  | { success?: boolean; data?: T; message?: string };

export function unwrap<T>(res: ApiEnvelope<T>): T {
  let x: any = res as any;

  // axios Response -> take .data
  if (
    x &&
    typeof x === "object" &&
    "data" in x &&
    (("status" in x && "headers" in x) || "config" in x)
  ) {
    x = x.data;
  }

  // common wrappers
  if (x && typeof x === "object" && x.result !== undefined) x = x.result;
  if (x && typeof x === "object" && "success" in x && x.data !== undefined) x = x.data;
  if (x && typeof x === "object" && x.data !== undefined) x = x.data;

  return x as T;
}

function unwrapPrefillDoc<TDoc = any>(res: any): TDoc {
  const x = unwrap<any>(res);
  return (x?.prefill ?? x) as TDoc;
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(err)) {
    const data: any = err.response?.data;
    return (
      data?.message ||
      data?.error?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      err.response?.statusText ||
      err.message ||
      fallback
    );
  }

  if (err && typeof err === "object") {
    const anyErr: any = err;
    return anyErr?.message || anyErr?.error?.message || fallback;
  }

  if (typeof err === "string") return err;
  return fallback;
}

/** -------------------------
 *  ✅ Request Core (GET/POST only)
 *  ------------------------*/
type HttpMethod = "GET" | "POST";
type AnyObj = Record<string, any>;

type RequestConfig = {
  params?: AnyObj;
  headers?: AnyObj;
  signal?: AbortSignal;
  [key: string]: any;
};

function resolveClient(): any {
  const mod: any = Api as any;
  return mod?.default ?? mod;
}

function cleanParams(params?: AnyObj) {
  if (!params) return undefined;
  const out: AnyObj = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

async function apiRequest<T>(
  method: HttpMethod,
  url: string,
  options: { data?: any; params?: AnyObj; config?: RequestConfig } = {}
): Promise<T> {
  const client = resolveClient();
  const params = cleanParams(options.params);
  const config = options.config ?? {};

  if (typeof client?.request === "function") {
    const res = await client.request({
      method,
      url,
      params,
      data: options.data,
      ...config,
    });
    return unwrap<T>(res as any);
  }

  const methodFn = client?.[method.toLowerCase()];
  if (typeof methodFn === "function") {
    if (method === "GET") {
      const res = await methodFn(url, { params, ...config });
      return unwrap<T>(res as any);
    } else {
      const res = await methodFn(url, options.data, { params, ...config });
      return unwrap<T>(res as any);
    }
  }

  throw new Error("No compatible API client found in @/lib/api (expected request/get/post methods).");
}

async function apiGet<T>(path: string, params?: AnyObj, config?: RequestConfig) {
  return apiRequest<T>("GET", path, { params, config });
}

async function apiPost<T>(path: string, body?: any, config?: RequestConfig) {
  // Prefer your existing lib post() if present
  if (typeof libPost === "function") {
    const res = await (libPost as any)(path, body, config);
    return unwrap<T>(res as any);
  }
  return apiRequest<T>("POST", path, { data: body, config });
}

/** -------------------------
 *  ✅ AUTH + SIGNUP
 *  ------------------------*/
export async function apiSendSignupOtp(input: {
  brandName: string;
  name: string;
  email: string;
  companySize: string;
  industry: string;
  password: string;
}) {
  return apiPost<{ message: string; email: string }>(`${BRAND_BASE}/send-otp-signup`, input);
}

export async function apiVerifyOtpSignup(input: { email: string; otp: string }) {
  return apiPost<{ message: string; brandId: string; token: string }>(
    `${BRAND_BASE}/verify-otp-signup`,
    input
  );
}

export async function apiSignInBrand(email: string, password: string) {
  return apiPost<{ message: string; brandId: string; token: string }>(`${BRAND_BASE}/signin`, {
    email,
    password,
  });
}

/** -------------------------
 *  ✅ ONBOARDING
 *  ------------------------*/
export type QA = { question: string; answers: string[] };

export async function apiSaveBrandOnboarding(payload: {
  page1?: QA[];
  page2?: QA[];
  page3?: QA[];
  ispage1Skip?: boolean;
  ispage2Skip?: boolean;
  ispage3Skip?: boolean;
  proxyEmail?: string;
  profilePic?: string;
  isProfilePicSkip?: boolean;
}) {
  return apiPost<{ message: string; brandId: string }>(`${BRAND_BASE}/save-brand-onboarding`, payload);
}

/** -------------------------
 *  ✅ FORGOT PASSWORD
 *  ------------------------*/
export async function apiSendOtpForgot(email: string) {
  return apiPost<{ message: string; email: string }>(`${BRAND_BASE}/send-otp-forgot`, { email });
}

export async function apiVerifyOtpForgot(email: string, otp: string) {
  return apiPost<{ message: string; resetToken: string }>(`${BRAND_BASE}/verify-otp-forgot`, {
    email,
    otp,
  });
}

export async function apiUpdatePasswordWithResetToken(resetToken: string, newPassword: string) {
  return apiPost<{ message: string }>(
    `${BRAND_BASE}/update-password`,
    { newPassword },
    { headers: { Authorization: `Bearer ${resetToken}` } }
  );
}

/** -------------------------
 *  ✅ LIST APIs (BASE: /list)
 *  ------------------------*/
export type ListQuery = { limit?: number; search?: string };

export type CountryRow = {
  _id?: string;
  id?: string;
  countryNameEn?: string;
  flag?: string;
  countryCode?: string;
  iso2?: string;
  iso3?: string;
  timeZone?: string;
  timezone?: string;
  timezones?: string[];
};

export type TierRow = { _id?: string; category?: string; value?: any; sortOrder?: number };
export type HashtagRow = { _id?: string; tag?: string };
export type GoalRow = { _id?: string; goal?: string };
export type AgeRow = { _id?: string; range?: string };
export type FormatRow = { _id?: string; format?: string };
export type LangRow = { _id?: string; code?: string; name?: string };

export async function apiListCountries(params: ListQuery = {}) {
  return apiGet<CountryRow[]>(`${LIST_BASE}/countries`, params);
}
export async function apiListInfluencerTiers(params: ListQuery = {}) {
  return apiGet<TierRow[]>(`${LIST_BASE}/influencer-tiers`, params);
}
export async function apiListPreferredHashtags(params: ListQuery = {}) {
  return apiGet<HashtagRow[]>(`${LIST_BASE}/preferred-hashtags`, params);
}
export async function apiListProductServiceGoals(params: ListQuery = {}) {
  return apiGet<GoalRow[]>(`${LIST_BASE}/product-service-goals`, params);
}
export async function apiListAgeRanges(params: ListQuery = {}) {
  return apiGet<AgeRow[]>(`${LIST_BASE}/age-ranges`, params);
}
export async function apiListContentFormats(params: ListQuery = {}) {
  return apiGet<FormatRow[]>(`${LIST_BASE}/content-formats`, params);
}
export async function apiListContentLanguages(params: ListQuery = {}) {
  return apiGet<LangRow[]>(`${LIST_BASE}/content-languages`, params);
}

/** -------------------------
 *  ✅ CATEGORY APIs
 *  ------------------------*/
export type CategoryDoc = {
  _id: string;
  name: string;
  subcategories?: Array<{ _id: string; name: string; tags?: any[] }>;
};

export type SubcategoryRow = {
  _id: string;
  name: string;
  tags?: any[];
  categoryId: string;
  categoryName: string;
};

export async function apiGetCategories(search?: string) {
  return apiGet<CategoryDoc[]>(`${CAMPAIGN_BASE}/category`, { search });
}

export async function apiGetSubcategories(params: { categoryId?: string; search?: string }) {
  return apiGet<SubcategoryRow[]>(`${CAMPAIGN_BASE}/subcategory`, params);
}

export type CategorySearchRow = {
  category: { id: string; name: string };
  subcategory: { id: string; name: string } | null;
};

export async function apiSearchCategories(input: { search: string; page?: number; limit?: number }) {
  const search = input.search ?? "";
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  const cats = await apiGet<CategoryDoc[]>(`${CAMPAIGN_BASE}/category`, { search });
  const subs = await apiGet<SubcategoryRow[]>(`${CAMPAIGN_BASE}/subcategory`, { search });

  const rows: CategorySearchRow[] = [
    ...cats.map((c) => ({
      category: { id: String(c._id), name: String(c.name ?? "") },
      subcategory: null,
    })),
    ...subs.map((s) => ({
      category: { id: String(s.categoryId), name: String(s.categoryName ?? "") },
      subcategory: { id: String(s._id), name: String(s.name ?? "") },
    })),
  ];

  const seen = new Set<string>();
  const uniq = rows.filter((r) => {
    const key = `${r.category.id}::${r.subcategory?.id ?? "null"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const start = (page - 1) * limit;
  return uniq.slice(start, start + limit);
}

export async function apiGetSubcategoriesByCategoryId(categoryId: string) {
  const subs = await apiGet<SubcategoryRow[]>(`${CAMPAIGN_BASE}/subcategory`, { categoryId });
  return {
    categoryId,
    categoryName: subs?.[0]?.categoryName ?? "",
    subcategories: subs.map((s) => ({ _id: s._id, name: s.name, tags: s.tags ?? [] })),
  };
}

/** ✅ CATEGORY GET-ALL (your custom endpoint) */
export async function apiGetAllCategories() {
  return apiGet<CategoryDoc[]>(`/category/categories`);
}

/** -------------------------
 *  ✅ CAMPAIGN APIs
 *  ------------------------*/
export type Platform = "youtube" | "instagram" | "tiktok";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "archived";

/** Your controller returns enriched docs; keep it flexible */
export type EnrichedCampaignDoc = any;

/** ✅ Dashboard/List Summary Row (NEW) */
export type TimeMeta = {
  unit: "minutes" | "hours" | "days" | "expired" | null;
  value: number | null;
  text: string | null;
};

export type CampaignRowSummary = {
  campaignId: string;
  campaignTitle: string;
  status: CampaignStatus;

  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  startAt: string | null;
  endAt: string | null;

  category: { id: string; name: string } | null;

  numberOfInfluencers: number | null;
  campaignBudget: number;

  contractsCount: number;
  acceptedContracts: number;
  assignedContracts: number;

  startIn: TimeMeta;
  expireIn: TimeMeta;

  platformSelection: Platform[];
  productImages: any[];

  byAi: 0 | 1;
  isActive: 0 | 1;
  isDraft: 0 | 1;
};


export type CreateCampaignManualPayload = {
  brandId: string;

  campaignTitle?: string;
  description?: string;
  campaignType?: string;

  categoryId?: string;
  subcategoryIds?: string[] | string;

  productImages?: any[];
  productLink?: string;

  campaignGoals?: string[] | string;
  influencerTierIds?: string[] | string;
  contentFormats?: string[] | string;
  contentLanguageIds?: string[] | string;

  platformSelection?: Platform[] | string[];

  targetCountryIds?: string[] | string;
  targetAgeRanges?: string[] | string;
  preferredHashtags?: string[] | string;

  minFollowers?: number;
  maxFollowers?: number;

  numberOfInfluencers?: number;

  campaignBudget?: number;
  paymentType?: string;

  additionalNotes?: string;

  scheduledAt?: string;
  startAt?: string;
  endAt?: string;

  status?: CampaignStatus;
};

export async function apiCampaignCreate(payload: CreateCampaignManualPayload) {
  const res = await apiPost<any>(`${CAMPAIGN_BASE}/create`, payload);
  return (res?.doc ?? res) as EnrichedCampaignDoc;
}

/** -------- AI Prefill -------- */
export type PrefillCampaignAIPayload = {
  brandId: string;

  campaignTitle: string;
  description: string;
  campaignType: string;

  categoryId: string;
  subcategoryIds: string[] | string;

  productImages: any[];
  productLink?: string;

  targetCountryIds: string[] | string;
  targetAgeRanges: string[] | string;

  additionalNotes?: string;

  saveDraft?: boolean;
  save?: boolean;
};

export async function apiCampaignPrefillAI(payload: PrefillCampaignAIPayload) {
  const finalPayload = {
    ...payload,
    saveDraft: payload.saveDraft ?? payload.save ?? false,
  };

  const res = await apiPost<any>(`${CAMPAIGN_BASE}/create-ai`, finalPayload);

  const prefill = unwrapPrefillDoc<any>(res);
  const prefillDetails = res?.prefillDetails ?? null;
  const savedDraft = res?.savedDraft ?? null;

  return {
    ...prefill,
    categoryName: prefill?.categoryName ?? prefillDetails?.category?.name ?? "",
    details: prefillDetails,
    savedDraft,
  } as EnrichedCampaignDoc;
}

export async function apiCampaignCreateAI(payload: PrefillCampaignAIPayload) {
  return apiCampaignPrefillAI(payload);
}

/** -------- List / Get -------- */
export type ListCampaignsPayload = {
  brandId: string;

  page?: number;
  limit?: number;
  search?: string;

  status?: CampaignStatus;
  byAi?: 0 | 1;

  campaignType?: string;

  categoryId?: string;
  categoryIds?: string[];

  subcategoryId?: string;
  subcategoryIds?: string[];

  dateField?: "createdAt" | "updatedAt" | "startAt" | "endAt" | "publishedAt";
  datePreset?:
  | "today"
  | "last7days"
  | "last30days"
  | "thisweek"
  | "thismonth"
  | "launchingSoon";

  dateFrom?: string;
  dateTo?: string;

  sortBy?:
  | "createdAt"
  | "updatedAt"
  | "startAt"
  | "endAt"
  | "publishedAt"
  | "campaignTitle"
  | "campaignBudget"
  | "numberOfInfluencers"
  | "status";

  sortOrder?: "asc" | "desc";
};


export async function apiCampaignGetDrafts(payload: ListCampaignsPayload) {
  return apiPost<{ items: EnrichedCampaignDoc[]; meta: any }>(`${CAMPAIGN_BASE}/get-drafts`, payload);
}

export async function apiCampaignGetByBrand(payload: ListCampaignsPayload) {
  return apiPost<{ items: CampaignRowSummary[]; meta: any }>(
    `${CAMPAIGN_BASE}/get-by-brand`,
    payload
  );
}

export async function apiCampaignGetById(payload: { campaignId: string; brandId?: string }) {
  return apiPost<EnrichedCampaignDoc>(`${CAMPAIGN_BASE}/get-by-id`, payload);
}

export type EditDraftPayload = {
  brandId: string;
  campaignId: string;

  campaignTitle?: string;
  description?: string;
  campaignType?: string;

  categoryId?: string;
  subcategoryIds?: string[] | string;

  productImages?: any[];
  productLink?: string;

  campaignGoals?: string[] | string;
  influencerTierIds?: string[] | string;
  contentFormats?: string[] | string;
  contentLanguageIds?: string[] | string;

  platformSelection?: Platform[] | string[];

  targetCountryIds?: string[] | string;
  targetAgeRanges?: string[] | string;
  preferredHashtags?: string[] | string;

  numberOfInfluencers?: number;

  campaignBudget?: number;
  paymentType?: string;

  additionalNotes?: string;

  scheduledAt?: string;
  startAt?: string;
  endAt?: string;

  status?: CampaignStatus;
};
export async function apiCampaignEditDraft(payload: EditDraftPayload) {
  return apiPost<EnrichedCampaignDoc>(`${CAMPAIGN_BASE}/edit-draft`, payload);
}

export type EditActivePayload = {
  brandId: string;
  campaignId: string;

  campaignTitle?: string;
  description?: string;
  campaignType?: string;

  categoryId?: string;
  subcategoryIds?: string[] | string;

  productImages?: any[];

  campaignGoals?: string[] | string;
  influencerTierIds?: string[] | string;
  contentFormats?: string[] | string;

  paymentType?: string;
  campaignBudget?: number;

  startAt?: string;
  endAt?: string;

  platformSelection?: Platform[] | string[];

  targetCountryIds?: string[] | string;
  targetAgeRanges?: string[] | string;

  numberOfInfluencers?: number;
};

export async function apiCampaignEditActive(payload: EditActivePayload) {
  return apiPost<EnrichedCampaignDoc>(`${CAMPAIGN_BASE}/active/edit`, payload);
}

/** -------- Actions -------- */
export async function apiCampaignPause(payload: { campaignId: string; brandId?: string }) {
  return apiPost<EnrichedCampaignDoc>(`${CAMPAIGN_BASE}/pause`, payload);
}

export type DeleteCampaignByCampaignIdResponse = {
  message: string;
  deleted: {
    campaignId: string;
    campaignTitle: string;
    status: string;
    hadContracts: boolean;
  };
};

export async function apiCampaignDelete(payload: { brandId: string; campaignId: string }) {
  return apiPost<DeleteCampaignByCampaignIdResponse>(`${CAMPAIGN_BASE}/delete`, payload);
}

/** -------------------------
 *  ✅ TIMEZONE API
 *  ------------------------*/
export type GetTimezonesByCountriesPayload = {
  targetCountryIds?: string[] | string;
  targetCountryCodes?: string[] | string;
  current?: {
    ip?: string;
    countryCode?: string;
    countryName?: string;
    timezone?: string;
  };
};

export type TimezoneItem = {
  timezone: string;
  isValid: boolean;
  nowLocal: string | null;
  offsetMinutes: number | null;
  offsetMinutesFromCurrent: number | null;
};

export type TimezonesTargetCountry = {
  id: string;
  countryCode?: string;
  countryNameEn?: string;
  countryNameLocal?: string;
  region?: string;
  flag?: string;
  timezones: TimezoneItem[];
};
export type TimezoneTarget = {
  id: string;
  countryCode: string;
  countryName: string;
  callingCode?: string;
  flag?: string;
  timezones: Array<{
    timezone: string;
    isValid?: boolean;
    nowLocal?: string;
    offsetMinutes?: number;
    offsetMinutesFromCurrent?: number;
  }>;
  timezoneMeta?: {
    selected?: string;
    selectedBy?: string;
    availableCount?: number;
  };
};

export type GetTimezonesByCountriesResponse = {
  success: boolean;
  data: {
    current: {
      timezone: string;
      nowLocal: string;
      nowUtc: string;
    };
    targets: TimezoneTarget[];
    meta?: {
      requested?: {
        ids?: number;
        codes?: number;
      };
      resolved?: {
        countries?: number;
      };
      invalid?: {
        countryIds?: string[];
        countryCodes?: string[];
      };
    };
  };
  requestId?: string;
};

export async function apiGetTimezonesByCountries(payload: GetTimezonesByCountriesPayload) {
  return apiPost<GetTimezonesByCountriesResponse>(`/timezone/by-countries`, payload);
}

export type ViewCampaignByBrandPayload = {
  brandId: string;
  campaignId: string;
};

export async function apiCampaignViewByBrand(payload: ViewCampaignByBrandPayload) {
  const res = await apiPost<{ doc: any }>(`${CAMPAIGN_BASE}/view-campaign-brand`, payload);
  return (res?.doc ?? res) as EnrichedCampaignDoc;
}

/** -------------------------
 *  ✅ WALLET APIs
 *  ------------------------*/
export type WalletFreezeRow = {
  brandId: string;
  campaignId: string;
  influencerId?: string;
  freezeAmount: number;
};

export type BrandWalletResponse = {
  brandId: string;
  walletBalance: number;
  frozenBalance: number;
  usableBalance: number;
  freezes: WalletFreezeRow[];
};

export async function apiGetBrandWallet(params: { brandId: string }) {
  return apiGet<BrandWalletResponse>(`${WALLET_BASE}`, {
    brandId: params.brandId,
  });
}

export type BrandWalletTopupPayload = {
  brandId: string;
  campaignId?: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
};

export type BrandWalletTopupResponse = {
  message: string;
  brandId: string;
  amount: number;
  currency: string;
  sessionId: string;
  checkoutUrl?: string;
};

export async function apiBrandWalletTopup(payload: BrandWalletTopupPayload) {
  return apiPost<BrandWalletTopupResponse>(`${WALLET_BASE}/topup`, {
    brandId: payload.brandId,
    campaignId: payload.campaignId,
    amount: payload.amount,
    currency: payload.currency ?? "inr",
    successUrl: payload.successUrl,
    cancelUrl: payload.cancelUrl,
  });
}

export type ConfirmBrandWalletTopupPayload = {
  brandId: string;
  sessionId: string;
};

export type ConfirmBrandWalletTopupResponse = {
  message: string;
  brandId: string;
  addedAmount: number;
  walletBalance: number;
  frozenBalance: number;
  usableBalance: number;
};

export async function apiConfirmBrandWalletTopup(
  payload: ConfirmBrandWalletTopupPayload
) {
  return apiPost<ConfirmBrandWalletTopupResponse>(`${WALLET_BASE}/topup/confirm`, {
    brandId: payload.brandId,
    sessionId: payload.sessionId,
  });
}

export type FrozenAmountResponse = {
  brandId: string;
  campaignId: string;
  influencerId?: string | null;
  frozenAmount: number;
};

export async function apiGetFrozenAmountForCampaign(params: {
  brandId: string;
  campaignId: string;
  influencerId?: string;
}) {
  return apiGet<FrozenAmountResponse>(`${WALLET_BASE}/freeze-amount`, params);
}

export type RecommendedInfluencerRow = {
  influencerId: string;
  name: string;
};

export type RecommendedInfluencersResponse = {
  items: RecommendedInfluencerRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function apiCampaignRecommendedInfluencers(payload: {
  brandId: string;
  campaignId: string;
  page?: number;
  limit?: number;
}) {
  return apiPost<RecommendedInfluencersResponse>(`${CAMPAIGN_BASE}/recommended-influencers`, {
    brandId: payload.brandId,
    campaignId: payload.campaignId,
    page: payload.page ?? 1,
    limit: payload.limit ?? 20,
  });
}

export type UpdateCampaignStatusPayload = {
  brandId: string;
  campaignId: string;
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "archived";
};

export type UpdateCampaignStatusResponse = {
  message: string;
};

export async function apiCampaignUpdateStatus(payload: UpdateCampaignStatusPayload) {
  return apiPost<UpdateCampaignStatusResponse>(`${CAMPAIGN_BASE}/update-status`, payload);
}

export type InviteInfluencerPayload = {
  brandId: string;
  campaignId: string;
  influencerId: string;
  modashId?: string;
};

export type InviteInfluencerResponse = {
  message: string;
  doc: any;
};

export async function apiCampaignInviteInfluencer(payload: InviteInfluencerPayload) {
  return apiPost<InviteInfluencerResponse>(`${CAMPAIGN_BASE}/invite`, payload);
}

export type InvitedInfluencerRow = {
  inviteId: string;
  status: "invited" | "accepted" | "declined" | "cancelled";
  invitedAt: string | null;
  modashId: string | null;
  influencer: any | null;
};

export type GetInvitationListByCampaignPayload = {
  brandId: string;
  campaignId: string;
  page?: number;
  limit?: number;
};

export type GetInvitationListByCampaignResponse = {
  items: InvitedInfluencerRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export async function apiGetInvitationListByCampaign(payload: GetInvitationListByCampaignPayload) {
  return apiPost<GetInvitationListByCampaignResponse>(`${INVITATION_BASE}/list`, {
    brandId: payload.brandId,
    campaignId: payload.campaignId,
    page: payload.page ?? 1,
    limit: payload.limit ?? 20,
  });
}

export type ApplicantStatus = "applied" | "shortlisted" | "undecided" | "active" | "rejected";

export type ApplyCampaignPayload = {
  influencerId: string;
  campaignId: string;
};

export type ApplyCampaignResponse = {
  message: string;
  campaignId: string;
  campaignTitle: string;
  totalApplicants: number;
  contractsDone: number;
  numberOfInfluencers: number;
};

export async function apiApplyToCampaign(payload: ApplyCampaignPayload) {
  return apiPost<ApplyCampaignResponse>(`${APPLY_BASE}/apply`, payload);
}

export type GetApplicantsByCampaignPayload = {
  campaignId: string;
  status?: ApplicantStatus;
};

export type ApplicantRow = {
  influencerId: string;
  influencerName: string;
  appliedAt: string;

  status?: ApplicantStatus;
  statusUpdatedAt?: string;
};

export type GetApplicantsByCampaignResponse = {
  campaignId: string;
  campaignTitle: string;
  status: ApplicantStatus | null;
  applicants: ApplicantRow[];
  totalApplicants: number;
};

export async function apiGetApplicantsByCampaign(payload: GetApplicantsByCampaignPayload) {
  return apiPost<GetApplicantsByCampaignResponse>(`${APPLY_BASE}/applicants`, payload);
}

export type UpdateApplicantStatusPayload = {
  campaignId: string;
  influencerId: string;
  status: ApplicantStatus;
};

export type UpdateApplicantStatusResponse = {
  message: string;
  campaignId: string;
  influencerId: string;
  status: ApplicantStatus;
};

export async function apiUpdateApplicantStatus(payload: UpdateApplicantStatusPayload) {
  return apiPost<UpdateApplicantStatusResponse>(`${APPLY_BASE}/status/update`, payload);
}

export type GetCampaignForEditPayload = ViewCampaignByBrandPayload;

export type UpdateCampaignManualPayload = EditDraftPayload & {
  productImages?: any[];
};

export async function apiCampaignUpdateManual(payload: UpdateCampaignManualPayload) {
  const res = await apiPost<any>(`${CAMPAIGN_BASE}/update-manual`, payload);
  return (res?.doc ?? res?.data ?? res) as EnrichedCampaignDoc;
}

/** -------------------------
 *  ✅ MILESTONE APIs
 *  ------------------------*/
export type CreateMilestonePayload = {
  brandId: string;
  influencerId: string;
  campaignId: string;
  milestoneTitle: string;
  amount: number;
  milestoneDescription?: string;
};

export type CreateMilestoneResponse = {
  message: string;
  milestoneId: string;
  totalAmount: number;
  entry: {
    milestoneHistoryId: string;
    influencerId: string;
    campaignId: string;
    milestoneTitle: string;
    amount: number;
    milestoneDescription: string;
    released: boolean;
    payoutStatus: "pending" | "initiated" | "paid";
    createdAt: string;
  };
  wallet: {
    walletBalance: number;
    frozenBalance: number;
    usableBalance: number;
  };
  contractStatus: string | null;
  milestonesCreatedAt: string | null;
};

export async function apiCreateMilestone(payload: CreateMilestonePayload) {
  return apiPost<CreateMilestoneResponse>(`${MILESTONE_BASE}/create`, {
    brandId: payload.brandId,
    influencerId: payload.influencerId,
    campaignId: payload.campaignId,
    milestoneTitle: payload.milestoneTitle,
    amount: payload.amount,
    milestoneDescription: payload.milestoneDescription ?? "",
  });
}

export type MilestoneRow = {
  _id?: string;
  milestoneHistoryId: string;
  influencerId: string;
  campaignId: string;
  milestoneTitle: string;
  amount: number;
  milestoneDescription: string;
  released: boolean;
  releasedAt?: string | null;
  payoutStatus: "pending" | "initiated" | "paid";
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  brandId: string;
  milestoneId: string;
};

export type BrandWalletSnapshot = {
  walletBalance: number;
  frozenBalance: number;
  usableBalance: number;
};

export type GetMilestonesByBrandPayload = {
  brandId: string;
};

export type GetMilestonesByBrandResponse = {
  message: string;
  wallet: BrandWalletSnapshot;
  totalAmount: number;
  milestones: MilestoneRow[];
};

export async function apiGetMilestonesByBrand(payload: GetMilestonesByBrandPayload) {
  return apiPost<GetMilestonesByBrandResponse>(`${MILESTONE_BASE}/byBrand`, {
    brandId: payload.brandId,
  });
}

export type GetMilestoneWalletBalancePayload = {
  brandId: string;
};

export type GetMilestoneWalletBalanceResponse = {
  message: string;
  brandId: string;
  walletBalance: number;
  frozenBalance: number;
  usableBalance: number;
};

export async function apiGetMilestoneWalletBalance(
  payload: GetMilestoneWalletBalancePayload
) {
  return apiPost<GetMilestoneWalletBalanceResponse>(`${MILESTONE_BASE}/balance`, {
    brandId: payload.brandId,
  });
}

export type ReleaseMilestonePayload = {
  milestoneId: string;
  milestoneHistoryId: string;
};

export type ReleaseMilestoneResponse = {
  message: string;
  releasedAmount: number;
  payoutStatus: "initiated" | "paid" | "pending";
  wallet: BrandWalletSnapshot;
};

export async function apiReleaseMilestone(payload: ReleaseMilestonePayload) {
  return apiPost<ReleaseMilestoneResponse>(`${MILESTONE_BASE}/release`, {
    milestoneId: payload.milestoneId,
    milestoneHistoryId: payload.milestoneHistoryId,
  });
}


export type CampaignMilestoneRow = {
  _id?: string;
  milestoneHistoryId: string;
  influencerId: string;
  influencerName?: string | null;
  campaignId: string;
  milestoneTitle: string;
  amount: number;
  milestoneDescription: string;
  released: boolean;
  releasedAt?: string | null;
  payoutStatus: "pending" | "initiated" | "paid";
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  brandId: string;
  milestoneId: string;
};

export type GetMilestonesByCampaignPayload = {
  campaignId: string;
  brandId?: string;
};

export type GetMilestonesByCampaignResponse = {
  message: string;
  milestones: CampaignMilestoneRow[];
};

export async function apiGetMilestonesByCampaign(
  payload: GetMilestonesByCampaignPayload
) {
  const res = await apiPost<GetMilestonesByCampaignResponse>(
    `${MILESTONE_BASE}/byCampaign`,
    {
      campaignId: payload.campaignId,
      brandId: payload.brandId,
    }
  );

  return {
    ...res,
    milestones: (res?.milestones || []).filter(
      (item) => !payload.brandId || String(item.brandId) === String(payload.brandId)
    ),
  };
}

/** -------------------------
 *  ✅ DELIVERABLE APIs
 *  ------------------------*/
/** -------------------------
 *  ✅ DELIVERABLE APIs
 *  ------------------------*/
export type DeliverableStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "revision";

export type ApprovedRole = "Brand" | "Admin";

export type DeliverableInfluencer = {
  _id: string;
  name: string;
};

export type DeliverableRow = {
  _id?: string;
  deliverableId?: string;
  delieverableApprovalId?: string; // keep legacy typo if backend ever sends it
  campaignId: string;
  influencerId: string;
  milestoneId?: string;
  milestoneHistoryId?: string;

  title?: string;
  description?: string;
  fileUrl?: string;
  link?: string;

  status?: DeliverableStatus | string;
  comments?: string;
  approvalId?: string;
  approvedRole?: ApprovedRole;

  createdAt?: string;
  updatedAt?: string;

  milestoneTitle?: string;
  influencerName?: string;
  influencer?: DeliverableInfluencer | null;

  [key: string]: any;
};

export async function apiListDeliverablesByCampaign(params: {
  campaignId: string;
  status?: string;
}) {
  return apiGet<DeliverableRow[]>(
    `${DELIVERABLE_BASE}/campaign/${params.campaignId}`,
    {
      status: params.status,
    }
  );
}

export type UpdateDeliverableApprovalStatusPayload = {
  deliverableId: string;
  status: "approved" | "revision";
  comments?: string;
  approvedRole?: ApprovedRole;
  approvalId?: string;
};

export async function apiUpdateDeliverableApprovalStatus(
  payload: UpdateDeliverableApprovalStatusPayload
) {
  return apiPost<DeliverableRow>(
    `${DELIVERABLE_BASE}/${payload.deliverableId}/approval-status`,
    {
      status: payload.status,
      comments: payload.comments,
      approvedRole: payload.approvedRole,
      approvalId: payload.approvalId,
    }
  );
}

export type GetAllCampaignsParams = {
  brandId?: string;
  page?: number;
  limit?: number;
};

export type GetAllCampaignsRow = {
  _id?: string;
  id?: string;
  campaignId?: string;
  campaignTitle?: string;
  title?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GetAllCampaignsResponse = {
  data: GetAllCampaignsRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export async function apiGetAllCampaigns(params: GetAllCampaignsParams = {}) {
  const res = await apiGet<any>(`${CAMPAIGN_BASE}/getAll`, {
    brandId: params.brandId,
    page: params.page ?? 1,
    limit: params.limit ?? 100,
  });

  if (Array.isArray(res)) {
    return {
      data: res,
      pagination: {
        total: res.length,
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    } as GetAllCampaignsResponse;
  }

  return res as GetAllCampaignsResponse;
}

export type CreateCampaignInvitationPayload = {
  brandId: string;
  influencerId: string;
  campaignIds: string[];
  platform?: "youtube" | "instagram" | "tiktok";
  handle?: string;
  modashUserId?: string;
  emailTo?: string;
};

export type CampaignInvitationRow = {
  _id?: string;
  brandId: string;
  campaignId: string;
  influencerId: string;
  status?: string;
  sentAt?: string;
  failedAt?: string | null;
  failReason?: string | null;
  platform?: string;
  handle?: string;
  modashUserId?: string;
  emailTo?: string | null;
  [key: string]: any;
};

export type CreateCampaignInvitationResponse = {
  status: "success" | "error";
  message: string;
  requestedCampaigns?: number;
  created?: number;
  missingCampaignIds?: string[];
  invitations?: CampaignInvitationRow[];
};

export async function apiCreateCampaignInvitation(
  payload: CreateCampaignInvitationPayload
) {
  return apiPost<CreateCampaignInvitationResponse>(`${CAMPAIGN_INVITATION_BASE}/create`, payload);
}


/** -------- Campaign Invitation List by Brand (NEW) -------- */
export type GetCampaignInvitationsByBrandParams = {
  brandId: string;
  page?: number;
  limit?: number;
  status?: string;
  influencerId?: string;
};

export type CampaignInvitationListResponse = {
  status: "success" | "error";
  page: number;
  limit: number;
  total: number;
  pages: number;
  brandId: string;
  invitations: CampaignInvitationRow[];
};

export async function apiGetCampaignInvitationsByBrand(
  params: GetCampaignInvitationsByBrandParams
) {
  const { brandId, page = 1, limit = 25, status, influencerId } = params;

  return apiGet<CampaignInvitationListResponse>(
    `${CAMPAIGN_INVITATION_BASE}/brand/${brandId}`,
    {
      page,
      limit,
      status,
      influencerId,
    }
  );
}

/** -------- Campaign History -------- */
export type CampaignHistoryTimelineState = "none" | "running" | "expired";

export type CampaignHistorySortBy =
  | "createdAt"
  | "budget"
  | "applicantCount"
  | "campaignStatus"
  | "statusUpdatedAt"
  | "productOrServiceName"
  | "isActive";

export type CampaignHistorySortOrder = "asc" | "desc";

export type CampaignHistoryPayload = {
  brandId: string;

  page?: number;
  limit?: number;
  search?: string;
  sortBy?: CampaignHistorySortBy;
  sortOrder?: CampaignHistorySortOrder;
  includeDescription?: 0 | 1;

  campaignStatus?: "open" | "paused";
  timelineState?: CampaignHistoryTimelineState;
  goal?: string;
  minBudget?: number | string;
  maxBudget?: number | string;

  campaignType?: string;
  creatorStatus?: "all" | "invited" | "applied" | "approved";
  categoryIds?: string[];
  aiCreated?: boolean | 0 | 1 | "true" | "false";

  quickFilter?:
  | "recently_edited"
  | "launching_soon"
  | "today"
  | "this_week"
  | "this_month";

  allDatesOption?:
  | "all"
  | "last_7"
  | "last_15"
  | "last_30"
  | "last_90"
  | "last_365"
  | "last_month"
  | "last_quarter";

  startDate?: string;
  endDate?: string;
};

export type CampaignHistoryRow = EnrichedCampaignDoc & {
  computedIsActive?: boolean;
  timelineState?: CampaignHistoryTimelineState;
  hasTimeline?: boolean;
  influencerWorking?: boolean;
};

export type CampaignHistoryResponse = {
  data: CampaignHistoryRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function apiCampaignHistory(payload: CampaignHistoryPayload) {
  const client = resolveClient();

  if (typeof client?.request === "function") {
    const res = await client.request({
      method: "POST",
      url: `${CAMPAIGN_BASE}/history`,
      data: payload,
    });
    return res?.data as CampaignHistoryResponse;
  }

  if (typeof client?.post === "function") {
    const res = await client.post(`${CAMPAIGN_BASE}/history`, payload);
    return res?.data as CampaignHistoryResponse;
  }

  throw new Error("No compatible API client found in @/lib/api");
}



/** -------- Applicant List By Campaign (NEW) -------- */

/** -------- Applicant List By Campaign (UPDATED) -------- */

export type ApplyListSortField =
  | "name"
  | "primaryPlatform"
  | "category"
  | "audienceSize"
  | "handle"
  | "createdAt";

export type ApplicantDecisionFilter = 0 | 1 | boolean | "0" | "1" | "true" | "false";

export type GetListByCampaignPayload = {
  campaignId: string;
  page?: number;
  limit?: number;
  search?: string;
  sortField?: ApplyListSortField;
  createdPage?: boolean | "true" | "false";
  sortOrder?: 0 | 1; // 0 = asc, 1 = desc
  filterStatus?: "all" | "applied" | "active" | "shortlisted" | "undecided" | "rejected" | "invited" | "completed";
  // new applicant decision filters
  isShortlisted?: ApplicantDecisionFilter;
  isUndicided?: ApplicantDecisionFilter;
  isRejected?: ApplicantDecisionFilter;
};

export type CampaignApplicantInfluencerRow = {
  influencerId: string;
  name: string;
  primaryPlatform: string | null;
  handle: string | null;
  category: string | null;
  audienceSize: number;
  createdAt: string | null;

  // applicant decision flags
  isShortlisted: 0 | 1;
  isUndicided: 0 | 1;
  isRejected: 0 | 1;

  // approval / contract flags
  isAssigned: 0 | 1;
  isContracted: 0 | 1;
  contractId: string | null;
  feeAmount: number;
  isAccepted: 0 | 1;

  // contract rejection (separate from applicant rejection)
  isContractRejected?: 0 | 1;
  rejectedReason: string;
};

export type GetListByCampaignResponse = {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  applicantCount: number;
  isContracted: 0 | 1;
  contractId: string | null;
  influencers: CampaignApplicantInfluencerRow[];
};

export async function apiGetListByCampaign(
  payload: GetListByCampaignPayload
) {
  return apiPost<GetListByCampaignResponse>(
    `${Apply_Base}/list`,
    {
      campaignId: payload.campaignId,
      page: payload.page ?? 1,
      limit: payload.limit ?? 10,
      search: payload.search,
      sortField: payload.sortField,
      filterStatus: payload.filterStatus,
      createdPage: payload.createdPage,
      sortOrder: payload.sortOrder ?? 0,
      isShortlisted: payload.isShortlisted,
      isUndicided: payload.isUndicided,
      isRejected: payload.isRejected,
    }
  );
}

export type ApplicantDecisionField =
  | "isShortlisted"
  | "isUndicided"
  | "isRejected";

export type SetApplicantDecisionStatusPayload = {
  campaignId: string;
  influencerId: string;
  field: ApplicantDecisionField;
};

export type SetApplicantDecisionStatusResponse = {
  message: string;
  applicant: {
    influencerId: string;
    name: string;
    isShortlisted: 0 | 1;
    isUndicided: 0 | 1;
    isRejected: 0 | 1;
  };
};

export async function apiSetApplicantDecisionStatus(
  payload: SetApplicantDecisionStatusPayload
) {
  return apiPost<SetApplicantDecisionStatusResponse>(
    `${Apply_Base}/update-status`,
    {
      campaignId: payload.campaignId,
      influencerId: payload.influencerId,
      field: payload.field,
    }
  );
}

/** -------- Campaign Invitations By Brand + Campaign (NEW) -------- */
export type GetCampaignInvitationsByBrandAndCampaignPayload = {
  brandId: string;
  campaignId: string;
  status?: string;
  influencerId?: string;
  platform?: "youtube" | "instagram" | "tiktok";
  handle?: string;
};

export type GetCampaignInvitationsByBrandAndCampaignResponse = {
  status: "success" | "error";
  total: number;
  brandId: string;
  campaignId: string;
  invitations: CampaignInvitationRow[];
};

export async function apiGetCampaignInvitationsByBrandAndCampaign(
  payload: GetCampaignInvitationsByBrandAndCampaignPayload
) {
  return apiPost<GetCampaignInvitationsByBrandAndCampaignResponse>(
    `${CAMPAIGN_INVITATION_BASE}/get-invitations`,
    {
      brandId: payload.brandId,
      campaignId: payload.campaignId,
      status: payload.status,
      influencerId: payload.influencerId,
      platform: payload.platform,
      handle: payload.handle,
    }
  );
}

export type BrandLiteFeature = {
  key?: string | null;
  value?: string | number | null;
  limit?: number | null;
  used?: number | null;
  note?: string | null;
  resetsEvery?: string | null;
  resetsAt?: string | null;
};

export type BrandLiteSubscription = {
  brandPlanId?: string | null;
  brandPlanName?: string | null;
  plan?: string | null;
  status?: string | null;
  features?: BrandLiteFeature[] | null;
};

export type BrandLiteResponse = {
  subscription: BrandLiteSubscription | null;
  brandId: string;
  name: string;
  proxyEmail: string;
  profilePic: string;
  subscriptionDetails: BrandLiteSubscription | null;
};

export async function apiGetBrandLite(brandId: string) {
  return apiGet<BrandLiteResponse>(`${BRAND_BASE}/lite`, { brandId });
}

export type BrandProfileResponse = {
  _id: string;
  brandId: string;
  brandName?: string;
  name?: string;
  email?: string;
  companySize?: string;
  industry?: string;

  page1?: Array<{ question: string; answers: string[] }>;
  page2?: Array<{ question: string; answers: string[] }>;
  page3?: Array<{ question: string; answers: string[] }>;

  ispage1Skip?: boolean;
  ispage2Skip?: boolean;
  ispage3Skip?: boolean;

  proxyEmail?: string;
  profilePic?: string;
  isProfilePicSkip?: boolean;

  subscription?: any;
  subscriptionDetails?: any;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
};

export async function apiGetBrandProfile(brandId: string) {
  return apiPost<BrandProfileResponse>(`${BRAND_BASE}/profile`, {
    brandId,
  });
}

export async function apigetSignatureExistance(brandId: string) {
  console.log("called apigetSignatureExistance")
  return apiGet(`${CONTRACT_BASE}/signature/${brandId}`)
}


export async function apipostSignatureUpload(payload: {
  brandId: string;
  signature: File;
}) {
  const formData = new FormData();
  formData.append("brandId", payload.brandId);
  formData.append("signature", payload.signature);

  return apiPost(`${CONTRACT_BASE}/upload`, formData);
}

export async function apiGetManageContractInfo(contractId: string) {
  return apiGet(`${CONTRACT_BASE}/manage/${contractId}`)
}

// Add these types and functions near the bottom of services/brandApi.t

export type UpdateBrandProfilePayload = {
  brandId: string;
  brandName?: string;
  companySize?: string;
  brandType?: string;
  platform?: "Instagram" | "Youtube" | "Tiktok";
  profilePic?: string;
};

export type UpdateBrandProfileResponse = {
  message: string;
  brandId: string;
};


export async function apiUpdateBrandProfile(payload: UpdateBrandProfilePayload) {
  return apiPost<UpdateBrandProfileResponse>(`${BRAND_BASE}/profile/update`, payload);
}


export type AcceptedAdminCreatedInfluencerRow = {
  invitationId: string;
  influencerId: string | null;
  influencerName: string | null;
  influencerEmail: string | null;
  modashUserId: string | null;
  handle: string | null;
  platform: string | null;
  status: string;
  brandId: string | null;
  brandName: string | null;
  campaignId: string | null;
  campaignTitle?: string | null;
  description?: string | null;
  campaignBudget?: number | null;
  budget?: number | null;
  influencerBudget?: number | null;
  minFollowers?: number | null;
  maxFollowers?: number | null;
  targetCountry?: string | null;
  paymentType?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetAcceptedAdminCreatedInfluencersByCampaignPayload = {
  campaignId: string;
  brandId?: string;
  page?: number;
  limit?: number;
  includeCampaign?: 0 | 1 | boolean;
  includeNames?: 0 | 1 | boolean;
};

export type GetAcceptedAdminCreatedInfluencersByCampaignResponse = {
  status: "success" | "error";
  page: number;
  limit: number;
  total: number;
  pages: number;
  campaignId: string;
  filters: {
    status: "accepted";
    createdByAdmin: true;
    brandId?: string;
  };
  influencers: AcceptedAdminCreatedInfluencerRow[];
};

export async function apiGetAcceptedAdminCreatedInfluencersByCampaign(
  params: GetAcceptedAdminCreatedInfluencersByCampaignPayload
) {
  return apiGet<GetAcceptedAdminCreatedInfluencersByCampaignResponse>(
    `${CAMPAIGN_INVITATION_BASE}/accepted-admin-created-influencers`,
    {
      campaignId: params.campaignId,
      brandId: params.brandId,
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      includeCampaign:
        typeof params.includeCampaign === "boolean"
          ? params.includeCampaign
            ? 1
            : 0
          : (params.includeCampaign ?? 1),
      includeNames:
        typeof params.includeNames === "boolean"
          ? params.includeNames
            ? 1
            : 0
          : (params.includeNames ?? 1),
    }
  );
}

export type GetMilestonesByInfluencerAndCampaignPayload = {
  influencerId: string;
  campaignId: string;
  brandId?: string;
};

export type GetMilestonesByInfluencerAndCampaignResponse = {
  message: string;
  milestones: MilestoneRow[];
};

export async function apiGetMilestonesByInfluencerAndCampaign(
  payload: GetMilestonesByInfluencerAndCampaignPayload
) {
  return apiPost<GetMilestonesByInfluencerAndCampaignResponse>(
    `${MILESTONE_BASE}/getMilestome`,
    {
      influencerId: payload.influencerId,
      campaignId: payload.campaignId,
      brandId: payload.brandId,
    }
  );
}

export type GetDeliverablesByBrandPayload = {
  brandId: string;
  status?: string;
  campaignId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type GetDeliverablesByMilestonePayload = {
  milestoneId: string;
  brandId?: string;
  influencerId?: string;
  campaignId?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type GetDeliverablesListResponse = {
  success: boolean;
  message: string;
  page: number;
  limit: number;
  total: number;
  count: number;
  data: DeliverableRow[];
  filters?: {
    brandId?: string;
    milestoneId?: string;
    influencerId?: string;
    campaignId?: string;
    status?: string;
    search?: string;
  };
};

export async function apiGetDeliverablesByBrand(
  payload: GetDeliverablesByBrandPayload
) {
  return apiPost<GetDeliverablesListResponse>(
    `${DELIVERABLE_BASE}/by-brand`,
    {
      brandId: payload.brandId,
      status: payload.status,
      campaignId: payload.campaignId,
      search: payload.search,
      page: payload.page ?? 1,
      limit: payload.limit ?? 20,
    }
  );
}

export async function apiGetDeliverablesByMilestone(
  payload: GetDeliverablesByMilestonePayload
) {
  return apiPost<GetDeliverablesListResponse>(
    `${DELIVERABLE_BASE}/by-milestone`,
    {
      milestoneId: payload.milestoneId,
      brandId: payload.brandId,
      influencerId: payload.influencerId,
      campaignId: payload.campaignId,
      status: payload.status,
      page: payload.page ?? 1,
      limit: payload.limit ?? 20,
    }
  );
}

/** -------- Public Campaign Share APIs -------- */

export type EnableCampaignSharePayload = {
  brandId: string;
  campaignId: string;
};

export type EnableCampaignShareResponse = {
  message: string;
  shareUrl: string;
  publicShareToken: string;
  isPublic: boolean;
};

export async function apiEnableCampaignShare(
  payload: EnableCampaignSharePayload
) {
  return apiPost<EnableCampaignShareResponse>(
    `${CAMPAIGN_BASE}/share/enable`,
    {
      brandId: payload.brandId,
      campaignId: payload.campaignId,
    }
  );
}

export type DisableCampaignSharePayload = {
  brandId: string;
  campaignId: string;
};

export type DisableCampaignShareResponse = {
  message: string;
  isPublic: boolean;
};

export async function apiDisableCampaignShare(
  payload: DisableCampaignSharePayload
) {
  return apiPost<DisableCampaignShareResponse>(
    `${CAMPAIGN_BASE}/share/disable`,
    {
      brandId: payload.brandId,
      campaignId: payload.campaignId,
    }
  );
}

export type PublicCampaignDoc = {
  _id: string;
  campaignTitle: string;
  description?: string;
  campaignType?: string;

  campaignBudget?: number;
  budget?: number;
  paymentType?: string;

  platformSelection?: string[];

  targetCountryIds?: string[];
  targetAgeRanges?: string[];

  productImages?: any[];
  productLink?: string;
  videoLink?: string;

  additionalNotes?: string;

  startAt?: string | null;
  endAt?: string | null;
  status?: string;

  brandName?: string;

  categoryId?: string | null;
  subcategoryIds?: string[];

  contentFormats?: string[];
  contentLanguageIds?: string[];
  preferredHashtags?: string[];
  campaignGoals?: string[];
};

export type GetPublicCampaignResponse = {
  doc: PublicCampaignDoc;
};

export async function apiGetPublicCampaign(token: string) {
  return apiGet<GetPublicCampaignResponse>(
    `${CAMPAIGN_BASE}/public/${encodeURIComponent(token)}`
  );
}