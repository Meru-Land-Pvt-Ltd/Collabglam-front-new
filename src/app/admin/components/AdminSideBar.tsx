"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Outfit } from "next/font/google";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  Home,
  List,
  LogOut,
  MailCheckIcon,
  Menu,
  MessageSquare,
  Settings as SettingsIcon,
  Users,
  X,
} from "lucide-react";
import api from "@/lib/api";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

type IconType = React.ElementType;

type NavItem = {
  key: string;  
  label: string;
  href: string;
  icon: IconType;
};

type SectionLink = {
  key: string;
  label: string;
  href: string;
};

type Permission = {
  key?: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "notifications", label: "Notifications", href: "/admin/notifications", icon: Bell },
  { key: "brands", label: "Brands", href: "/admin/brands", icon: Home },
  { key: "influencers", label: "Influencers", href: "/admin/influencers", icon: Users },
  { key: "influencer-pipeline", label: "Influencer Pipeline", href: "/admin/influencer-pipeline", icon: Users },
  { key: "campaigns", label: "All Campaigns", href: "/admin/campaigns", icon: List },
  { key: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: DollarSign },
  { key: "disputes", label: "Disputes", href: "/admin/disputes", icon: FileText },
  { key: "emails", label: "E-Mails", href: "/admin/emails", icon: MailCheckIcon },
  { key: "messages", label: "Message", href: "/admin/messages", icon: MessageSquare },
  { key: "influencer-email", label: "Influencer-Email", href: "/admin/influencerdetails", icon: MailCheckIcon },
  { key: "inbound-emails", label: "Inbound Emails", href: "/admin/inbound-emails", icon: MailCheckIcon },
  { key: "missing-email", label: "Missing-Email", href: "/admin/missingemail", icon: MailCheckIcon },
  { key: "invoice-details", label: "Invoice Details", href: "/admin/invoiceDetails", icon: DollarSign },
  { key: "payment-notification", label: "Payment Notification", href: "/admin/payment", icon: Bell },
  { key: "youtube-handle", label: "Youtube Handle", href: "/admin/youtube", icon: MailCheckIcon },
  { key: "modash-data", label: "Modash Data", href: "/admin/modash", icon: MailCheckIcon },
  { key: "invited-influencer", label: "Invited Influencer", href: "/admin/invitedInfluencer", icon: MailCheckIcon },
];

const SETTINGS_LINKS: SectionLink[] = [
  { key: "role", label: "Role", href: "/admin/role" },
  { key: "employees", label: "Employees", href: "/admin/employees" },
];

const DOCUMENT_LINKS: SectionLink[] = [
  { key: "contact-us-page-email", label: "Contact US Page Email", href: "/admin/documents/contact-us" },
  { key: "faqs", label: "FAQs", href: "/admin/documents/faqs" },
  { key: "privacy-policy", label: "Privacy Policy", href: "/admin/documents/privacy-policy" },
  { key: "terms-of-service", label: "Terms of Service", href: "/admin/documents/terms-of-service" },
  { key: "cookie-policy", label: "Cookie Policy", href: "/admin/documents/cookie-policy" },
  { key: "shipping-delivery-policy", label: "Shipping & Delivery Policy", href: "/admin/documents/shipping-delivery" },
  { key: "returns-policy", label: "Returns Policy", href: "/admin/documents/return-policy" },
];

const drawerVariants = {
  hidden: { x: "-100%" },
  visible: { x: "0%" },
};

const linkBase =
  "group block rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none";
const linkActive = "bg-black text-white";
const linkInactive = "text-black/80 hover:bg-black hover:text-white";
const subLinkInactive = "text-black/70 hover:bg-black hover:text-white";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "px-4 py-3" : "p-5"}>
      <Link href="/admin" className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl overflow-hidden border border-black/10 bg-white">
          <img
            src="/logo.png"
            alt="CollabGlam logo"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="leading-tight">
          <div className={compact ? "text-sm font-extrabold" : "text-base font-extrabold"}>
            CollabGlam
          </div>
        </div>
      </Link>
    </div>
  );
}

