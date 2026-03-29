"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/buttonComp";
import { DateTimePanel } from "@/components/ui/date";
import { Spinner } from "@/components/ui/spinner";
import { InfoIcon } from "@phosphor-icons/react";
import { cn, clamp } from "./create-campaign.utils";

/* ============================================================================
   ✅ Timezone / scheduling helpers (kept identical behavior)
============================================================================ */
const __dtfCache = new Map<string, Intl.DateTimeFormat>();

function getDTF(timeZone: string) {
  const key = `en-US|${timeZone}`;
  let dtf = __dtfCache.get(key);
  if (!dtf) { 
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    __dtfCache.set(key, dtf);
  }
  return dtf;
}

function isValidIanaTimeZone(tz?: string) {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Returns offset in ms for `timeZone` at `date` instant. */
function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = getDTF(timeZone).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return asUTC - date.getTime();
}

function buildZonedDate(dateStr: string, timeStr: string, timeZone: string) {
  if (!dateStr) return null;

  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
  if (!y || !m || !d) return null;

  const utcGuess = new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, 0, 0));
  const offset = getTimeZoneOffsetMs(timeZone, utcGuess);
  return new Date(utcGuess.getTime() - offset);
}

const TZ_ALIASES: Record<string, string> = {
  London: "Europe/London",
  UK: "Europe/London",
  "New York": "America/New_York",
  "Los Angeles": "America/Los_Angeles",
  IST: "Asia/Kolkata",
};

export function normalizeTimeZone(tz: string | undefined, fallback: string) {
  const cleaned = String(tz || "").trim();
  const mapped = TZ_ALIASES[cleaned] || cleaned;
  return isValidIanaTimeZone(mapped) ? mapped : fallback;
}

type TZPattern = "date" | "time" | "datetime";

