// services/influencerApi.ts
import axios from "axios";
import * as Api from "@/lib/api";
import { post as libPost } from "@/lib/api";

const INFLUENCER_BASE = "/influencer";
const CATEGORY_BASE = "/category";
const CAMPAIGN_BASE = "/campaign";
const MODASH_BASE = "/modash";
const APPLY_BASE = "/apply";
const LIST_BASE = "/list";
const MILESTONE_BASE = "/milestone";
const DELEVERABLE_BASE = "/deliverable";
const CAMPAIGN_INVITATION_BASE = "/campaign-invitation";
const CONTRACT_BASE = "/contract"

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

  countryName?: string;
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

/** -------------------------
 *  ✅ CATEGORY APIs
 *  Endpoint: GET /category/categories
 *  Response: { count, categories: [{ _id, name, subcategories: [...] }] }
 *  ------------------------*/
export type CategoryRow = { id: string; name: string };

export async function apiCategoryGetAll(
  _input: { search?: string; page?: number; limit?: number } = {}
) {
  const raw = await apiGet<any>(`${CATEGORY_BASE}/categories`);

  const arr: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.categories)
      ? raw.categories
      : [];

  return arr
    .map((c: any) => ({
      id: String(c?._id ?? c?.id ?? ""),
      name: String(c?.name ?? ""),
    }))
    .filter((c: CategoryRow) => !!c.id);
}

/** -------------------------
 *  ✅ AUTH + SIGNUP
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
 *  ✅ SIGN IN
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
  return apiPost<{ message: string; email: string }>(`${INFLUENCER_BASE}/send-otp-forgot`, {
    email,
  });
}

export async function apiVerifyOtpForgotInfluencer(email: string, otp: string) {
  return apiPost<{ message: string; resetToken: string }>(
    `${INFLUENCER_BASE}/verify-otp-forgot`,
    {
      email,
      otp,
    }
  );
}

export async function apiUpdateInfluencerPasswordWithResetToken(
  resetToken: string,
  newPassword: string
) {
  return apiPost<{ message: string }>(
    `${INFLUENCER_BASE}/update-password`,
    { newPassword },
    { headers: { Authorization: `Bearer ${resetToken}` } }
  );
}

/** -------------------------
 *  ✅ ACTIVE CAMPAIGNS
 *  Backend route: POST /influencer/get-all-active
 *  Response:
 *  {
 *    items: campaigns,
 *    pagination: { total, page, limit, totalPages }
 *  }
 *  ------------------------*/
export type GetAllActiveCampaignsBody = {
  influencerId: string;
  page?: number;
  limit?: number;
  search?: string;
};

export type ActiveCampaignItem = {
  _id?: string;
  campaignsId?: string;

  campaignTitle?: string;
  description?: string;

  status?: string;
  isActive?: number;
  isDraft?: number;

  createdAt?: string;
  updatedAt?: string;

  scheduledAt?: string | null;
  startAt?: string | null;
  endAt?: string | null;

  campaignBudget?: number | null;

  targetCountryIds?: string[];
  targetCountries?: { id: string; name: string; countryCode?: string }[];

  targetAgeRanges?: string[];
  targetAgeRangesDetails?: { id: string; range: string }[];

  category?: { id: string; name: string } | null;

  numberOfInfluencers?: number | null;

  contractsCount?: any;
  emailsSent?: any;

  scheduleIn?: { unit: any; value: any; text: any };
  expireIn?: string;

  platformSelection?: string[];
  productImages?: string[];
};

