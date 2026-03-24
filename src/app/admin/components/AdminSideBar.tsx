"use client";

import React from "react";
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
  Users,
  X,
} from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

type IconType = React.ComponentType<{ className?: string }>;

type NavItem = {
  key: string;  
  label: string;
  href: string;
  icon?: IconType;
};

type DocumentLink = {
  key: string;
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  {
    key: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    key: "brands",
    label: "Brands",
    href: "/admin/brands",
    icon: Home,
  },
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
    key: "influencer-pipeline",
    label: "Influencer Pipeline",
    href: "/admin/influencer-pipeline",
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
  {
    key: "role",
    label: "Role",
    href: "/admin/role",
    icon: MailCheckIcon,
  },
  {
    key: "influencer-data",
    label: "Influencer Data",
    href: "/admin/influencer-data",
    icon: MailCheckIcon,
  },
];

const documentLinks: DocumentLink[] = [
  {
    key: "contact-us",
    label: "Contact US Page Email",
    href: "/admin/documents/contact-us",
  },
  {
    key: "faqs",
    label: "FAQs",
    href: "/admin/documents/faqs",
  },
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
    key: "shipping-delivery",
    label: "Shipping & Delivery Policy",
    href: "/admin/documents/shipping-delivery",
  },
  {
    key: "return-policy",
    label: "Returns Policy",
    href: "/admin/documents/return-policy",
  },
];

const drawerVariants = {
  hidden: { x: "-100%" },
  visible: { x: "0%" },
};

const linkBase =
  "group block rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none";
const linkActive = "bg-black text-white";
const linkInactive = "text-black/80 hover:bg-black hover:text-white";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [docsOpen, setDocsOpen] = React.useState(
    pathname.startsWith("/admin/documents/"),
  );

  React.useEffect(() => {
    if (pathname.startsWith("/admin/documents/")) {
      setDocsOpen(true);
    }
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const isActive = React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );

  const handleLogout = React.useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {
      // ignore storage errors
    }
    router.replace("/admin/login");
  }, [router]);

  const renderNavLink = React.useCallback(
    (item: NavItem, onClick?: () => void) => {
      const active = isActive(item.href);
      const Icon = item.icon;

      return (
        <Link
          href={item.href}
          onClick={onClick}
          className={`${linkBase} ${active ? linkActive : linkInactive}`}
        >
          <span className="flex items-center gap-2">
            {Icon ? (
              <Icon
                className={`h-4 w-4 ${active ? "text-white" : "text-black/50 group-hover:text-white"
                  }`}
              />
            ) : null}
            <span className="flex-1 whitespace-nowrap">{item.label}</span>
          </span>
        </Link>
      );
    },
    [isActive],
  );

  const renderDocuments = (isMobile = false) => {
    const docsActive = pathname.startsWith("/admin/documents/");

    return (
      <div>
        <button
          type="button"
          onClick={() => setDocsOpen((prev) => !prev)}
          className={`${linkBase} w-full ${docsActive ? linkActive : linkInactive
            }`}
        >
          <span className="flex items-center gap-2">
            <FileText
              className={`h-4 w-4 ${docsActive ? "text-white" : "text-black/50 group-hover:text-white"
                }`}
            />
            <span className="flex-1 text-left">Documents</span>
            {docsOpen ? (
              <ChevronUp
                className={`h-4 w-4 ${docsActive
                    ? "text-white"
                    : "text-black/50 group-hover:text-white"
                  }`}
              />
            ) : (
              <ChevronDown
                className={`h-4 w-4 ${docsActive
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
              {documentLinks.map((doc) => {
                const active = isActive(doc.href);

                return (
                  <Link
                    key={doc.key}
                    href={doc.href}
                    onClick={() => {
                      if (isMobile) setDrawerOpen(false);
                    }}
                    className={`${linkBase} ${active
                        ? linkActive
                        : "text-black/70 hover:bg-black hover:text-white"
                      }`}
                  >
                    {doc.label}
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
        <div className="h-10 w-10 overflow-hidden rounded-xl border border-black/10 bg-white">
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
        </div>
      </Link>
    </div>
  );

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
            <div className="h-8 w-8 overflow-hidden rounded-xl border border-black/10 bg-white">
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
        <BrandHeader compact={false} />

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <React.Fragment key={item.key}>
                {renderNavLink(item)}
              </React.Fragment>
            ))}
            {renderDocuments(false)}
          </nav>
        </div>

        <div className="shrink-0 border-t border-black/10 p-3">
          <button
            onClick={handleLogout}
            className={`${linkBase} ${linkInactive} w-full`}
          >
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
                  {navItems.map((item) => (
                    <React.Fragment key={item.key}>
                      {renderNavLink(item, () => setDrawerOpen(false))}
                    </React.Fragment>
                  ))}
                  {renderDocuments(true)}
                </nav>
              </div>

              <div className="shrink-0 border-t border-black/10 p-3">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    handleLogout();
                  }}
                  className={`${linkBase} ${linkInactive} w-full`}
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