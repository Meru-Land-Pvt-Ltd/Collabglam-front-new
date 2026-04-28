"use client";

import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyPanel, SectionCard } from "./shared";

export function BrandInvoicesTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [range, setRange] = useState("30d");

  return (
    <SectionCard
      title="Invoices"
      description="UI is ready. Connect your invoice list endpoint here."
      action={
        <Button className="rounded-2xl bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90">
          <Plus className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      }
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-3 xl:grid-cols-[1.2fr,0.8fr,0.8fr,0.9fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="h-11 rounded-2xl border-black/10 bg-white pl-11 text-sm font-semibold"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="card">Credit Card</SelectItem>
              <SelectItem value="wire">Wire Transfer</SelectItem>
              <SelectItem value="ach">ACH</SelectItem>
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <EmptyPanel
          title="Invoice endpoint not connected"
          description="The layout is ready. Plug in your invoice API and render the rows here."
        />
      </div>
    </SectionCard>
  );
}