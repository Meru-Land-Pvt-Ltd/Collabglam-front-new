import { getApiErrorMessage as getInfluencerApiErrorMessage } from "@/app/influencer/services/influencerApi";
import { getApiErrorMessage as getBrandApiErrorMessage } from "@/app/brand/services/brandApi";
export function friendlyInfluencerError(err: unknown, influencerId?: string): string {
  const status = (err as any)?.response?.status ?? (err as any)?.status;
  const raw = getInfluencerApiErrorMessage(err, "");
  // ← Add this block at the top:
  const isNetworkDown =
    !status &&
    (/network error|err_connection_refused|failed to fetch|net::/i.test(raw) ||
      (err as any)?.code === "ERR_NETWORK" ||
      (err as any)?.message === "Network Error");

  if (isNetworkDown)
    return "Oops, something went wrong. Please check your connection and try again.";

  if (!influencerId || /influencer.*not found|sign in/i.test(raw))
    return "We couldn't find your account. Please log out and sign in again.";
  if (status === 403 || /forbidden/i.test(raw))
    return "You don't have access to this page. Try logging out and signing back in.";
  if (status === 401 || /unauthorized/i.test(raw))
    return "Your session has expired. Please sign in again.";
  if (status === 404)
    return "No campaigns could be found for your account.";
  if (status >= 500)
    return "Something went wrong on our end. Please try again shortly.";
  if (typeof window !== "undefined" && !navigator.onLine)
    return "You appear to be offline. Check your connection and try again.";
  return raw || "Oops, something went wrong. Please try again.";
}

export function friendlyBrandError(err: unknown, brandId?: string): string {
  const status = (err as any)?.response?.status ?? (err as any)?.status;
  const raw = getBrandApiErrorMessage(err, "");

  // Network / connection down — no HTTP status at all
  const isNetworkDown =
    !status &&
    (/network error|err_connection_refused|failed to fetch|net::/i.test(raw) ||
      (err as any)?.code === "ERR_NETWORK" ||
      (err as any)?.message === "Network Error");

  if (isNetworkDown)
    return "Oops, something went wrong. Please check your connection and try again.";

  // Missing session
  if (!brandId)
    return "Your session looks incomplete. Please log out and sign in again.";

  if (status === 403 || /forbidden/i.test(raw))
    return "You don't have permission to do this. Try logging out and signing back in.";

  if (status === 401 || /unauthorized/i.test(raw))
    return "Your session has expired. Please sign in again.";

  if (status === 404 || /not found/i.test(raw))
    return "We couldn't find what you're looking for. It may have been moved or deleted.";

  if (status === 429 || /too many|rate.?limit/i.test(raw))
    return "Too many requests. Please wait a moment and try again.";

  if (status >= 500)
    return "Something went wrong on our end. Please try again shortly.";

  if (typeof window !== "undefined" && !navigator.onLine)
    return "You appear to be offline. Check your connection and try again.";

  return raw || "Oops, something went wrong. Please try again.";
}

export function isAuthError(msg: string): boolean {
  return /log out|sign in|session|permission/i.test(msg);
}
