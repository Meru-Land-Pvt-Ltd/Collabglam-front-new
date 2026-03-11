// services/influencerApi.ts
import axios from "axios";
import * as Api from "@/lib/api";
import { post as libPost } from "@/lib/api";

const INFLUENCER_BASE = "/influencer";
const CATEGORY_BASE = "/category";
const CAMPAIGN_BASE = "/campaign";
const MODASH_BASE = "/modash";

/** -------------------------
 *  ✅ Response Unwrap Helpers
 *  ------------------------*/
export type ApiEnvelope<T> =
  | T
  | { data?: T; result?: T; message?: string }
  | { success?: boolean; data?: T; message?: string };

export function unwrap<T>(res: ApiEnvelope<T>): T {
  let x: any = res as any;

  // axios-like response: { data, status, headers, config }
  if (
    x &&
    typeof x === "object" &&
    "data" in x &&
    (("status" in x && "headers" in x) || "config" in x)
  ) {
    x = x.data;
  }

  // { result: ... }
  if (x && typeof x === "object" && x.result !== undefined) x = x.result;

  // { success: true, data: ... }
  if (x && typeof x === "object" && "success" in x && x.data !== undefined) x = x.data;

  // { data: ... }  (also covers { total, data })
  if (x && typeof x === "object" && x.data !== undefined) x = x.data;

  return x as T;
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
 *  ✅ Request Core (GET/POST)
 *  ------------------------*/
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
    if (method === "GET" || method === "DELETE") {
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
  if (typeof libPost === "function") {
    const res = await (libPost as any)(path, body, config);
    return unwrap<T>(res as any);
  }
  return apiRequest<T>("POST", path, { data: body, config });
}

/** -------------------------
 *  ✅ AUTH HEADER HELPER
 *  ------------------------*/
function authHeader(token?: string) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** -------------------------
 *  ✅ LIST APIs
 *  ------------------------*/
export type ListQuery = { limit?: number; search?: string };

export type CountryRow = {
  _id?: string;
  id?: string;

  countryName?: string; // ✅ backend returns this
  countryNameEn?: string;

  callingCode?: string;
  countryCode?: string;
  flag?: string;

  iso2?: string;
  iso3?: string;
  timeZone?: string;
  timezone?: string;
  timezones?: string[];
};

export type LangRow = { _id?: string; id?: string; code?: string; name?: string };

export async function apiListCountries(params: ListQuery = {}) {
  return apiGet<CountryRow[]>(`/country/getall`, params);
}

export async function apiListContentLanguages(params: ListQuery = {}) {
  // returns { total, data: [...] } -> unwrap() returns the data array
  return apiGet<LangRow[]>(`/languages/all`, params);
}

/** -------------------------
 *  ✅ CATEGORY APIs  (UPDATED)
 *  Endpoint: GET /category/categories
 *  Response: { count, categories: [{ _id, name, subcategories: [...] }] }
 *  UI needs only category name
 *  ------------------------*/
export type CategoryRow = { id: string; name: string };

export async function apiCategoryGetAll(_input: { search?: string; page?: number; limit?: number } = {}) {
  // keep signature so signup page doesn't change
  const raw = await apiGet<any>(`${CATEGORY_BASE}/categories`);

  const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.categories) ? raw.categories : [];

  return arr
    .map((c: any) => ({
      id: String(c?._id ?? c?.id ?? ""),
      name: String(c?.name ?? ""),
    }))
    .filter((c: CategoryRow) => !!c.id);
}

/** -------------------------
 *  ✅ AUTH + SIGNUP (UPDATED)
 *  Send OTP: POST /influencer/request-otp
 *  Verify OTP: POST /influencer/verify-otp
 *  ------------------------*/
export type InfluencerSignUpRoute = "page1" | "page2" | "page3" | "homepage";

export type SignupVerifyResponse = {
  message: string;
  influencerId: string;
  token: string;
  route?: InfluencerSignUpRoute;
  onboarding?: { page1Done: boolean; page2Done: boolean; page3Done: boolean };
};

export async function apiSendInfluencerSignupOtp(input: {
  creatorName: string;
  email: string;
  password: string;

  countryId: string;

  // signup page still uses single languageId select
  languageId?: string;

  // multi-category
  categoryIds?: string[];
  categoryId?: string;
}) {
  const normalizedCategoryIds =
    Array.isArray(input.categoryIds) && input.categoryIds.length > 0
      ? input.categoryIds
      : input.categoryId
        ? [input.categoryId]
        : [];

  const payload: AnyObj = {
    email: input.email?.trim(),
    name: input.creatorName?.trim(),
    password: input.password,
    countryId: input.countryId,
    languageIds: input.languageId ? [input.languageId] : [],
    categoryIds: normalizedCategoryIds,
  };

  return apiPost<{ message: string; email: string }>(`${INFLUENCER_BASE}/request-otp`, payload);
}

export async function apiVerifyInfluencerOtpSignup(input: { email: string; otp: string }) {
  return apiPost<SignupVerifyResponse>(`${INFLUENCER_BASE}/verify-otp`, {
    email: input.email.trim(),
    otp: input.otp,
  });
}

/** -------------------------
 *  ✅ SIGN IN (kept as-is)
 *  ------------------------*/
export type InfluencerSignInRoute = "page1" | "page2" | "page3" | "homepage";

export type InfluencerSignInResponse = {
  message: string;
  influencerId: string;
  token: string;
  route: InfluencerSignInRoute;
  onboarding?: { page1Done: boolean; page2Done: boolean; page3Done: boolean };
};

