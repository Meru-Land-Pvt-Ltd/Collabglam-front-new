"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyPanel, SectionCard } from "./shared";

export function BrandActivityTab() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState("all");
  const [module, setModule] = useState("all");
  const [range, setRange] = useState("30d");

  return (
    <SectionCard
      title="Activity Log"
      description="UI is ready. Connect your activity log endpoint here."
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-3 xl:grid-cols-[1.3fr,0.8fr,0.8fr,0.8fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity..."
              className="h-11 rounded-2xl border-black/10 bg-white pl-11 text-sm font-semibold"
            />
          </div>

          <Select value={user} onValueChange={setUser}>
            <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
              <SelectValue placeholder="Users" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
              <SelectValue placeholder="Modules" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="campaign">Campaign</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
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
          title="Activity API not connected"
          description="Wire your activity endpoint and replace this placeholder with the table."
        />
      </div>
    </SectionCard>
  );
}