// services/brandApi.ts
import axios from "axios";
import * as Api from "@/lib/api";

const BRAND_BASE = "/brand";
const LIST_BASE = "/list";
const CAMPAIGN_BASE = "/campaign";
const WALLET_BASE = "/wallet";

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
  // endpoint: /category/get-all
  return apiPost<CategoryDoc[]>(`/category/get-all`);
}

/** -------------------------
 *  ✅ CAMPAIGN APIs
 *  ------------------------*/
export type Platform = "youtube" | "instagram" | "tiktok";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed";

/** Your controller returns enriched docs; keep it flexible */
export type EnrichedCampaignDoc = any;

/** ✅ Dashboard/List Summary Row (NEW) */
export type TimeMeta = {
  unit: "minutes" | "hours" | "days" | null;
  value: number | null;
  text: string | null;
};

export type CampaignRowSummary = {
  campaignTitle: string;

  scheduledAt: string | null;
  startAt: string | null;
  endAt: string | null;

  status: CampaignStatus;
  campaignId: string;

  category: { id: string; name: string } | null;

  numberOfInfluencers: number | null;
  contractsCount: number;
  emailsSent: number;

  scheduleIn: TimeMeta;
  expireIn: TimeMeta;

  platformSelection: Platform[];
  productImages: any[];
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
  // backend returns { doc: enriched }
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
  save?: boolean; // legacy alias
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
  // ✅ REQUIRED (you said brand id is required)
  brandId: string;

  page?: number;
  limit?: number;
  search?: string;

  status?: CampaignStatus;
  byAi?: 0 | 1;

  // ✅ filters used by your UI
  campaignType?: string;
  creatorStatus?: string; // optional (backend can ignore if not supported)
  categoryId?: string;    // single select
  categoryIds?: string[]; // optional multi (if you add later)

  dateFrom?: string;
  dateTo?: string;

  sortBy?: "createdAt" | "updatedAt" | "scheduledAt" | "startAt" | "endAt";
  sortOrder?: "asc" | "desc";
};

export async function apiCampaignGetDrafts(payload: ListCampaignsPayload) {
  return apiPost<{ items: EnrichedCampaignDoc[]; meta: any }>(`${CAMPAIGN_BASE}/get-drafts`, payload);
}

/** ✅ This is the ONLY list API you’ll use in frontend now (NO LITE) */
export async function apiCampaignGetByBrand(payload: ListCampaignsPayload) {
  return apiPost<{ items: CampaignRowSummary[]; meta: any }>(`${CAMPAIGN_BASE}/get-by-brand`, payload);
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

  status?: CampaignStatus; // "draft" | "active" | "scheduled"
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

export async function apiCampaignDelete(payload: { brandId: string; campaignId: string }) {
  return apiPost<any>(`${CAMPAIGN_BASE}/delete`, payload);
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

export type GetTimezonesByCountriesResponse = {
  current: {
    ip?: string;
    countryCode?: string;
    timezone: string;
    nowLocal: string | null;
    nowUtc: string;
  };
  targets: TimezonesTargetCountry[];
  meta: {
    requested: { ids: number; codes: number };
    resolved: { countries: number };
    invalid: { countryIds: string[]; countryCodes: string[] };
  };
};

export async function apiGetTimezonesByCountries(payload: GetTimezonesByCountriesPayload) {
  return apiPost<GetTimezonesByCountriesResponse>(`/timezone/by-countries`, payload);
}



export type ViewCampaignByBrandPayload = {
  brandId: string;
  campaignId: string;
};

export async function apiCampaignViewByBrand(payload: ViewCampaignByBrandPayload) {
  // ✅ backend endpoint: POST /campaign/view-campaign-brand
  const res = await apiPost<{ doc: any }>(`${CAMPAIGN_BASE}/view-campaign-brand`, payload);
  return (res?.doc ?? res) as EnrichedCampaignDoc;
}


export type FrozenAmountResponse = {
  brandId: string;
  campaignId: string;
  frozenAmount: number;
};

export async function apiGetFrozenAmountForCampaign(params: {
  brandId: string;
  campaignId: string;
}) {
  // ✅ calls: GET /wallet/freeze-amount?brandId=...&campaignId=...
  return apiGet<FrozenAmountResponse>(`${WALLET_BASE}/freeze-amount`, params);
}