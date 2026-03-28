"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BookmarkSimple,
  Briefcase,
  CaretRight,
  DotsThree,
  Eye,
  EyesIcon,
  LinkSimple,
  Trash,
} from "@phosphor-icons/react";

import {
  Combobox,
  ComboboxContent,
  ComboboxTrigger,
} from "@/components/ui/combobox";

export type InfluencerMenuType = "shortlisted" | "active";

type MenuKey =
  | "viewProfile"
  | "copyProfileLink"
  | "saveToHub"
  | "moveToWorkspace"
  | "compare"
  | "remove"
  | "addMilestone"
  | "assignDeliverables"
  | "raiseDispute";

type WorkspaceItem = {
  id: string;
  name: string;
  logo?: React.ReactNode;
};

type InfluencerContextMenuProps = {
  type?: InfluencerMenuType;

  onViewProfile?: () => void;
  onCopyProfileLink?: () => void;
  onSaveToHub?: (hubId?: string) => void;
  onMoveToWorkspace?: (workspaceId?: string) => void;
  onCompare?: () => void;
  onDelete?: () => void;

  onAddMilestone?: () => void;
  onAssignDeliverables?: () => void;
  onRaiseDispute?: () => void;
};

type MenuItem = {
  label: string;
  key: MenuKey;
  icon?: React.ComponentType<any> | null;
  hasArrow?: boolean;
  badge?: string;
  danger?: boolean;
};

const MENU_BY_TYPE: Record<InfluencerMenuType, MenuItem[]> = {
  shortlisted: [
    { label: "View profile", icon: Eye, key: "viewProfile" },
    { label: "Copy profile link", icon: LinkSimple, key: "copyProfileLink" },
    { label: "Save to HUB", icon: BookmarkSimple, key: "saveToHub", hasArrow: true },
    { label: "Move to workspace", icon: null, key: "moveToWorkspace", hasArrow: true },
    { label: "Compare", icon: EyesIcon, key: "compare", badge: "Soon" },
    { label: "Remove", icon: Trash, key: "remove", danger: true },
  ],

  active: [
    { label: "View profile", icon: Eye, key: "viewProfile" },
    { label: "Copy profile link", icon: LinkSimple, key: "copyProfileLink" },
    { label: "Add milestone", icon: BookmarkSimple, key: "addMilestone" },
    { label: "Assign deliverables", icon: BookmarkSimple, key: "assignDeliverables" },
    { label: "Save to HUB", icon: BookmarkSimple, key: "saveToHub", hasArrow: true },
    { label: "Move to workspace", icon: null, key: "moveToWorkspace", hasArrow: true },
    { label: "Raise Dispute", icon: BookmarkSimple, key: "raiseDispute" },
    { label: "Remove", icon: Trash, key: "remove", danger: true },
  ],
};

export function InfluencerContextMenu({
  type = "shortlisted",
  onViewProfile,
  onCopyProfileLink,
  onSaveToHub,
  onMoveToWorkspace,
  onCompare,
  onDelete,
  onAddMilestone,
  onAssignDeliverables,
  onRaiseDispute,
}: InfluencerContextMenuProps) {
  const [workspaceSubmenuOpen, setWorkspaceSubmenuOpen] = useState(false);
  const [hubSubmenuOpen, setHubSubmenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement | null>(null);

  const menuItems = useMemo(() => MENU_BY_TYPE[type], [type]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRootRef.current) return;
      if (!menuRootRef.current.contains(e.target as Node)) {
        setWorkspaceSubmenuOpen(false);
        setHubSubmenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlers: Record<MenuKey, (() => void) | undefined> = {
    viewProfile: onViewProfile,
    copyProfileLink: onCopyProfileLink,
    saveToHub: undefined,
    moveToWorkspace: undefined,
    compare: onCompare,
    remove: onDelete,
    addMilestone: onAddMilestone,
    assignDeliverables: onAssignDeliverables,
    raiseDispute: onRaiseDispute,
  };

  const workspaces: WorkspaceItem[] = [
    { id: "nike", name: "Nike Workspace" },
    { id: "mailchimp", name: "Mailchimp Workspace" },
    { id: "slack", name: "Slack Workspace" },
    { id: "notion", name: "Notion Workspace" },
  ];

  const hubs: WorkspaceItem[] = [
    { id: "main", name: "Main HUB" },
    { id: "favorites", name: "Favorites HUB" },
  ];

  return (
    <Combobox>
      <ComboboxTrigger hideIcon>
        {/* <Button
          variant="ghost"
          size="sm"
          aria-label="More actions"
          className="
            my-0
            h-[2rem] w-[2.4rem]
            px-[0.5rem]
            rounded-[0.55rem]
            border border-[#E6E6E6]
            bg-white
            shadow-none
          "
        >
          <DotsThree size={20} weight="bold" />
        </Button> */}
      </ComboboxTrigger>

      <ComboboxContent
        align="end"
        className="
          w-[13.6875rem]
          rounded-[0.75rem]
          bg-white
          py-[1rem]
          px-[0.75rem]
          shadow-[0_8px_32px_rgba(0,0,0,0.13)]
        "
      >
        <div ref={menuRootRef} className="flex flex-col gap-[0.5rem]">
          {menuItems.map(({ label, icon: Icon, key, hasArrow, badge, danger }) => {
            const isWorkspace = key === "moveToWorkspace";
            const isHub = key === "saveToHub";

            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();

              if (isWorkspace) {
                setWorkspaceSubmenuOpen((prev) => !prev);
                setHubSubmenuOpen(false);
                return;
              }

              if (isHub) {
                setHubSubmenuOpen((prev) => !prev);
                setWorkspaceSubmenuOpen(false);
                return;
              }

              setWorkspaceSubmenuOpen(false);
              setHubSubmenuOpen(false);
              handlers[key]?.();
            };

            return (
              <div key={key} className="relative">
                <button
                  onClick={handleClick}
                  className={[
                    "w-full flex items-center gap-[0.5rem] px-[0.5rem] py-[0.5rem] rounded-[0.5rem] transition-colors",
                    danger
                      ? "text-[#E53935] hover:bg-[#FFF5F5]"
                      : "text-[#1A1A1A] hover:bg-[#F5F5F5]",
                  ].join(" ")}
                >
                  {label === "Move to workspace" ? (
                    <Image
                      width={16}
                      height={16}
                      src="/Component 32.svg"
                      alt="workspace icon"
                      draggable={false}
                    />
                  ) : (
                    Icon && <Icon size={16} className="h-[1rem] w-[1rem]" />
                  )}

                  <span className="flex-1 text-left text-sm font-normal">{label}</span>

                  {badge ? (
                    <span className="rounded-full bg-[#F2F2F2] px-2 py-[0.15rem] text-[0.625rem] text-[#7A7A7A]">
                      {badge}
                    </span>
                  ) : null}

                  {hasArrow ? <CaretRight size={16} /> : null}
                </button>

                {isWorkspace && workspaceSubmenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
                      absolute top-0 -left-55
                      w-[13rem]
                      rounded-[0.75rem]
                      bg-white
                      p-[0.5rem]
                      shadow-[0_8px_32px_rgba(0,0,0,0.13)]
                      z-50
                      flex flex-col gap-[0.25rem]
                    "
                  >
                    <p className="ml-2 mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-[#999]">
                      Workspace name
                    </p>

                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onMoveToWorkspace?.(ws.id);
                          setWorkspaceSubmenuOpen(false);
                        }}
                        className="
                          w-full flex items-center gap-3
                          border p-2 rounded-md
                          text-sm font-medium
                          hover:bg-[#F5F5F5]
                          transition-colors
                        "
                      >
                        <span className="w-8 h-8 rounded-md bg-black flex items-center justify-center text-white">
                          {ws.name.charAt(0)}
                        </span>
                        {ws.name}
                      </button>
                    ))}
                  </div>
                )}

                {isHub && hubSubmenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
                      absolute top-0 -left-55
                      w-[13rem]
                      rounded-[0.75rem]
                      bg-white
                      p-[0.5rem]
                      shadow-[0_8px_32px_rgba(0,0,0,0.13)]
                      z-50
                      flex flex-col gap-[0.25rem]
                    "
                  >
                    <p className="ml-2 mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-[#999]">
                      Save to HUB
                    </p>

                    {hubs.map((hub) => (
                      <button
                        key={hub.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSaveToHub?.(hub.id);
                          setHubSubmenuOpen(false);
                        }}
                        className="
                          w-full flex items-center gap-3
                          border p-2 rounded-md
                          text-sm font-medium
                          hover:bg-[#F5F5F5]
                          transition-colors
                        "
                      >
                        <span className="w-8 h-8 rounded-md bg-black flex items-center justify-center text-white">
                          {hub.name.charAt(0)}
                        </span>
                        {hub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ComboboxContent>
    </Combobox>
  );
}