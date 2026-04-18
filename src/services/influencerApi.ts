// services/influencerApi.ts
import axios from "axios";
import * as Api from "@/lib/api";
import { post as libPost } from "@/lib/api";

const INFLUENCER_BASE = "/influencer";
const LIST_BASE = "/list";
const CATEGORY_BASE = "/category";
const CAMPAIGN_BASE = "/campaign";

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

  // { data: ... }
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

export type LangRow = { _id?: string; code?: string; name?: string };

export async function apiListCountries(params: ListQuery = {}) {
  return apiGet<CountryRow[]>(`${LIST_BASE}/countries`, params);
}

export async function apiListContentLanguages(params: ListQuery = {}) {
  return apiGet<LangRow[]>(`${LIST_BASE}/content-languages`, params);
}

/** -------------------------
 *  ✅ CATEGORY APIs
 *  ------------------------*/
export type CategoryRow = { id: string; name: string };

export async function apiCategoryGetAll(input: { search?: string; page?: number; limit?: number } = {}) {
  return apiPost<CategoryRow[]>(`${CATEGORY_BASE}/get-all`, {
    search: input.search ?? "",
    page: input.page ?? 1,
    limit: input.limit ?? 50,
  });
}

/** -------------------------
 *  ✅ AUTH + SIGNUP
 *  ------------------------*/
export type InfluencerSignUpRoute = "page1" | "page2" | "page3" | "homepage";

export type SignupVerifyResponse = {
  message: string;
  influencerId: string;
  token: string;
  route?: InfluencerSignUpRoute; // ✅ NEW
  onboarding?: { page1Done: boolean; page2Done: boolean; page3Done: boolean }; // ✅ NEW
};

// ✅ UPDATED: supports multi category selection, still backward compatible with categoryId
export async function apiSendInfluencerSignupOtp(input: {
  creatorName: string;
  email: string;
  password: string;

  countryId: string;
  languageId?: string;

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
    name: input.creatorName?.trim(),
    creatorName: input.creatorName?.trim(),
    email: input.email?.trim(),
    password: input.password,

    countryId: input.countryId,
    languageId: input.languageId,

    categoryIds: normalizedCategoryIds,
    categoryId: normalizedCategoryIds[0],

    // optional compatibility fields (safe if backend ignores)
    locationCountryId: input.countryId,
    location: input.countryId,
    languageIds: input.languageId ? [input.languageId] : [],
    languages: input.languageId ? [input.languageId] : [],
    categories: normalizedCategoryIds,
  };

  return apiPost<{ message: string; email: string }>(`${INFLUENCER_BASE}/send-otp-signup`, payload);
}

// ✅ UPDATED: now expects route + onboarding flags from backend
export async function apiVerifyInfluencerOtpSignup(input: { email: string; otp: string }) {
  return apiPost<SignupVerifyResponse>(`${INFLUENCER_BASE}/verify-otp-signup`, {
    email: input.email.trim(),
    otp: input.otp,
  });
}

/** -------------------------
 *  ✅ SIGN IN (UPDATED to match backend)
 *  Backend returns: { message, influencerId, token, route, onboarding? }
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
  return apiPost<InfluencerSignInResponse>(`${INFLUENCER_BASE}/signin`, {
    email: email?.trim(),
    password,
  });
}

/** -------------------------
 *  ✅ ONBOARDING
 *  IMPORTANT: pass token in headers (protected route)
 *  ------------------------*/
export type QA = { question: string; answers: string[] };

export async function apiSaveInfluencerOnboarding(
  payload: {
    page1?: QA[];
    page2?: QA[];
    page3?: QA[];
    ispage1Skip?: boolean; // (backend currently doesn't use ispage1Skip, but safe)
    ispage2Skip?: boolean;
    ispage3Skip?: boolean;

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
  return apiPost<{ message: string; email: string }>(`${INFLUENCER_BASE}/sendOtp`, { email });
}

export async function apiVerifyOtpForgotInfluencer(email: string, otp: string) {
  return apiPost<{ message: string; resetToken: string }>(
    `${INFLUENCER_BASE}/verifyOtp`,
    {
      email: email.trim(),
      otp: otp.trim(),
    }
  );
}

export async function apiUpdateInfluencerPasswordWithResetToken(
  resetToken: string,
  newPassword: string,
  confirmPassword: string
) {
  return apiPost<{ message: string }>(
    `${INFLUENCER_BASE}/updatePassword`,
    {
      resetToken: resetToken.trim(),
      newPassword,
      confirmPassword,
    }
  );
}

/** -------------------------
 *  ✅ CAMPAIGN: ACTIVE CAMPAIGNS
 *  URL: POST /campaign/active
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

  return apiPost<ActiveCampaignsResponse>(`${CAMPAIGN_BASE}/influencer/get-all-active`, payload, {
    headers: {
      ...authHeader(token),
    },
  });
}
