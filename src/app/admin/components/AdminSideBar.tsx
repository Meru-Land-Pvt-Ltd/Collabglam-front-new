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
  X,
} from "lucide-react";
import api from "@/lib/api";
import {
  ADMIN_MODULES,
  hasModuleAccess,
} from "@/app/admin/components/admin-access";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

type Permission = {
  key?: string;
};

type MeResponse = {
  role?: string;
  permissions?: Permission[];
  access?: Permission[];
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

function isActivePath(pathname: string, href: string) {
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    documents: pathname.startsWith("/admin/documents"),
  });

  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState("");
  const [permissionsLoading, setPermissionsLoading] = useState(true);

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

    const fetchPermissions = async () => {
      try {
        const response = await api.get("/admins/me");
        const me: MeResponse = response.data?.data || response.data || {};
        const permissions: Permission[] = me.permissions ?? me.access ?? [];
        const keys = permissions.map((item) => item?.key).filter(Boolean) as string[];

        if (mounted) {
          setPermissionKeys(keys);
          setCurrentRole(String(me.role || "").toLowerCase());
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        if (mounted) {
          setPermissionKeys([]);
          setCurrentRole("");
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

  const showAllModules = currentRole === "super_admin";

  const allowedSidebarItems = useMemo(() => {
    if (showAllModules) return ADMIN_MODULES;

    return ADMIN_MODULES.filter((item) => hasModuleAccess(permissionKeys, item.key));
  }, [permissionKeys, showAllModules]);

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

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <nav className="space-y-1">
            {allowedSidebarItems.map((item) => renderSidebarItem(item))}
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