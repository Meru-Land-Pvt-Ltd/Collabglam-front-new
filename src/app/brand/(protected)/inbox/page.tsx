"use client"

import { Search, ChevronLeft, ChevronRight, ChevronDown, RefreshCw, Archive, Star, SquarePen, Mail, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/buttonComp";

import * as React from "react";

type MailItem = {
  id: number;
  name: string;
  verified?: boolean;
  avatar?: string;
  fallback: string;
  preview: string;
  time: string;
  starred?: boolean;
  selected?: boolean;
};

const mails: MailItem[] = [
  {
    id: 1,
    name: "justine",
    verified: true,
    fallback: "J",
    avatar: "https://i.pravatar.cc/100?img=12",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 2,
    name: "Collabglam",
    fallback: "C",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
    starred: true,
    selected: true,
  },
  {
    id: 3,
    name: "Marshmello",
    fallback: "M",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 4,
    name: "Ups",
    verified: true,
    fallback: "U",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 5,
    name: "Shell",
    verified: true,
    fallback: "S",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 6,
    name: "Team Mr Beast",
    fallback: "T",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 7,
    name: "Chanel India",
    verified: true,
    fallback: "CI",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
    starred: true,
  },
  {
    id: 8,
    name: "ED sheeran",
    verified: true,
    fallback: "E",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 9,
    name: "HUL",
    verified: true,
    fallback: "H",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
    starred: true,
  },
  {
    id: 10,
    name: "Dude Perfect",
    fallback: "DP",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 11,
    name: "LEGO UK",
    fallback: "L",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
  {
    id: 12,
    name: "Ariana grande",
    fallback: "A",
    preview:
      "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
    time: "11:53 (1 min ago)",
  },
];

function BrandAvatar({ mail }: { mail: MailItem }) {
  return (
    <Avatar className="h-7 w-7 rounded-full border border-border/60">
      <AvatarImage src={mail.avatar} alt={mail.name} />
      <AvatarFallback className="rounded-full bg-muted text-[10px] font-semibold text-foreground">
        {mail.fallback}
      </AvatarFallback>
    </Avatar>
  );
}

type FilterOption = {
  id: string;
  name: string;
};

function FilterPopover({
  label,
  options,
}: {
  label: string;
  options: FilterOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<FilterOption>(options[0]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-[32px] rounded-[0.5rem] px-3 inline-flex items-center gap-2 transition-colors",
            "text-[14px] font-medium text-[#1A1A1A]",
            open ? "bg-[#ECEEF2]" : "bg-transparent"
          )}
        >
          <span>{label}</span>
          <span className="text-muted-foreground">{selectedOption.name}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[240px] rounded-[12px] border border-[#E6E6E6] bg-white p-2",
          "shadow-[0_7px_20px_0_rgba(25,33,61,0.04)]"
        )}
      >
        <Command>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <CommandInput
              placeholder="Search..."
              className="h-[40px] rounded-[10px] border border-[#E6E6E6] pl-9"
            />
          </div>

          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup className="mt-2">
            {options.map((option) => (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => {
                  setSelectedOption(option);
                  setOpen(false);
                }}
                className="rounded-[10px]"
              >
                <span className="flex-1">{option.name}</span>
                {selectedOption.id === option.id ? <Check className="h-4 w-4" /> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const readStatusOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "read", name: "Read" },
  { id: "unread", name: "Unread" },
  { id: "starred", name: "Starred" },
];

const collaborationStageOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "outreach", name: "Outreach" },
  { id: "negotiation", name: "Negotiation" },
  { id: "closed", name: "Closed" },
];

const recipientOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "brand", name: "Brand" },
  { id: "creator", name: "Creator" },
  { id: "agency", name: "Agency" },
];

const dateOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "today", name: "Today" },
  { id: "week", name: "This week" },
  { id: "month", name: "This month" },
];

export default function InfluencerInboxPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f8] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col rounded-[24px] border border-border/60 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1 md:gap-3">
            <FilterPopover label="Read Status" options={readStatusOptions} />
            <FilterPopover label="Collaboration Stage" options={collaborationStageOptions} />
            <FilterPopover label="Recipient" options={recipientOptions} />
            <FilterPopover label="Date" options={dateOptions} />
            <Badge
              variant="secondary"
              className="h-8 rounded-md bg-muted px-3 text-xs font-medium text-foreground"
            >
              Clear ×
            </Badge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full min-w-[280px] sm:w-[320px] lg:w-[360px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for influencer"
                className="h-11 rounded-xl border-border/70 bg-background pl-11 pr-4 shadow-none"
              />
            </div>

            <Button>
              <SquarePen className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Checkbox />
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="More selection options">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Refresh inbox">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Archive inbox">
              <Archive className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>1-20 of 550</span>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-3 pb-4">
            {mails.map((mail) => (
              <div
                key={mail.id}
                className={cn(
                  "grid grid-cols-[24px_minmax(180px,1.1fr)_minmax(0,4fr)_minmax(120px,140px)] items-center gap-3 rounded-xl border-b border-border/50 px-3 py-4 transition-colors hover:bg-muted/40",
                  mail.selected && "bg-muted/60"
                )}
              >
                <Checkbox />

                <div className="flex min-w-0 items-center gap-3">
                  <BrandAvatar mail={mail} />
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {mail.name}
                    </span>
                    {mail.verified && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-muted sm:flex">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {mail.preview}
                  </p>
                </div>

                <div className="ml-auto flex items-center justify-end gap-4">
                  <button className="rounded-md p-1 hover:bg-muted" aria-label="Star mail">
                    <Star
                      className={cn(
                        "h-4 w-4",
                        mail.starred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {mail.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