type CollapsibleSectionProps = {
  title: string;
  icon: IconType;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  icon: Icon,
  isOpen,
  isActive,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`${linkBase} w-full ${isActive ? linkActive : linkInactive}`}
      >
        <span className="flex items-center gap-2">
          <Icon
            className={`h-4 w-4 ${isActive ? "text-white" : "text-black/50 group-hover:text-white"
              }`}
          />
          <span className="flex-1 text-left">{title}</span>
          {isOpen ? (
            <ChevronUp
              className={`h-4 w-4 ${isActive ? "text-white" : "text-black/50 group-hover:text-white"
                }`}
            />
          ) : (
            <ChevronDown
              className={`h-4 w-4 ${isActive ? "text-white" : "text-black/50 group-hover:text-white"
                }`}
            />
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-3 mt-2 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const docsActive = pathname.startsWith("/admin/documents/");
  const settingsActive =
    pathname === "/admin/role" ||
    pathname === "/admin/employees" ||
    pathname.startsWith("/admin/settings/");

  useEffect(() => {
    if (docsActive) setDocsOpen(true);
    if (settingsActive) setSettingsOpen(true);
  }, [docsActive, settingsActive]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    let mounted = true;

    const fetchPermissions = async () => {
      try {
        const response = await api.get("/admins/me");
        const permissions: Permission[] = response.data?.permissions ?? [];
        const keys = permissions.map((item) => item?.key).filter(Boolean) as string[];

        if (mounted) {
          setPermissionKeys(keys);
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        if (mounted) {
          setPermissionKeys([]);
        }
      } finally {
        if (mounted) {
          setPermissionsLoading(false);
        }
      }
    };

    fetchPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => permissionKeys.includes(item.key)),
    [permissionKeys]
  );

  const allowedSettingsLinks = useMemo(
    () => SETTINGS_LINKS.filter((item) => permissionKeys.includes(item.key)),
    [permissionKeys]
  );

  const allowedDocumentLinks = useMemo(
    () => DOCUMENT_LINKS.filter((item) => permissionKeys.includes(item.key)),
    [permissionKeys]
  );

  const showSettings = allowedSettingsLinks.length > 0;
  const showDocuments = allowedDocumentLinks.length > 0;

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    } catch {
      // ignore localStorage errors
    }

    router.replace("/admin/login");
  };

  const renderMainLink = (item: NavItem, onClick?: () => void) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={`${linkBase} ${active ? linkActive : linkInactive}`}
      >
        <span className="flex items-center gap-2">
          <Icon
            className={`h-4 w-4 ${active ? "text-white" : "text-black/50 group-hover:text-white"
              }`}
          />
          <span className="flex-1 whitespace-nowrap">{item.label}</span>
        </span>
      </Link>
    );
  };

  const renderSectionLink = (
    item: SectionLink,
    isMobile = false
  ) => {
    const active = isActivePath(pathname, item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => {
          if (isMobile) setDrawerOpen(false);
        }}
        className={`${linkBase} ${active ? linkActive : subLinkInactive}`}
      >
        {item.label}
      </Link>
    );
  };

  const renderSettingsSection = (isMobile = false) => {
    if (!showSettings) return null;

    return (
      <CollapsibleSection
        title="Settings"
        icon={SettingsIcon}
        isOpen={settingsOpen}
        isActive={settingsActive}
        onToggle={() => setSettingsOpen((prev) => !prev)}
      >
        {allowedSettingsLinks.map((item) => renderSectionLink(item, isMobile))}
      </CollapsibleSection>
    );
  };

  const renderDocumentsSection = (isMobile = false) => {
    if (!showDocuments) return null;

    return (
      <CollapsibleSection
        title="Documents"
        icon={FileText}
        isOpen={docsOpen}
        isActive={docsActive}
        onToggle={() => setDocsOpen((prev) => !prev)}
      >
        {allowedDocumentLinks.map((item) => renderSectionLink(item, isMobile))}
      </CollapsibleSection>
    );
  };

  if (permissionsLoading) return null;

  return (
    <>
      <header
        className={`${outfit.className} fixed inset-x-0 top-0 z-50 flex h-12 items-center border-b border-black/10 bg-white px-4 md:hidden`}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 hover:bg-black/5 focus:outline-none"
        >
          <Menu className="h-6 w-6 text-black/80" />
        </button>

        <div className="ml-3">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl overflow-hidden border border-black/10 bg-white">
              <img
                src="/logo.png"
                alt="CollabGlam logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-base font-extrabold">CollabGlam</span>
          </Link>
        </div>
      </header>

      <aside
        className={`${outfit.className} hidden h-screen w-64 flex-col border-r border-black/10 bg-white md:fixed md:inset-y-0 md:left-0 md:flex`}
      >
        <BrandHeader />

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <nav className="space-y-1">
            {allowedNavItems.map((item) => renderMainLink(item))}
            {renderSettingsSection(false)}
            {renderDocumentsSection(false)}
          </nav>
        </div>

        <div className="shrink-0 border-t border-black/10 p-3">
          <button onClick={handleLogout} className={`${linkBase} w-full ${linkInactive}`}>
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-black/50 group-hover:text-white" />
              <span>Logout</span>
            </span>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />

            <motion.aside
              className={`${outfit.className} fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-black/10 bg-white`}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <div className="flex h-12 items-center justify-between border-b border-black/10">
                <BrandHeader compact />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="mr-2 rounded-lg p-2 hover:bg-black/5 focus:outline-none"
                >
                  <X className="h-6 w-6 text-black/80" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3 pt-3">
                <nav className="space-y-1">
                  {allowedNavItems.map((item) =>
                    renderMainLink(item, () => setDrawerOpen(false))
                  )}
                  {renderSettingsSection(true)}
                  {renderDocumentsSection(true)}
                </nav>
              </div>

              <div className="shrink-0 border-t border-black/10 p-3">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    handleLogout();
                  }}
                  className={`${linkBase} w-full ${linkInactive}`}
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-black/50 group-hover:text-white" />
                    <span>Logout</span>
                  </span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}