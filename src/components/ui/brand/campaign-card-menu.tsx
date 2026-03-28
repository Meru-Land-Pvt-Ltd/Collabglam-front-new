"use client";

import React, { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  DotsThree,
  Eye,
  LinkSimple,
  PaperPlaneTilt,
} from "@phosphor-icons/react";

type Props = {
  viewHref: string;
  inviteHref: string;
};

const itemCls =
  "flex w-full items-center gap-3 rounded-[0.75rem] px-3 py-2.5 text-left text-[0.95rem] font-medium text-[#2D2D2D] hover:bg-[#F6F6F6] transition-colors";

function toAbsoluteUrl(href: string) {
  if (typeof window === "undefined") return href;
  if (/^https?:\/\//i.test(href)) return href;
  return `${window.location.origin}${href}`;
}

export default function CampaignCardMenu({ viewHref, inviteHref }: Props) {
  const [open, setOpen] = useState(false);

  const goTo = (href: string) => {
    if (typeof window !== "undefined") {
      window.location.href = href;
    }
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(toAbsoluteUrl(viewHref));
    } catch {
      // ignore silently for now
    }
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-[2.85rem] items-center justify-center bg-background text-muted-foreground shadow-none hover:text-tx-secondary"
          aria-label="More options"
        >
          <DotsThree size={18} weight="bold" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[13.75rem] rounded-[1rem] border border-[#ECECEC] bg-white p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
        >
          <button
            type="button"
            onClick={() => goTo(viewHref)}
            className={itemCls}
          >
            <Eye size={18} weight="regular" />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={copyLink}
            className={itemCls}
          >
            <LinkSimple size={18} weight="regular" />
            <span>Copy Link</span>
          </button>

          <button
            type="button"
            onClick={() => goTo(inviteHref)}
            className={itemCls}
          >
            <PaperPlaneTilt size={18} weight="regular" />
            <span>Invite Influencers</span>
          </button>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}