function formatInTZ(dt: Date, timeZone: string, pattern: TZPattern = "datetime") {
  const make = (useTZ: boolean) => {
    const base: Intl.DateTimeFormatOptions = useTZ ? { timeZone } : {};

    if (pattern === "date") {
      return new Intl.DateTimeFormat("en-US", {
        ...base,
        weekday: "short",
        month: "long",
        day: "numeric",
      }).format(dt);
    }

    if (pattern === "time") {
      return new Intl.DateTimeFormat("en-US", {
        ...base,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(dt);
    }

    return new Intl.DateTimeFormat("en-US", {
      ...base,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dt);
  };

  try {
    return make(true);
  } catch {
    return make(false);
  }
}

/* ============================================================================
   ✅ Overlay
============================================================================ */
export function ScheduleCampaignOverlay(props: {
  open: boolean;
  isMobile: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;

  date: string;
  time: string;
  baseTimeZone: string;

  countries: Array<{
    id: string;
    label: string;
    timezones: Array<{
      timezone: string;
      isValid?: boolean;
      offsetMinutes?: number;
      offsetMinutesFromCurrent?: number;
      nowLocal?: string;
    }>;
  }>;

  tzLoading?: boolean;
  tzError?: string;

  onClose: () => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onConfirm: (isoString: string) => void;
}) {
  const {
    open,
    isMobile,
    anchorRef,
    date,
    time,
    baseTimeZone,
    countries,
    tzLoading,
    tzError,
    onClose,
    onDateChange,
    onTimeChange,
    onConfirm,
  } = props;

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const titleId = React.useId();
  const descId = React.useId();

  const dt = React.useMemo(() => buildZonedDate(date, time, baseTimeZone), [date, time, baseTimeZone]);
  const canConfirm = !!dt && dt.getTime() > Date.now();

  const [q, setQ] = React.useState("");
  const filteredCountries = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((c) => c.label.toLowerCase().includes(query) || c.id.toLowerCase().includes(query));
  }, [countries, q]);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    let prevOverflow: string | null = null;
    if (isMobile) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      if (isMobile && prevOverflow !== null) document.body.style.overflow = prevOverflow;
    };
  }, [open, isMobile, onClose]);

  React.useLayoutEffect(() => {
    if (!open || isMobile) return;

    const MARGIN = 12;
    const FALLBACK_BOTTOM_BAR_HEIGHT = 64;

    const place = () => {
      const p = panelRef.current;
      if (!p) return;

      const pr = p.getBoundingClientRect();
      const left = Math.max(MARGIN, window.innerWidth - pr.width - MARGIN);

      const a = anchorRef.current;
      if (a) {
        const ar = a.getBoundingClientRect();
        let top = ar.top - pr.height - MARGIN;
        top = clamp(top, MARGIN, window.innerHeight - pr.height - MARGIN);
        setPos({ top, left });
        return;
      }

      const top = clamp(
        window.innerHeight - pr.height - (FALLBACK_BOTTOM_BAR_HEIGHT + MARGIN),
        MARGIN,
        window.innerHeight - pr.height - MARGIN
      );
      setPos({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, isMobile, anchorRef]);

  if (!open) return null;

  const previewText = dt ? formatInTZ(dt, baseTimeZone) : "";
  const confirmLabel = dt ? `Confirm • ${previewText}` : "Confirm Schedule";

  const content = (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="Close schedule"
        className={cn("absolute inset-0", isMobile ? "bg-black/45 backdrop-blur-[2px]" : "bg-black/20 backdrop-blur-[2px]")}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white border border-neutral-200 shadow-2xl overflow-hidden",
          "flex flex-col",
          isMobile ? "fixed inset-x-0 bottom-0 w-full max-h-[92dvh] rounded-t-2xl" : "fixed w-[92vw] max-w-[725px] max-h-[92dvh] rounded-2xl"
        )}
        style={isMobile ? undefined : { top: pos.top, left: pos.left }}
      >
        {isMobile ? (
          <div className="flex justify-center pt-3 shrink-0">
            <div className="h-1 w-10 rounded-full bg-neutral-200" />
          </div>
        ) : null}

        <div className={cn("flex-1 min-h-0 overflow-y-auto")}>
          <div className={cn("grid", "grid-cols-1 lg:grid-cols-[max-content_320px] lg:justify-start")}>
            <div className="p-5 shrink-0">
              <DateTimePanel
                className="[&_[role=dialog]]:border-0 [&_[role=dialog]]:shadow-none"
                value={date}
                onValueChange={onDateChange}
                outputFormat="iso"
                withTime
                timeValue={time}
                onTimeChange={onTimeChange}
                timezoneLabel={baseTimeZone}
              />
            </div>

            <div className={cn("border-l border-neutral-100", "lg:border-l", "border-l-0 border-t lg:border-t-0")}>
              <div className="h-full px-5 pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-[13px] font-medium text-neutral-900">Selected Country</div>
                    <InfoIcon />
                  </div>
                </div>

                {tzError ? (
                  <div className="mt-3 rounded-m border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{tzError}</div>
                ) : null}

                <div className={cn("mt-4 pr-1 overflow-auto", isMobile ? "max-h-[44dvh]" : "max-h-[440px]")}>
                  {tzLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-m border border-neutral-200 bg-white px-[1.125rem] py-5">
                          <div className="h-4 w-28 rounded bg-neutral-200" />
                          <div className="mt-3 h-9 w-40 rounded bg-neutral-100" />
                        </div>
                      ))}
                    </div>
                  ) : countries.length === 0 ? (
                    <div className="rounded-m border border-neutral-100 bg-neutral-50 p-4 text-[12px] text-neutral-600">
                      Select countries in <span className="font-medium">Target country</span> to preview local times here.
                    </div>
                  ) : filteredCountries.length === 0 ? (
                    <div className="rounded-m border border-neutral-100 bg-neutral-50 p-4 text-[12px] text-neutral-600">
                      No countries match “{q}”.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pb-5">
                      {filteredCountries.map((c) => {
                        const tz = (c.timezones?.[0]?.timezone || baseTimeZone) as string;

                        const rightTop = dt ? formatInTZ(dt, tz, "date") : "—";
                        const rightBottom = dt ? formatInTZ(dt, tz, "time") : "—";

                        return (
                          <div key={c.id} className="flex items-center justify-between self-stretch rounded-m border border-neutral-200 bg-white px-[1.125rem] py-5">
                            <div className="text-[14px] font-medium leading-[20px] tracking-[0] text-neutral-900">{c.label}</div>

                            <div className="flex flex-col items-end gap-[0.12rem] text-right leading-[20px]">
                              <div className="text-[14px] font-normal leading-[20px] tracking-[0] text-[#969696]">{rightTop}</div>
                              <div className="text-[14px] font-semibold leading-[20px] tracking-[0] text-[#969696]">{rightBottom}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("shrink-0 flex items-center justify-between gap-3 px-5 py-2 border-t border-[#D6D6D6] bg-white")}>
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="shadow-none">
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (!dt) return;
                onConfirm(dt.toISOString());
              }}
              disabled={!canConfirm}
              className={cn(!canConfirm ? "opacity-60" : "")}
            >
              {tzLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4 animate-spin" />
                  Loading…
                </span>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
