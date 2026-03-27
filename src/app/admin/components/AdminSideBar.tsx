"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Outfit } from "next/font/google";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  Shield,
  UserCircle2,
  X,
} from "lucide-react";
import api from "@/lib/api";
import {
  ADMIN_MODULES,
  canonicalizeModuleKey,
  hasModuleAccess,
} from "@/app/admin/components/admin-access";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

type Permission = {
  key?: string;
};

type AdminUser = {
  _id?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
  permissions?: Permission[];
  access?: Permission[];
};

type MeResponse = {
  data?: AdminUser;
  role?: string;
  permissions?: Permission[];
  access?: Permission[];
  email?: string;
  name?: string;
  status?: string;
};

const ROLES = {
  SUPER_ADMIN: "super_admin",
  REVENUE_HEAD: "revenue_head",
  IME: "ime",
  BME: "bme",
} as const;

/**
 * Fallback module access per role.
 * Backend `access` / `permissions` still takes priority.
 * Dashboard added for all roles.
 */
const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: ADMIN_MODULES.map((item) => item.key),

  [ROLES.REVENUE_HEAD]: [
    "dashboard",
    "brands",
    "campaigns",
    "subscriptions",
    "invoiceDetails",
    "payment",
    "disputes",
    "notifications",
    "documents",
  ],

  [ROLES.IME]: [
    "dashboard",
    "influencers",
    "influencer-data",
    "influencer-pipeline",
    "influencerdetails",
    "invitedInfluencer",
    "modash",
    "messages",
    "inbound-emails",
    "youtube",
    "documents",
  ],

  [ROLES.BME]: [
    "dashboard",
    "brands",
    "campaigns",
    "messages",
    "inbound-emails",
    "youtube",
    "documents",
  ],
};

const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.REVENUE_HEAD]: "Revenue Head",
  [ROLES.IME]: "IME",
  [ROLES.BME]: "BME",
};

const drawerVariants = {
  hidden: { x: "-100%" },
  visible: { x: "0%" },
};

const linkBase =
  "group block rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none";
const linkActive = "bg-black text-white";
const linkInactive = "text-black/80 hover:bg-black hover:text-white";
const subLinkInactive = "text-black/70 hover:bg-black hover:text-white";