export async function apiSignInInfluencer(email: string, password: string) {
  return apiPost<InfluencerSignInResponse>(`${INFLUENCER_BASE}/login`, {
    email: email?.trim(),
    password,
  });
}

/** -------------------------
 *  ✅ ONBOARDING
 *  ------------------------*/
export type QA = { question: string; answers: string[] };

export type OnboardingPage1Item = {
  platform: string;
  handle?: string;
  username?: string;
  data?: any;
  categories?: any[];
  isPrimary?: boolean;
};

export async function apiSaveInfluencerOnboarding(
  payload: {
    page1?: OnboardingPage1Item[];
    page2?: QA[];
    page3?: QA[];
    ispage1Skip?: boolean;
    ispage2Skip?: boolean;
    ispage3Skip?: boolean;
    preferredPlatform?: string;

    profilePic?: string;
    isProfilePicSkip?: boolean;

    [key: string]: any;
  },
  token?: string
) {
  return apiPost<{ message: string; influencerId?: string }>(
    `${INFLUENCER_BASE}/save-influencer-onboarding`,
    payload,
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

/** -------------------------
 *  ✅ FORGOT PASSWORD
 *  ------------------------*/
export async function apiSendOtpForgotInfluencer(email: string) {
  return apiPost<{ message: string; email: string }>(`${INFLUENCER_BASE}/send-otp-forgot`, { email });
}

export async function apiVerifyOtpForgotInfluencer(email: string, otp: string) {
  return apiPost<{ message: string; resetToken: string }>(`${INFLUENCER_BASE}/verify-otp-forgot`, {
    email,
    otp,
  });
}

export async function apiUpdateInfluencerPasswordWithResetToken(resetToken: string, newPassword: string) {
  return apiPost<{ message: string }>(
    `${INFLUENCER_BASE}/update-password`,
    { newPassword },
    { headers: { Authorization: `Bearer ${resetToken}` } }
  );
}

/** -------------------------
 *  ✅ CAMPAIGN: ACTIVE CAMPAIGNS
 *  ------------------------*/
export type GetAllActiveCampaignsBody = {
  influencerId: string;

  page?: number;
  limit?: number;
  search?: string;

  byAi?: 0 | 1;
  campaignType?: string;

  categoryIds?: string[];
  categoryId?: string;

  platform?: string;
  paymentType?: string;

  datePreset?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;

  sortBy?: string;
  sortOrder?: "asc" | "desc" | 1 | -1;
};

export type ActiveCampaignItem = {
  campaignId: string;
  campaignTitle: string;
  description?: string;

  scheduledAt: string | null;
  startAt: string | null;
  endAt: string | null;

  status: string;
  campaignBudget: number | null;

  targetCountryIds: string[];
  targetCountries: { id: string; name: string; countryCode?: string }[];

  targetAgeRanges: string[];
  targetAgeRangesDetails: { id: string; range: string }[];

  category: { id: string; name: string } | null;

  numberOfInfluencers: number | null;

  contractsCount: any;
  emailsSent: any;

  scheduleIn: { unit: any; value: any; text: any };
  expireIn: string;

  platformSelection: string[];
  productImages: string[];
};

export type ActiveCampaignsResponse = {
  items: ActiveCampaignItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export async function apiGetAllActiveCampaigns(body: GetAllActiveCampaignsBody, token?: string) {
  const normalizedCategoryIds =
    Array.isArray(body.categoryIds) && body.categoryIds.length > 0
      ? body.categoryIds
      : body.categoryId
        ? [body.categoryId]
        : [];

  const payload: AnyObj = {
    ...body,
    categoryIds: normalizedCategoryIds,
    categoryId: normalizedCategoryIds[0],
  };

  return apiPost<ActiveCampaignsResponse>(`${CAMPAIGN_BASE}/active`, payload, {
    headers: {
      ...authHeader(token),
    },
  });
}

export type ModashResolveProfileInput = {
  platform: "instagram" | "youtube" | "tiktok" | string;
  handle: string;
};

export async function apiResolveModashProfile(
  input: ModashResolveProfileInput,
  token?: string
) {
  const normalizedHandle = String(input.handle || "").trim().replace(/^@+/, "");

  return apiPost<any>(
    `${MODASH_BASE}/resolve-profile`,
    {
      platform: String(input.platform || "").toLowerCase(),
      handle: normalizedHandle,
      username: normalizedHandle,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export async function apiGetAllCampaigns(influencerId: string) {
  return apiPost<any[]>(`/influencer/get-campaign`, { influencerId });
}

export const apiGetAppliedCampaigns = (influencerId: string, token?: string) => {
  return apiPost<any[]>(`/campaign/applied`, {
    influencerId,
    limit: 10,
    pagination: 1,
    search: ""
  }, {
    headers: {
      ...authHeader(token),
    },
  });
}

export const apiGetfetchCampaignbyId = (
  influencerId: string,
  campaignId: string,
  token?: string
) => {
  return apiPost<any>(
    `${CAMPAIGN_BASE}/view-campaign-by-influencer`,
    {
      influencerId,
      campaignId,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
};

export const apiGetContractedCampaigns = (influencerId: string, token?: string) => {
  return apiPost<any[]>(
    `${CAMPAIGN_BASE}/contracted`,
    {
      influencerId,
      limit: 10,
      pagination: 1,
      search: "",
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
};