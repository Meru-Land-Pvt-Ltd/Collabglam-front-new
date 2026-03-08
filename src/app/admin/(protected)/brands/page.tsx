"use client";

import React, { useState, useEffect } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { Outfit } from "next/font/google";

import {
  HiOutlineRefresh,
  HiOutlineEye,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiOutlinePlus,
  HiPencil,
  HiDotsVertical,
} from "react-icons/hi";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

// Domain types
interface Subscription {
  planName: string;
  expiresAt: string; // kept (still used by backend / subscription logic if needed)
}

export interface Brand {
  _id: string;
  name: string;
  email: string;
  callingcode?: string;
  phone?: string;

  // ✅ show this instead of expiry
  createdAt: string;

  subscriptionExpired: boolean;
  subscription: Subscription;
}

interface GetListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  brands: Brand[];
}

const SORTABLE_FIELDS: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  planName: "Plan",
  createdAt: "Created At",
  subscriptionExpired: "Status",
};

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const AdminBrandsPage: NextPage = () => {
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [limit] = useState<number>(10); // used only for the "Showing x–y" line below (kept as-is)
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search, sortBy, sortOrder };
      const response = await post<GetListResponse>("/admin/brand/getlist", params);
      setBrands(response.brands);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.limit);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, sortBy, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const Th = ({
    field,
    label,
    align = "left",
  }: {
    field: string;
    label: string;
    align?: "left" | "center" | "right";
  }) => (
    <TableHead
      onClick={() => toggleSort(field)}
      className={`cursor-pointer py-4 text-xs font-extrabold text-black/60 ${
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
      }`}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "center"
            ? "justify-center"
            : align === "right"
            ? "justify-end"
            : "justify-start"
        }`}
      >
        {label}
        {sortBy === field &&
          (sortOrder === "asc" ? <HiChevronUp /> : <HiChevronDown />)}
      </div>
    </TableHead>
  );

  return (
    <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827] leading-tight">
              Brands Administration
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-black/55">
              Manage brand partners, subscriptions, and account status.
            </p>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <Card className="border border-black/10 bg-white rounded-2xl">
          <div className="p-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/55" />
              <Input
                placeholder="Search by name, email, plan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-full border-black/10 bg-white pl-11 text-[13px] font-semibold placeholder:text-black/40 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <Button
              variant="outline"
              onClick={fetchBrands}
              disabled={loading}
              className="h-11 rounded-full border-black/10 bg-white px-4 text-[13px] font-extrabold text-black/80 hover:bg-black hover:text-white hover:border-black"
            >
              <HiOutlineRefresh className={`mr-2 h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Table Card */}
        <Card className="border border-black/10 bg-white rounded-2xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <Th field="name" label="Name" align="left" />
                  <Th field="email" label="Email" align="center" />
                  <Th field="phone" label="Phone" align="center" />
                  <Th field="planName" label="Plan" align="center" />
                  <Th field="expiresAt" label="Expires" align="center" />
                  <Th field="subscriptionExpired" label="Status" align="center" />
                  <TableHead className="py-4 text-xs font-extrabold text-black/60 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-b border-black/5">
                      {Array(7)
                        .fill(0)
                        .map((_, j) => (
                          <TableCell key={j} className="py-4">
                            <div className="h-4 w-full max-w-[220px] bg-black/10 rounded animate-pulse" />
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
                ) : brands.length === 0 ? (
                  <TableRow className="border-b border-black/5">
                    <TableCell colSpan={7} className="text-center text-black/55 py-10 text-sm font-semibold">
                      No brands match the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((b) => {
                    const initials = (b.name || "—").trim().slice(0, 1).toUpperCase();

                    return (
                      <TableRow
                        key={b._id}
                        className="border-b border-black/5 hover:bg-black/[0.02]"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div className="h-9 w-9 rounded-full border border-black/10 bg-black/[0.06] flex items-center justify-center text-sm font-extrabold text-[#111827]">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-extrabold text-[#111827] truncate">
                                {b.name}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                          {b.email}
                        </TableCell>

                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                          {b.callingcode ? `${b.callingcode} ${b.phone}` : b.phone}
                        </TableCell>

                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                          {b.subscription.planName}
                        </TableCell>

                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                          {new Date(b.subscription.expiresAt).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="py-4 text-center">
                          {b.subscriptionExpired ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.06] text-black/70 px-3 py-1 text-xs font-extrabold border border-black/10">
                              <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
                              Expired
                            </span>
                          ) : (
                            <span className="text-[13px] font-extrabold text-[#111827]">
                              Active
                            </span>
                          )}
                        </TableCell>

                        {/* Actions dropdown */}
                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg text-black/70 hover:bg-black/[0.04] focus:outline-none"
                                aria-label="Actions"
                              >
                                <HiDotsVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="min-w-[200px] rounded-xl border border-black/10 bg-white text-black shadow-lg"
                            >
                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/view?brandId=${b._id}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiOutlineEye className="h-4 w-4" />
                                    View details
                                  </span>
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/create-campaign?brandId=${b._id}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiOutlinePlus className="h-4 w-4" />
                                    Create Campaign
                                  </span>
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/review-campaigns?brandId=${b._id}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiPencil className="h-4 w-4" />
                                    Review Campaigns
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer (logic unchanged) */}
          {!loading && !error && brands.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-t border-black/5 bg-white">
              <div className="text-xs font-extrabold text-black/60">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:bg-black hover:text-white hover:border-black"
                >
                  <HiChevronLeft />
                </Button>

                <div className="text-xs font-extrabold text-black/60">
                  Page {page} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:bg-black hover:text-white hover:border-black"
                >
                  <HiChevronRight />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminBrandsPage;