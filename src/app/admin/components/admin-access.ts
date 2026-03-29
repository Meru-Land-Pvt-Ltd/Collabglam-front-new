"use client";

import React from "react";
import {
  Bell,
  DollarSign,
  FileText,
  GitBranch,
  Home,
  LayoutDashboard,
  MailCheckIcon,
  MessageSquare,
  Shield,
  Users,
  List,
} from "lucide-react";

export type IconType = React.ElementType;

export type AdminChildLink = {
  key: string;
  label: string;
  href: string;
};

export type AdminModule = {
  key: string;
  label: string;
  href: string;
  icon: IconType;
  aliases?: string[];
  children?: AdminChildLink[];
};

export type AdminPermissionSection = {
  key: string;
  title: string;
  icon: IconType;
  items: string[];
};

export const ADMIN_MODULES: AdminModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    aliases: ["home", "admin-dashboard"],
  },

  {
    key: "brands",
    label: "Brands",
    href: "/admin/brands",
    icon: Home,
  },

  {
    key: "campaigns",
    label: "Campaigns",
    href: "/admin/campaigns",
    icon: List,
  },

  {
    key: "influencers",
    label: "Influencers",
    href: "/admin/influencers",
    icon: Users,
  },

    {
    key: "brand-pipeline",
    label: "Brands Pipeline",
    href: "/admin/brand-pipeline",
    icon: GitBranch,
  },

  {
    key: "influencer-pipeline",
    label: "Influencer Pipeline",
    href: "/admin/influencer-pipeline",
    icon: GitBranch,
  },

    {
    key: "brand-pipeline",
    label: "Brand Pipeline",
    href: "/admin/brand-pipeline",
    icon: GitBranch,
  },

  {
    key: "influencer-data",
    label: "Influencer Data",
    href: "/admin/influencer-data",
    icon: Users,
  },

  {
    key: "influencerdetails",
    label: "Influencer Details",
    href: "/admin/influencerdetails",
    icon: MailCheckIcon,
    aliases: ["influencer-email"],
  },

  {
    key: "invitedInfluencer",
    label: "Invited Influencer",
    href: "/admin/invitedInfluencer",
    icon: Users,
    aliases: ["invited-influencer"],
  },

  {
    key: "modash",
    label: "Modash",
    href: "/admin/modash",
    icon: FileText,
    aliases: ["modash-data"],
  },

  {
    key: "messages",
    label: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
  },

  {
    key: "inbound-emails",
    label: "Inbound Emails",
    href: "/admin/inbound-emails",
    icon: MailCheckIcon,
  },

  {
    key: "youtube",
    label: "YouTube",
    href: "/admin/youtube",
    icon: MailCheckIcon,
    aliases: ["youtube-handle"],
  },

  {
    key: "subscriptions",
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: DollarSign,
  },

  {
    key: "invoiceDetails",
    label: "Invoice Details",
    href: "/admin/invoiceDetails",
    icon: DollarSign,
    aliases: ["invoice-details"],
  },

  {
    key: "payment",
    label: "Payment",
    href: "/admin/payment",
    icon: Bell,
    aliases: ["payment-notification"],
  },

  {
    key: "disputes",
    label: "Disputes",
    href: "/admin/disputes",
    icon: FileText,
  },

  {
    key: "documents",
    label: "Documents",
    href: "/admin/documents",
    icon: FileText,
    children: [
      {
        key: "contact-us-page-email",
        label: "Contact US Page Email",
        href: "/admin/documents/contact-us",
      },
      { key: "faqs", label: "FAQs", href: "/admin/documents/faqs" },
      {
        key: "privacy-policy",
        label: "Privacy Policy",
        href: "/admin/documents/privacy-policy",
      },
      {
        key: "terms-of-service",
        label: "Terms of Service",
        href: "/admin/documents/terms-of-service",
      },
      {
        key: "cookie-policy",
        label: "Cookie Policy",
        href: "/admin/documents/cookie-policy",
      },
      {
        key: "shipping-delivery-policy",
        label: "Shipping & Delivery Policy",
        href: "/admin/documents/shipping-delivery",
      },
      {
        key: "returns-policy",
        label: "Returns Policy",
        href: "/admin/documents/return-policy",
      },
    ],
  },

  {
    key: "employees",
    label: "Employees",
    href: "/admin/employees",
    icon: Users,
  },

  {
    key: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },

  {
    key: "role",
    label: "Role",
    href: "/admin/role",
    icon: Shield,
  },
];

export const ROLE_PERMISSION_SECTIONS: AdminPermissionSection[] = [
  {
    key: "overview",
    title: "Overview",
    icon: LayoutDashboard,
    items: ["dashboard"],
  },
  {
    key: "business",
    title: "Business & Billing",
    icon: DollarSign,
    items: [
      "brands",
      "campaigns",
      "subscriptions",
      "invoiceDetails",
      "payment",
      "disputes",
    ],
  },
  {
    key: "influencer",
    title: "Influencer Operations",
    icon: Users,
    items: [
      "influencers",
      "influencer-pipeline",
      "influencer-data",
      "influencerdetails",
      "invitedInfluencer",
      "modash",
    ],
  },
  {
    key: "communication",
    title: "Communication",
    icon: MessageSquare,
    items: ["messages", "inbound-emails", "youtube", "documents"],
  },
  {
    key: "admin",
    title: "Admin Controls",
    icon: Shield,
    items: ["employees", "notifications", "role"],
  },
];

export function normalizeModuleKey(value?: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
}

const MODULE_KEY_MAP = new Map<string, string>();

for (const module of ADMIN_MODULES) {
  MODULE_KEY_MAP.set(normalizeModuleKey(module.key), module.key);

  for (const alias of module.aliases || []) {
    MODULE_KEY_MAP.set(normalizeModuleKey(alias), module.key);
  }
}

export function canonicalizeModuleKey(value?: string) {
  const normalized = normalizeModuleKey(value);
  return MODULE_KEY_MAP.get(normalized) || String(value || "");
}

export function getAdminModule(value?: string) {
  const canonicalKey = canonicalizeModuleKey(value);
  return ADMIN_MODULES.find((item) => item.key === canonicalKey);
}

export function hasModuleAccess(permissionKeys: string[] = [], moduleKey?: string) {
  const wanted = canonicalizeModuleKey(moduleKey);
  return permissionKeys.some((item) => canonicalizeModuleKey(item) === wanted);
}