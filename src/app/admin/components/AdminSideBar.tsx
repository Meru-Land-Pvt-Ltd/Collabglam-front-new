"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Outfit } from "next/font/google";
import {
  Home,
  Users,
  List,
  Menu,
  X,
  DollarSign,
  MailCheckIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  LogOut,
  Bell,
} from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// ✅ Notifications moved AFTER Invited Influencer (same item, same route)
const navItems = [
  {
    key: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  { key: "brands", label: "Brands", href: "/admin/brands", icon: Home },
  {
    key: "paid-brands",
    label: "Paid Brands",
    href: "/admin/paid-brands",
    icon: Home,
  },
  {
    key: "influencers",
    label: "Influencers",
    href: "/admin/influencers",
    icon: Users,
  },
  {
    key: "campaigns",
    label: "All Campaigns",
    href: "/admin/campaigns",
    icon: List,
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: DollarSign,
  },
  {
    key: "disputes",
    label: "Disputes",
    href: "/admin/disputes",
    icon: FileText,
  },

  {
    key: "emails",
    label: "E-Mails",
    href: "/admin/emails",
    icon: MailCheckIcon,
  },
  {
    key: "influencer-email",
    label: "Influencer-Email",
    href: "/admin/influencerdetails",
    icon: MailCheckIcon,
  },
  {
    key: "missing-email",
    label: "Missing-Email",
    href: "/admin/missingemail",
    icon: MailCheckIcon,
  },

  {
    key: "invoice-details",
    label: "Invoice Details",
    href: "/admin/invoiceDetails",
    icon: DollarSign,
  },
  {
    key: "payment-notification",
    label: "Payment Notification",
    href: "/admin/payment",
    icon: Bell,
  },

  {
    key: "youtube-handle",
    label: "Youtube Handle",
    href: "/admin/youtube",
    icon: MailCheckIcon,
  },
  {
    key: "modash-data",
    label: "Modash Data",
    href: "/admin/modash",
    icon: MailCheckIcon,
  },
  {
    key: "invited-influencer",
    label: "Invited Influencer",
    href: "/admin/invitedInfluencer",
    icon: MailCheckIcon,
  },
  { key: "role", label: "Role", href: "/admin/role", icon: MailCheckIcon },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  {
    label: "Influencer Data",
    href: "/admin/influencer-data",
    icon: MailCheckIcon,
  },
];

const documentLinks = [
  { label: "Contact US Page Email", href: "/admin/documents/contact-us" },
  { label: "FAQs", href: "/admin/documents/faqs" },
  { label: "Privacy Policy", href: "/admin/documents/privacy-policy" },
  { label: "Terms of Service", href: "/admin/documents/terms-of-service" },
  { label: "Cookie Policy", href: "/admin/documents/cookie-policy" },
  {
    label: "Shipping & Delivery Policy",
    href: "/admin/documents/shipping-delivery",
  },
  { label: "Returns Policy", href: "/admin/documents/return-policy" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const initialDocsOpen = pathname.startsWith("/admin/documents/");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(initialDocsOpen);

  useEffect(() => {
    if (pathname.startsWith("/admin/documents/")) setDocsOpen(true);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
  }, [drawerOpen]);

  const drawerVariants = {
    hidden: { x: "-100%" },
    visible: { x: "0%" },
  };

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") localStorage.clear();
    } catch (e) {
      // ignore
    }
    router.push("/admin/login");
  };

  // ✅ Brands page vibe: clean + black hover/active + Outfit font
  const linkBase =
    "group block rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none";
  const linkActive = "bg-black text-white";
  const linkInactive = "text-black/80 hover:bg-black hover:text-white";

  const renderLink = (
    { label, href, icon: Icon }: any,
    onClick?: () => void,
  ) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        onClick={onClick}
        className={`${linkBase} ${active ? linkActive : linkInactive}`}
      >
        <span className="flex items-center gap-2">
          {Icon ? (
            <Icon
              className={`h-4 w-4 ${
                active ? "text-white" : "text-black/50 group-hover:text-white"
              }`}
            />
          ) : null}
          <span className="whitespace-nowrap flex-1">{label}</span>
        </span>
      </Link>
    );
  };

  const renderDocuments = (isMobile = false) => {
    const docsActive = pathname.startsWith("/admin/documents/");
    return (
      <div>
        <button
          type="button"
          onClick={() => setDocsOpen((prev) => !prev)}
          className={`${linkBase} w-full ${docsActive ? linkActive : linkInactive}`}
        >
          <span className="flex items-center gap-2">
            <FileText
              className={`h-4 w-4 ${
                docsActive
                  ? "text-white"
                  : "text-black/50 group-hover:text-white"
              }`}
            />
            <span className="flex-1 text-left">Documents</span>
            {docsOpen ? (
              <ChevronUp
                className={`h-4 w-4 ${
                  docsActive
                    ? "text-white"
                    : "text-black/50 group-hover:text-white"
                }`}
              />
            ) : (
              <ChevronDown
                className={`h-4 w-4 ${
                  docsActive
                    ? "text-white"
                    : "text-black/50 group-hover:text-white"
                }`}
              />
            )}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {docsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-3 mt-2 space-y-1 overflow-hidden"
            >
              {documentLinks.map(({ label, href }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => {
                      if (isMobile) setDrawerOpen(false);
                    }}
                    className={`${linkBase} ${
                      active
                        ? linkActive
                        : "text-black/70 hover:bg-black hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const BrandHeader = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? "px-4 py-3" : "p-5"}>
      <Link href="/admin" className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl border border-black/10 overflow-hidden bg-white">
          <img
            src="/logo.png"
            alt="CollabGlam logo"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="leading-tight">
          <div
            className={
              compact ? "text-sm font-extrabold" : "text-base font-extrabold"
            }
          >
            CollabGlam
          </div>
          <div className="text-xs text-black/60" />
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {/* Mobile Topbar */}
      <header
        className={`${outfit.className} md:hidden fixed inset-x-0 top-0 z-50 h-12 bg-white border-b border-black/10 flex items-center px-4`}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-black/5 focus:outline-none"
        >
          <Menu className="h-6 w-6 text-black/80" />
        </button>

        <div className="ml-3">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl border border-black/10 overflow-hidden bg-white">
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

      {/* Desktop Sidebar */}
      <aside
        className={`${outfit.className} hidden md:flex md:fixed md:inset-y-0 md:left-0 w-64 border-r border-black/10 bg-white h-screen flex-col`}
      >
        {/* Header */}
        <BrandHeader compact={false} />

        {/* Middle (scrolls) */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <nav className="space-y-1">
            {navItems.map((item) => renderLink(item))}
            {renderDocuments(false)}
          </nav>
        </div>

        {/* Bottom (pinned) */}
        <div className="shrink-0 p-3 border-t border-black/10">
          <button
            onClick={handleLogout}
            className={`${linkBase} w-full ${linkInactive}`}
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-black/50 group-hover:text-white" />
              <span>Logout</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
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
              className={`${outfit.className} fixed inset-y-0 left-0 z-50 w-64 border-r border-black/10 bg-white h-screen flex flex-col`}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <div className="h-12 flex items-center justify-between border-b border-black/10">
                <BrandHeader compact />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="mr-2 p-2 rounded-lg hover:bg-black/5 focus:outline-none"
                >
                  <X className="h-6 w-6 text-black/80" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3 pt-3">
                <nav className="space-y-1">
                  {navItems.map((item) =>
                    renderLink(item, () => setDrawerOpen(false)),
                  )}
                  {renderDocuments(true)}
                </nav>
              </div>

              <div className="shrink-0 p-3 border-t border-black/10">
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
