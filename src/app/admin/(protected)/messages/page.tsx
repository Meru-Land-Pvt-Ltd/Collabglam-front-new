"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { get, post } from "@/lib/api";
import {
  HiOutlineRefresh,
  HiOutlineEye,
  HiChevronLeft,
  HiChevronRight,
  HiChevronUp,
  HiChevronDown,
} from "react-icons/hi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Message {
  messageId: string;
  conversationId: string;
  brandName: string;
  influencerName: string;
  senderType: "Brand" | "Influencer";
  content: string;
  timestamp: string;
}

type SortKey =
  | "brandName"
  | "influencerName"
  | "senderType"
  | "timestamp"
  | "content";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [influencerFilter, setInfluencerFilter] = useState("All");
  const [directionFilter, setDirectionFilter] = useState<"All" | "Brand" | "Influencer">("All");

  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [influencerOptions, setInfluencerOptions] = useState<string[]>([]);

  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortAsc, setSortAsc] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(h);
  }, [search]);

  // Fetch filters & messages
  useEffect(() => {
    fetchFilters();
    fetchMessages();
  }, []);

  const fetchFilters = async () => {
    setLoadingFilters(true);
    try {
      // expect { brands: string[], influencers: string[] }
      const { brands, influencers } = await get<{
        brands: string[];
        influencers: string[];
      }>("/message/getFilters");
      setBrandOptions(["All", ...brands.sort()]);
      setInfluencerOptions(["All", ...influencers.sort()]);
    } catch (e) {
      console.error("Failed to load message filters", e);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await post<Message[]>("/message/getall");
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  // Filter, search, sort
  const processed = useMemo(() => {
    let data = messages;

    if (brandFilter !== "All") {
      data = data.filter((m) => m.brandName === brandFilter);
    }
    if (influencerFilter !== "All") {
      data = data.filter((m) => m.influencerName === influencerFilter);
    }
    if (directionFilter !== "All") {
      data = data.filter((m) => m.senderType === directionFilter);
    }
    if (debouncedSearch) {
      const t = debouncedSearch.toLowerCase();
      data = data.filter(
        (m) =>
          m.content.toLowerCase().includes(t) ||
          m.brandName.toLowerCase().includes(t) ||
          m.influencerName.toLowerCase().includes(t)
      );
    }

    return data.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortKey) {
        case "timestamp":
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        default:
          aVal = (a as any)[sortKey];
          bVal = (b as any)[sortKey];
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [
    messages,
    brandFilter,
    influencerFilter,
    directionFilter,
    debouncedSearch,
    sortKey,
    sortAsc,
  ]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const paginated = processed.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on deps change
  useEffect(() => {
    setCurrentPage(1);
  }, [brandFilter, influencerFilter, directionFilter, debouncedSearch]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderSortIcon = (key: SortKey) =>
    sortKey === key ? (
      sortAsc ? (
        <HiChevronUp className="inline-block ml-1" />
      ) : (
        <HiChevronDown className="inline-block ml-1" />
      )
    ) : null;

  const isLoading = loading || loadingFilters;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header + Filters */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h1 className="text-3xl font-semibold">
          Brand-Influencer Messages
        </h1>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={brandFilter}
            onValueChange={setBrandFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              {brandOptions.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={influencerFilter}
            onValueChange={setInfluencerFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Influencers" />
            </SelectTrigger>
            <SelectContent>
              {influencerOptions.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={directionFilter}
            onValueChange={(v) => setDirectionFilter(v as any)}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="All Senders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Brand">Brand → Influencer</SelectItem>
              <SelectItem value="Influencer">Influencer → Brand</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchFilters(); fetchMessages(); }}
            disabled={isLoading}
          >
            <HiOutlineRefresh
              className={`mr-2 h-4 w-4 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            Reload
          </Button>
        </div>
      </div>

      {/* Loading / Empty / Table */}
      {isLoading ? (
        <Card className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </Card>
      ) : error ? (
        <Card className="text-center py-20 text-red-600">
          {error}
        </Card>
      ) : paginated.length === 0 ? (
        <Card className="text-center py-20 text-gray-600">
          No messages found.
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { label: "ID", key: "messageId" },
                  { label: "Brand", key: "brandName" },
                  { label: "Influencer", key: "influencerName" },
                  { label: "Sender", key: "senderType" },
                  { label: "Message", key: "content" },
                  { label: "Date", key: "timestamp" },
                  { label: "Actions", key: "" },
                ].map((col) => (
                  <TableHead
                    key={col.label}
                    className={col.key ? "cursor-pointer select-none" : ""}
                    onClick={() => {
                      if (!col.key) return;
                      if (sortKey === col.key) setSortAsc(!sortAsc);
                      else {
                        setSortKey(col.key as SortKey);
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {col.key && renderSortIcon(col.key as SortKey)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((m) => (
                <TableRow key={m.messageId}>
                  <TableCell>{m.messageId}</TableCell>
                  <TableCell>{m.brandName}</TableCell>
                  <TableCell>{m.influencerName}</TableCell>
                  <TableCell>{m.senderType}</TableCell>
                  <TableCell className="line-clamp-2">{m.content}</TableCell>
                  <TableCell>{formatDate(m.timestamp)}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/admin/messages/view?conversationId=${m.conversationId}`}
                          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <HiOutlineEye size={18} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>View Conversation</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && !error && paginated.length > 0 && (
        <div className="flex justify-between items-center p-4">
          <div className="text-sm">
            Showing {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, processed.length)} of{" "}
            {processed.length}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <HiChevronLeft />
            </Button> 
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <HiChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