export type ActiveCampaignsResponse = {
  items: ActiveCampaignItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function apiGetAllActiveCampaigns(
  body: GetAllActiveCampaignsBody,
  token?: string
) {
  const payload: AnyObj = {
    influencerId: body.influencerId,
    page: body.page ?? 1,
    limit: body.limit ?? 10,
    search: body.search ?? "",
  };

  return apiPost<ActiveCampaignsResponse>(
    `${CAMPAIGN_BASE}/influencer/get-all-active`,
    payload,
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

/** -------------------------
 *  ✅ MODASH
 *  ------------------------*/
export type ModashResolveProfileInput = {
  platform: "instagram" | "youtube" | "tiktok" | string;
  handle: string;
};

export async function apiResolveModashProfile(
  input: ModashResolveProfileInput,
  token?: string
) {
  const normalizedHandle = String(input.handle || "")
    .trim()
    .replace(/^@+/, "");

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
  return apiPost<any[]>(
    `/campaign/applied`,
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

export const apiGetfetchMediaKit = (influencerId: string) => {
  return apiPost<any>(`/media-kit/influencer`, {
    influencerId,
  });
};


export const apiGetfetchBulkInfleuncerId = (ids: string[]) => {
  return apiPost<any>(`/${INFLUENCER_BASE}/getBulkByIds`, { ids })
}

export type ApplyToCampaignResponse = {
  message: string;
  campaignId: string;
  influencerId: string;
  applicantCount: number;
  hasApplied: number;
};

export async function apiApplyToCampaign(
  input: {
    campaignId: string;
    influencerId: string;
  },
  token?: string
) {
  return apiPost<ApplyToCampaignResponse>(
    `${APPLY_BASE}/campaign`,
    {
      campaignId: input.campaignId,
      influencerId: input.influencerId,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export type MyCampaignsBody = {
  influencerId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type MyCampaignItem = {
  _id?: string;
  campaignTitle?: string;
  description?: string;

  status?: string;
  isActive?: number;
  isDraft?: number;

  createdAt?: string;
  updatedAt?: string;
  scheduledAt?: string | null;
  startAt?: string | null;
  endAt?: string | null;

  campaignBudget?: number | null;
  productImages?: string[];

  hasApplied?: number;
  isContracted?: number;
  isAccepted?: number;
  hasMilestone?: number;

  contractId?: string | null;
  feeAmount?: number;
  contractStatus?: string | null;
  milestonesCreatedAt?: string | null;
};

export type MyCampaignsResponse = {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  campaigns: MyCampaignItem[];
};

export async function apiGetMyCampaigns(
  body: MyCampaignsBody,
  token?: string
) {
  return apiPost<MyCampaignsResponse>(
    `${CAMPAIGN_BASE}/myCampaign`,
    {
      influencerId: body.influencerId,
      search: body.search ?? "",
      page: body.page ?? 1,
      limit: body.limit ?? 10,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export type TierRow = { _id?: string; category?: string; value?: any; sortOrder?: number };
export type HashtagRow = { _id?: string; tag?: string };
export type GoalRow = { _id?: string; goal?: string };
export type AgeRow = { _id?: string; range?: string };
export type FormatRow = { _id?: string; format?: string };
export type LangRow = {
  id: string | undefined; _id?: string; code?: string; name?: string 
};

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

export type MilestoneByCampaignItem = {
  _id?: string;
  milestoneHistoryId?: string;
  milestoneId?: string;
  brandId?: string;

  campaignId?: string;
  influencerId?: string;
  influencerName?: string;

  title?: string;
  name?: string;
  description?: string;
  status?: string;

  amount?: number;
  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
};

export type MilestonesByCampaignResponse = {
  message: string;
  milestones: MilestoneByCampaignItem[];
};

export async function apiGetMilestonesByCampaign(
  campaignId: string,
  token?: string
) {
  return apiPost<MilestonesByCampaignResponse>(
    `${MILESTONE_BASE}/byCampaign`,
    { campaignId },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

async function apiGetRaw<T>(path: string, params?: AnyObj, config?: RequestConfig) {
  const client = resolveClient();
  const clean = cleanParams(params);
  const finalConfig = { params: clean, ...(config ?? {}) };

  if (typeof client?.get === "function") {
    const res = await client.get(path, finalConfig);
    return (res?.data ?? res) as T;
  }

  if (typeof client?.request === "function") {
    const res = await client.request({
      method: "GET",
      url: path,
      params: clean,
      ...(config ?? {}),
    });
    return (res?.data ?? res) as T;
  }

  throw new Error("No compatible API client found in @/lib/api (expected request/get methods).");
}

async function apiPostRaw<T>(path: string, body?: any, config?: RequestConfig) {
  const client = resolveClient();

  if (typeof libPost === "function") {
    const res = await (libPost as any)(path, body, config);
    return ((res as any)?.data ?? res) as T;
  }

  if (typeof client?.post === "function") {
    const res = await client.post(path, body, config ?? {});
    return (res?.data ?? res) as T;
  }

  if (typeof client?.request === "function") {
    const res = await client.request({
      method: "POST",
      url: path,
      data: body,
      ...(config ?? {}),
    });
    return (res?.data ?? res) as T;
  }

  throw new Error("No compatible API client found in @/lib/api (expected request/post methods).");
}

export type DeliverableInfluencer = {
  _id?: string;
  name?: string;
} | null;

export type DeliverableItem = {
  _id?: string;

  brandId?: string;
  influencerId?: string;
  campaignId?: string;

  title?: string;
  description?: string;
  url?: string[];

  milestoneId?: string;
  milestoneHistoryId?: string;
  milestoneTitle?: string;

  status?: string;
  approvedRole?: string;
  comments?: string;
  approvalId?: string;

  influencerName?: string;
  influencer?: DeliverableInfluencer;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
};

export type CreateDeliverableApprovalInput = {
  brandId: string;
  influencerId: string;
  campaignId: string;
  title: string;
  description?: string;
  url?: string[] | string;
  milestoneHistoryId: string;
};

export type CreateDeliverableApprovalEnvelope = {
  success: boolean;
  message: string;
  data: DeliverableItem;
};

export type ListDeliverablesByCampaignEnvelope = {
  success: boolean;
  message: string;
  count: number;
  data: DeliverableItem[];
};

export async function apiCreateDeliverableApproval(
  input: CreateDeliverableApprovalInput,
  token?: string
) {
  const payload = {
    brandId: input.brandId,
    influencerId: input.influencerId,
    campaignId: input.campaignId,
    title: input.title,
    description: input.description ?? "",
    url: Array.isArray(input.url)
      ? input.url
      : input.url
        ? [input.url]
        : [],
    milestoneHistoryId: input.milestoneHistoryId,
  };

  return apiPostRaw<CreateDeliverableApprovalEnvelope>(
    `${DELEVERABLE_BASE}/create`,
    payload,
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export async function apiListDeliverablesByCampaign(
  campaignId: string,
  options?: {
    status?: string;
    token?: string;
    signal?: AbortSignal;
  }
): Promise<ListDeliverablesByCampaignEnvelope> {
  const { status, token, signal } = options ?? {};

  if (!campaignId?.trim()) {
    throw new Error("campaignId is required");
  }

  return apiGetRaw<ListDeliverablesByCampaignEnvelope>(
    `${DELEVERABLE_BASE}/campaign/${campaignId}`,
    status ? { status } : undefined,
    {
      headers: {
        ...authHeader(token),
      },
      signal,
    }
  );
}

export type MilestoneByInfluencerItem = {
  _id?: string;
  milestoneHistoryId?: string;
  milestoneId?: string;
  brandId?: string;

  campaignId?: string;
  influencerId?: string;
  influencerName?: string;

  title?: string;
  name?: string;
  description?: string;
  status?: string;

  amount?: number;
  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
};

export type MilestonesByInfluencerResponse = {
  message: string;
  milestones: MilestoneByInfluencerItem[];
};

export async function apiGetMilestonesByInfluencer(
  influencerId: string,
  token?: string
) {
  return apiPost<MilestonesByInfluencerResponse>(
    `${MILESTONE_BASE}/byInfluencer`,
    { influencerId },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export type CampaignInvitationItem = {
  _id?: string;
  brandId?: string;
  influencerId?: string;
  campaignId?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;

  campaign?: any;
  brandName?: string;
  influencerName?: string;

  [key: string]: any;
};

export type GetInvitationsByInfluencerResponse = {
  status: "success" | "error";
  page: number;
  limit: number;
  total: number;
  pages: number;
  influencerId: string;
  invitations: CampaignInvitationItem[];
};

export type GetInvitationsByInfluencerParams = {
  influencerId: string;
  page?: number;
  limit?: number;
  status?: string;
  brandId?: string;
};

export async function apiGetInvitationsByInfluencer(
  params: GetInvitationsByInfluencerParams,
  token?: string
) {
  const influencerId = String(params.influencerId || "").trim();

  if (!influencerId) {
    throw new Error("influencerId is required");
  }

  return apiGet<GetInvitationsByInfluencerResponse>(
    `${CAMPAIGN_INVITATION_BASE}/influencer/${influencerId}`,
    {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      status: params.status,
      brandId: params.brandId,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export type GetAllInvitationsByInfluencerResponse = {
  status: "success" | "error";
  total: number;
  influencerId: string;
  filter?: {
    status?: string;
  };
  invitations: CampaignInvitationItem[];
};

export type GetAllInvitationsByInfluencerParams = {
  influencerId: string;
  status?: string;
};

export async function apiGetAllInvitationsByInfluencer(
  params: GetAllInvitationsByInfluencerParams,
  token?: string
) {
  const influencerId = String(params.influencerId || "").trim();

  if (!influencerId) {
    throw new Error("influencerId is required");
  }

  return apiGet<GetAllInvitationsByInfluencerResponse>(
    `${CAMPAIGN_INVITATION_BASE}/influencer/${influencerId}/all`,
    {
      status: params.status,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export type UpdateInvitationStatusInput = {
  campaignId: string;
  invitationId: string;
  status: "sent" | "accepted" | "reject" | "failed";
  failReason?: string;
};

export type UpdateInvitationStatusResponse = {
  status: "success" | "error";
  message: string;
  invitation?: CampaignInvitationItem;
};

export async function apiUpdateInvitationStatus(
  input: UpdateInvitationStatusInput,
  token?: string
) {
  return apiPost<UpdateInvitationStatusResponse>(
    `${CAMPAIGN_INVITATION_BASE}/update-status`,
    {
      campaignId: input.campaignId,
      invitationId: input.invitationId,
      status: input.status,
      failReason: input.failReason,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export type GetAcceptedAdminCreatedCampaignsParams = {
  influencerId?: string;
  brandId?: string;
  campaignId?: string;
  page?: number;
  limit?: number;
  includeCampaign?: 0 | 1;
  includeNames?: 0 | 1;
  includeFullCampaignDetails?: 0 | 1;
};

export type AcceptedAdminCreatedCampaignItem = CampaignInvitationItem & {
  campaignDetails?: any | null;
};

export type GetAcceptedAdminCreatedCampaignsResponse = {
  status: "success" | "error";
  page: number;
  limit: number;
  total: number;
  pages: number;
  filters?: {
    status?: string;
    createdByAdmin?: boolean;
    influencerId?: string;
    brandId?: string;
    campaignId?: string;
  };
  invitations: AcceptedAdminCreatedCampaignItem[];
};

export async function apiGetAcceptedAdminCreatedCampaigns(
  params: GetAcceptedAdminCreatedCampaignsParams = {},
  token?: string
) {
  return apiGet<GetAcceptedAdminCreatedCampaignsResponse>(
    `${CAMPAIGN_INVITATION_BASE}/accepted-admin-created-campaigns`,
    {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      influencerId: params.influencerId,
      brandId: params.brandId,
      campaignId: params.campaignId,
      includeCampaign: params.includeCampaign ?? 1,
      includeNames: params.includeNames ?? 1,
      includeFullCampaignDetails: params.includeFullCampaignDetails ?? 1,
    },
    {
      headers: {
        ...authHeader(token),
      },
    }
  );
}

export async function apiUploadInfluencerSignature(payload: FormData) {
  return apiPost(`${CONTRACT_BASE}/upload-influencer`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function apiGetInfluencerSignature(influencerId: string) {
  return apiGet(`${CONTRACT_BASE}/signature-influencer/${influencerId}`);
}