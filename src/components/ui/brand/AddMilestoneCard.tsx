import React, { useEffect, useMemo, useState } from "react";
import { X, ChevronDown, Minus, Plus, Clock3 } from "lucide-react";

import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { Button } from "@/components/ui/buttonComp";
import { FloatingInput } from "@/components/ui/floatingInput";
import { ProductImagesUpload } from "@/components/ui/upload-card";
import { FloatingDateInput } from "@/components/ui/date";
import { FloatingSelect, SelectItem } from "@/components/ui/selectComp";

const fieldLabelClass =
  "mb-2 block text-[12px] font-medium leading-4 text-[#4D4D4D]";

const deliveryOptions = [
  { value: "static_post", label: "Static post" },
  { value: "carousel", label: "Carousel" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
  { value: "video", label: "Video" },
];

type AddMilestoneCardProps = {
  open: boolean;
  onClose: () => void;
  contractId?: string;
  campaignId?: string;
  influencerId?: string;
  influencerName?: string;
  onSubmit?: () => void;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className={fieldLabelClass}>{children}</label>;
}

function DeliveryCounter({
  count,
  onDecrease,
  onIncrease,
}: {
  count: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex h-11 items-center overflow-hidden rounded-[10px] border border-[#D6D6D6] bg-[#F8F8F8]">
      <button
        type="button"
        onClick={onDecrease}
        className="grid h-full w-11 place-items-center text-[#1A1A1A] transition hover:bg-[#F1F1F1]"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="grid h-full min-w-[2.75rem] place-items-center border-x border-[#D6D6D6] bg-white text-sm font-medium text-[#1A1A1A]">
        {count}
      </div>
      <button
        type="button"
        onClick={onIncrease}
        className="grid h-full w-11 place-items-center text-[#1A1A1A] transition hover:bg-[#F1F1F1]"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AddMilestoneCard({
  open,
  onClose,
  contractId,
  campaignId,
  influencerId,
  influencerName,
  onSubmit,
}: AddMilestoneCardProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [descriptionAttachment, setDescriptionAttachment] = useState<File | null>(null);
  const [needsDraftFirst, setNeedsDraftFirst] = useState(false);
  const [deliveries, setDeliveries] = useState<string[]>([""]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const deliveryCount = deliveries.length;

  const handleAddDelivery = () => {
    setDeliveries((prev) => [...prev, ""]);
  };

  const handleRemoveDelivery = () => {
    setDeliveries((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const handleDeliveryChange = (index: number, value: string) => {
    setDeliveries((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const modalSubtitle = useMemo(() => {
    if (!influencerName) return "";
    return `for ${influencerName}`;
  }, [influencerName]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6"
      onClick={onClose}
    >
      <div
        className="flex w-[48.6875rem] max-w-full flex-col items-end gap-8 rounded-[1rem] bg-white px-7 py-5 shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between border-b border-[#F0F0F0] pb-4">
          <div>
            <h2 className="text-[1.25rem] font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
              Create Milestone
            </h2>
            {modalSubtitle ? (
              <p className="mt-1 text-xs text-[#7A7A7A]">{modalSubtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-[#666666] transition hover:bg-[#F5F5F5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="w-full space-y-4">
          <FloatingInput label="Milestone Name *" />

          <LabeledTextarea
            label="Description"
            placeholder="Describe your campaign goals, product details, and what creators should focus on."
            rows={5}
            maxLength={500}
            showCharCount
            showAttachment
            attachmentLabel="Attachment"
            attachment={descriptionAttachment}
            onAttachmentChange={setDescriptionAttachment}
            accept="image/*,.pdf,.doc,.docx"
          />

          <ProductImagesUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
          />

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <div>
              <FieldLabel>Deliveries *</FieldLabel>
              <div className="space-y-3">
                {deliveries.map((delivery, index) => (
                  <FloatingSelect
                    key={`delivery-${index}`}
                    label={index === 0 ? "Select delivery" : `Select delivery ${index + 1}`}
                    value={delivery}
                    onValueChange={(value) => handleDeliveryChange(index, value)}
                    searchable={false}
                  >
                    {deliveryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>&nbsp;</FieldLabel>
              <DeliveryCounter
                count={deliveryCount}
                onDecrease={handleRemoveDelivery}
                onIncrease={handleAddDelivery}
              />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_11.5rem] gap-3">
            <FloatingDateInput label="Start Date *" />

            <FloatingDateInput label="End Date *" />

            <div>
              <FieldLabel>&nbsp;</FieldLabel>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-[10px] border border-[#1A1A1A] bg-white px-3 text-sm text-[#1A1A1A] transition hover:bg-[#FAFAFA]"
              >
                <span>Add grace days</span>
                <Clock3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <FloatingInput label="Submission link *" />

          <label className="flex items-center gap-2 text-sm text-[#666666]">
            <input
              type="checkbox"
              checked={needsDraftFirst}
              onChange={(e) => setNeedsDraftFirst(e.target.checked)}
              className="h-4 w-4 rounded border-[#D9D9D9]"
            />
            I need a draft first
          </label>

          {needsDraftFirst ? <FloatingDateInput label="Add draft date" /> : null}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 rounded-lg px-4 text-sm font-medium text-[#4D4D4D] hover:bg-[#F5F5F5]"
          >
            Discard
          </Button>

          <Button
            type="button"
            onClick={onSubmit}
            className="h-10 rounded-lg bg-[#1A1A1A] px-4 text-sm font-medium text-white hover:bg-black"
          >
            Create Milestone
          </Button>
        </div>
      </div>
    </div>
  );
}
