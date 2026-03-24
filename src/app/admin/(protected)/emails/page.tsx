"use client"

import React, { useEffect, useState, useMemo } from "react";
import { downloadBlob, post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, parseISO } from "date-fns";
import Swal from "sweetalert2";

interface NewsletterSubscriber {
  _id: string;
  email: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

export default function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await post<{ subscribers: NewsletterSubscriber[] }>(
          "/contact/newsletter/list"
        );
        setSubscribers(
          Array.isArray(data.subscribers) ? data.subscribers : []
        );
      } catch (e) {
        console.error(e);
        setError("Failed to load newsletter signups.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadExport = async (type: 'csv' | 'excel') => {
    try {
      // downloadBlob returns the raw Blob directly
      const blob = await downloadBlob(
        "/contact/newsletter/download",
        { type }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter_signups.${type === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      await Swal.fire({
        icon: 'success',
        title: 'Download Started',
        text: `Your ${type.toUpperCase()} file is downloading.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'Please try again.',
      });
    }
  };

  // Filter & pagination
  const filtered = useMemo(
    () => subscribers.filter((sub) =>
      sub.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [subscribers, searchTerm]
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const total = subscribers.length;
  const lastSignup =
    total > 0
      ? subscribers.reduce((prev, curr) =>
          new Date(prev.createdAt) > new Date(curr.createdAt) ? prev : curr
        ).createdAt
      : null;

  return (
    <div className="flex flex-col text-gray-900">
      <div className="h-16" aria-hidden />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Newsletter Signups Admin</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Subscribers</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {total}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last Signup</CardTitle>
            </CardHeader>
            <CardContent>
              {lastSignup ? (
                <div className="flex items-center space-x-2">
                  <span>
                    {formatDistanceToNow(parseISO(lastSignup), {
                      addSuffix: true,
                    })}
                  </span>
                  <Badge variant="secondary" key="badge-last">
                    {new Date(lastSignup).toLocaleDateString()}
                  </Badge>
                </div>
              ) : (
                <span>No signups yet</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex space-x-2">
              <Button
                onClick={() => downloadExport('csv')}
                variant="outline"
                key="btn-csv"
              >
                Download CSV
              </Button>
              <Button
                onClick={() => downloadExport('excel')}
                variant="outline"
                key="btn-excel"
              >
                Download Excel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by email…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
            key="input-search"
          />
          <div className="text-sm text-gray-600 mt-2 sm:mt-0" key="info-count">
            Showing {filtered.length} of {total}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead key="header-email">Email</TableHead>
                <TableHead key="header-date">Date Signed Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((sub) => (
                <TableRow
                  key={sub._id}
                  className="even:bg-gray-50 hover:bg-gray-50 transition"
                >
                  <TableCell key={`email-${sub._id}`}>{sub.email}</TableCell>
                  <TableCell key={`date-${sub._id}`}>
                    {new Date(sub.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-center items-center space-x-4" key="pagination">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              key="btn-prev"
            >
              Previous
            </Button>
            <span key="pagination-info">
              Page {page} of {pageCount}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              key="btn-next"
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}