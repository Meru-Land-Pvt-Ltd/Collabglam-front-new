import dynamic from "next/dynamic";

const MinimalPdfPreview = dynamic(
  () => import("@/components/ui/MinimalPdfPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading PDF preview...
      </div>
    ),
  }
);
import { Eye } from "lucide-react";
import { HiX } from "react-icons/hi";

function InfluencerSidebarShell({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  previewUrl,
  previewBlob,
  footer,
  sidebarOffset,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  subtitle: string;
  previewUrl: string;
  previewBlob: Blob | null;
  footer: React.ReactNode;
  sidebarOffset?: number;
}) {
  return (
    <div
      className={`fixed inset-y-0 right-0 isolate transition-[left] duration-300 ease-out ${
        isOpen ? "" : "pointer-events-none"
      }`}
      style={{ left: `${sidebarOffset}px` }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute inset-0 overflow-hidden border-l border-gray-200 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="relative z-10 h-20 border-b border-[#e5e5e5] bg-white">
          <div className="flex h-full items-center justify-between px-6">
            <div className="min-w-0">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9d9d9d]">
                {title}
              </div>
              <div className="truncate text-lg font-bold text-[#1a1a1a]">
                {subtitle}
              </div>
            </div>

            <button
              type="button"
              className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#9d9d9d] transition-all duration-150 hover:bg-[#f7f7f7] hover:text-[#1a1a1a]"
              onClick={onClose}
              aria-label="Close"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 flex h-[calc(100%-160px)] bg-white">
          {/* Left */}
          <div className="h-full w-full overflow-auto space-y-5 px-6 py-5 xl:w-1/2">
            {children}
          </div>

          {/* Right */}
          {previewUrl ? (
            <div className="hidden xl:flex xl:w-1/2 flex-col border-l border-gray-100 bg-white">
              <div className="min-h-0 flex-1">
                {previewBlob ? <MinimalPdfPreview file={previewBlob} /> : null}
              </div>
            </div>
          ) : (
            <div className="hidden xl:flex xl:w-1/2 items-center justify-center border-l border-gray-100 bg-white p-6 text-gray-400">
              <div className="text-center">
                <Eye className="mx-auto mb-2 h-8 w-8" />
                <div className="text-sm">Generate a preview to see the PDF here</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 min-h-[80px] border-t border-gray-200 bg-white px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfluencerSidebarShell;