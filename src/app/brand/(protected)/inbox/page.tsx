"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { get } from "@/lib/api";

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
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  CaretDown,
  ArrowClockwise,
  Archive,
  Star,
  Envelope,
  Check,
  PencilSimple,
} from "@phosphor-icons/react";

type FilterOption = {
  id: string;
  name: string;
};

type Conversation = {
  id: string;
  brand: {
    brandId: string | null;
    name: string;
    aliasEmail: string;
    logoUrl: string | null;
  };
  subject: string;
  lastMessageAt: string | null;
  lastMessageDirection: string | null;
  lastMessageSnippet: string;
  influencerAliasEmail: string;
};

type ConversationsResponse = {
  conversations: Conversation[];
};

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
}

function getFallback(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "B";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function BrandAvatar({
  brandName,
  avatar,
}: {
  brandName: string;
  avatar?: string | null;
}) {
  return (
    <Avatar className="h-7 w-7 rounded-full border border-border/60">
      <AvatarImage src={avatar || ""} alt={brandName} />
      <AvatarFallback className="rounded-full bg-muted text-[10px] font-semibold text-foreground">
        {getFallback(brandName)}
      </AvatarFallback>
    </Avatar>
  );
}

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
          <CaretDown className="h-3.5 w-3.5" />
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
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchConversations = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await get<ConversationsResponse>("/emails/conversations");

      setConversations(Array.isArray(data?.conversations) ? data.conversations : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load conversations"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((item) => {
      const brandName = item.brand?.name?.toLowerCase() || "";
      const subject = item.subject?.toLowerCase() || "";
      const preview = item.lastMessageSnippet?.toLowerCase() || "";

      return (
        brandName.includes(q) ||
        subject.includes(q) ||
        preview.includes(q)
      );
    });
  }, [conversations, search]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredConversations.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredConversations.map((item) => item.id));
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-full flex-col rounded-[24px] border border-border/60 bg-white shadow-sm">
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
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="h-12 rounded-m border-border/70 bg-background pl-11 pr-4 shadow-none"
              />
            </div>

            <Button type="button">
              <PencilSimple className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Checkbox
              checked={
                filteredConversations.length > 0 &&
                selectedIds.length === filteredConversations.length
              }
              onCheckedChange={toggleSelectAll}
            />
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="More selection options">
              <CaretDown className="h-4 w-4" />
            </button>
            <button
              className="rounded-md p-1.5 hover:bg-muted"
              aria-label="Refresh inbox"
              onClick={fetchConversations}
            >
              <ArrowClockwise className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Archive inbox">
              <Archive className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {filteredConversations.length === 0
                ? "0 conversations"
                : `1-${filteredConversations.length} of ${filteredConversations.length}`}
            </span>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Previous page">
              <CaretLeft className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Next page">
              <CaretRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-3 pb-4">
            {loading ? (
              <div className="px-4 py-10 text-sm text-muted-foreground">
                Loading conversations...
              </div>
            ) : error ? (
              <div className="px-4 py-10 text-sm text-red-500">{error}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-4 py-10 text-sm text-muted-foreground">
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((item) => {
                const checked = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/influencer/inbox/${item.id}`)}
                    className={cn(
                      "cursor-pointer grid grid-cols-[24px_minmax(180px,1.1fr)_minmax(0,4fr)_minmax(120px,140px)] items-center gap-3 border-b border-[#D6D6D6] px-3 py-4 transition-colors hover:bg-[#EDEDED]"
                    )}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSelected(item.id)}
                      />
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <BrandAvatar
                        brandName={item.brand?.name || "Brand"}
                        avatar={item.brand?.logoUrl}
                      />
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {item.brand?.name || "Brand"}
                        </span>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-muted sm:flex">
                        <Envelope className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.lastMessageSnippet || item.subject || "No message preview"}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center justify-end gap-4">
                      <button
                        type="button"
                        className="rounded-md p-1 hover:bg-muted"
                        aria-label="Star mail"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </button>

                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatRelativeTime(item.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client"

// import * as React from "react"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import { Checkbox } from "@/components/ui/checkbox"
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
// } from "@/components/ui/command"
// import { Input } from "@/components/ui/input"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { Button } from "@/components/ui/buttonComp"
// import { cn } from "@/lib/utils"
// import {
//   MagnifyingGlass,
//   CaretLeft,
//   CaretRight,
//   CaretDown,
//   ArrowClockwise,
//   Archive,
//   Star,
//   Envelope,
//   Check,
//   PencilSimple,
// } from "@phosphor-icons/react"

// type MailItem = {
//   id: number
//   name: string
//   verified?: boolean
//   avatar?: string
//   fallback: string
//   preview: string
//   time: string
//   starred?: boolean
//   selected?: boolean
// }

// type FilterOption = {
//   id: string
//   name: string
// }

// const mails: MailItem[] = [
//   {
//     id: 1,
//     name: "justine",
//     verified: true,
//     fallback: "J",
//     avatar: "https://i.pravatar.cc/100?img=12",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 2,
//     name: "Collabglam",
//     fallback: "C",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//     starred: true,
//     selected: true,
//   },
//   {
//     id: 3,
//     name: "Marshmello",
//     fallback: "M",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 4,
//     name: "Ups",
//     verified: true,
//     fallback: "U",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 5,
//     name: "Shell",
//     verified: true,
//     fallback: "S",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 6,
//     name: "Team Mr Beast",
//     fallback: "T",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 7,
//     name: "Chanel India",
//     verified: true,
//     fallback: "CI",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//     starred: true,
//   },
//   {
//     id: 8,
//     name: "ED sheeran",
//     verified: true,
//     fallback: "E",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 9,
//     name: "HUL",
//     verified: true,
//     fallback: "H",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//     starred: true,
//   },
//   {
//     id: 10,
//     name: "Dude Perfect",
//     fallback: "DP",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 11,
//     name: "LEGO UK",
//     fallback: "L",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
//   {
//     id: 12,
//     name: "Ariana grande",
//     fallback: "A",
//     preview:
//       "Lorem Ipsum is simply dummy - text of the printing and typesetting industry. Lorem Ipsum has been the industry's s",
//     time: "11:53 (1 min ago)",
//   },
// ]

// const readStatusOptions: FilterOption[] = [
//   { id: "all", name: "All" },
//   { id: "read", name: "Read" },
//   { id: "unread", name: "Unread" },
//   { id: "starred", name: "Starred" },
// ]

// const collaborationStageOptions: FilterOption[] = [
//   { id: "all", name: "All" },
//   { id: "outreach", name: "Outreach" },
//   { id: "negotiation", name: "Negotiation" },
//   { id: "closed", name: "Closed" },
// ]

// const recipientOptions: FilterOption[] = [
//   { id: "all", name: "All" },
//   { id: "brand", name: "Brand" },
//   { id: "creator", name: "Creator" },
//   { id: "agency", name: "Agency" },
// ]

// const dateOptions: FilterOption[] = [
//   { id: "all", name: "All" },
//   { id: "today", name: "Today" },
//   { id: "week", name: "This week" },
//   { id: "month", name: "This month" },
// ]

// function BrandAvatar({ mail }: { mail: MailItem }) {
//   return (
//     <Avatar className="h-7 w-7 rounded-full border border-[#E8E8E8] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
//       <AvatarImage src={mail.avatar} alt={mail.name} />
//       <AvatarFallback className="rounded-full bg-[#F4F4F5] text-[10px] font-semibold text-[#111827]">
//         {mail.fallback}
//       </AvatarFallback>
//     </Avatar>
//   )
// }

// function FilterPopover({
//   label,
//   options,
// }: {
//   label: string
//   options: FilterOption[]
// }) {
//   const [open, setOpen] = React.useState(false)
//   const [selectedOption, setSelectedOption] = React.useState<FilterOption>(options[0])

//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <button
//           type="button"
//           className={cn(
//             "inline-flex h-8 items-center gap-2 rounded-[10px] px-3 transition-all duration-200",
//             "text-[13px] font-medium text-[#1A1A1A]",
//             open ? "bg-[#ECEEF2]" : "bg-transparent hover:bg-[#F3F4F6]"
//           )}
//         >
//           <span>{label}</span>
//           <span className="text-[#6B7280]">{selectedOption.name}</span>
//           <CaretDown size={14} weight="bold" className="text-[#6B7280]" />
//         </button>
//       </PopoverTrigger>

//       <PopoverContent
//         align="start"
//         className={cn(
//           "w-[240px] rounded-[14px] border border-[#E6E6E6] bg-white p-2",
//           "shadow-[0_10px_30px_rgba(25,33,61,0.08)]"
//         )}
//       >
//         <Command>
//           <div className="relative">
//             <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
//             <CommandInput
//               placeholder="Search..."
//               className="h-10 rounded-[10px] border border-[#E6E6E6] pl-9"
//             />
//           </div>

//           <CommandEmpty>No results found.</CommandEmpty>

//           <CommandGroup className="mt-2">
//             {options.map((option) => (
//               <CommandItem
//                 key={option.id}
//                 value={option.name}
//                 onSelect={() => {
//                   setSelectedOption(option)
//                   setOpen(false)
//                 }}
//                 className="rounded-[10px] px-3 py-2 text-[13px]"
//               >
//                 <span className="flex-1">{option.name}</span>
//                 {selectedOption.id === option.id ? (
//                   <Check size={16} weight="bold" className="text-[#111827]" />
//                 ) : null}
//               </CommandItem>
//             ))}
//           </CommandGroup>
//         </Command>
//       </PopoverContent>
//     </Popover>
//   )
// }

// export default function InfluencerInboxPage() {
//   return (
//     <div className="min-h-screen bg-[#F7F7F8] p-4 md:p-6">
//       <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-full flex-col overflow-hidden rounded-[24px] border border-[#E7E7E8] bg-white shadow-[0_8px_30px_rgba(17,24,39,0.04)]">
//         <div className="flex flex-col gap-4 border-b border-[#ECECEC] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
//           <div className="flex flex-wrap items-center gap-1 md:gap-2">
//             <FilterPopover label="Read Status" options={readStatusOptions} />
//             <FilterPopover label="Collaboration Stage" options={collaborationStageOptions} />
//             <FilterPopover label="Recipient" options={recipientOptions} />
//             <FilterPopover label="Date" options={dateOptions} />
//             <Badge
//               variant="secondary"
//               className="h-8 rounded-[10px] border border-transparent bg-[#EEF0F3] px-3 text-[12px] font-medium text-[#111827] hover:bg-[#E7EAEE]"
//             >
//               Clear ×
//             </Badge>
//           </div>

//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//             <div className="relative w-full min-w-[280px] sm:w-[320px] lg:w-[360px]">
//               <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
//               <Input
//                 placeholder="Search for influencer"
//                 className="h-12 rounded-[14px] border-[#E5E7EB] bg-white pl-11 pr-4 text-sm text-[#111827] shadow-none placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#D1D5DB]"
//               />
//             </div>

//             <Button className="h-12 rounded-[14px] bg-[#111111] px-5 text-sm font-medium text-white shadow-none hover:bg-black">
//               <PencilSimple size={18} weight="bold" className="mr-2" />
//               Compose
//             </Button>
//           </div>
//         </div>

//         <div className="flex items-center justify-between border-b border-[#F1F1F1] px-5 py-3">
//           <div className="flex items-center gap-1 text-[#6B7280]">
//             <div className="flex items-center gap-2 pr-2">
//               <Checkbox />
//               <button
//                 className="rounded-md p-1.5 transition-colors hover:bg-[#F3F4F6]"
//                 aria-label="More selection options"
//               >
//                 <CaretDown size={16} weight="bold" />
//               </button>
//             </div>
//             <button
//               className="rounded-md p-2 transition-colors hover:bg-[#F3F4F6]"
//               aria-label="Refresh inbox"
//             >
//               <ArrowClockwise size={18} />
//             </button>
//             <button
//               className="rounded-md p-2 transition-colors hover:bg-[#F3F4F6]"
//               aria-label="Archive inbox"
//             >
//               <Archive size={18} />
//             </button>
//           </div>

//           <div className="flex items-center gap-2 text-sm text-[#6B7280]">
//             <span className="pr-1 text-[13px] font-medium">1-20 of 550</span>
//             <button
//               className="rounded-md p-2 transition-colors hover:bg-[#F3F4F6]"
//               aria-label="Previous page"
//             >
//               <CaretLeft size={16} weight="bold" />
//             </button>
//             <button
//               className="rounded-md p-2 transition-colors hover:bg-[#F3F4F6]"
//               aria-label="Next page"
//             >
//               <CaretRight size={16} weight="bold" />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-hidden">
//           <div className="h-full overflow-y-auto px-3 pb-4">
//             {mails.map((mail) => (
//               <div
//                 key={mail.id}
//                 className={cn(
//                   "grid grid-cols-[24px_minmax(170px,1.15fr)_minmax(0,4fr)_minmax(130px,150px)] items-center gap-3 border-b border-[#ECECEC] px-3 py-4 transition-all duration-200",
//                   mail.selected
//                     ? "bg-[#F3F4F6]"
//                     : "bg-white hover:bg-[#FAFAFA]"
//                 )}
//               >
//                 <Checkbox />

//                 <div className="flex min-w-0 items-center gap-3">
//                   <BrandAvatar mail={mail} />
//                   <div className="flex min-w-0 items-center gap-1.5">
//                     <span className="truncate text-[14px] font-semibold text-[#111827]">
//                       {mail.name}
//                     </span>
//                     {mail.verified && (
//                       <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2D9CFF] text-[10px] font-bold text-white shadow-sm">
//                         ✓
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex min-w-0 items-center gap-3">
//                   <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] sm:flex">
//                     <Envelope size={16} className="text-[#6B7280]" />
//                   </div>
//                   <p className="truncate text-[13px] text-[#6B7280]">
//                     {mail.preview}
//                   </p>
//                 </div>

//                 <div className="ml-auto flex items-center justify-end gap-4">
//                   <button
//                     className="rounded-md p-1.5 transition-colors hover:bg-[#F3F4F6]"
//                     aria-label="Star mail"
//                   >
//                     <Star
//                       size={16}
//                       weight={mail.starred ? "fill" : "regular"}
//                       className={cn(
//                         mail.starred ? "text-[#FFBF00]" : "text-[#9CA3AF]"
//                       )}
//                     />
//                   </button>
//                   <span className="whitespace-nowrap text-[12px] font-medium text-[#9CA3AF]">
//                     {mail.time}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }