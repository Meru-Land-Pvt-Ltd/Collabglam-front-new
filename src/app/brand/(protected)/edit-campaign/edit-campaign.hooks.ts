"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGetSubcategoriesByCategoryId,
  apiListAgeRanges,
  apiListContentFormats,
  apiListContentLanguages,
  apiListCountries,
  apiListInfluencerTiers,
  apiListPreferredHashtags,
  apiListProductServiceGoals,
  apiSearchCategories,
  AgeRow,
  CountryRow,
  FormatRow,
  GoalRow,
  HashtagRow,
  LangRow,
  ListQuery,
  TierRow,
} from "../../services/brandApi";
import { countryKey, idOf, uniqByValue, Option, prettyTierValue } from "./edit-campaign.utils";

/* =============================================================================
   ✅ Cached list fetch + debounced search
============================================================================= */
const __listDataCache = new Map<string, any>();
const __listInFlight = new Map<string, Promise<any>>();

function cacheKey(fetcher: any, params: any) {
  const base = fetcher?.cacheKey ?? fetcher?.name ?? "fetcher";
  return `${base}:${JSON.stringify(params)}`;
}

export function useGetAllList<TItem, TMapped>(args: {
  fetcher: (params: ListQuery) => Promise<TItem[]>;
  initialValue: TMapped;
  mapFn: (items: TItem[]) => TMapped;
  limit?: number;
  debounceMs?: number;
  enabled?: boolean;
}) {
  const { fetcher, initialValue, mapFn, limit = 500, debounceMs = 250, enabled = true } = args;

  const initialRef = useRef(initialValue);
  const mapRef = useRef(mapFn);
  useEffect(() => {
    mapRef.current = mapFn;
  }, [mapFn]);

  const [data, setData] = useState<TMapped>(initialValue);
  const [rawItems, setRawItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const timerRef = useRef<number | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const mySeq = ++seqRef.current;
    let mounted = true;

    const run = async () => {
      setLoading(true);

      const trimmed = search.trim() || undefined;
      const key = cacheKey(fetcher, { limit, search: trimmed });

      try {
        let items: TItem[];

        if (__listDataCache.has(key)) {
          items = __listDataCache.get(key);
        } else {
          let p = __listInFlight.get(key);
          if (!p) {
            p = fetcher({ limit, search: trimmed });
            __listInFlight.set(key, p);
          }
          items = await p;
          __listDataCache.set(key, items);
          __listInFlight.delete(key);
        }

        if (!mounted || mySeq !== seqRef.current) return;

        setRawItems(items ?? []);
        setData(mapRef.current(items ?? []));
      } catch {
        __listInFlight.delete(key);
        if (mounted) setData(initialRef.current);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(run, debounceMs);

    return () => {
      mounted = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [enabled, fetcher, limit, search, debounceMs]);

  return { data, rawItems, loading, search, setSearch };
}

/* =============================================================================
   ✅ Lists (option.value = backend id)
============================================================================= */
export function useCampaignLists(enabled: boolean) {
  const countriesRaw = useGetAllList<CountryRow, any[]>({
    fetcher: apiListCountries,
    initialValue: [],
    mapFn: (items) => items ?? [],
    enabled,
  });

  const influencerTiersApi = useGetAllList<TierRow, Option[]>({
    fetcher: apiListInfluencerTiers,
    initialValue: [],
    enabled,
    mapFn: (items) =>
      uniqByValue(
        (items ?? [])
          .map((x: any) => {
            const id = idOf(x);
            const category = String(x?.category ?? "").trim();
            const range = prettyTierValue(x?.value);
            const label = category && range ? `${category} (${range})` : category || range;
            return id && label ? { label, value: id } : null;
          })
          .filter(Boolean) as Option[]
      ),
  });

  const preferredHashtagsApi = useGetAllList<HashtagRow, Option[]>({
    fetcher: apiListPreferredHashtags,
    initialValue: [],
    enabled,
    mapFn: (items) =>
      uniqByValue(
        (items ?? [])
          .map((x: any) => {
            const id = idOf(x);
            const label = String(x?.tag ?? "").trim();
            return id && label ? { label, value: id } : null;
          })
          .filter(Boolean) as Option[]
      ),
  });

  const productServiceGoalsApi = useGetAllList<GoalRow, Option[]>({
    fetcher: apiListProductServiceGoals,
    initialValue: [],
    enabled,
    mapFn: (items) =>
      uniqByValue(
        (items ?? [])
          .map((x: any) => {
            const id = idOf(x);
            const label = String(x?.goal ?? "").trim();
            return id && label ? { label, value: id } : null;
          })
          .filter(Boolean) as Option[]
      ),
  });

  const ageRangesApi = useGetAllList<AgeRow, Option[]>({
    fetcher: apiListAgeRanges,
    initialValue: [],
    enabled,
    mapFn: (items) =>
      uniqByValue(
        (items ?? [])
          .map((x: any) => {
            const id = idOf(x);
            const label = String(x?.range ?? "").trim();
            return id && label ? { label, value: id } : null;
          })
          .filter(Boolean) as Option[]
      ),
  });

  const contentFormatsApi = useGetAllList<FormatRow, Option[]>({
    fetcher: apiListContentFormats,
    initialValue: [],
    enabled,
    mapFn: (items) =>
      uniqByValue(
        (items ?? [])
          .map((x: any) => {
            const id = idOf(x);
            const label = String(x?.format ?? "").trim();
            return id && label ? { label, value: id } : null;
          })
          .filter(Boolean) as Option[]
      ),
  });

  const contentLanguagesApi = useGetAllList<LangRow, Option[]>({
    fetcher: apiListContentLanguages,
    initialValue: [],
    enabled,
    mapFn: (items) =>
      uniqByValue(
        (items ?? [])
          .map((x: any) => {
            const id = idOf(x);
            const label = String(x?.name ?? "").trim();
            return id && label ? { label, value: id } : null;
          })
          .filter(Boolean) as Option[]
      ),
  });

  const countriesByName: Option[] = useMemo(() => {
    console.log(countriesRaw);
    
    return uniqByValue(
      (countriesRaw.data ?? [])
        .map((c: any) => {
          const name = String(c?.countryName ?? "").trim();
          const flag = String(c?.flag ?? "").trim();
          const id = idOf(c) || String(c?.countryCode ?? "").trim().toLowerCase();
          return name && id ? { label: `${flag ? flag + " " : ""}${name}`, value: id } : null;
        })
        .filter(Boolean) as Option[]
    );
  }, [countriesRaw.data]);

  const countriesByCode: Option[] = useMemo(() => {
    return uniqByValue(
      (countriesRaw.data ?? [])
        .map((c: any) => {
          const name = String(c?.countryName ?? "").trim();
          const flag = String(c?.flag ?? "").trim();
          const id = countryKey(c);
          return name && id ? { label: `${flag ? flag + " " : ""}${name}`, value: id } : null;
        })
        .filter(Boolean) as Option[]
    );
  }, [countriesRaw.data]);

  return {
    countriesByName,
    countriesByCode,
    influencerTiers: influencerTiersApi.data,
    preferredHashtags: preferredHashtagsApi.data,
    productServiceGoals: productServiceGoalsApi.data,
    ageRanges: ageRangesApi.data,
    contentFormats: contentFormatsApi.data,
    contentLanguages: contentLanguagesApi.data,
    raw: {
      countries: countriesRaw.rawItems ?? [],
      influencerTiers: influencerTiersApi.rawItems ?? [],
    },
    search: {
      countries: { value: countriesRaw.search, onChange: countriesRaw.setSearch },
      influencerTiers: { value: influencerTiersApi.search, onChange: influencerTiersApi.setSearch },
      preferredHashtags: { value: preferredHashtagsApi.search, onChange: preferredHashtagsApi.setSearch },
      productServiceGoals: { value: productServiceGoalsApi.search, onChange: productServiceGoalsApi.setSearch },
      ageRanges: { value: ageRangesApi.search, onChange: ageRangesApi.setSearch },
      contentFormats: { value: contentFormatsApi.search, onChange: contentFormatsApi.setSearch },
      contentLanguages: { value: contentLanguagesApi.search, onChange: contentLanguagesApi.setSearch },
    },
  };
}

/* =============================================================================
   ✅ Category picker (cached search + cached subcats)
============================================================================= */
type CatOpt = { id: string; name: string };
type SubOpt = { id: string; name: string };

const __catSearchCache = new Map<string, CatOpt[]>();
const __catInFlight = new Map<string, Promise<CatOpt[]>>();
const __subcatCache = new Map<string, SubOpt[]>();
const __subInFlight = new Map<string, Promise<SubOpt[]>>();

export function useCategoryPicker(params?: { debounceMs?: number; enabled?: boolean }) {
  const debounceMs = params?.debounceMs ?? 250;
  const enabled = params?.enabled ?? true;

  const [search, setSearch] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [matches, setMatches] = useState<CatOpt[]>([]);
  const [selected, setSelected] = useState<CatOpt | null>(null);

  const [subLoading, setSubLoading] = useState(false);
  const [subs, setSubs] = useState<SubOpt[]>([]);
  const [subSearch, setSubSearch] = useState("");

  useEffect(() => setSubSearch(""), [selected?.id]);

  const tRef = useRef<number | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const q = (search ?? "").trim().toLowerCase();
    const key = q;

    if (tRef.current) window.clearTimeout(tRef.current);

    const mySeq = ++seqRef.current;
    let active = true;

    tRef.current = window.setTimeout(async () => {
      setCatLoading(true);
      try {
        if (__catSearchCache.has(key)) {
          if (!active || mySeq !== seqRef.current) return;
          setMatches(__catSearchCache.get(key)!);
          return;
        }

        let p = __catInFlight.get(key);
        if (!p) {
          p = (async () => {
            const rows = await apiSearchCategories({ search: q, page: 1, limit: 50 });
            const seen = new Set<string>();
            const cats: CatOpt[] = [];
            for (const r of rows ?? []) {
              const c = (r as any)?.category ?? r;
              const id = String(c?.id ?? c?._id ?? "").trim();
              const name = String(c?.name ?? "").trim();
              if (!id || !name) continue;
              if (seen.has(id)) continue;
              seen.add(id);
              cats.push({ id, name });
            }
            return cats;
          })();
          __catInFlight.set(key, p);
        }

        const cats = await p;
        __catSearchCache.set(key, cats);
        __catInFlight.delete(key);

        if (!active || mySeq !== seqRef.current) return;
        setMatches(cats);
      } catch {
        __catInFlight.delete(key);
        if (!active || mySeq !== seqRef.current) return;
        setMatches([]);
      } finally {
        if (!active || mySeq !== seqRef.current) return;
        setCatLoading(false);
      }
    }, debounceMs);

    return () => {
      active = false;
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [search, debounceMs, enabled]);

  const categoryOptions: Option[] = useMemo(() => {
    const base = (matches ?? []).map((c) => ({ label: c.name, value: c.id }));
    const withSelected = selected ? [{ label: selected.name, value: selected.id }, ...base] : base;
    return uniqByValue(withSelected);
  }, [matches, selected]);

  const hydrateSelectedCategory = useCallback((cat: CatOpt | null) => setSelected(cat), []);

  const selectCategoryId = useCallback(
    (id: string) => {
      const opt = categoryOptions.find((o) => o.value === id);
      if (!opt) return;
      setSelected({ id: opt.value, name: opt.label });
    },
    [categoryOptions]
  );

  useEffect(() => {
    if (!enabled) return;

    const categoryId = selected?.id;
    if (!categoryId) {
      setSubs([]);
      setSubLoading(false);
      return;
    }

    let active = true;

    (async () => {
      setSubLoading(true);
      try {
        if (__subcatCache.has(categoryId)) {
          if (!active) return;
          setSubs(__subcatCache.get(categoryId)!);
          return;
        }

        let p = __subInFlight.get(categoryId);
        if (!p) {
          p = (async () => {
            const res = await apiGetSubcategoriesByCategoryId(categoryId);
            const subcats = (res?.subcategories ?? []).map((s: any) => ({
              id: String(s?._id ?? "").trim(),
              name: String(s?.name ?? "").trim(),
            }));
            return subcats.filter((x: any) => x.id && x.name);
          })();
          __subInFlight.set(categoryId, p);
        }

        const out = await p;
        __subcatCache.set(categoryId, out);
        __subInFlight.delete(categoryId);

        if (!active) return;
        setSubs(out);
      } catch {
        __subInFlight.delete(categoryId);
        if (!active) return;
        setSubs([]);
      } finally {
        if (!active) return;
        setSubLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selected?.id, enabled]);

  const subcategoryOptions: Option[] = useMemo(() => (subs ?? []).map((s) => ({ label: s.name, value: s.id })), [subs]);

  return {
    search,
    setSearch,
    subSearch,
    setSubSearch,
    catLoading,
    categoryOptions,
    selectedCategory: selected,
    selectCategoryId,
    hydrateSelectedCategory,
    subLoading,
    subcategoryOptions,
  };
}

/* =============================================================================
   ✅ Layout helpers (sidebar-aware)
============================================================================= */
export function useViewportWidth(fallback = 1440) {
  const [w, setW] = useState<number>(() => (typeof window !== "undefined" ? window.innerWidth : fallback));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

export function useContentWidth(sidebarOffsetPx: number) {
  const vw = useViewportWidth();
  return Math.max(0, vw - (sidebarOffsetPx || 0));
}

export function useResponsivePreviewWidth(params: {
  desiredPx: number;
  sidebarOffsetPx: number;
  enabled: boolean;
  maxRatio?: number;
  minLeftPx?: number;
}) {
  const { desiredPx, sidebarOffsetPx, enabled, maxRatio = 0.42, minLeftPx = 360 } = params;
  const vw = useViewportWidth();
  const contentW = useContentWidth(sidebarOffsetPx);
  const isLg = vw >= 1024;

  return useMemo(() => {
    if (!enabled || !isLg) return desiredPx;
    const byRatio = Math.floor(contentW * maxRatio);
    const byLeft = Math.max(0, contentW - minLeftPx);
    return Math.max(0, Math.min(desiredPx, byRatio, byLeft));
  }, [enabled, isLg, desiredPx, contentW, maxRatio, minLeftPx]);
}

export function useSidebarOffsetPx() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

    const findSidebarEl = () =>
      document.querySelector<HTMLElement>("[data-cg-sidebar]") ||
      document.querySelector<HTMLElement>("#cg-sidebar") ||
      document.querySelector<HTMLElement>("[data-sidebar]") ||
      document.querySelector<HTMLElement>("aside");

    let observedEl: HTMLElement | null = null;
    let raf = 0;

    const recomputeNow = (ro: ResizeObserver) => {
      if (!isDesktop()) return setOffset(0);

      const stillConnected = observedEl && document.body.contains(observedEl);
      const el = stillConnected ? observedEl : findSidebarEl();

      if (el !== observedEl) {
        if (observedEl) ro.unobserve(observedEl);
        observedEl = el;
        if (observedEl) ro.observe(observedEl);
      }

      if (!observedEl) return setOffset(0);

      const w = Math.round(observedEl.getBoundingClientRect().width || 0);
      setOffset(Number.isFinite(w) ? w : 0);
    };

    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        recomputeNow(ro);
      });
    });

    recomputeNow(ro);

    const mo = new MutationObserver(() => recomputeNow(ro));
    mo.observe(document.body, { childList: true, subtree: true });

    const onResize = () => recomputeNow(ro);
    window.addEventListener("resize", onResize);

    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => recomputeNow(ro);
    // @ts-ignore
    mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq);

    return () => {
      window.removeEventListener("resize", onResize);
      mo.disconnect();
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
      // @ts-ignore
      mq.removeEventListener ? mq.removeEventListener("change", onMq) : mq.removeListener(onMq);
    };
  }, []);

  return offset;
}