function normalizeRole(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
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
  icon: React.ElementType;
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
            className={`h-4 w-4 ${
              isActive ? "text-white" : "text-black/50 group-hover:text-white"
            }`}
          />
          <span className="flex-1 text-left">{title}</span>
          {isOpen ? (
            <ChevronUp
              className={`h-4 w-4 ${
                isActive ? "text-white" : "text-black/50 group-hover:text-white"
              }`}
            />
          ) : (
            <ChevronDown
              className={`h-4 w-4 ${
                isActive ? "text-white" : "text-black/50 group-hover:text-white"
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
  const [bootstrapped, setBootstrapped] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    documents: pathname.startsWith("/admin/documents"),
  });

  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  useEffect(() => {
    if (pathname.startsWith("/admin/documents")) {
      setOpenSections((prev) => ({ ...prev, documents: true }));
    }
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    let mounted = true;

    const bootstrapAndFetch = async () => {
      try {
        if (typeof window !== "undefined") {
          const storedRole = normalizeRole(localStorage.getItem("adminRole") || "");
          const storedName = String(localStorage.getItem("adminName") || "");
          const storedEmail = String(localStorage.getItem("userEmail") || "");
          const storedStatus = String(localStorage.getItem("adminStatus") || "");

          let storedPermissions: string[] = [];

          try {
            const storedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
            const permissionObjects: Permission[] =
              storedAdmin?.permissions ?? storedAdmin?.access ?? [];
            storedPermissions = permissionObjects
              .map((item) => canonicalizeModuleKey(item?.key))
              .filter(Boolean);
          } catch {
            storedPermissions = [];
          }

          if (mounted) {
            setCurrentRole(storedRole);
            setPermissionKeys(storedPermissions);
            setAdminName(storedName);
            setAdminEmail(storedEmail);
            setAdminStatus(storedStatus);
            setBootstrapped(true);
          }
        } else if (mounted) {
          setBootstrapped(true);
        }

        const response = await api.get("/admins/me");
        const raw: MeResponse = response?.data || {};
        const me: AdminUser = raw?.data || raw || {};

        const roleFromApi = normalizeRole(me.role || raw.role || "");
        const permissionObjects: Permission[] =
          me.permissions ?? me.access ?? raw.permissions ?? raw.access ?? [];

        const normalizedPermissionKeys = permissionObjects
          .map((item) => canonicalizeModuleKey(item?.key))
          .filter(Boolean);

        if (mounted) {
          if (roleFromApi) {
            setCurrentRole(roleFromApi);
            if (typeof window !== "undefined") {
              localStorage.setItem("adminRole", roleFromApi);
            }
          }

          setPermissionKeys(normalizedPermissionKeys);
          setAdminName(String(me.name || raw.name || ""));
          setAdminEmail(String(me.email || raw.email || ""));
          setAdminStatus(String(me.status || raw.status || ""));

          if (typeof window !== "undefined") {
            if (me.name || raw.name) {
              localStorage.setItem("adminName", String(me.name || raw.name || ""));
            }
            if (me.email || raw.email) {
              localStorage.setItem("userEmail", String(me.email || raw.email || ""));
            }
            if (me.status || raw.status) {
              localStorage.setItem("adminStatus", String(me.status || raw.status || ""));
            }

            const existingAdmin = (() => {
              try {
                return JSON.parse(localStorage.getItem("admin") || "{}");
              } catch {
                return {};
              }
            })();

            localStorage.setItem(
              "admin",
              JSON.stringify({
                ...existingAdmin,
                ...me,
                role: roleFromApi || existingAdmin?.role || "",
                access: permissionObjects,
              })
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
      }
    };

    bootstrapAndFetch();

    return () => {
      mounted = false;
    };
  }, []);

  const isSuperAdmin = currentRole === ROLES.SUPER_ADMIN;
  const isRevenueHead = currentRole === ROLES.REVENUE_HEAD;
  const isIME = currentRole === ROLES.IME;
  const isBME = currentRole === ROLES.BME;

  const allowedSidebarItems = useMemo(() => {
    if (isSuperAdmin) return ADMIN_MODULES;

    if (permissionKeys.length > 0) {
      return ADMIN_MODULES.filter((item) =>
        hasModuleAccess(permissionKeys, item.key)
      );
    }

    const fallbackKeys =
      DEFAULT_ROLE_MODULES[currentRole]?.map((item) => canonicalizeModuleKey(item)) || [];

    return ADMIN_MODULES.filter((item) =>
      fallbackKeys.includes(canonicalizeModuleKey(item.key))
    );
  }, [currentRole, permissionKeys, isSuperAdmin]);

  const roleLabel = useMemo(() => {
    if (!currentRole) return "Admin";
    return ROLE_LABELS[currentRole] || currentRole;
  }, [currentRole]);

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    } catch {
      // ignore
    }

    router.replace("/admin/login");
  };

  const renderSectionLink = (
    item: { href: string; label: string },
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

  const renderSidebarItem = (
    item: (typeof ADMIN_MODULES)[number],
    isMobile = false
  ) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;

    if (item.children?.length) {
      const isOpen = Boolean(openSections[item.key]);

      return (
        <CollapsibleSection
          key={item.key}
          title={item.label}
          icon={Icon}
          isOpen={isOpen}
          isActive={active}
          onToggle={() =>
            setOpenSections((prev) => ({
              ...prev,
              [item.key]: !prev[item.key],
            }))
          }
        >
          {item.children.map((child) => renderSectionLink(child, isMobile))}
        </CollapsibleSection>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => {
          if (isMobile) setDrawerOpen(false);
        }}
        className={`${linkBase} ${active ? linkActive : linkInactive}`}
      >
        <span className="flex items-center gap-2">
          <Icon
            className={`h-4 w-4 ${
              active ? "text-white" : "text-black/50 group-hover:text-white"
            }`}
          />
          <span className="flex-1 whitespace-nowrap">{item.label}</span>
        </span>
      </Link>
    );
  };

  if (!bootstrapped) return null;

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
        <BrandHeader />

        <div className="px-3 pb-3">
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-black/5 p-2">
                <UserCircle2 className="h-5 w-5 text-black/70" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-black">
                  {adminName || "Admin User"}
                </p>
                <p className="truncate text-xs text-black/50">
                  {adminEmail || "No email"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {roleLabel}
                  </span>

                  {adminStatus ? (
                    <span className="inline-flex items-center rounded-full border border-black/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-black/60">
                      {adminStatus}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <nav className="space-y-1">
            {allowedSidebarItems.map((item) => renderSidebarItem(item))}
          </nav>

          {!isSuperAdmin && permissionKeys.length === 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Showing fallback modules for <strong>{roleLabel}</strong>.
              Add backend <code>access</code> / <code>permissions</code> for stricter control.
            </div>
          )}
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

              <div className="px-3 pb-3 pt-3">
                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-black/5 p-2">
                      <Shield className="h-5 w-5 text-black/70" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-black">
                        {adminName || "Admin User"}
                      </p>
                      <p className="truncate text-xs text-black/50">
                        {adminEmail || "No email"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                          {roleLabel}
                        </span>

                        {adminStatus ? (
                          <span className="inline-flex items-center rounded-full border border-black/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-black/60">
                            {adminStatus}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3">
                <nav className="space-y-1">
                  {allowedSidebarItems.map((item) => renderSidebarItem(item, true))}
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