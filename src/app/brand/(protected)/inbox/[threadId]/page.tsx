import React from "react";
import BrandInboxMailDetailPage from "./BrandInboxDetailsPageContent";
export default function BrandInboxPage() {
  return (
    <React.Suspense fallback={<BrandInboxPageFallback />}>
      <BrandInboxMailDetailPage />
    </React.Suspense>
  );
}

function BrandInboxPageFallback() {
  return (
    <div className="min-h-screen bg-[#f7f7f8] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-full flex-col rounded-[24px] border border-border/60 bg-white shadow-sm">
        <div className="px-4 py-10 text-sm text-muted-foreground">
          Loading inbox...
        </div>
      </div>
    </div>
  );
}