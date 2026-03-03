// app/brand/layout.tsx (wherever you use this)
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import BrandScaffold from "@/components/ui/brand/brandScaffold";

export default function BrandAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const NO_SCAFFOLD_ROUTES = ["/brand/login", "/brand/signup", "/brand/forgot-password", "/brand/onboarding"];

  const skipScaffold = NO_SCAFFOLD_ROUTES.some(
    (route) => pathname === route
  );

  if (skipScaffold) return <>{children}</>;

  return (
    <div className="h-dvh overflow-hidden">
      <BrandScaffold>{children}</BrandScaffold>
    </div>
  );
}
