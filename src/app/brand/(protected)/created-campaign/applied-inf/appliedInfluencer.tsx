import React from "react";

const HelloWorld: React.FC = () => {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
};

export default HelloWorld;


// "use client";

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import dynamic from "next/dynamic";
// import Swal from "sweetalert2";
// import api, { post } from "@/lib/api";
// import { Button } from "@/components/ui/buttonComp";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Badge } from "@/components/ui/badge";
// import InfluencerFilter, {
//   type FilterState,
// } from "@/components/ui/brand/InfluencerFilter";
// import {
//   InfluencerTable,
//   type InfluencerRow,
//   type PlatformType,
// } from "@/components/ui/brand/Influencertable";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import AddMilestoneCard from "@/components/ui/brand/AddMilestoneCard";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import {
//   Combobox,
//   ComboboxContent,
//   ComboboxEmpty,
//   ComboboxItem,
//   ComboboxList,
//   ComboboxTrigger,
// } from "@/components/ui/combobox";
// import {
//   CaretLeft,
//   CaretRight,
//   ClipboardText,
//   DotsThree,
//   EnvelopeOpen,
//   Eye,
//   EyeSlash,
//   FileText,
//   Info,
//   LockSimple,
//   MagnifyingGlass,
//   PaperPlaneTilt,
//   PenNib,
//   SealCheck,
//   Signature,
//   WarningCircle,
// } from "@phosphor-icons/react";
// import { FloatingInput } from "@/components/ui/floatingInput";
// import {
//   FloatingMultiSelect,
//   FloatingSelect,
//   SelectItem,
// } from "@/components/ui/selectComp";
// import { LabeledTextarea } from "@/components/ui/textAreaComp";
// import { FloatingDateInput } from "@/components/ui/date";
// import { FloatingTagInput } from "@/components/ui/tagInput";
// import { apiListCountries } from "@/app/brand/services/brandApi";
// import { apiGetfetchBulkInfleuncerId } from "@/app/influencer/services/influencerApi";
// export type Party = "brand" | "influencer";
// export type CampaignType = "fixed_payment" | "milestone_based" | "product_gifting";

// type FieldKind = "text" | "textarea" | "date" | "number" | "select" | "radio" | "multi";
// type Option = { value: string; label: string };
// type RequiredRule = boolean | ((values: LaneAContractValues) => boolean);

// type ObjectionEntry = {
//   by: Party;
//   text: string;
//   updatedAt?: string;
// };

// export type MilestoneRow = {
//   id: string;
//   milestoneName: string;
//   paymentAmount: string;
//   triggerEvent: string;
//   dueDate: string;
// };

// export type LaneAContractValues = {
//   campaignType: CampaignType;

//   brandLegalName: string;
//   campaignTitleId: string;
//   brandContactNameTitle: string;
//   brandNoticeEmailPhone: string;
//   brandBillingAddress: string;
//   productsServicesCovered: string;
//   territoryTargetCountry: string;
//   effectiveDate: string;

//   influencerLegalName: string;
//   postingHandleUrl: string;
//   influencerContactEmailPhone: string;
//   influencerMailingAddress: string;

//   platforms: string[];
//   deliverableFormat: string;
//   numberOfDeliverables: string;
//   draftDueDate: string;
//   livePostingDate: string;
//   minimumLivePeriod: string;
//   videoLengthFormatSpecs: string;
//   includedRevisionRounds: string;
//   brandReviewSlaBusinessDays: string;
//   mandatoryTagsLinks: string;
//   additionalRevisionFee: string;
//   preShootScriptRequired: string;
//   scriptDueDate: string;
//   reshootObligation: string;

//   fixedTotalCampaignFee: string;
//   paymentStructure: string;
//   customSplitDetails: string;
//   advancePaymentTrigger: string;
//   balancePaymentTrigger: string;
//   fixedProcessorFeesBorneBy: string;
//   fixedKillFee: string;
//   fixedPayoutMethod: string;
//   fixedPayoutAccountId: string;
//   fixedTaxId: string;

//   milestoneTotalCampaignFee: string;
//   milestoneProcessorFeesBorneBy: string;
//   milestoneKillFee: string;
//   milestones: MilestoneRow[];
//   milestonePayoutMethod: string;
//   milestonePayoutAccountId: string;

//   estimatedRetailValue: string;
//   receiptConfirmationDeadline: string;
//   productDisposition: string;
//   returnWindow: string;
//   returnShippingMethod: string;
//   returnPackagingInstructions: string;
//   itemsToKeepReturn: string;
//   shipToName: string;
//   shippingAddress: string;
//   shippingPhoneNumber: string;
//   deliveryInstructions: string;

//   cashCompensationModel: string;
//   cashFeeAmount: string;
//   cashPaymentTrigger: string;
//   cashProcessorFeesBorneBy: string;
//   affiliateCommissionRate: string;
//   affiliateLinkCode: string;
//   commissionReportingPeriod: string;
//   giftingCashPayoutMethod: string;
//   giftingCashPayoutAccountId: string;

//   grantedUsageRights: string[];
//   usageRightsDuration: string;
//   editingRights: string;
//   musicAssetResponsibility: string;
//   attributionRequirement: string;
//   rawSourceFileDelivery: string;

//   analyticsReportingDeadline: string;
//   requiredAnalyticsItems: string[];

//   competitorExclusivity: string;
//   competitorCategoryList: string;
//   exclusivityPeriod: string;
//   creativeBrief: string;
//   prohibitedStatements: string;
//   moralsClause: string;
//   ftcAcknowledgement: string;

//   governingLaw: string;
//   disputeResolutionMethod: string;
//   venueSeat: string;
//   attorneysFees: string;
//   noBypassPeriod: string;

//   objections: Record<string, ObjectionEntry>;
// };

// type FieldDef = {
//   key: keyof LaneAContractValues;
//   label: string;
//   owner: Party;
//   kind: FieldKind;
//   placeholder?: string;
//   tooltip?: string;
//   required?: RequiredRule;
//   options?: Option[];
//   private?: boolean;
//   showWhen?: (values: LaneAContractValues) => boolean;
//   sectionHint?: string;
// };

// export type LaneAContractEditorProps = {
//   value: LaneAContractValues;
//   onChange: React.Dispatch<React.SetStateAction<LaneAContractValues>>;
//   viewerParty: Party;
//   onViewerPartyChange: (party: Party) => void;
//   fieldErrors?: Record<string, string>;
//   className?: string;
// };

// const DEFAULT_TIMEZONE = "America/Los_Angeles";
// const PAGE_SIZE = 10;

// const TAG_STYLE_FIELDS = new Set<keyof LaneAContractValues>([
//   "mandatoryTagsLinks",
//   "competitorCategoryList",
// ]);

// function toControlState(error?: string) {
//   return error ? ("error" as const) : undefined;
// }

// function csvToTags(raw: string) {
//   return String(raw || "")
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// function tagsToCsv(tags: string[]) {
//   return tags.join(", ");
// }

// const PLATFORM_OPTIONS: Option[] = [
//   { value: "Instagram", label: "Instagram" },
//   { value: "TikTok", label: "TikTok" },
//   { value: "YouTube", label: "YouTube" },
// ];
// const YES_NO_BOOL_OPTIONS = [
//   { value: "yes", label: "Yes" },
//   { value: "no", label: "No" },
// ];
// const CAMPAIGN_TYPE_OPTIONS: Option[] = [
//   { value: "fixed_payment", label: "Fixed Payment" },
//   { value: "milestone_based", label: "Milestone-Based" },
//   // { value: "product_gifting", label: "Product Gifting" },
// ];

// const DELIVERABLE_FORMAT_OPTIONS: Option[] = [
//   { value: "Dedicated Video", label: "Dedicated Video" },
//   { value: "Integrated Video", label: "Integrated Video" },
//   { value: "Reel", label: "Reel" },
//   { value: "Story Set", label: "Story Set" },
//   { value: "Static Post", label: "Static Post" },
//   { value: "UGC (Raw Files Only)", label: "UGC (Raw Files Only)" },
//   { value: "Live Stream", label: "Live Stream" },
// ];

// const YES_NO_SCRIPT_OPTIONS: Option[] = [
//   { value: "No", label: "No" },
//   { value: "Yes", label: "Yes — Script Must Be Submitted First" },
// ];

// const RESHOOT_OPTIONS: Option[] = [
//   { value: "No reshoot required", label: "No reshoot required" },
//   { value: "Only if brief not followed", label: "Only if brief not followed" },
//   { value: "One reshoot included", label: "One reshoot included" },
// ];

// const ADVANCE_PAYMENT_TRIGGER_OPTIONS: Option[] = [
//   { value: "On Signing", label: "On Signing" },
//   { value: "On Product Receipt", label: "On Product Receipt" },
//   { value: "On Receipt of Invoice", label: "On Receipt of Invoice" },
//   { value: "On Draft Submitted", label: "On Draft Submitted" },
//   { value: "Other", label: "Other" },
// ];

// const BALANCE_PAYMENT_TRIGGER_OPTIONS: Option[] = [
//   { value: "After Final Draft Approved", label: "After Final Draft Approved" },
//   { value: "After Posting Goes Live", label: "After Posting Goes Live" },
//   { value: "After Analytics Delivered", label: "After Analytics Delivered" },
//   { value: "Other", label: "Other" },
// ];

// const PROCESSOR_FEE_OPTIONS: Option[] = [
//   { value: "Brand", label: "Brand" },
//   { value: "Influencer", label: "Influencer" },
//   { value: "Split Between Both", label: "Split Between Both" },
// ];

// const PAYOUT_METHOD_OPTIONS: Option[] = [
//   { value: "PayPal", label: "PayPal" },
//   { value: "Bank Transfer / ACH", label: "Bank Transfer / ACH" },
//   { value: "Wise", label: "Wise" },
//   { value: "Payoneer", label: "Payoneer" },
//   { value: "CollabGlam Wallet", label: "CollabGlam Wallet" },
// ];

// const PRODUCT_DISPOSITION_OPTIONS: Option[] = [
//   { value: "Keep", label: "Keep — Influencer keeps as a gift" },
//   { value: "Return", label: "Return — Returnable loaner" },
//   { value: "Partial", label: "Partial — Keep some, return others" },
// ];

// const RETURN_SHIPPING_OPTIONS: Option[] = [
//   { value: "Brand Provides Prepaid Label", label: "Brand Provides Prepaid Label" },
//   { value: "Influencer Ships Back", label: "Influencer Ships Back" },
//   { value: "Brand Schedules Courier Pickup", label: "Brand Schedules Courier Pickup" },
// ];

// const CASH_COMP_OPTIONS: Option[] = [
//   { value: "Gifting Only", label: "Gifting Only — No cash" },
//   { value: "Gifting + Fixed Cash Fee", label: "Gifting + Fixed Cash Fee" },
//   { value: "Gifting + Affiliate / Commission", label: "Gifting + Affiliate / Commission" },
// ];

// const CASH_TRIGGER_OPTIONS: Option[] = [
//   { value: "On Signing", label: "On Signing" },
//   { value: "On Product Receipt", label: "On Product Receipt" },
//   { value: "After Draft Approved", label: "After Draft Approved" },
//   { value: "After Posting Goes Live", label: "After Posting Goes Live" },
// ];

// const COMPETITOR_EXCLUSIVITY_OPTIONS: Option[] = [
//   { value: "None", label: "None" },
//   { value: "Applies", label: "Applies" },
// ];

// const MORALS_OPTIONS: Option[] = [
//   { value: "Not Included", label: "Not Included" },
//   { value: "Included", label: "Included" },
// ];

// const EDITING_RIGHTS_OPTIONS: Option[] = [
//   { value: "Cropping / Resizing Only", label: "Cropping / Resizing Only" },
//   { value: "Brand May Create Cutdowns / Clips", label: "Brand May Create Cutdowns / Clips" },
//   { value: "No Edits Without Approval", label: "No Edits Without Approval" },
// ];

// const MUSIC_RESPONSIBILITY_OPTIONS: Option[] = [
//   { value: "Brand Responsible", label: "Brand Responsible" },
//   { value: "Influencer Responsible", label: "Influencer Responsible" },
//   { value: "Custom Arrangement", label: "Custom Arrangement" },
// ];

// const ATTRIBUTION_OPTIONS: Option[] = [
//   { value: "Credit Required", label: "Credit Required" },
//   { value: "No Attribution Required", label: "No Attribution Required" },
// ];

// const RAW_FILE_OPTIONS: Option[] = [
//   { value: "Not Included", label: "Not Included" },
//   { value: "Included", label: "Included" },
// ];

// const DISPUTE_OPTIONS: Option[] = [
//   { value: "State / Federal Courts", label: "State / Federal Courts" },
//   { value: "AAA Arbitration", label: "AAA Arbitration" },
//   { value: "Other", label: "Other" },
// ];

// const ATTORNEYS_FEES_OPTIONS: Option[] = [
//   { value: "Prevailing Party Recovers Fees", label: "Prevailing Party Recovers Fees" },
//   { value: "Each Party Bears Own Fees", label: "Each Party Bears Own Fees" },
//   { value: "Other", label: "Other" },
// ];

// const USAGE_RIGHTS_OPTIONS: Option[] = [
//   { value: "Organic Repost on Brand Social", label: "Organic Repost on Brand Social" },
//   { value: "Website / Product Listing", label: "Website / Product Listing" },
//   { value: "Email / CRM / Internal Decks", label: "Email / CRM / Internal Decks" },
//   { value: "Paid Social / Ads / Boosting", label: "Paid Social / Ads / Boosting" },
//   { value: "Whitelisting / Spark Ads", label: "Whitelisting / Spark Ads" },
//   { value: "Perpetual Rights / Buyout", label: "Perpetual Rights / Buyout" },
// ];

// const ANALYTICS_ITEMS_OPTIONS: Option[] = [
//   { value: "Live Link", label: "Live Link" },
//   { value: "Screenshots", label: "Screenshots" },
//   { value: "Reach / Views", label: "Reach / Views" },
//   { value: "Watch Time", label: "Watch Time" },
//   { value: "Clicks", label: "Clicks" },
//   { value: "Saves / Shares", label: "Saves / Shares" },
//   { value: "Native Insights Access", label: "Native Insights Access" },
// ];

// const PAYMENT_TYPE_OPTIONS: Option[] = [
//   { value: "fixed_payment", label: "Fixed Payment" },
//   { value: "milestone_based", label: "Milestone Based" },
//   // { value: "product_gifting", label: "Product Gifting" },
// ];

// const PAYMENT_STRUCTURE_OPTIONS: Option[] = [
//   { value: "50% advance / 50% balance", label: "50% advance / 50% balance" },
//   { value: "100% upfront", label: "100% upfront" },
//   { value: "100% on completion", label: "100% on completion" },
//   { value: "Custom", label: "Custom" },
// ];

// const ALL_FIELD_DEFS: FieldDef[] = [
//   {
//     key: "campaignType",
//     label: "Campaign Type",
//     owner: "brand",
//     kind: "radio",
//     options: CAMPAIGN_TYPE_OPTIONS,
//     required: true,
//     tooltip: "Select the payment model for this contract. This controls which payment sections appear.",
//   },

//   { key: "brandLegalName", label: "Brand Legal Name", owner: "brand", kind: "text", placeholder: "e.g. Glow Beauty Inc.", tooltip: "Full registered legal name — must match official documents.", required: true },
//   { key: "campaignTitleId", label: "Campaign Title / ID", owner: "brand", kind: "text", placeholder: "e.g. Summer Glow 2025 / CG-0012", tooltip: "Unique campaign name or CollabGlam platform campaign ID.", required: true },
//   { key: "brandContactNameTitle", label: "Brand Contact Name & Title", owner: "brand", kind: "text", placeholder: "e.g. Jane Smith, Marketing Manager", tooltip: "Brand's main person managing this campaign.", required: true },
//   { key: "brandNoticeEmailPhone", label: "Brand Notice Email / Phone", owner: "brand", kind: "text", placeholder: "e.g. campaigns@brand.com", tooltip: "Primary channel for legal notices and campaign updates.", required: true },
//   { key: "brandBillingAddress", label: "Brand Billing Address", owner: "brand", kind: "textarea", placeholder: "e.g. Street, City, State, ZIP", tooltip: "Brand's full billing address for invoicing and records.", required: true },
//   { key: "productsServicesCovered", label: "Products / Services Covered", owner: "brand", kind: "text", placeholder: "e.g. Vitamin C Serum SKU#123", tooltip: "Product names, SKUs, or service descriptions in this campaign.", required: true },
//   { key: "territoryTargetCountry", label: "Territory / Target Country", owner: "brand", kind: "text", placeholder: "e.g. United States, or Worldwide", tooltip: "Geographic region where content will be targeted or distributed.", required: true },
//   { key: "effectiveDate", label: "Effective Date", owner: "brand", kind: "date", tooltip: "Date this agreement takes legal effect.", required: true },
//   { key: "influencerLegalName", label: "Influencer Legal Name / Entity", owner: "influencer", kind: "text", placeholder: "e.g. Jane Doe or Jane Doe LLC", tooltip: "Full legal name or registered business entity name.", required: true },
//   { key: "postingHandleUrl", label: "Posting Handle / Profile URL", owner: "influencer", kind: "text", placeholder: "e.g. @janeglow / instagram.com/j", tooltip: "Main public social handle and profile URL.", required: true },
//   { key: "influencerContactEmailPhone", label: "Influencer Contact Email / Phone", owner: "influencer", kind: "text", placeholder: "e.g. jane@janeglow.com", tooltip: "Primary contact for all campaign communications.", required: true },
//   { key: "influencerMailingAddress", label: "Influencer Mailing Address", owner: "influencer", kind: "textarea", placeholder: "e.g. Street, City, State, ZIP", tooltip: "Address for legal notices.", required: true },

//   { key: "platforms", label: "Platform(s)", owner: "brand", kind: "multi", options: PLATFORM_OPTIONS, tooltip: "Social media platform where content will be published.", required: true },
//   { key: "deliverableFormat", label: "Deliverable Format", owner: "brand", kind: "select", options: DELIVERABLE_FORMAT_OPTIONS, tooltip: "Type of content the influencer must create.", required: true },
//   { key: "numberOfDeliverables", label: "Number of Deliverables", owner: "brand", kind: "number", placeholder: "e.g. 2", tooltip: "Total count of content pieces required.", required: true },
//   { key: "draftDueDate", label: "Draft Due Date", owner: "brand", kind: "date", tooltip: "Deadline for the influencer to submit the first draft for review.", required: true },
//   { key: "livePostingDate", label: "Live / Posting Date", owner: "brand", kind: "date", tooltip: "Date content must be published on the influencer's channel.", required: true },
//   { key: "minimumLivePeriod", label: "Minimum Live Period", owner: "brand", kind: "text", placeholder: "e.g. 12 months", tooltip: "How long the content must remain live and undeleted.", required: true },
//   { key: "videoLengthFormatSpecs", label: "Video Length / Format Specs", owner: "brand", kind: "text", placeholder: "e.g. Min 60s, 9:16 vertical", tooltip: "Technical requirements: duration, aspect ratio, resolution." },
//   { key: "includedRevisionRounds", label: "Included Revision Rounds", owner: "brand", kind: "number", placeholder: "e.g. 1", tooltip: "Free revision cycles included per deliverable.", required: true },
//   { key: "brandReviewSlaBusinessDays", label: "Brand Review SLA (Business Days)", owner: "brand", kind: "number", placeholder: "e.g. 3", tooltip: "Days the brand has to review and respond to submitted drafts.", required: true },
//   { key: "mandatoryTagsLinks", label: "Mandatory Tags / Mentions / Links", owner: "brand", kind: "text", placeholder: "e.g. @BrandHandle, #Ad", tooltip: "Required handles, hashtags, UTM links, or discount codes to include in post." },
//   { key: "additionalRevisionFee", label: "Additional Revision Fee", owner: "brand", kind: "text", placeholder: "e.g. $150 per extra round", tooltip: "Fee charged per revision round beyond the included number." },
//   { key: "preShootScriptRequired", label: "Pre-Shoot Script Required?", owner: "brand", kind: "radio", options: YES_NO_SCRIPT_OPTIONS, tooltip: "Must the influencer submit a script for brand approval before shooting?", required: true },
//   { key: "scriptDueDate", label: "Script Due Date", owner: "brand", kind: "date", tooltip: "Deadline for the influencer to submit the pre-approved script.", required: (v) => v.preShootScriptRequired === "Yes", showWhen: (v) => v.preShootScriptRequired === "Yes" },
//   { key: "reshootObligation", label: "Reshoot Obligation?", owner: "brand", kind: "radio", options: RESHOOT_OPTIONS, tooltip: "Under what circumstances must the influencer reshoot content?" },

//   { key: "fixedTotalCampaignFee", label: "Total Budget", owner: "brand", kind: "text", placeholder: "e.g. $2,500 USD", tooltip: "Total fixed amount the brand will pay for all deliverables.", required: true, showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "paymentStructure", label: "Payment Structure", owner: "brand", kind: "select", options: PAYMENT_STRUCTURE_OPTIONS, tooltip: "How payment is split between advance and balance.", required: true, showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "customSplitDetails", label: "Custom Details", owner: "brand", kind: "text", placeholder: "e.g. 30% on signing, 70% on post", tooltip: "Exact payment split percentages and triggers.", required: (v) => v.campaignType === "fixed_payment" && v.paymentStructure === "Custom", showWhen: (v) => v.campaignType === "fixed_payment" && v.paymentStructure === "Custom" },
//   { key: "advancePaymentTrigger", label: "Advance Payment Trigger", owner: "brand", kind: "select", options: ADVANCE_PAYMENT_TRIGGER_OPTIONS, tooltip: "When is the advance payment released?", required: true, showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "balancePaymentTrigger", label: "Balance Payment Trigger", owner: "brand", kind: "select", options: BALANCE_PAYMENT_TRIGGER_OPTIONS, tooltip: "When is the remaining balance released?", required: true, showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "fixedProcessorFeesBorneBy", label: "Payment Processor Fees Borne By", owner: "brand", kind: "select", options: PROCESSOR_FEE_OPTIONS, tooltip: "Who pays payment processing charges?", required: true, showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "fixedKillFee", label: "Kill Fee / Cancellation Compensation", owner: "brand", kind: "text", placeholder: "e.g. $500 if cancelled after shoot", tooltip: "Compensation owed to influencer if brand cancels without cause.", showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "fixedPayoutMethod", label: "Payout Method on File", owner: "influencer", kind: "select", options: PAYOUT_METHOD_OPTIONS, tooltip: "How the influencer wants to receive payment. PRIVATE — brand cannot see.", required: true, private: true, showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "fixedPayoutAccountId", label: "Payout Account Email / ID", owner: "influencer", kind: "text", placeholder: "e.g. jane@paypal.com", tooltip: "Email or account ID for the influencer's payout method. PRIVATE.", required: true, private: true, showWhen: (v) => v.campaignType === "fixed_payment" },
//   { key: "fixedTaxId", label: "Tax ID (if applicable)", owner: "influencer", kind: "text", placeholder: "e.g. EIN / SSN last 4 / VAT", tooltip: "May be required for processing above IRS thresholds. PRIVATE.", private: true, showWhen: (v) => v.campaignType === "fixed_payment" },

//   { key: "milestoneTotalCampaignFee", label: "Total Budget (All Milestones)", owner: "brand", kind: "text", placeholder: "e.g. $5,000 USD", tooltip: "Total gross amount across all milestones combined.", required: true, showWhen: (v) => v.campaignType === "milestone_based" },
//   { key: "milestoneProcessorFeesBorneBy", label: "Payment Processor Fees Borne By", owner: "brand", kind: "select", options: PROCESSOR_FEE_OPTIONS, tooltip: "Who pays payment processing charges per milestone?", required: true, showWhen: (v) => v.campaignType === "milestone_based" },
//   { key: "milestoneKillFee", label: "Kill Fee / Cancellation Compensation", owner: "brand", kind: "text", placeholder: "e.g. Completed milestones non-refundable", tooltip: "Compensation if brand cancels mid-campaign.", showWhen: (v) => v.campaignType === "milestone_based" },
//   { key: "milestonePayoutMethod", label: "Payout Method on File", owner: "influencer", kind: "select", options: PAYOUT_METHOD_OPTIONS, tooltip: "How the influencer wants to receive each milestone payment. PRIVATE.", required: true, private: true, showWhen: (v) => v.campaignType === "milestone_based" },
//   { key: "milestonePayoutAccountId", label: "Payout Account Email / ID", owner: "influencer", kind: "text", placeholder: "e.g. jane@paypal.com", tooltip: "Email or account ID for payout method. PRIVATE.", required: true, private: true, showWhen: (v) => v.campaignType === "milestone_based" },

//   { key: "estimatedRetailValue", label: "Estimated Retail Value (ERV)", owner: "brand", kind: "text", placeholder: "e.g. $150 USD", tooltip: "Market retail value of gifted products — may have tax implications for influencer.", showWhen: (v) => v.campaignType === "product_gifting" },
//   { key: "receiptConfirmationDeadline", label: "Product Receipt Confirmation Deadline", owner: "brand", kind: "text", placeholder: "e.g. Within 3 business days", tooltip: "How quickly the influencer must confirm receipt after delivery.", required: true, showWhen: (v) => v.campaignType === "product_gifting" },
//   { key: "productDisposition", label: "Product Disposition — Keep or Return?", owner: "brand", kind: "radio", options: PRODUCT_DISPOSITION_OPTIONS, tooltip: "Determines whether the influencer keeps or returns the product after campaign.", required: true, showWhen: (v) => v.campaignType === "product_gifting" },
//   { key: "returnWindow", label: "Return Window", owner: "brand", kind: "text", placeholder: "e.g. Within 7 days after shoot", tooltip: "Timeframe for the influencer to return the product.", required: (v) => v.campaignType === "product_gifting" && ["Return", "Partial"].includes(v.productDisposition), showWhen: (v) => v.campaignType === "product_gifting" && ["Return", "Partial"].includes(v.productDisposition) },
//   { key: "returnShippingMethod", label: "Return Shipping Method", owner: "brand", kind: "select", options: RETURN_SHIPPING_OPTIONS, tooltip: "Who arranges and pays for return shipping?", required: (v) => v.campaignType === "product_gifting" && ["Return", "Partial"].includes(v.productDisposition), showWhen: (v) => v.campaignType === "product_gifting" && ["Return", "Partial"].includes(v.productDisposition) },
//   { key: "returnPackagingInstructions", label: "Return Packaging Instructions", owner: "brand", kind: "text", placeholder: "e.g. Use original packaging", tooltip: "Packaging and handling requirements for the return.", showWhen: (v) => v.campaignType === "product_gifting" && ["Return", "Partial"].includes(v.productDisposition) },
//   { key: "itemsToKeepReturn", label: "Items to Keep / Items to Return", owner: "brand", kind: "text", placeholder: "e.g. Serum (keep), Camera (return)", tooltip: "Specify which items stay vs. which must be returned.", required: (v) => v.campaignType === "product_gifting" && v.productDisposition === "Partial", showWhen: (v) => v.campaignType === "product_gifting" && v.productDisposition === "Partial" },
//   { key: "shipToName", label: "Ship-To Name", owner: "influencer", kind: "text", placeholder: "e.g. Name on the package", tooltip: "Name on the shipping label — can differ from legal name.", required: true, showWhen: (v) => v.campaignType === "product_gifting" },
//   { key: "shippingAddress", label: "Shipping Address", owner: "influencer", kind: "textarea", placeholder: "e.g. Street, City, State, ZIP", tooltip: "Full delivery address for the gifted products.", required: true, showWhen: (v) => v.campaignType === "product_gifting" },
//   { key: "shippingPhoneNumber", label: "Shipping Phone Number", owner: "influencer", kind: "text", placeholder: "e.g. +1 555 000 0000", tooltip: "Contact number for the carrier in case of delivery issues.", required: true, showWhen: (v) => v.campaignType === "product_gifting" },
//   { key: "deliveryInstructions", label: "Delivery Instructions", owner: "influencer", kind: "text", placeholder: "e.g. Leave at door, code 1234", tooltip: "Special instructions to ensure successful delivery.", showWhen: (v) => v.campaignType === "product_gifting" },

//   { key: "cashCompensationModel", label: "Cash Compensation Model", owner: "brand", kind: "radio", options: CASH_COMP_OPTIONS, tooltip: "Will the influencer receive cash in addition to gifted products?", required: true, showWhen: (v) => v.campaignType === "product_gifting" },
//   { key: "cashFeeAmount", label: "Cash Fee Amount", owner: "brand", kind: "text", placeholder: "e.g. $500 USD", tooltip: "Fixed cash payment in addition to the gifted product.", required: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee", showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee" },
//   { key: "cashPaymentTrigger", label: "Cash Payment Trigger", owner: "brand", kind: "select", options: CASH_TRIGGER_OPTIONS, tooltip: "When does the cash payment get released?", required: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee", showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee" },
//   { key: "cashProcessorFeesBorneBy", label: "Processor Fees Borne By", owner: "brand", kind: "select", options: PROCESSOR_FEE_OPTIONS, tooltip: "Who pays payment processing charges for the cash payment?", showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee" },
//   { key: "affiliateCommissionRate", label: "Affiliate / Commission Rate", owner: "brand", kind: "text", placeholder: "e.g. 15% of net sales", tooltip: "Commission earned per sale tracked via the influencer's affiliate link.", required: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Affiliate / Commission", showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Affiliate / Commission" },
//   { key: "affiliateLinkCode", label: "Affiliate Link / Code", owner: "brand", kind: "text", placeholder: "e.g. GLAM15 or bit.ly/link", tooltip: "The unique tracking link or discount code assigned to this influencer.", required: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Affiliate / Commission", showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Affiliate / Commission" },
//   { key: "commissionReportingPeriod", label: "Commission Reporting Period", owner: "brand", kind: "text", placeholder: "e.g. Monthly", tooltip: "When and how often commission earnings will be reported and paid.", showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Affiliate / Commission" },
//   { key: "giftingCashPayoutMethod", label: "Payout Method", owner: "influencer", kind: "select", options: PAYOUT_METHOD_OPTIONS, tooltip: "How the influencer wants to receive the cash payment. PRIVATE.", required: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee", private: true, showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee" },
//   { key: "giftingCashPayoutAccountId", label: "Payout Account Email / ID", owner: "influencer", kind: "text", placeholder: "e.g. jane@paypal.com", tooltip: "Email or account ID for the payout method. PRIVATE.", required: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee", private: true, showWhen: (v) => v.campaignType === "product_gifting" && v.cashCompensationModel === "Gifting + Fixed Cash Fee" },

//   { key: "grantedUsageRights", label: "Granted Usage Rights", owner: "brand", kind: "multi", options: USAGE_RIGHTS_OPTIONS, tooltip: "All ways the brand is permitted to use the influencer's content." },
//   { key: "usageRightsDuration", label: "Usage Rights Duration", owner: "brand", kind: "text", placeholder: "e.g. 12 months / Perpetual", tooltip: "How long the brand may use the content under the selected rights." },
//   { key: "editingRights", label: "Editing Rights", owner: "brand", kind: "select", options: EDITING_RIGHTS_OPTIONS, tooltip: "Modifications the brand may make to the influencer's content." },
//   { key: "musicAssetResponsibility", label: "Music / Stock Asset Responsibility", owner: "brand", kind: "select", options: MUSIC_RESPONSIBILITY_OPTIONS, tooltip: "Who obtains commercial licensing for music or stock assets." },
//   { key: "attributionRequirement", label: "Attribution Requirement", owner: "brand", kind: "select", options: ATTRIBUTION_OPTIONS, tooltip: "Must the influencer be credited when the brand uses the content?" },
//   { key: "rawSourceFileDelivery", label: "Raw / Source File Delivery?", owner: "brand", kind: "radio", options: RAW_FILE_OPTIONS, tooltip: "Must the influencer hand over unedited raw footage or source files?" },

//   { key: "analyticsReportingDeadline", label: "Analytics Reporting Deadline", owner: "brand", kind: "text", placeholder: "e.g. 7 days after posting", tooltip: "How many days after posting the influencer must submit performance data." },
//   { key: "requiredAnalyticsItems", label: "Required Analytics Items", owner: "brand", kind: "multi", options: ANALYTICS_ITEMS_OPTIONS, tooltip: "Performance metrics the influencer must report back to the brand." },

//   { key: "competitorExclusivity", label: "Competitor Exclusivity / Blackout?", owner: "brand", kind: "radio", options: COMPETITOR_EXCLUSIVITY_OPTIONS, tooltip: "Should the influencer avoid promoting competitor brands during a set period?" },
//   { key: "competitorCategoryList", label: "Competitor / Category List", owner: "brand", kind: "text", placeholder: "e.g. L'Oreal, all skincare", tooltip: "Brands or product categories the influencer must avoid.", required: (v) => v.competitorExclusivity === "Applies", showWhen: (v) => v.competitorExclusivity === "Applies" },
//   { key: "exclusivityPeriod", label: "Exclusivity / Blackout Period", owner: "brand", kind: "text", placeholder: "e.g. 30 days before/after posting", tooltip: "Duration of the exclusivity restriction.", required: (v) => v.competitorExclusivity === "Applies", showWhen: (v) => v.competitorExclusivity === "Applies" },
//   { key: "creativeBrief", label: "Creative Brief / Mandatory Talking Points", owner: "brand", kind: "textarea", placeholder: "e.g. Key messages, approved claims", tooltip: "Exact product claims and key messages the influencer must include." },
//   { key: "prohibitedStatements", label: "Prohibited Statements / Brand Safety", owner: "brand", kind: "textarea", placeholder: "e.g. No competitor mentions…", tooltip: "Content the influencer must never include." },
//   { key: "moralsClause", label: "Optional Morals / Reputation Clause?", owner: "brand", kind: "radio", options: MORALS_OPTIONS, tooltip: "Allows either party to terminate if serious misconduct occurs." },
//   { key: "ftcAcknowledgement", label: "FTC / Disclosure Acknowledgement", owner: "influencer", kind: "textarea", placeholder: "e.g. I will disclose #ad, #sponsored…", tooltip: "Influencer's commitment to FTC and platform disclosure requirements.", required: true },

//   { key: "governingLaw", label: "Governing Law (State / Country)", owner: "brand", kind: "text", placeholder: "e.g. Nevada, USA", tooltip: "Jurisdiction whose laws govern this agreement.", required: true },
//   { key: "disputeResolutionMethod", label: "Dispute Resolution Method", owner: "brand", kind: "select", options: DISPUTE_OPTIONS, tooltip: "How disputes will be resolved if they cannot be settled directly.", required: true },
//   { key: "venueSeat", label: "Venue / Seat", owner: "brand", kind: "text", placeholder: "e.g. Las Vegas, Nevada", tooltip: "City and state where disputes will be heard or arbitration seated." },
//   { key: "attorneysFees", label: "Attorneys' Fees", owner: "brand", kind: "select", options: ATTORNEYS_FEES_OPTIONS, tooltip: "Who pays legal fees if a dispute escalates?" },
//   { key: "noBypassPeriod", label: "No-Bypass Period", owner: "brand", kind: "text", placeholder: "e.g. 12 months after campaign end", tooltip: "Period during which neither party may bypass CollabGlam platform fees." },
// ];

// const FIELD_LABEL_MAP = ALL_FIELD_DEFS.reduce<Record<string, string>>((acc, field) => {
//   acc[String(field.key)] = field.label;
//   return acc;
// }, {});

// const uid = () => Math.random().toString(36).slice(2, 10);

// export function createLaneAContractDefaults(): LaneAContractValues {
//   return {
//     campaignType: "fixed_payment",

//     brandLegalName: "",
//     campaignTitleId: "",
//     brandContactNameTitle: "",
//     brandNoticeEmailPhone: "",
//     brandBillingAddress: "",
//     productsServicesCovered: "",
//     territoryTargetCountry: "",
//     effectiveDate: "",

//     influencerLegalName: "",
//     postingHandleUrl: "",
//     influencerContactEmailPhone: "",
//     influencerMailingAddress: "",

//     platforms: [],
//     deliverableFormat: "",
//     numberOfDeliverables: "",
//     draftDueDate: "",
//     livePostingDate: "",
//     minimumLivePeriod: "",
//     videoLengthFormatSpecs: "",
//     includedRevisionRounds: "",
//     brandReviewSlaBusinessDays: "",
//     mandatoryTagsLinks: "",
//     additionalRevisionFee: "",
//     preShootScriptRequired: "No",
//     scriptDueDate: "",
//     reshootObligation: "",

//     fixedTotalCampaignFee: "",
//     paymentStructure: "",
//     customSplitDetails: "",
//     advancePaymentTrigger: "",
//     balancePaymentTrigger: "",
//     fixedProcessorFeesBorneBy: "",
//     fixedKillFee: "",
//     fixedPayoutMethod: "",
//     fixedPayoutAccountId: "",
//     fixedTaxId: "",

//     milestoneTotalCampaignFee: "",
//     milestoneProcessorFeesBorneBy: "",
//     milestoneKillFee: "",
//     milestones: [createMilestoneRow()],
//     milestonePayoutMethod: "",
//     milestonePayoutAccountId: "",

//     estimatedRetailValue: "",
//     receiptConfirmationDeadline: "",
//     productDisposition: "Keep",
//     returnWindow: "",
//     returnShippingMethod: "",
//     returnPackagingInstructions: "",
//     itemsToKeepReturn: "",
//     shipToName: "",
//     shippingAddress: "",
//     shippingPhoneNumber: "",
//     deliveryInstructions: "",

//     cashCompensationModel: "Gifting Only",
//     cashFeeAmount: "",
//     cashPaymentTrigger: "",
//     cashProcessorFeesBorneBy: "",
//     affiliateCommissionRate: "",
//     affiliateLinkCode: "",
//     commissionReportingPeriod: "",
//     giftingCashPayoutMethod: "",
//     giftingCashPayoutAccountId: "",

//     grantedUsageRights: [],
//     usageRightsDuration: "",
//     editingRights: "",
//     musicAssetResponsibility: "",
//     attributionRequirement: "",
//     rawSourceFileDelivery: "",

//     analyticsReportingDeadline: "",
//     requiredAnalyticsItems: [],

//     competitorExclusivity: "None",
//     competitorCategoryList: "",
//     exclusivityPeriod: "",
//     creativeBrief: "",
//     prohibitedStatements: "",
//     moralsClause: "Not Included",
//     ftcAcknowledgement: "",

//     governingLaw: "",
//     disputeResolutionMethod: "",
//     venueSeat: "",
//     attorneysFees: "",
//     noBypassPeriod: "",

//     objections: {},
//   };
// }

// export function createMilestoneRow(): MilestoneRow {
//   return {
//     id: uid(),
//     milestoneName: "",
//     paymentAmount: "",
//     triggerEvent: "",
//     dueDate: "",
//   };
// }

// function isVisible(field: FieldDef, values: LaneAContractValues) {
//   return field.showWhen ? field.showWhen(values) : true;
// }

// function isRequired(field: FieldDef, values: LaneAContractValues) {
//   if (typeof field.required === "function") return field.required(values);
//   return Boolean(field.required);
// }

// function isFilled(value: unknown) {
//   if (Array.isArray(value)) return value.length > 0;
//   if (typeof value === "string") return value.trim().length > 0;
//   return value !== undefined && value !== null && value !== "";
// }

// function fieldState(field: FieldDef, values: LaneAContractValues, viewerParty: Party) {
//   if (!isVisible(field, values)) return "hidden" as const;
//   if (field.private && field.owner !== viewerParty) return "hidden" as const;
//   if (field.owner === viewerParty) return field.private ? ("private" as const) : ("editable" as const);
//   return isFilled(values[field.key]) ? ("locked" as const) : ("waiting" as const);
// }

// function waitingText(owner: Party) {
//   return owner === "brand" ? "Waiting for Brand to fill this…" : "Waiting for Influencer to fill this…";
// }

// function getMilestoneCellValue(row: MilestoneRow, key: keyof Omit<MilestoneRow, "id">) {
//   return row[key];
// }

// function milestoneCellLabel(key: keyof Omit<MilestoneRow, "id">) {
//   switch (key) {
//     case "milestoneName":
//       return "Milestone Name";
//     case "paymentAmount":
//       return "Payment Amount";
//     case "triggerEvent":
//       return "Trigger / Completion Event";
//     case "dueDate":
//       return "Due Date";
//     default:
//       return key;
//   }
// }

// export function validateLaneAContract(values: LaneAContractValues, scope: Party): Record<string, string> {
//   const errors: Record<string, string> = {};

//   ALL_FIELD_DEFS.forEach((field) => {
//     if (field.owner !== scope) return;
//     if (!isVisible(field, values)) return;
//     if (!isRequired(field, values)) return;
//     if (!isFilled(values[field.key])) {
//       errors[String(field.key)] = `${field.label} is required.`;
//     }
//   });

//   // if (scope === "brand" && values.campaignType === "milestone_based") {
//   //   if (!values.milestones.length) {
//   //     errors.milestones = "At least one milestone row is required.";
//   //   }
//   //   values.milestones.forEach((row, index) => {
//   //     if (!row.milestoneName.trim()) errors[`ms_${row.id}_milestoneName`] = `Milestone ${index + 1}: name is required.`;
//   //     // if (!row.paymentAmount.trim()) errors[`ms_${row.id}_paymentAmount`] = `Milestone ${index + 1}: payment amount is required.`;
//   //     // if (!row.triggerEvent.trim()) errors[`ms_${row.id}_triggerEvent`] = `Milestone ${index + 1}: trigger event is required.`;
//   //     if (!row.dueDate.trim()) errors[`ms_${row.id}_dueDate`] = `Milestone ${index + 1}: due date is required.`;
//   //   });
//   // }

//   return errors;
// }

// const SIDEBAR_TOOLTIPS = {
//   // ── Brand ──────────────────────────────────────────────────────────────────
//   brandLegalName:
//     "Full registered legal name of the brand signing this agreement.",
//   brandContactPerson:
//     "Primary brand contact responsible for campaign coordination and approvals.",
//   brandNoticeEmail:
//     "Official email for notices, updates, and legal communication.",
//   brandNoticePhone:
//     "Phone number for urgent campaign or contract communication.",
//   brandBillingAddress:
//     "Official billing address used for invoicing and records.",

//   // ── Campaign ───────────────────────────────────────────────────────────────
//   campaignTitle:
//     "Internal or external campaign title / ID used to identify this agreement.",
//   campaignProductsServices: "Products or services covered by this contract.",
//   campaignTerritory:
//     "Territory where content will be distributed or targeted.",
//   requestedEffectiveDate:
//     "Date the agreement is intended to become effective.",
//   timezone:
//     "Timezone used for the requested effective date and scheduling references.",

//   // ✅ NEW
//   paymentType:
//     "Payment model for this campaign. Fixed = single lump-sum fee; Milestone = staged payments tied to deliverable events; Gifting = product-only compensation. Set at the campaign level and shared across all influencers.",

//   // ── Deliverables ───────────────────────────────────────────────────────────
//   platformHandle:
//     "Social platform where the content will be published (e.g. Instagram, TikTok, YouTube).",

//   // ✅ NEW
//   handle:
//     "The influencer's public username on the selected platform (e.g. @janeglow). This identifies the posting account in the contract.",

//   qty: "Number of content units for this deliverable.",
//   deliverableFormat: "Content format required for this deliverable.",
//   draftDue: "Deadline for draft submission.",
//   liveDate: "Date the deliverable must go live.",
//   minimumVideoSpecs:
//     "Format, duration, resolution, or aspect-ratio requirements.",
//   mandatoryTags:
//     "Required mentions, hashtags, affiliate links, tracking links, or promo codes.",
//   preShootScriptRequired:
//     "Whether brand approval of a script is required before filming begins.",
//   preShootScriptDue: "Deadline for the influencer to submit the script.",
//   preShootReviewDays:
//     "How many business days the brand gets to review and approve the script.",

//   // ── Review / Revisions / Reshoots ──────────────────────────────────────────
//   includedRevisionRounds:
//     "Number of revision rounds included in the fee without extra charge.",
//   additionalRevisionFee:
//     "Fee charged for each revision round beyond the included number.",
//   reshootObligation:
//     "Circumstances under which the influencer is required to reshoot content.",
//   // ✅ UPDATED — added context
//   reshootFee:
//     "Fee applicable when a reshoot is requested beyond the included reshoot obligation.",
//   // ✅ UPDATED — added context
//   minimumLivePeriod:
//     "Minimum duration the content must remain live before the influencer may archive or delete it.",

//   // ── Commercial ─────────────────────────────────────────────────────────────
//   totalCampaignFee: "Total gross compensation for the influencer.",
//   currency: "Currency in which all compensation figures are denominated.",
//   paymentStructure:
//     "How the total fee is split across stages (e.g. 50% advance / 50% on completion).",
//   customSplit:
//     "Custom breakdown of the payment structure — specify exact percentages and trigger conditions.",
//   advancePaymentTrigger:
//     "The event or condition that triggers the advance payment to be released.",
//   remainingPaymentTrigger:
//     "The event or condition that triggers the remaining balance to be released.",
//   processorFeesBorneBy:
//     "Who bears payment processing fees (e.g. PayPal / Wise / ACH transaction charges).",
//   processorFeesNotes:
//     "Additional context or percentage details about processor fee treatment.",
//   laneAMarketplaceFeeNote:
//     "Platform marketplace fee language that will appear verbatim in the signed contract.",

//   // ✅ NEW — shared by Fixed, Milestone, and Gifting cash sections
//   payoutMethod:
//     "How the influencer prefers to receive payment (PayPal, Bank Transfer / ACH, Wise, Payoneer, or CollabGlam Wallet). This field is private — the brand cannot see it.",
//   payoutAccountId:
//     "Email address or account ID tied to the selected payout method (e.g. jane@paypal.com or a bank reference). This field is private — the brand cannot see it.",
//   taxId:
//     "Tax identification number (EIN, SSN last 4, or VAT) required for payments above IRS or local reporting thresholds. This field is private — the brand cannot see it.",

//   // ✅ NEW — contextual kill-fee tooltips per payment type
//   killFeeFixed:
//     "Cancellation compensation owed to the influencer if the brand cancels the campaign without cause after production has begun.",
//   killFeeMilestone:
//     "Compensation terms if the brand cancels a milestone-based campaign mid-execution (e.g. completed milestones are non-refundable).",

//   // ── Raw files & reporting ──────────────────────────────────────────────────
//   rawSourceFileDelivery:
//     "Whether the influencer must deliver unedited raw footage or original source files to the brand.",
//   rawFilesFormat:
//     "Expected file format for delivered raw/source files (e.g. .mp4 4K, .psd, .ai).",
//   rawFilesDeliveryDue:
//     "Deadline to provide raw/source files after the content goes live.",
//   analyticsReportingDeadline:
//     "Deadline for the influencer to submit post-campaign performance data.",
//   analyticsReportingItems:
//     "Specific metrics or evidence required (e.g. screenshots, reach, watch time, native insights access).",

//   // ── Shipping & returns ─────────────────────────────────────────────────────
//   productShippingApplicable:
//     "Whether this campaign includes shipment of a physical product to the influencer.",
//   productReturnable:
//     "Whether the gifted product is kept by the influencer or is a loaner that must be returned.",
//   shipToName:
//     "Name to appear on the shipping label — may differ from the influencer's legal name.",
//   shipToPhone:
//     "Phone number for the carrier to use if there are delivery issues.",
//   shipToAddress: "Full street address where the product should be shipped.",
//   productReceiptConfirmationDeadline:
//     "How quickly (in business days) the influencer must confirm receipt after delivery.",
//   returnWindowMethod:
//     "Timeframe and method the influencer must follow to return the product.",
//   riskOfLossNotes:
//     "Clarifies who is responsible if the product is lost or damaged during transit.",

//   // ── Usage rights ───────────────────────────────────────────────────────────
//   grantedUsageRights:
//     "All permitted ways the brand may use the influencer's content after delivery.",
//   usageDuration:
//     "How long the brand may exercise the selected usage right (e.g. 12 months, perpetual).",
//   usageTerritoryNotes:
//     "Geographic or channel limitations that apply to this specific usage right.",
//   attributionRequirement:
//     "Whether the influencer must be credited when the brand repurposes or republishes the content.",
//   editingRights:
//     "Level of editing the brand is permitted to make to the original content.",
//   attributionText:
//     "Exact attribution wording required when the brand uses the content (e.g. 'Content by @janeglow').",
//   musicStockAssetResponsibility:
//     "Identifies who obtains commercial licenses for background music or stock assets used in the content.",

//   // ── Compliance & brand safety ──────────────────────────────────────────────
//   creativeBrief:
//     "Mandatory talking points, approved product claims, and content guidelines the influencer must follow.",
//   restrictedStatements:
//     "Statements, claims, or topics the influencer must never include in the content.",
//   competitorBlackout:
//     "Whether the influencer is restricted from promoting competitor brands during a defined window.",
//   categoryCompetitorList:
//     "Specific brand names or product categories the influencer must avoid during the exclusivity period.",
//   blackoutPeriod:
//     "The calendar window during which the competitor exclusivity restriction applies.",
//   optionalMoralsClause:
//     "Allows either party to terminate the agreement if the other commits a serious act of misconduct or reputational harm.",

//   // ── Cancellation & refunds ─────────────────────────────────────────────────
//   killFeeOrProrata:
//     "Compensation owed to either party in the event of early termination or campaign cancellation.",
//   refundOfUnearnedAdvance:
//     "Whether the influencer must refund any advance payment that was not yet earned through completed deliverables.",

//   // ── Dispute & notices ──────────────────────────────────────────────────────
//   governingLaw:
//     "The jurisdiction (state or country) whose laws govern interpretation and enforcement of this agreement.",
//   disputeResolutionMethod:
//     "The method used to resolve disputes — state/federal courts, AAA arbitration, or another mechanism.",
//   disputeVenue:
//     "City and state where court proceedings would be held if disputes escalate to litigation.",
//   arbitrationSeat:
//     "Official seat or location for any arbitration proceedings (relevant when AAA arbitration is selected).",
//   attorneysFees:
//     "Determines who pays legal fees if a dispute escalates — prevailing party recovers, or each bears their own.",
// } as const;

// function sectionFields(keys: Array<keyof LaneAContractValues>) {
//   return ALL_FIELD_DEFS.filter((field) => keys.includes(field.key));
// }

// const identityFields = sectionFields([
//   "brandLegalName",
//   "campaignTitleId",
//   "brandContactNameTitle",
//   "brandNoticeEmailPhone",
//   "brandBillingAddress",
//   "productsServicesCovered",
//   "territoryTargetCountry",
//   "effectiveDate",
//   "influencerLegalName",
//   "postingHandleUrl",
//   "influencerContactEmailPhone",
//   "influencerMailingAddress",
// ]);

// const deliverableFields = sectionFields([
//   "platforms",
//   "deliverableFormat",
//   "numberOfDeliverables",
//   "draftDueDate",
//   "livePostingDate",
//   "minimumLivePeriod",
//   "videoLengthFormatSpecs",
//   "includedRevisionRounds",
//   "brandReviewSlaBusinessDays",
//   "mandatoryTagsLinks",
//   "additionalRevisionFee",
//   "preShootScriptRequired",
//   "scriptDueDate",
//   "reshootObligation",
// ]);

// const fixedPaymentFields = sectionFields([
//   "fixedTotalCampaignFee",
//   "paymentStructure",
//   "customSplitDetails",
//   "advancePaymentTrigger",
//   "balancePaymentTrigger",
//   "fixedProcessorFeesBorneBy",
//   "fixedKillFee",
//   "fixedPayoutMethod",
//   "fixedPayoutAccountId",
//   "fixedTaxId",
// ]);

// const milestoneHeaderFields = sectionFields([
//   "milestoneTotalCampaignFee",
//   "milestoneProcessorFeesBorneBy",
//   "milestoneKillFee",
//   "milestonePayoutMethod",
//   "milestonePayoutAccountId",
// ]);

// const giftingFields = sectionFields([
//   "estimatedRetailValue",
//   "receiptConfirmationDeadline",
//   "productDisposition",
//   "returnWindow",
//   "returnShippingMethod",
//   "returnPackagingInstructions",
//   "itemsToKeepReturn",
//   "shipToName",
//   "shippingAddress",
//   "shippingPhoneNumber",
//   "deliveryInstructions",
// ]);

// const giftingCashFields = sectionFields([
//   "cashCompensationModel",
//   "cashFeeAmount",
//   "cashPaymentTrigger",
//   "cashProcessorFeesBorneBy",
//   "affiliateCommissionRate",
//   "affiliateLinkCode",
//   "commissionReportingPeriod",
//   "giftingCashPayoutMethod",
//   "giftingCashPayoutAccountId",
// ]);

// const usageFields = sectionFields([
//   "grantedUsageRights",
//   "usageRightsDuration",
//   "editingRights",
//   "musicAssetResponsibility",
//   "attributionRequirement",
//   "rawSourceFileDelivery",
// ]);

// const reportingFields = sectionFields([
//   "analyticsReportingDeadline",
//   "requiredAnalyticsItems",
// ]);

// const complianceFields = sectionFields([
//   "competitorExclusivity",
//   "competitorCategoryList",
//   "exclusivityPeriod",
//   "creativeBrief",
//   "prohibitedStatements",
//   "moralsClause",
//   "ftcAcknowledgement",
// ]);

// const governingFields = sectionFields([
//   "governingLaw",
//   "disputeResolutionMethod",
//   "venueSeat",
//   "attorneysFees",
//   "noBypassPeriod",
// ]);

// export function LaneAContractEditor({
//   value,
//   onChange,
//   viewerParty,
//   onViewerPartyChange,
//   fieldErrors = {},
//   className = "",
// }: LaneAContractEditorProps) {
//   const [openObjectionKey, setOpenObjectionKey] = useState<string | null>(null);

//   const pendingObjections = useMemo(() => {
//     const entries = Object.entries(value.objections || {});
//     return entries.filter(([, entry]) => Boolean(entry?.text?.trim()));
//   }, [value.objections]);

//   const setField = <K extends keyof LaneAContractValues>(key: K, next: LaneAContractValues[K]) => {
//     onChange((prev) => {
//       const updated: LaneAContractValues = { ...prev, [key]: next };

//       if (key === "campaignType") {
//         if (next !== "fixed_payment") {
//           updated.fixedTotalCampaignFee = "";
//           updated.paymentStructure = "";
//           updated.customSplitDetails = "";
//           updated.advancePaymentTrigger = "";
//           updated.balancePaymentTrigger = "";
//           updated.fixedProcessorFeesBorneBy = "";
//           updated.fixedKillFee = "";
//           updated.fixedPayoutMethod = "";
//           updated.fixedPayoutAccountId = "";
//           updated.fixedTaxId = "";
//         }
//         if (next !== "milestone_based") {
//           updated.milestoneTotalCampaignFee = "";
//           updated.milestoneProcessorFeesBorneBy = "";
//           updated.milestoneKillFee = "";
//           updated.milestones = [createMilestoneRow()];
//           updated.milestonePayoutMethod = "";
//           updated.milestonePayoutAccountId = "";
//         }
//         if (next !== "product_gifting") {
//           updated.estimatedRetailValue = "";
//           updated.receiptConfirmationDeadline = "";
//           updated.productDisposition = "Keep";
//           updated.returnWindow = "";
//           updated.returnShippingMethod = "";
//           updated.returnPackagingInstructions = "";
//           updated.itemsToKeepReturn = "";
//           updated.shipToName = "";
//           updated.shippingAddress = "";
//           updated.shippingPhoneNumber = "";
//           updated.deliveryInstructions = "";
//           updated.cashCompensationModel = "Gifting Only";
//           updated.cashFeeAmount = "";
//           updated.cashPaymentTrigger = "";
//           updated.cashProcessorFeesBorneBy = "";
//           updated.affiliateCommissionRate = "";
//           updated.affiliateLinkCode = "";
//           updated.commissionReportingPeriod = "";
//           updated.giftingCashPayoutMethod = "";
//           updated.giftingCashPayoutAccountId = "";
//         }
//       }

//       if (key === "preShootScriptRequired" && next !== "Yes") {
//         updated.scriptDueDate = "";
//       }

//       if (key === "paymentStructure" && next !== "Custom") {
//         updated.customSplitDetails = "";
//       }

//       if (key === "productDisposition") {
//         if (next === "Keep") {
//           updated.returnWindow = "";
//           updated.returnShippingMethod = "";
//           updated.returnPackagingInstructions = "";
//           updated.itemsToKeepReturn = "";
//         }
//         if (next !== "Partial") {
//           updated.itemsToKeepReturn = "";
//         }
//       }

//       if (key === "cashCompensationModel") {
//         if (next !== "Gifting + Fixed Cash Fee") {
//           updated.cashFeeAmount = "";
//           updated.cashPaymentTrigger = "";
//           updated.cashProcessorFeesBorneBy = "";
//           updated.giftingCashPayoutMethod = "";
//           updated.giftingCashPayoutAccountId = "";
//         }
//         if (next !== "Gifting + Affiliate / Commission") {
//           updated.affiliateCommissionRate = "";
//           updated.affiliateLinkCode = "";
//           updated.commissionReportingPeriod = "";
//         }
//       }

//       if (key === "competitorExclusivity" && next !== "Applies") {
//         updated.competitorCategoryList = "";
//         updated.exclusivityPeriod = "";
//       }

//       return updated;
//     });
//   };

//   const updateObjection = (fieldKey: string, text: string) => {
//     onChange((prev) => {
//       const next = { ...prev, objections: { ...prev.objections } };
//       if (!text.trim()) {
//         delete next.objections[fieldKey];
//       } else {
//         next.objections[fieldKey] = {
//           by: viewerParty,
//           text,
//           updatedAt: new Date().toISOString(),
//         };
//       }
//       return next;
//     });
//   };

//   const renderField = (field: FieldDef) => {
//     const state = fieldState(field, value, viewerParty);
//     if (state === "hidden") return null;

//     const objection = value.objections[String(field.key)];
//     const canEditObjection = state === "locked" && (!objection || objection.by === viewerParty);
//     const key = String(field.key);
//     const editableLike = state === "editable" || state === "private";

//     return (
//       <FieldShell
//         key={key}
//         state={state}
//         label={field.label}
//         tooltip={field.tooltip}
//         required={isRequired(field, value)}
//         owner={field.owner}
//         error={fieldErrors[key]}
//         objection={objection}
//         canEditObjection={canEditObjection}
//         openObjection={openObjectionKey === key}
//         onToggleObjection={() => setOpenObjectionKey((prev) => (prev === key ? null : key))}
//         onSaveObjection={(text) => {
//           updateObjection(key, text);
//           setOpenObjectionKey(null);
//         }}
//         onClearObjection={() => {
//           updateObjection(key, "");
//           setOpenObjectionKey(null);
//         }}
//         showOuterLabel={!editableLike}
//         showOuterError={!editableLike}
//       >
//         {editableLike ? (
//           <EditableControl
//             field={field}
//             value={value[field.key]}
//             error={fieldErrors[key]}
//             onChange={(next) => setField(field.key, next as never)}
//           />
//         ) : state === "waiting" ? (
//           <WaitingState owner={field.owner} />
//         ) : (
//           <LockedValue field={field} value={value[field.key]} />
//         )}
//       </FieldShell>
//     );
//   };
//   return (
//     <TooltipProvider delayDuration={150}>
//       <div className={`space-y-5 ${className}`}>
//         <div className="rounded-2xl border border-gray-200 bg-white p-4">
//           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//             <div>
//               <div className="text-sm font-semibold text-gray-900">Lane A Contract Editor</div>
//               <div className="text-sm text-gray-500">Brand and Influencer preview the same contract with role-specific field states.</div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
//                 <button
//                   type="button"
//                   onClick={() => onViewerPartyChange("brand")}
//                   className={`rounded-full px-4 py-1.5 text-sm font-medium ${viewerParty === "brand" ? "bg-black text-white" : "text-gray-600"}`}
//                 >
//                   Brand View
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => onViewerPartyChange("influencer")}
//                   className={`rounded-full px-4 py-1.5 text-sm font-medium ${viewerParty === "influencer" ? "bg-black text-white" : "text-gray-600"}`}
//                 >
//                   Influencer View
//                 </button>
//               </div>
//               <Badge variant="secondary" className="rounded-full bg-rose-50 text-rose-700">
//                 ✋ {pendingObjections.length} Objections Pending
//               </Badge>
//             </div>
//           </div>
//         </div>

//         {pendingObjections.length > 0 ? (
//           <ObjectionSummary viewerParty={viewerParty} objections={pendingObjections} />
//         ) : null}

//         <SectionCard title="Campaign Type">
//           {renderField(ALL_FIELD_DEFS.find((field) => field.key === "campaignType")!)}
//         </SectionCard>

//         <SectionCard title="Parties & Campaign Identity" description="Present in all three campaign types.">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//             {identityFields.map(renderField)}
//           </div>
//         </SectionCard>

//         <SectionCard title="Deliverables & Timeline" description="Brand-owned section visible in every campaign type.">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//             {deliverableFields.map(renderField)}
//           </div>
//         </SectionCard>

//         {value.campaignType === "fixed_payment" ? (
//           <SectionCard title="Fixed Payment Terms" description="Brand fields plus influencer private payout fields.">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               {fixedPaymentFields.map(renderField)}
//             </div>
//           </SectionCard>
//         ) : null}

//         {value.campaignType === "milestone_based" ? (
//           <SectionCard title="Milestone Payment Schedule" description="Brand defines milestone rows. Each cell can be objected to independently.">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{milestoneHeaderFields.map(renderField)}</div>
//             <MilestonesEditor
//               value={value}
//               onChange={onChange}
//               viewerParty={viewerParty}
//               fieldErrors={fieldErrors}
//               openObjectionKey={openObjectionKey}
//               setOpenObjectionKey={setOpenObjectionKey}
//               updateObjection={updateObjection}
//             />
//           </SectionCard>
//         ) : null}

//         {value.campaignType === "product_gifting" ? (
//           <SectionCard title="Product Gifting & Shipping" description="Brand defines gifting terms. Influencer fills ship-to details.">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{giftingFields.map(renderField)}</div>
//           </SectionCard>
//         ) : null}

//         {value.campaignType === "product_gifting" ? (
//           <SectionCard title="Additional Cash Compensation" description="Shown only for product gifting campaigns.">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{giftingCashFields.map(renderField)}</div>
//           </SectionCard>
//         ) : null}

//         <SectionCard title="Usage Rights & Content Ownership" description="Brand-owned permissions and usage scope.">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{usageFields.map(renderField)}</div>
//         </SectionCard>

//         <SectionCard title="Reporting & Analytics" description="Brand-defined post-campaign reporting requirements.">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{reportingFields.map(renderField)}</div>
//         </SectionCard>

//         <SectionCard title="Exclusivity, Compliance & Claims" description="Shared visibility. FTC acknowledgement belongs to the influencer.">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{complianceFields.map(renderField)}</div>
//         </SectionCard>

//         <SectionCard title="Governing Law & Dispute Resolution" description="Brand-owned legal terms shown in all campaign types.">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{governingFields.map(renderField)}</div>
//         </SectionCard>
//       </div>
//     </TooltipProvider>
//   );
// }

// function MilestonesEditor({
//   value,
//   onChange,
//   viewerParty,
//   fieldErrors,
//   openObjectionKey,
//   setOpenObjectionKey,
//   updateObjection,
// }: {
//   value: LaneAContractValues;
//   onChange: React.Dispatch<React.SetStateAction<LaneAContractValues>>;
//   viewerParty: Party;
//   fieldErrors: Record<string, string>;
//   openObjectionKey: string | null;
//   setOpenObjectionKey: React.Dispatch<React.SetStateAction<string | null>>;
//   updateObjection: (fieldKey: string, text: string) => void;
// }) {
//   const isOwner = viewerParty === "brand";

//   const addMilestone = () => {
//     if (!isOwner) return;
//     onChange((prev) => ({ ...prev, milestones: [...prev.milestones, createMilestoneRow()] }));
//   };

//   const removeMilestone = (id: string) => {
//     if (!isOwner) return;
//     onChange((prev) => ({
//       ...prev,
//       milestones: prev.milestones.length > 1 ? prev.milestones.filter((row) => row.id !== id) : prev.milestones,
//     }));
//   };

//   const updateCell = (id: string, key: keyof Omit<MilestoneRow, "id">, next: string) => {
//     onChange((prev) => ({
//       ...prev,
//       milestones: prev.milestones.map((row) => (row.id === id ? { ...row, [key]: next } : row)),
//     }));
//   };

//   return (
//     <div className="mt-5 space-y-4">
//       <div className="flex items-center justify-between gap-3">
//         <div>
//           <div className="text-sm font-semibold text-gray-900">Milestone Rows</div>
//           <div className="text-sm text-gray-500">Minimum one milestone is always present. Only Brand can add or remove rows.</div>
//         </div>
//         {isOwner ? (
//           <Button type="button" variant="outline" className="rounded-full" onClick={addMilestone}>
//             + Add Milestone
//           </Button>
//         ) : null}
//       </div>

//       {fieldErrors.milestones ? <div className="text-sm text-red-600">{fieldErrors.milestones}</div> : null}

//       {value.milestones.map((row, index) => (
//         <div key={row.id} className="rounded-2xl border border-gray-200 bg-white p-4">
//           <div className="mb-4 flex items-center justify-between gap-3">
//             <div className="text-sm font-semibold text-gray-900">Milestone {index + 1}</div>
//             {isOwner && value.milestones.length > 1 ? (
//               <button type="button" className="text-sm text-red-600" onClick={() => removeMilestone(row.id)}>
//                 Remove
//               </button>
//             ) : null}
//           </div>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//             {(["milestoneName", "paymentAmount", "triggerEvent", "dueDate"] as const).map((key) => {
//               const fieldKey = `ms_${row.id}_${key}`;
//               const val = getMilestoneCellValue(row, key);
//               const locked = !isOwner && Boolean(String(val).trim());
//               const waiting = !isOwner && !String(val).trim();
//               const state = isOwner ? "editable" : waiting ? "waiting" : "locked";
//               const objection = value.objections[fieldKey];
//               const canEditObjection = state === "locked" && (!objection || objection.by === viewerParty);

//               return (
//                 <FieldShell
//                   key={fieldKey}
//                   state={state as "editable" | "waiting" | "locked"}
//                   label={milestoneCellLabel(key)}
//                   required
//                   owner="brand"
//                   error={fieldErrors[fieldKey]}
//                   objection={objection}
//                   showOuterLabel={!isOwner}
//                   showOuterError={!isOwner}
//                   canEditObjection={canEditObjection}
//                   openObjection={openObjectionKey === fieldKey}
//                   onToggleObjection={() => setOpenObjectionKey((prev) => (prev === fieldKey ? null : fieldKey))}
//                   onSaveObjection={(text) => {
//                     updateObjection(fieldKey, text);
//                     setOpenObjectionKey(null);
//                   }}
//                   onClearObjection={() => {
//                     updateObjection(fieldKey, "");
//                     setOpenObjectionKey(null);
//                   }}
//                 >
//                   {isOwner ? (
//                     key === "dueDate" ? (
//                       <input
//                         type="date"
//                         value={row.dueDate}
//                         onChange={(e) => updateCell(row.id, "dueDate", e.target.value)}
//                         className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10"
//                       />
//                     ) : key === "triggerEvent" ? (
//                       <textarea
//                         rows={3}
//                         value={row.triggerEvent}
//                         onChange={(e) => updateCell(row.id, "triggerEvent", e.target.value)}
//                         className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10"
//                       />
//                     ) : (
//                       <input
//                         type="text"
//                         value={String(val)}
//                         onChange={(e) => updateCell(row.id, key, e.target.value)}
//                         className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10"
//                       />
//                     )
//                   ) : state === "waiting" ? (
//                     <WaitingState owner="brand" />
//                   ) : (
//                     <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-gray-800">{val || "—"}</div>
//                   )}
//                 </FieldShell>
//               );
//             })}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// function EditableControl({
//   field,
//   value,
//   error,
//   onChange,
// }: {
//   field: FieldDef;
//   value: LaneAContractValues[keyof LaneAContractValues];
//   error?: string;
//   onChange: (next: unknown) => void;
// }) {
//   const info = field.tooltip;

//   if (TAG_STYLE_FIELDS.has(field.key)) {
//     return (
//       <FloatingTagInput
//         label={field.label}
//         info={info}
//         value={csvToTags(String(value || ""))}
//         options={[]}
//         onValueChange={(next) => onChange(tagsToCsv(next))}
//         dropdownDirection="up"
//       />
//     );
//   }

//   if (field.kind === "textarea") {
//     return (
//       <LabeledTextarea
//         label={field.label}
//         info={info}
//         value={String(value || "")}
//         placeholder={field.placeholder}
//         onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
//         state={toControlState(error)}
//         errorText={error}
//       />
//     );
//   }

//   if (field.kind === "date") {
//     return (
//       <FloatingDateInput
//         label={field.label}
//         info={info}
//         type="date"
//         value={String(value || "")}
//         onValueChange={(next) => onChange(next)}
//         state={toControlState(error)}
//         errorText={error}
//       />
//     );
//   }

//   if (field.kind === "number") {
//     return (
//       <FloatingInput
//         label={field.label}
//         info={info}
//         type="number"
//         value={String(value || "")}
//         onValueChange={(next) => onChange(next)}
//         state={toControlState(error)}
//         errorText={error}
//       />
//     );
//   }

//   if (field.kind === "select" || field.kind === "radio") {
//     return (
//       <FloatingSelect
//         label={field.label}
//         info={info}
//         value={String(value || "")}
//         searchable={false}
//         onValueChange={(next) => onChange(next)}
//         state={toControlState(error)}
//         errorText={error}
//       >
//         {(field.options || []).map((option) => (
//           <SelectItem key={option.value} value={option.value}>
//             {option.label}
//           </SelectItem>
//         ))}
//       </FloatingSelect>
//     );
//   }

//   if (field.kind === "multi") {
//     const listValue = (Array.isArray(value) ? value : []) as string[];

//     return (
//       <FloatingMultiSelect
//         label={field.label}
//         info={info}
//         value={listValue}
//         options={field.options || []}
//         onValueChange={(next) => onChange(next)}
//         includeAll={false}
//         searchable={false}
//         state={toControlState(error)}
//         errorText={error}
//       />
//     );
//   }

//   return (
//     <FloatingInput
//       label={field.label}
//       info={info}
//       value={String(value || "")}
//       onValueChange={(next) => onChange(next)}
//       state={toControlState(error)}
//       errorText={error}
//     />
//   );
// }

// function LockedValue({
//   field,
//   value,
// }: {
//   field: FieldDef;
//   value: LaneAContractValues[keyof LaneAContractValues];
// }) {
//   if (Array.isArray(value)) {
//     const listValue = value as string[];

//     if (!listValue.length) {
//       return (
//         <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-gray-700">
//           —
//         </div>
//       );
//     }

//     return (
//       <div className="flex flex-wrap gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
//         {listValue.map((item: string) => (
//           <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-700">
//             {item}
//           </span>
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-gray-800">
//       {String(value || "—")}
//     </div>
//   );
// }

// function WaitingState({ owner }: { owner: Party }) {
//   return (
//     <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm italic text-gray-500">
//       {waitingText(owner)}
//     </div>
//   );
// }

// function FieldShell({
//   label,
//   tooltip,
//   required,
//   owner,
//   state,
//   children,
//   error,
//   objection,
//   canEditObjection,
//   openObjection,
//   onToggleObjection,
//   onSaveObjection,
//   onClearObjection,
//   showOuterLabel = true,
//   showOuterError = true,
// }: {
//   label: string;
//   tooltip?: string;
//   required?: boolean;
//   owner: Party;
//   state: "editable" | "locked" | "waiting" | "private";
//   children: React.ReactNode;
//   error?: string;
//   objection?: ObjectionEntry;
//   canEditObjection?: boolean;
//   openObjection?: boolean;
//   onToggleObjection?: () => void;
//   onSaveObjection?: (text: string) => void;
//   onClearObjection?: () => void;
//   showOuterLabel?: boolean;
//   showOuterError?: boolean;
// }) {
//   const [draftObjection, setDraftObjection] = useState(objection?.text || "");

//   React.useEffect(() => {
//     setDraftObjection(objection?.text || "");
//   }, [objection?.text]);

//   const badge =
//     state === "private" ? (
//       <Badge className="rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
//         <EyeSlash className="mr-1 h-3.5 w-3.5" /> Private
//       </Badge>
//     ) : state === "locked" ? (
//       <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">
//         <LockSimple className="mr-1 h-3.5 w-3.5" /> Locked
//       </Badge>
//     ) : null;

//   return (
//     <div className="space-y-2">
//       {showOuterLabel ? (
//         <div className="flex flex-wrap items-center gap-2">
//           <div className="inline-flex items-center gap-1 text-sm font-medium text-gray-800">
//             <span>{label}</span>
//             {required ? <span className="text-red-500">*</span> : null}
//             {tooltip ? <InfoPill text={tooltip} /> : null}
//           </div>
//           {badge}
//           <span className="text-xs text-gray-400">Owner: {owner === "brand" ? "Brand" : "Influencer"}</span>
//         </div>
//       ) : (
//         <div className="flex flex-wrap items-center gap-2">
//           {badge}
//           <span className="text-xs text-gray-400">
//             Owner: {owner === "brand" ? "Brand" : "Influencer"}
//           </span>
//         </div>
//       )}

//       <div>{children}</div>

//       {state === "locked" && onToggleObjection ? (
//         <div className="flex items-center gap-2">
//           <button
//             type="button"
//             onClick={onToggleObjection}
//             className="text-sm font-medium text-amber-700 hover:text-amber-800"
//           >
//             {objection && canEditObjection ? "✎ Edit Objection" : "+ Raise Objection"}
//           </button>
//         </div>
//       ) : null}

//       {openObjection && canEditObjection ? (
//         <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
//           <div className="mb-2 text-sm font-medium text-rose-800">✋ Your Objection / Requested Change</div>
//           <textarea
//             rows={2}
//             value={draftObjection}
//             onChange={(e) => setDraftObjection(e.target.value)}
//             placeholder={`I'd prefer ${label} to be changed to…`}
//             className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
//           />
//           <div className="mt-3 flex items-center gap-2">
//             <Button type="button" size="sm" className="h-8 rounded-full" onClick={() => onSaveObjection?.(draftObjection)}>
//               Save
//             </Button>
//             <Button type="button" size="sm" variant="outline" className="h-8 rounded-full" onClick={onClearObjection}>
//               Clear
//             </Button>
//           </div>
//         </div>
//       ) : null}

//       {objection ? (
//         <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
//           <div className="mb-1 font-medium">Objection noted</div>
//           <div>{objection.text}</div>
//         </div>
//       ) : null}

//       {showOuterError && error ? (
//         <div className="inline-flex items-center gap-1 text-xs text-red-600">
//           <WarningCircle className="h-3.5 w-3.5" /> {error}
//         </div>
//       ) : null}
//     </div>
//   );
// }

// function SectionCard({
//   title,
//   description,
//   children,
// }: {
//   title: string;
//   description?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
//       <div className="mb-4 border-b border-gray-100 pb-3">
//         <div className="text-base font-semibold text-gray-900">{title}</div>
//         {description ? <div className="mt-1 text-sm text-gray-500">{description}</div> : null}
//       </div>
//       {children}
//     </div>
//   );
// }

// function InfoPill({ text }: { text: string }) {
//   return (
//     <Tooltip>
//       <TooltipTrigger asChild>
//         <button type="button" className="inline-flex items-center text-gray-400 hover:text-gray-600" aria-label="Field help">
//           <Info className="h-4 w-4" />
//         </button>
//       </TooltipTrigger>
//       <TooltipContent className="max-w-xs text-sm leading-6">
//         <p>{text}</p>
//       </TooltipContent>
//     </Tooltip>
//   );
// }

// function MultiChipField({
//   value,
//   options,
//   onChange,
// }: {
//   value: string[];
//   options: Option[];
//   onChange: (next: string[]) => void;
// }) {
//   const toggle = (entry: string) => {
//     if (value.includes(entry)) onChange(value.filter((item) => item !== entry));
//     else onChange([...value, entry]);
//   };

//   return (
//     <div className="flex flex-wrap gap-2">
//       {options.map((option) => {
//         const active = value.includes(option.value);
//         return (
//           <button
//             key={option.value}
//             type="button"
//             onClick={() => toggle(option.value)}
//             className={`rounded-full border px-3 py-2 text-sm ${active ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-700"}`}
//           >
//             {option.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// function ObjectionSummary({
//   viewerParty,
//   objections,
// }: {
//   viewerParty: Party;
//   objections: Array<[string, ObjectionEntry]>;
// }) {
//   return (
//     <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
//       <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-800">
//         ✋ Objections Summary
//       </div>
//       <div className="space-y-3">
//         {objections.map(([key, entry]) => {
//           const label = key.startsWith("ms_")
//             ? `Milestone — ${milestoneSummaryLabel(key)}`
//             : FIELD_LABEL_MAP[key] || key;
//           const direction = entry.by === viewerParty ? "Raised by you" : `Raised by ${entry.by === "brand" ? "Brand" : "Influencer"}`;
//           return (
//             <div key={key} className="rounded-xl border border-rose-200 bg-white px-3 py-3">
//               <div className="mb-1 text-sm font-medium text-gray-900">{label}</div>
//               <div className="mb-1 text-xs uppercase tracking-wide text-rose-700">{direction}</div>
//               <div className="text-sm text-gray-700">{entry.text}</div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function milestoneSummaryLabel(fieldKey: string) {
//   const key = fieldKey.split("_").slice(2).join("_") as keyof Omit<MilestoneRow, "id">;
//   return milestoneCellLabel(key);
// }

// const ReactSelect = dynamic(() => import("react-select"), { ssr: false });

// const CONTRACT_STATUS = {
//   DRAFT: "DRAFT",
//   BRAND_SENT_DRAFT: "BRAND_SENT_DRAFT",
//   BRAND_EDITED: "BRAND_EDITED",
//   INFLUENCER_EDITED: "INFLUENCER_EDITED",
//   BRAND_ACCEPTED: "BRAND_ACCEPTED",
//   INFLUENCER_ACCEPTED: "INFLUENCER_ACCEPTED",
//   READY_TO_SIGN: "READY_TO_SIGN",
//   CONTRACT_SIGNED: "CONTRACT_SIGNED",
//   MILESTONES_CREATED: "MILESTONES_CREATED",
//   REJECTED: "REJECTED",
//   SUPERSEDED: "SUPERSEDED",
// } as const;

// type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];
// type PanelMode = "send" | "edit" | "bulk-send";
// type FormErrors = Record<string, string>;
// type CurrencyOption = { value: string; label: string; meta?: any };
// type TzOption = { value: string; label: string; meta?: any };

// type ContractPartyBrand = {
//   legalName: string;
//   contactPersonName: string;
//   noticeEmail: string;
//   noticePhone: string;
//   billingAddress: string;
// };

// type ContractPartyInfluencer = {
//   legalName: string;
//   contactName: string;
//   postingHandleUrl: string;
//   contactEmail: string;
//   contactPhone: string;
//   whatsApp: string;
//   address: string;
// };
// type ContractMilestone = {
//   id: string;
//   milestoneName: string;
//   paymentAmount: string;
//   triggerEvent: string;
//   dueDate: string;
// };

// type ScheduleADeliverable = {
//   id: string;
//   srNo: number;
//   platform: string;
//   Handle: string[];
//   deliverableFormat: string;
//   qty: string;
//   isDraftRequired: boolean;
//   draftDue: string;
//   liveDate: string;
// };

// type UsageRightsRow = {
//   id: string;
//   usageRight: string;
//   selected: boolean;
//   duration: string;
//   territoryNotes: string;
// };

// export const PAYMENT_TYPE = {
//   FIXED: "fixed_payment",
//   MILESTONE: "milestone_based",
//   GIFTING: "product_gifting",
// } as const;

// export type PaymentType =
//   (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

// type ContractCampaign = {
//   productsServicesCovered: string;
//   territoryTargetCountry: string;
//   effectiveDate: string;
//   campaignTitleOrId: string;
//   paymentType: PaymentType;
// };
// type ContractFormState = {
//   brand: ContractPartyBrand;
//   influencer: ContractPartyInfluencer;
//   campaign: ContractCampaign;
//   scheduleA: {
//     minimumVideoSpecs: string;
//     preShootScriptRequired: boolean;
//     preShootScriptDue: string;
//     preShootScriptReviewBusinessDays: string;
//     mandatoryTagsMentionsLinksCodes: string;
//     review: {
//       includedRevisionRounds: string;
//       additionalRevisionFee: string;
//       reshootObligation: string;
//       reshootFee: string;
//       minimumLivePeriod: string;
//     };
//     commercial: {
//       totalCampaignFee: string;
//       currency: string;
//       paymentStructure: string;
//       customSplit: string;
//       advancePaymentTrigger: string;
//       remainingPaymentTrigger: string;
//       paymentProcessorFeesBorneBy: string;
//       paymentProcessorFeesNotes: string;
//       laneAMarketplaceFeeNote: string;
//       milestones: ContractMilestone[];
//       payoutMethod: string;
//       payoutAccountId: string;
//       taxId: string;
//     };
//     rawFiles: {
//       rawSourceFileDelivery: string;
//       deliveryDue: string;
//       format: string;
//       analyticsReportingDeadline: string;
//       analyticsReportingItems: string;
//     };
//     shipping: {
//       productShippingApplicable: string;
//       shipToName: string;
//       shipToAddress: string;
//       shipToPhone: string;
//       productReceiptConfirmationDeadline: string;
//       productReturnable: string;
//       returnWindowMethod: string;
//       riskOfLossNotes: string;
//     };
//     usageRights: {
//       rows: UsageRightsRow[];
//       attributionRequirement: string;
//       attributionText: string;
//       editingRights: string;
//       musicStockAssetResponsibility: string;
//     };
//     compliance: {
//       creativeBriefMandatoryTalkingPoints: string;
//       restrictedStatements: string;
//     };
//     exclusivity: {
//       competitorBlackout: string;
//       categoryCompetitorList: string;
//       blackoutPeriod: string;
//       optionalMoralsClause: string;
//     };
//     cancellation: {
//       killFeeOrProrata: string;
//       refundOfUnearnedAdvance: string;
//     };
//     dispute: {
//       governingLaw: string;
//       disputeResolutionMethod: string;
//       disputeVenue: string;
//       arbitrationSeat: string;
//       attorneysFees: string;
//     };
//   };
// };
// interface Influencer {
//   influencerId: string;
//   name: string;
//   primaryPlatform?: "instagram" | "tiktok" | "youtube" | string | null;
//   handle: string | null;
//   category?: string | { name?: string } | null;
//   categoryName?: string | null;
//   categories?: Array<{ name?: string }>;
//   audienceSize: number;
//   createdAt?: string;
//   isAssigned: number;
//   isContracted: number;
//   contractId: string | null;
//   feeAmount: number;
//   isAccepted: number;
//   isRejected: number;
//   rejectedReason: string;
// }

// interface Meta {
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// interface PartyConfirm {
//   confirmed?: boolean;
//   byUserId?: string;
//   at?: string;
// }

// interface PartySign {
//   signed?: boolean;
//   byUserId?: string;
//   name?: string;
//   email?: string;
//   at?: string;
// }

// interface AuditEvent {
//   byUserId?: string;
//   role?: string;
//   type: string;
//   details?: { reason?: string;[k: string]: any };
//   at?: string;
// }

// interface ContractContent {
//   brand?: Partial<ContractPartyBrand>;
//   influencer?: Partial<ContractPartyInfluencer>;
//   campaign?: Partial<ContractCampaign>;
//   scheduleA?: Partial<ContractFormState["scheduleA"]> & {
//     deliverables?: Array<Partial<ScheduleADeliverable>>;
//     usageRights?: Partial<ContractFormState["scheduleA"]["usageRights"]> & {
//       rows?: Array<Partial<UsageRightsRow>>;
//     };
//   };
// }

// interface ContractMeta {
//   contractId: string;
//   campaignId: string;
//   status: ContractStatus | string;
//   lastSentAt?: string;
//   lockedAt?: string | null;
//   requestedEffectiveDate?: string | null;
//   requestedEffectiveDateTimezone?: string | null;
//   confirmations?: { brand?: PartyConfirm; influencer?: PartyConfirm };
//   signatures?: {
//     brand?: PartySign;
//     influencer?: PartySign;
//     collabglam?: PartySign;
//   };
//   resendIteration?: number;
//   audit?: AuditEvent[];
//   flags?: Record<string, any>;
//   statusFlags?: Record<string, any>;
//   content?: ContractContent;
// }

// type AppliedInfluencerRow = InfluencerRow & {
//   rawInfluencer: Influencer;
//   contractMeta: ContractMeta | null;
//   hasContract: boolean;
//   rejected: boolean;
//   typeLabel: string;
//   feeAmountValue: number;
// };

// const normalizePaymentType = (raw?: string | null): PaymentType => {
//   const v = String(raw || "").trim().toLowerCase();

//   if (["fixed", "fixed_payment", "fixed-payment"].includes(v)) {
//     return PAYMENT_TYPE.FIXED;
//   }
//   if (["milestone", "milestone_based", "milestone-based"].includes(v)) {
//     return PAYMENT_TYPE.MILESTONE;
//   }
//   if (["gifting", "product_gifting", "product-gifting"].includes(v)) {
//     return PAYMENT_TYPE.GIFTING;
//   }

//   return PAYMENT_TYPE.FIXED;
// };

// const createDefaultCommercialMilestone = (
//   index: number = 1
// ): ContractMilestone => ({
//   id: createRowId(),
//   milestoneName: `Milestone ${index}`,
//   paymentAmount: "",
//   triggerEvent: "",
//   dueDate: "",
// });

// const SHIPPING_APPLICABLE_OPTIONS = [
//   { value: "No", label: "No" },
//   { value: "Yes", label: "Yes" },
// ] as const;

// const RETURNABLE_OPTIONS = [
//   { value: "Gift / keep product", label: "Gift / keep product" },
//   { value: "Returnable loaner", label: "Returnable loaner" },
// ] as const;

// const defaultUsageRightsRows = (): UsageRightsRow[] => [
//   {
//     id: createRowId(),
//     usageRight: "Organic repost on Brand-owned social channels",
//     selected: false,
//     duration: "",
//     territoryNotes: "",
//   },
//   {
//     id: createRowId(),
//     usageRight: "Brand website / blog / PDP / retailer listing",
//     selected: false,
//     duration: "",
//     territoryNotes: "",
//   },
//   {
//     id: createRowId(),
//     usageRight: "Email / CRM / deck / internal presentation use",
//     selected: false,
//     duration: "",
//     territoryNotes: "",
//   },
//   {
//     id: createRowId(),
//     usageRight: "Paid social / boosting / ads",
//     selected: false,
//     duration: "",
//     territoryNotes: "",
//   },
//   {
//     id: createRowId(),
//     usageRight: "Whitelisting / Spark Ads / dark posting / creator handle",
//     selected: false,
//     duration: "",
//     territoryNotes: "",
//   },
//   {
//     id: createRowId(),
//     usageRight: "Perpetual rights / buyout / work-made-for-hire",
//     selected: false,
//     duration: "",
//     territoryNotes: "",
//   },
// ];

// const createDefaultScheduleDeliverable = (
//   index: number = 1
// ): ScheduleADeliverable => ({
//   id: `deliverable-${index}`,
//   srNo: index,
//   platform: "",
//   Handle: [],
//   deliverableFormat: "",
//   qty: "1",
//   isDraftRequired: false,
//   draftDue: "",
//   liveDate: "",
// });

// const createDefaultContractForm = (): ContractFormState => ({
//   brand: {
//     legalName: "",
//     contactPersonName: "",
//     noticeEmail: "",
//     noticePhone: "",
//     billingAddress: "",
//   },
//   influencer: {
//     legalName: "",
//     contactName: "",
//     postingHandleUrl: "",
//     contactEmail: "",
//     contactPhone: "",
//     whatsApp: "",
//     address: "",
//   },
//   campaign: {
//     productsServicesCovered: "",
//     territoryTargetCountry: "Worldwide",
//     effectiveDate: "",
//     campaignTitleOrId: "",
//     paymentType: PAYMENT_TYPE.FIXED,
//   },
//   scheduleA: {
//     minimumVideoSpecs: "",
//     preShootScriptRequired: false,
//     preShootScriptDue: "",
//     preShootScriptReviewBusinessDays: "2",
//     mandatoryTagsMentionsLinksCodes: "",
//     review: {
//       includedRevisionRounds: "",
//       additionalRevisionFee: "",
//       reshootObligation:
//         "No reshoot required except for material failure to follow approved brief",
//       reshootFee: "",
//       minimumLivePeriod: "",
//     },
//     commercial: {
//       totalCampaignFee: "",
//       currency: "USD",
//       paymentStructure: "50% advance / 50% balance",
//       customSplit: "",
//       advancePaymentTrigger: "",
//       remainingPaymentTrigger: "",
//       paymentProcessorFeesBorneBy: "",
//       paymentProcessorFeesNotes: "",
//       laneAMarketplaceFeeNote:
//         "Unless expressly stated otherwise, 10% of the applicable Influencer compensation funded through the Platform is deducted from the Influencer payout and retained by CollabGlam; the Brand-funded campaign amount remains fixed.",
//       milestones: [createDefaultCommercialMilestone()],
//       payoutMethod: "",
//       payoutAccountId: "",
//       taxId: "",
//     },
//     rawFiles: {
//       rawSourceFileDelivery: "Not included",
//       deliveryDue: "",
//       format: "",
//       analyticsReportingDeadline: "",
//       analyticsReportingItems: "",
//     },
//     shipping: {
//       productShippingApplicable: "",
//       shipToName: "",
//       shipToAddress: "",
//       shipToPhone: "",
//       productReceiptConfirmationDeadline: "",
//       productReturnable: "",
//       returnWindowMethod: "",
//       riskOfLossNotes: "",
//     },
//     usageRights: {
//       rows: defaultUsageRightsRows(),
//       attributionRequirement: "No attribution required",
//       attributionText: "",
//       editingRights: "Cropping / resizing only",
//       musicStockAssetResponsibility:
//         "Brand responsible for separate commercial licensing",
//     },
//     compliance: {
//       creativeBriefMandatoryTalkingPoints: "",
//       restrictedStatements: "",
//     },
//     exclusivity: {
//       competitorBlackout: "",
//       categoryCompetitorList: "",
//       blackoutPeriod: "",
//       optionalMoralsClause: "",
//     },
//     cancellation: {
//       killFeeOrProrata: "",
//       refundOfUnearnedAdvance:
//         "",
//     },
//     dispute: {
//       governingLaw: "",
//       disputeResolutionMethod: "",
//       disputeVenue: "",
//       arbitrationSeat: "",
//       attorneysFees: "",
//     },
//   },
// });

// function createRowId() {
//   return Math.random().toString(36).slice(2);
// }

// function deepClone<T>(value: T): T {
//   return JSON.parse(JSON.stringify(value));
// }

// function getAtPath(obj: any, path: string, fallback: any = "") {
//   const value = String(path)
//     .split(".")
//     .reduce((acc, key) => acc?.[key], obj);
//   return value === undefined || value === null ? fallback : value;
// }

// function setAtPath<T extends Record<string, any>>(obj: T, path: string, value: any): T {
//   const clone = deepClone(obj);
//   const keys = String(path).split(".");
//   let ref: any = clone;
//   while (keys.length > 1) {
//     const key = keys.shift()!;
//     if (!ref[key] || typeof ref[key] !== "object") ref[key] = {};
//     ref = ref[key];
//   }
//   ref[keys[0]] = value;
//   return clone;
// }

// function mergeDeep<T>(base: T, patch: any): T {
//   if (patch === undefined || patch === null) return base;
//   if (Array.isArray(patch)) return patch as T;
//   if (typeof patch !== "object") return patch;

//   const output: any = Array.isArray(base) ? [...base] : { ...(base as any) };
//   for (const [key, value] of Object.entries(patch)) {
//     if (
//       value &&
//       typeof value === "object" &&
//       !Array.isArray(value) &&
//       output[key] &&
//       typeof output[key] === "object" &&
//       !Array.isArray(output[key])
//     ) {
//       output[key] = mergeDeep(output[key], value);
//     } else {
//       output[key] = value;
//     }
//   }
//   return output;
// }

// const toast = (opts: {
//   icon: "success" | "error" | "info";
//   title: string;
//   text?: string;
// }) =>
//   Swal.fire({
//     ...opts,
//     showConfirmButton: false,
//     timer: 1800,
//     timerProgressBar: true,
//     background: "white",
//     customClass: { popup: "rounded-lg border border-gray-200" },
//   });

// const askConfirm = async (title: string, text?: string) => {
//   const result = await Swal.fire({
//     title,
//     text,
//     icon: "question",
//     showCancelButton: true,
//     confirmButtonText: "Yes, continue",
//     cancelButtonText: "Cancel",
//     reverseButtons: true,
//     background: "white",
//   });
//   return result.isConfirmed;
// };

// function toInputDate(v?: string | Date | null) {
//   if (!v) return "";
//   const d = new Date(v);
//   if (Number.isNaN(d.getTime())) return "";
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// }
// function addOneDay(dateStr?: string | null) {
//   if (!dateStr) return "";
//   const d = new Date(dateStr);
//   if (Number.isNaN(d.getTime())) return "";
//   d.setDate(d.getDate() + 1);
//   return toInputDate(d);
// }
// function formatCompactAudience(n: number) {
//   if (!n && n !== 0) return "—";
//   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
//   if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
//   return String(n);
// }

// function formatMoneyINR(n: number) {
//   return `₹${Number(n || 0).toLocaleString("en-IN")}`;
// }

// function normalizePlatform(platform?: string | null): PlatformType {
//   switch ((platform || "").toLowerCase()) {
//     case "instagram":
//       return "instagram";
//     case "tiktok":
//       return "tiktok";
//     case "youtube":
//     default:
//       return "youtube";
//   }
// }

// function buildHandleUrl(platform?: string | null, handle?: string | null) {
//   if (!handle) return null;
//   const raw = handle.startsWith("@") ? handle.slice(1) : handle;
//   switch ((platform || "").toLowerCase()) {
//     case "instagram":
//       return `https://instagram.com/${raw}`;
//     case "tiktok":
//       return `https://www.tiktok.com/@${raw}`;
//     case "youtube":
//     default:
//       return `https://www.youtube.com/@${raw}`;
//   }
// }

// function sanitizeHandle(h: string) {
//   const t = (h || "").trim();
//   if (!t) return t;
//   return t.startsWith("@") ? t : `@${t}`;
// }

// function getCategoryLabel(inf: any) {
//   const pick = (...vals: any[]) =>
//     vals.find((v) => typeof v === "string" && v.trim());
//   const fromObj = (o?: any) =>
//     o && typeof o.name === "string" && o.name.trim() ? o.name : "";

//   const direct = pick(
//     inf.category,
//     inf.category_name,
//     inf.categoryName,
//     inf.categoryTitle,
//     inf.primaryCategory,
//     inf.niche,
//     inf.vertical
//   );
//   if (direct) return direct;

//   const obj =
//     fromObj(inf.category) ||
//     fromObj(inf.primary_category) ||
//     fromObj(inf.influencerCategory);
//   if (obj) return obj;

//   const arr =
//     inf.categories || inf.category_list || inf.influencerCategories || [];
//   if (Array.isArray(arr) && arr.length) {
//     const names = arr.map(fromObj).filter(Boolean);
//     if (names.length) return names.join(", ");
//   }

//   return "—";
// }

// function getEngagementValue(inf: Influencer) {
//   const raw = Number((inf as any)?.engagementRate ?? (inf as any)?.engagement ?? 0);
//   return Number.isFinite(raw) ? raw : 0;
// }

// function getFollowerTierBucket(n: number) {
//   if (n < 10_000) return "Nano";
//   if (n < 100_000) return "Micro";
//   if (n < 500_000) return "Mid";
//   if (n < 1_000_000) return "Macro";
//   return "Mega";
// }

// function matchesEngagementFilter(value: number, filterValue: string) {
//   if (!filterValue || filterValue === "All") return true;
//   if (filterValue === "0-2%") return value >= 0 && value < 2;
//   if (filterValue === "2-5%") return value >= 2 && value < 5;
//   if (filterValue === "5-8%") return value >= 5 && value < 8;
//   if (filterValue === "8-12%") return value >= 8 && value < 12;
//   if (filterValue === "12%+") return value >= 12;
//   return true;
// }

// function matchesDateFilter(dateStr: string, filterValue: string) {
//   if (!filterValue || filterValue === "All") return true;
//   const date = new Date(dateStr);
//   if (Number.isNaN(date.getTime())) return false;

//   const now = new Date();
//   const diffMs = now.getTime() - date.getTime();
//   const diffDays = diffMs / (1000 * 60 * 60 * 24);

//   if (filterValue === "Today") {
//     return date.toDateString() === now.toDateString();
//   }
//   if (filterValue === "Last 7 Days") return diffDays <= 7;
//   if (filterValue === "Last 30 Days") return diffDays <= 30;
//   return true;
// }

// function isRejectedMeta(meta?: ContractMeta | null) {
//   if (!meta) return false;
//   const s = String(meta.status || "").toUpperCase();
//   return (
//     s === CONTRACT_STATUS.REJECTED ||
//     (meta as any).isRejected === 1 ||
//     meta.flags?.isRejected ||
//     meta.statusFlags?.isRejected
//   );
// }

// function wasResent(meta?: ContractMeta | null) {
//   if (!meta) return false;
//   if ((meta as any).isResend || (meta as any).isresend) return true;
//   if (meta.flags?.isResend || meta.flags?.isResendChild) return true;
//   if (meta.statusFlags?.isResend || meta.statusFlags?.isResendChild) return true;
//   if (typeof meta.resendIteration === "number" && meta.resendIteration > 0) return true;
//   const audit = Array.isArray(meta.audit) ? meta.audit : [];
//   return audit.some((ev) => (ev.type || "").toUpperCase() === "RESENT");
// }

// function signingStatusLabel(meta?: ContractMeta | null) {
//   if (!meta) return null;
//   const s = String(meta.status || "");
//   if (s !== CONTRACT_STATUS.READY_TO_SIGN) return null;

//   const brandSigned = !!meta.signatures?.brand?.signed;
//   const influencerSigned = !!meta.signatures?.influencer?.signed;

//   if (brandSigned && !influencerSigned) return "Awaiting influencer signature";
//   if (!brandSigned && influencerSigned) return "Awaiting brand signature";
//   if (!brandSigned && !influencerSigned) return "Ready to sign";
//   if (brandSigned && influencerSigned) return "Signed";
//   return null;
// }

// function statusLabel(status?: string | null) {
//   switch (status) {
//     case CONTRACT_STATUS.BRAND_SENT_DRAFT:
//       return "Draft sent to influencer";
//     case CONTRACT_STATUS.BRAND_EDITED:
//       return "Brand edited";
//     case CONTRACT_STATUS.INFLUENCER_EDITED:
//       return "Influencer edited";
//     case CONTRACT_STATUS.INFLUENCER_ACCEPTED:
//       return "Influencer accepted";
//     case CONTRACT_STATUS.BRAND_ACCEPTED:
//       return "Brand accepted";
//     case CONTRACT_STATUS.READY_TO_SIGN:
//       return "Ready to sign";
//     case CONTRACT_STATUS.CONTRACT_SIGNED:
//       return "Signed";
//     case CONTRACT_STATUS.MILESTONES_CREATED:
//       return "Milestones created";
//     case CONTRACT_STATUS.SUPERSEDED:
//       return "Superseded";
//     case CONTRACT_STATUS.REJECTED:
//       return "Rejected";
//     default:
//       return status ? String(status) : "—";
//   }
// }

// function prettyStatus(meta: ContractMeta | null, hasContract: boolean, fallbackApplied = false) {
//   if (!hasContract) return fallbackApplied ? "Applied" : "—";
//   if (isRejectedMeta(meta)) return "Rejected";
//   const signing = signingStatusLabel(meta);
//   if (signing) return signing;
//   return statusLabel(String(meta?.status || ""));
// }

// function getAppliedTypeLabel(meta: ContractMeta | null, hasContract: boolean) {
//   if (isRejectedMeta(meta)) return "Rejected";
//   const status = String(meta?.status || "");

//   if (!hasContract) return "Applied";
//   if (
//     status === CONTRACT_STATUS.CONTRACT_SIGNED ||
//     status === CONTRACT_STATUS.MILESTONES_CREATED
//   ) {
//     return "Active";
//   }
//   if (
//     status === CONTRACT_STATUS.INFLUENCER_ACCEPTED ||
//     status === CONTRACT_STATUS.BRAND_ACCEPTED ||
//     status === CONTRACT_STATUS.READY_TO_SIGN
//   ) {
//     return "Selected";
//   }
//   return "Invited";
// }

// function matchesInfluencerType(typeLabel: string, filterValue: string) {
//   if (!filterValue || filterValue === "All") return true;
//   return typeLabel.toLowerCase() === filterValue.toLowerCase();
// }

// function isLockedStatus(status?: string | null) {
//   return (
//     status === CONTRACT_STATUS.CONTRACT_SIGNED ||
//     status === CONTRACT_STATUS.MILESTONES_CREATED
//   );
// }

// function isEditableStatus(status?: string | null) {
//   return (
//     status === CONTRACT_STATUS.BRAND_SENT_DRAFT ||
//     status === CONTRACT_STATUS.BRAND_EDITED ||
//     status === CONTRACT_STATUS.INFLUENCER_EDITED ||
//     status === CONTRACT_STATUS.INFLUENCER_ACCEPTED
//   );
// }

// function needsBrandAcceptance(status?: string | null) {
//   return status === CONTRACT_STATUS.INFLUENCER_ACCEPTED;
// }

// function canSignNow(status?: string | null) {
//   return status === CONTRACT_STATUS.READY_TO_SIGN;
// }

// function getRejectReasonFromMeta(meta: ContractMeta | null): string | null {
//   if (!meta) return null;
//   const events = Array.isArray(meta.audit) ? meta.audit : [];
//   const rejected = [...events]
//     .reverse()
//     .find((ev) => (ev.type || "").toUpperCase() === "REJECTED");
//   return rejected?.details?.reason ? String(rejected.details.reason).trim() : null;
// }

// export default function AppliedInfluencersPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const campaignPayoutTypeRef = useRef<string>("");
//   const campaignId = searchParams.get("id");
//   const influencerId = searchParams.get("infId");
//   const createdPage = searchParams.get("createdPage") === "true";
//   const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
//   const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
//   const [bulkTargets, setBulkTargets] = useState<Influencer[]>([]);
//   const [bulkInfluencerNames, setBulkInfluencerNames] = useState<string[]>([]);
//   const hasInitialPreviewRunRef = useRef(false);
//   const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
//   const [milestoneTargetInf, setMilestoneTargetInf] = useState<Influencer | null>(null);
//   const [milestoneTargetMeta, setMilestoneTargetMeta] = useState<ContractMeta | null>(null);
//   console.log("selectedBulkIds", selectedBulkIds)
//   const [serverCampaignTitle, setServerCampaignTitle] = useState("");
//   const [serverBudget, setServerBudget] = useState<number | null>(null);
//   const [serverTimeline, setServerTimeline] = useState<{
//     startDate?: string | Date;
//     endDate?: string | Date;
//   } | null>(null);
//   const [campaignPayoutType, setCampaignPayoutType] = React.useState<string>("");
//   const [isPayoutTypeDialogOpen, setIsPayoutTypeDialogOpen] = useState(false);
//   const [payoutDialogMode, setPayoutDialogMode] = useState<"bulk" | "single" | null>(null);
//   const [pendingInfluencerForContract, setPendingInfluencerForContract] =
//     useState<Influencer | null>(null);
//   const [influencers, setInfluencers] = useState<Influencer[]>([]);
//   const [meta, setMeta] = useState<Meta>({
//     total: 0,
//     page: 1,
//     limit: PAGE_SIZE,
//     totalPages: 1,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [page, setPage] = useState(1);

//   const [filters, setFilters] = useState<FilterState>({
//     "Influencer Type": "",
//     "Engagement Rate": "",
//     Follower: "",
//     Category: [],
//     Platform: [],
//     Date: "",
//   });
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [sortValue, setSortValue] = useState("Priority");
//   const searchInputRef = useRef<HTMLInputElement | null>(null);
//   const autoPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const [isAutoPreviewLoading, setIsAutoPreviewLoading] = useState(false);
//   const [highlightInfId, setHighlightInfId] = useState<string | null>(null);

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [panelMode, setPanelMode] = useState<PanelMode>("send");
//   const [selectedInf, setSelectedInf] = useState<Influencer | null>(null);
//   const [selectedMeta, setSelectedMeta] = useState<ContractMeta | null>(null);
//   const [pdfUrl, setPdfUrl] = useState("");

//   const [metaCache, setMetaCache] = useState<Record<string, ContractMeta | null>>({});
//   const [metaCacheLoading, setMetaCacheLoading] = useState(false);

//   const [brandId, setBrandId] = useState<string | null>(null);
//   const [brandPlanName, setBrandPlanName] = useState("free");
//   const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
//   const [tzOptions, setTzOptions] = useState<TzOption[]>([]);
//   const [listsLoading, setListsLoading] = useState(true);

//   const [requestedEffDate, setRequestedEffDate] = useState("");
//   const [requestedEffTz, setRequestedEffTz] = useState(DEFAULT_TIMEZONE);
//   const [contractForm, setContractForm] = useState<ContractFormState>(
//     createDefaultContractForm()
//   );
//   const [deliverables, setDeliverables] = useState<ScheduleADeliverable[]>([
//     createDefaultScheduleDeliverable(),
//   ]);

//   const [formErrors, setFormErrors] = useState<FormErrors>({});
//   const [isPreviewLoading, setIsPreviewLoading] = useState(false);
//   const [isSendLoading, setIsSendLoading] = useState(false);
//   const [isUpdateLoading, setIsUpdateLoading] = useState(false);

//   const [serverPaymentType, setServerPaymentType] = useState<PaymentType>(PAYMENT_TYPE.FIXED);

//   const [signOpen, setSignOpen] = useState(false);
//   const [signTargetMeta, setSignTargetMeta] = useState<ContractMeta | null>(null);

//   const signerName =
//     (typeof window !== "undefined" &&
//       (localStorage.getItem("brandContactName") ||
//         localStorage.getItem("brandName") ||
//         "")) ||
//     "";
//   const signerEmail =
//     (typeof window !== "undefined" && localStorage.getItem("brandEmail")) || "";

//   const isFullyManagedPlan = brandPlanName === "fully_managed";
//   const pageTitle = serverCampaignTitle || contractForm.campaign.campaignTitleOrId || "Unknown Campaign";

//   const clearErrors = useCallback(() => setFormErrors({}), []);
//   const setErr = useCallback((key: string, msg: string) => {
//     setFormErrors((prev) => ({ ...prev, [key]: msg }));
//   }, []);

//   const setContractField = useCallback((path: string, value: any) => {
//     setContractForm((prev) => setAtPath(prev, path, value));
//   }, []);

//   const isBulkSelectable = useCallback((row: AppliedInfluencerRow) => {
//     return !row.hasContract || row.rejected;
//   }, []);



//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const savedType = localStorage.getItem("campaignPayoutType") || "";
//     if (savedType) {
//       const normalized = normalizePaymentType(savedType);
//       campaignPayoutTypeRef.current = normalized; // ← sync ref
//       setCampaignPayoutType(normalized);
//       setContractField("campaign.paymentType", normalized);
//     }
//   }, [setContractField]);

//   const openBulkPayoutTypeDialog = useCallback(() => {
//     setPayoutDialogMode("bulk");
//     setPendingInfluencerForContract(null);
//     setIsPayoutTypeDialogOpen(true);
//   }, []);

//   const openSinglePayoutTypeDialog = useCallback((influencer: Influencer) => {
//     setPayoutDialogMode("single");
//     setPendingInfluencerForContract(influencer);
//     setIsPayoutTypeDialogOpen(true);
//   }, []);



//   const handleAddMilestone = useCallback(
//     (inf: Influencer, meta: ContractMeta | null) => {
//       if (!brandId) {
//         toast({
//           icon: "error",
//           title: "Brand not found",
//           text: "Brand ID is missing.",
//         });
//         return;
//       }

//       if (!campaignId) {
//         toast({
//           icon: "error",
//           title: "Campaign not found",
//           text: "Campaign ID is missing.",
//         });
//         return;
//       }

//       if (!inf?.influencerId) {
//         toast({
//           icon: "error",
//           title: "Influencer not found",
//           text: "Influencer ID is missing.",
//         });
//         return;
//       }

//       if (!meta?.contractId) {
//         toast({
//           icon: "error",
//           title: "No contract",
//           text: "Send/sign the contract before adding milestones.",
//         });
//         return;
//       }

//       setMilestoneTargetInf(inf);
//       setMilestoneTargetMeta(meta);
//       setAddMilestoneOpen(true);
//     },
//     [brandId, campaignId]
//   );

//   const handleViewMilestone = useCallback(
//     (inf: Influencer, meta: ContractMeta | null) => {
//       if (!meta?.contractId) {
//         toast({
//           icon: "error",
//           title: "No contract",
//           text: "No contract found for milestone viewing.",
//         });
//         return;
//       }

//       router.push(
//         `/brand/created-campaign/applied-inf/view-milestone?contractId=${meta.contractId}&campaignId=${campaignId || ""}&influencerId=${inf.influencerId || ""}&brandId=${brandId || ""}`
//       );
//     },
//     [brandId, campaignId, router]
//   );

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const storedBrandId = localStorage.getItem("brandId");
//     setBrandId(storedBrandId);
//     const cachedPlan = localStorage.getItem("brandPlanName");
//     if (cachedPlan) setBrandPlanName(String(cachedPlan).toLowerCase());
//   }, []);

//   useEffect(() => {
//     if (!brandId) return;
//     (async () => {
//       try {
//         const res: any = await api.get("/subscription/brand/current", {
//           params: { brandId },
//         });
//         const data = res?.data || res || {};
//         const latestName = (data?.brandPlanName || "free").toString().toLowerCase();
//         const latestId = data?.brandPlanId || null;
//         setBrandPlanName(latestName);
//         localStorage.setItem("brandPlanName", latestName);
//         if (latestId) localStorage.setItem("brandPlanId", latestId);
//       } catch {
//         // ignore
//       }
//     })();
//   }, [brandId]);

//   useEffect(() => {
//     const timeout = setTimeout(() => setDebouncedSearch(search), 300);
//     return () => clearTimeout(timeout);
//   }, [search]);

//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       const target = e.target as HTMLElement | null;
//       const tag = target?.tagName;
//       const isEditable =
//         target?.isContentEditable ||
//         tag === "INPUT" ||
//         tag === "TEXTAREA" ||
//         tag === "SELECT";
//       if (isEditable) return;

//       if (e.key === "/") {
//         e.preventDefault();
//         searchInputRef.current?.focus();
//       }
//       if (e.key === "Escape" && sidebarOpen) {
//         setSidebarOpen(false);
//       }
//     };

//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [sidebarOpen]);

//   useEffect(() => {
//     if (!campaignId) return;
//     (async () => {
//       try {
//         const res: any = await api.get("/campaign/campaignSummary", {
//           params: { id: campaignId },
//         });
//         const data = res?.data || res || {};
//         const campaignName = data.campaignName || data.productOrServiceName || "";
//         const budgetNum =
//           typeof data.budget === "number" ? data.budget : Number(data.budget ?? NaN);

//         const resolvedPaymentType = normalizePaymentType(data.paymentType);
//         setServerPaymentType(resolvedPaymentType);
//         setContractField("campaign.paymentType", resolvedPaymentType);

//         setServerCampaignTitle(campaignName);
//         setContractField("campaign.campaignTitleOrId", campaignName);
//         setContractField("campaign.productsServicesCovered", data.productOrServiceName || "");

//         if (!Number.isNaN(budgetNum)) {
//           setServerBudget(budgetNum);
//           setContractField("scheduleA.commercial.totalCampaignFee", String(budgetNum));
//         }

//         if (data.timeline) {
//           const start = data.timeline.startDate
//             ? toInputDate(new Date(data.timeline.startDate))
//             : "";
//           const end = data.timeline.endDate
//             ? toInputDate(new Date(data.timeline.endDate))
//             : "";
//           setServerTimeline(data.timeline);
//           if (start) {
//             setRequestedEffDate(start);
//             setContractField("campaign.effectiveDate", start);
//           }
//           if (end) {
//             setContractField(
//               "scheduleA.review.minimumLivePeriod",
//               `Until ${new Date(end).toLocaleDateString()}`
//             );
//           }
//         }
//       } catch (e: any) {
//         toast({
//           icon: "error",
//           title: "Failed to load campaign",
//           text:
//             e?.response?.data?.message ||
//             e?.message ||
//             "Could not fetch campaign summary.",
//         });
//       }
//     })();
//   }, [campaignId, setContractField]);

//   useEffect(() => {
//     let alive = true;

//     (async () => {
//       setListsLoading(true);

//       try {
//         const curRes: any = await api.get("/contract/currencies");
//         const curArr: any[] =
//           curRes?.data?.currencies || curRes?.currencies || curRes || [];

//         const currencies = curArr.map((c) => {
//           const code = String(c.code || c.symbol || "");
//           return {
//             value: code,
//             label: c.name ? `${code} — ${c.name}` : code,
//             meta: c,
//           };
//         });

//         const tzRes: any = await api.get("/contract/timezones");
//         const tzArr: any[] =
//           tzRes?.data?.timezones || tzRes?.timezones || tzRes || [];

//         const rawZones = tzArr.map((t, index) => {
//           const canonical =
//             typeof t?.value === "string" && t.value.trim()
//               ? t.value.trim()
//               : Array.isArray(t?.utc) && t.utc.length
//                 ? String(t.utc[0]).trim()
//                 : `timezone-${index}`;

//           return {
//             value: canonical,
//             label: t?.text || canonical,
//             meta: t,
//           };
//         });

//         const zones = Array.from(
//           new Map(rawZones.map((z) => [z.value, z])).values()
//         );

//         if (!alive) return;

//         setCurrencyOptions(currencies);
//         setTzOptions(zones);
//       } catch (e: any) {
//         toast({
//           icon: "error",
//           title: "Lists failed",
//           text: e?.message || "Could not load currency/timezone lists.",
//         });
//       } finally {
//         if (alive) setListsLoading(false);
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//   }, []);

//   const fetchApplicants = useCallback(
//     async (searchTerm?: string) => {
//       if (!campaignId) return;
//       setLoading(true);
//       setError(null);
//       try {
//         const res: any = await post("/apply/list", {
//           campaignId,
//           page,
//           limit: PAGE_SIZE,
//           search: (searchTerm ?? "").trim(),
//           sortField: "createdAt",
//           sortOrder: 0,
//           createdPage,
//         });

//         const influencersList =
//           res?.influencers || res?.data?.influencers || res?.data?.data || [];
//         const incomingMeta =
//           res?.meta ||
//           res?.data?.meta || {
//             total: 0,
//             page: 1,
//             limit: PAGE_SIZE,
//             totalPages: 1,
//           };

//         setInfluencers(influencersList || []);
//         setMeta(incomingMeta);
//       } catch (e: any) {
//         setError(
//           e?.response?.data?.message || e?.message || "Failed to load applicants."
//         );
//       } finally {
//         setLoading(false);
//       }
//     },
//     [campaignId, page, createdPage]
//   );

//   useEffect(() => {
//     fetchApplicants(debouncedSearch);
//   }, [fetchApplicants, debouncedSearch]);

//   useEffect(() => {
//     apiListCountries().then((res: any) => {
//       const list = res?.data?.data || res?.data || res || [];
//       setCountryOptions(
//         list.map((c: any) => ({
//           value: c.countryName,
//           label: `${c.flag} ${c.countryName}`,
//         }))
//       );
//     }).catch(() => { });
//   }, []);

//   const getLatestContractFor = useCallback(
//     async (inf: Influencer): Promise<ContractMeta | null> => {
//       const activeBrandId =
//         typeof window !== "undefined" ? localStorage.getItem("brandId") : null;
//       if (!activeBrandId || !campaignId) return null;
//       try {
//         const res: any = await post("/contract/getContract", {
//           brandId: activeBrandId,
//           influencerId: inf.influencerId,
//           campaignId,
//         });
//         const list = res?.contracts || res?.data?.contracts || [];
//         const filtered = (list as ContractMeta[]).filter(
//           (c) => String(c.campaignId) === String(campaignId)
//         );
//         return filtered.length ? filtered[0] : list.length ? list[0] : null;
//       } catch (e: any) {
//         toast({
//           icon: "error",
//           title: "Meta fetch failed",
//           text:
//             e?.response?.data?.message ||
//             e?.message ||
//             "Could not load contract state.",
//         });
//         return null;
//       }
//     },
//     [campaignId]
//   );

//   const loadMetaCache = useCallback(
//     async (list: Influencer[]) => {
//       if (!list.length) {
//         setMetaCache({});
//         return;
//       }
//       setMetaCacheLoading(true);
//       try {
//         const metas = await Promise.all(list.map((inf) => getLatestContractFor(inf)));
//         const next: Record<string, ContractMeta | null> = {};
//         list.forEach((inf, index) => {
//           next[inf.influencerId] = metas[index] || null;
//         });
//         setMetaCache(next);
//       } catch (e: any) {
//         toast({
//           icon: "error",
//           title: "Meta cache failed",
//           text: e?.message || "Unable to build contract cache.",
//         });
//       } finally {
//         setMetaCacheLoading(false);
//       }
//     },
//     [getLatestContractFor]
//   );

//   useEffect(() => {
//     loadMetaCache(influencers);
//   }, [influencers, loadMetaCache]);

//   useEffect(() => {
//     if (!influencerId || !influencers.length) return;
//     const exists = influencers.some(
//       (inf) => String(inf.influencerId) === String(influencerId)
//     );
//     if (!exists) return;

//     setHighlightInfId(influencerId);
//     const el =
//       document.getElementById(`inf-row-${influencerId}`) ||
//       document.getElementById(`inf-card-${influencerId}`);
//     if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

//     const timeout = setTimeout(() => setHighlightInfId(null), 4000);
//     return () => clearTimeout(timeout);
//   }, [influencerId, influencers]);

//   const clearPreview = useCallback(() => {
//     setPdfUrl((prev) => {
//       if (prev) URL.revokeObjectURL(prev);
//       return "";
//     });
//   }, []);

//   // useEffect(() => {
//   //   clearPreview();
//   // }, [contractForm, deliverables, requestedEffDate, requestedEffTz, clearPreview]);

//   useEffect(() => {
//     if (!sidebarOpen) return;

//     if (autoPreviewTimerRef.current) {
//       clearTimeout(autoPreviewTimerRef.current);
//     }

//     setIsAutoPreviewLoading(true);

//     autoPreviewTimerRef.current = setTimeout(() => {
//       generatePreviewSilently();
//     }, 1200); // 1.2s debounce — fast enough to feel live, slow enough to avoid hammering

//     return () => {
//       if (autoPreviewTimerRef.current) {
//         clearTimeout(autoPreviewTimerRef.current);
//       }
//     };
//   }, [contractForm, deliverables, requestedEffDate, requestedEffTz, sidebarOpen]);
//   // NOTE: intentionally omit generatePreviewSilently from deps to avoid re-triggering loop
//   const prefillFormFor = useCallback(
//     (
//       inf: Influencer,
//       meta?: ContractMeta | null,
//       forcedPaymentType?: PaymentType
//     ) => {
//       clearErrors();

//       const base = createDefaultContractForm();
//       base.brand.legalName = localStorage.getItem("brandName") || "";
//       base.brand.contactPersonName = localStorage.getItem("brandContactName") || "";
//       base.brand.noticeEmail = localStorage.getItem("brandEmail") || "";
//       base.brand.noticePhone = localStorage.getItem("brandPhone") || "";
//       base.brand.billingAddress = localStorage.getItem("brandAddress") || "";

//       base.influencer.legalName = inf.name || "";
//       base.influencer.contactName = inf.name || "";
//       base.influencer.postingHandleUrl =
//         buildHandleUrl(inf.primaryPlatform, inf.handle) || "";
//       base.influencer.contactEmail = (inf as any)?.email || "";
//       base.influencer.contactPhone = (inf as any)?.phone || "";
//       base.influencer.whatsApp = (inf as any)?.whatsapp || "";
//       base.influencer.address = (inf as any)?.address || "";

//       base.campaign.campaignTitleOrId = serverCampaignTitle || "";
//       base.campaign.productsServicesCovered =
//         (inf as any)?.productOrServiceName || "";
//       base.campaign.territoryTargetCountry = "Worldwide";
//       base.campaign.effectiveDate = requestedEffDate || toInputDate(new Date());

//       base.scheduleA.commercial.totalCampaignFee = "";

//       if (serverTimeline?.startDate) {
//         const start = toInputDate(serverTimeline.startDate);
//         if (start) {
//           base.campaign.effectiveDate = start;
//           setRequestedEffDate(start);
//         }
//       }

//       if (meta?.requestedEffectiveDate) {
//         setRequestedEffDate(toInputDate(meta.requestedEffectiveDate));
//       }

//       if (meta?.requestedEffectiveDateTimezone) {
//         setRequestedEffTz(meta.requestedEffectiveDateTimezone || DEFAULT_TIMEZONE);
//       } else {
//         setRequestedEffTz(DEFAULT_TIMEZONE);
//       }

//       const seededDeliverable = createDefaultScheduleDeliverable();
//       seededDeliverable.platform = inf.primaryPlatform || "";
//       seededDeliverable.Handle = inf.handle ? [inf.handle] : [];
//       seededDeliverable.srNo = 1;

//       const initialPaymentType =
//         forcedPaymentType ||
//         normalizePaymentType(
//           meta?.content?.campaign?.paymentType ||
//           campaignPayoutTypeRef.current ||   // ← ref, not state
//           serverPaymentType
//         );

//       base.campaign.paymentType = initialPaymentType;

//       const merged = mergeDeep(base, meta?.content || {});
//       merged.campaign.paymentType = initialPaymentType;

//       const rawMilestones =
//         meta?.content?.scheduleA?.commercial?.milestones ||
//         merged?.scheduleA?.commercial?.milestones ||
//         [];

//       merged.scheduleA.commercial.milestones =
//         Array.isArray(rawMilestones) && rawMilestones.length
//           ? rawMilestones.map((row: any, index: number) => ({
//             id: createRowId(),
//             milestoneName: String(row?.milestoneName || `Milestone ${index + 1}`),
//             paymentAmount: String(row?.paymentAmount || ""),
//             triggerEvent: String(row?.triggerEvent || ""),
//             dueDate: String(row?.dueDate || ""),
//           }))
//           : initialPaymentType === PAYMENT_TYPE.MILESTONE
//             ? [createDefaultCommercialMilestone()]
//             : [];

//       const scheduleAFromMeta = meta?.content?.scheduleA;
//       const usageRows = scheduleAFromMeta?.usageRights?.rows;
//       const deliverablesFromMeta = scheduleAFromMeta?.deliverables;

//       if (Array.isArray(usageRows) && usageRows.length) {
//         merged.scheduleA.usageRights.rows = usageRows.map((row) => ({
//           id: createRowId(),
//           usageRight: String(row?.usageRight || ""),
//           selected: Boolean(row?.selected),
//           duration: String(row?.duration || ""),
//           territoryNotes: String(row?.territoryNotes || ""),
//         }));
//       }

//       setDeliverables(
//         Array.isArray(deliverablesFromMeta) && deliverablesFromMeta.length
//           ? deliverablesFromMeta.map((row, index) => ({
//             id: createRowId(),
//             srNo: Number(row?.srNo ?? index + 1),
//             platform: row?.platform || "",
//             Handle:
//               Array.isArray(row?.Handle) && row.Handle.length
//                 ? row.Handle
//                 : row?.platform
//                   ? [row.platform]
//                   : [],
//             deliverableFormat: String(row?.deliverableFormat || ""),
//             qty: String(row?.qty ?? "1"),
//             isDraftRequired: Boolean(row?.isDraftRequired),
//             draftDue: String(row?.draftDue || ""),
//             liveDate: String(row?.liveDate || ""),
//           }))
//           : [seededDeliverable]
//       );

//       setContractForm(merged);
//     },
//     [

//       clearErrors,
//       requestedEffDate,
//       serverBudget,
//       serverCampaignTitle,
//       serverTimeline,
//       serverPaymentType,
//     ]
//   );

//   const openSidebar = useCallback(
//     async (
//       inf: Influencer,
//       mode: PanelMode,
//       forcedPaymentType?: PaymentType
//     ) => {
//       if (isFullyManagedPlan) {
//         toast({
//           icon: "info",
//           title: "Fully Managed Plan",
//           text: "Contract sending is handled by CollabGlam for Fully Managed brands.",
//         });
//         return;
//       }
//       hasInitialPreviewRunRef.current = false;
//       setSelectedInf(inf);
//       setPanelMode(mode);

//       const meta = metaCache[inf.influencerId] ?? (await getLatestContractFor(inf));
//       setSelectedMeta(meta || null);
//       // await apiListCountries()
//       prefillFormFor(inf, meta || null, forcedPaymentType);
//       clearPreview();
//       setSidebarOpen(true);
//     },
//     [
//       clearPreview,
//       getLatestContractFor,
//       isFullyManagedPlan,
//       metaCache,
//       prefillFormFor,
//     ]
//   );
//   const openBulkSidebar = useCallback(
//     async (forcedPaymentType?: PaymentType) => {
//       const targets = filteredRows
//         .filter((row) => selectedBulkIds.includes(row.rawInfluencer.influencerId))
//         .filter((row) => isBulkSelectable(row))
//         .map((row) => row.rawInfluencer);

//       if (!targets.length) {
//         toast({ icon: "info", title: "No influencers selected", text: "Select at least one eligible influencer." });
//         return;
//       }

//       hasInitialPreviewRunRef.current = false;
//       setBulkTargets(targets);
//       setPanelMode("bulk-send");
//       setSelectedInf(targets[0]);
//       setSelectedMeta(null);
//       prefillFormFor(targets[0], null, forcedPaymentType);
//       clearPreview();
//       clearErrors();
//       setSidebarOpen(true);

//       // Fetch names for the header
//       try {
//         const res: any = await apiGetfetchBulkInfleuncerId(selectedBulkIds);
//         const list: Influencer[] = res?.influencers || res?.data?.influencers || res?.data || [];
//         setBulkInfluencerNames(list.map((inf) => inf.name).filter(Boolean));
//       } catch {
//         // fallback to names already in targets
//         setBulkInfluencerNames(targets.map((t) => t.name).filter(Boolean));
//       }
//     },
//     [clearErrors, clearPreview, isBulkSelectable, prefillFormFor, selectedBulkIds]
//   );

//   const closeSidebar = useCallback(() => {
//     hasInitialPreviewRunRef.current = false;
//     setSidebarOpen(false);
//     clearPreview();
//     setSelectedInf(null);
//     setSelectedMeta(null);
//     setBulkTargets([]);
//     setBulkInfluencerNames([]); // ← add this
//     setIsPreviewLoading(false);
//     setIsSendLoading(false);
//     setIsUpdateLoading(false);
//   }, [clearPreview]);


//   const handleSelectPayoutType = useCallback(
//     (type: PaymentType) => {
//       if (typeof window !== "undefined") {
//         localStorage.setItem("campaignPayoutType", type);
//       }
//       campaignPayoutTypeRef.current = type; // ← sync ref
//       setCampaignPayoutType(type);
//       setContractField("campaign.paymentType", type);
//       setIsPayoutTypeDialogOpen(false);

//       if (payoutDialogMode === "bulk") {
//         openBulkSidebar(type);
//       } else if (payoutDialogMode === "single" && pendingInfluencerForContract) {
//         openSidebar(pendingInfluencerForContract, "send", type);
//       }

//       setPendingInfluencerForContract(null);
//       setPayoutDialogMode(null);
//     },
//     [openBulkSidebar, openSidebar, payoutDialogMode, pendingInfluencerForContract, setContractField]
//   );
//   useEffect(() => {
//     if (!sidebarOpen) return;
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = prev;
//     };
//   }, [sidebarOpen]);

//   const activePaymentType = useMemo(
//     () =>
//       normalizePaymentType(
//         contractForm.campaign.paymentType || serverPaymentType
//       ),
//     [contractForm.campaign.paymentType, serverPaymentType]
//   );

//   const buildContentPayload = useCallback(() => {
//     const content = deepClone(contractForm);
//     const paymentType = activePaymentType;
//     content.campaign.paymentType = paymentType;

//     return {
//       ...content,

//       campaign: {
//         ...content.campaign,
//         paymentType,
//         effectiveDate: requestedEffDate || content.campaign.effectiveDate || "",
//       },
//       scheduleA: {
//         ...content.scheduleA,
//         deliverables: deliverables.map((row, index) => ({
//           srNo: index + 1,
//           platform: row.platform,
//           Handle: row.Handle,
//           deliverableFormat: row.deliverableFormat,
//           qty: Number(row.qty || "0") || 0,
//           draftDue: row.draftDue,
//           liveDate: row.liveDate,
//         })),
//         review: {
//           ...content.scheduleA.review,
//           includedRevisionRounds:
//             Number(content.scheduleA.review.includedRevisionRounds || "1") || 1,
//         },
//         commercial: {
//           ...content.scheduleA.commercial,
//           totalCampaignFee:
//             paymentType === PAYMENT_TYPE.GIFTING
//               ? 0
//               : Number(content.scheduleA.commercial.totalCampaignFee || "0") || 0,
//           milestones:
//             paymentType === PAYMENT_TYPE.MILESTONE
//               ? content.scheduleA.commercial.milestones.map((row) => ({
//                 milestoneName: row.milestoneName,
//                 paymentAmount: Number(row.paymentAmount || "0") || 0,
//                 triggerEvent: row.triggerEvent,
//                 dueDate: row.dueDate,
//               }))
//               : [],
//         },
//         usageRights: {
//           ...content.scheduleA.usageRights,
//           rows: content.scheduleA.usageRights.rows.map((row) => ({
//             usageRight: row.usageRight,
//             selected: row.selected,
//             duration: row.duration,
//             territoryNotes: row.territoryNotes,
//           })),
//         },
//       },
//     };
//   }, [contractForm, deliverables, requestedEffDate, activePaymentType]);

//   const buildBrandUpdatesPayload = useCallback(() => {
//     return {
//       content: buildContentPayload(),
//     };
//   }, [buildContentPayload]);


//   const buildBulkContentPayload = useCallback(() => {
//     const content = buildContentPayload();

//     return {
//       ...content,
//       influencer: {}, // backend will fill per influencer
//       scheduleA: {
//         ...content.scheduleA,
//         deliverables: content.scheduleA.deliverables.map((row) => ({
//           ...row,
//           platformHandle: "", // backend should fill this per influencer
//         })),
//       },
//     };
//   }, [buildContentPayload]);

//   const generatePreviewSilently = useCallback(async () => {
//     if (!sidebarOpen) return;
//     if (!selectedInf || !campaignId || !brandId) {
//       setIsAutoPreviewLoading(false);
//       return;
//     }

//     const hasMinFields =
//       String(contractForm.brand.legalName ?? "").trim() &&
//       String(contractForm.influencer.legalName ?? "").trim() &&
//       String(contractForm.campaign.campaignTitleOrId ?? "").trim() &&
//       requestedEffDate;

//     if (!hasMinFields) {
//       setIsAutoPreviewLoading(false);
//       return;
//     }

//     setIsAutoPreviewLoading(true);

//     try {
//       let res: any;

//       if (panelMode === "send") {
//         res = await api.post(
//           "/contract/initiate",
//           {
//             brandId,
//             campaignId,
//             influencerId: selectedInf.influencerId,
//             content: buildContentPayload(),
//             requestedEffectiveDate: requestedEffDate,
//             requestedEffectiveDateTimezone: requestedEffTz,
//             preview: true,
//           },
//           { responseType: "blob" }
//         );
//       } else if (panelMode === "bulk-send") {
//         const sampleInf = bulkTargets[0];
//         if (!sampleInf) {
//           setIsAutoPreviewLoading(false);
//           return;
//         }

//         res = await api.post(
//           "/contract/initiate",
//           {
//             brandId,
//             campaignId,
//             influencerId: sampleInf.influencerId,
//             content: buildBulkContentPayload(),
//             requestedEffectiveDate: requestedEffDate,
//             requestedEffectiveDateTimezone: requestedEffTz,
//             preview: true,
//           },
//           { responseType: "blob" }
//         );
//       } else {
//         if (!selectedMeta?.contractId) {
//           setIsAutoPreviewLoading(false);
//           return;
//         }

//         if (isRejectedMeta(selectedMeta)) {
//           res = await api.post(
//             "/contract/resend",
//             {
//               contractId: selectedMeta.contractId,
//               content: buildContentPayload(),
//               requestedEffectiveDate: requestedEffDate,
//               requestedEffectiveDateTimezone: requestedEffTz,
//               preview: true,
//             },
//             { responseType: "blob" }
//           );
//         } else {
//           res = await api.post(
//             "/contract/brand/update",
//             {
//               contractId: selectedMeta.contractId,
//               brandId,
//               preview: true,
//               brandUpdates: buildBrandUpdatesPayload(),
//               requestedEffectiveDate: requestedEffDate,
//               requestedEffectiveDateTimezone: requestedEffTz,
//             },
//             { responseType: "blob" }
//           );
//         }
//       }

//       setPdfUrl((prev) => {
//         if (prev) URL.revokeObjectURL(prev);
//         return URL.createObjectURL(res.data);
//       });
//     } catch {
//       // silent fail
//     } finally {
//       setIsAutoPreviewLoading(false);
//     }
//   }, [
//     sidebarOpen,
//     selectedInf,
//     campaignId,
//     brandId,
//     contractForm,
//     requestedEffDate,
//     requestedEffTz,
//     panelMode,
//     bulkTargets,
//     selectedMeta,
//     buildContentPayload,
//     buildBulkContentPayload,
//     buildBrandUpdatesPayload,
//   ]);

//   useEffect(() => {
//     if (!sidebarOpen) return;
//     if (hasInitialPreviewRunRef.current) return;
//     if (!selectedInf || !campaignId || !brandId) return;

//     const hasMinFields =
//       String(contractForm.brand.legalName ?? "").trim() &&
//       String(contractForm.influencer.legalName ?? "").trim() &&
//       String(contractForm.campaign.campaignTitleOrId ?? "").trim() &&
//       requestedEffDate;

//     if (!hasMinFields) return;

//     hasInitialPreviewRunRef.current = true;
//     generatePreviewSilently();
//   }, [
//     sidebarOpen,
//     selectedInf,
//     campaignId,
//     brandId,
//     requestedEffDate,
//     contractForm.brand.legalName,
//     contractForm.influencer.legalName,
//     contractForm.campaign.campaignTitleOrId,
//     generatePreviewSilently,
//   ]);
//   //for later edits 
//   useEffect(() => {
//     if (!sidebarOpen) return;
//     if (!hasInitialPreviewRunRef.current) return;

//     if (autoPreviewTimerRef.current) {
//       clearTimeout(autoPreviewTimerRef.current);
//     }

//     autoPreviewTimerRef.current = setTimeout(() => {
//       generatePreviewSilently();
//     }, 1200);

//     return () => {
//       if (autoPreviewTimerRef.current) {
//         clearTimeout(autoPreviewTimerRef.current);
//       }
//     };
//   }, [
//     contractForm,
//     deliverables,
//     requestedEffDate,
//     requestedEffTz,
//     sidebarOpen,
//     generatePreviewSilently,
//   ]);
//   const scrollFirstErrorIntoView = useCallback(() => {
//     const first = document.querySelector("[data-field-error=true]") as HTMLElement | null;
//     if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
//   }, []);

//   const validateForPreview = useCallback(() => {
//     clearErrors();
//     let ok = true;
//     const add = (key: string, message: string) => {
//       ok = false;
//       setErr(key, message);
//     };

//     const feeRaw = String(contractForm.scheduleA.commercial.totalCampaignFee ?? "");
//     const feeValue = Number(feeRaw);
//     const paymentType = activePaymentType;
//     const revisionRaw = String(
//       contractForm.scheduleA.review.includedRevisionRounds ?? ""
//     );
//     const revisionValue = Number(revisionRaw);

//     const reviewDaysRaw = String(
//       contractForm.scheduleA.preShootScriptReviewBusinessDays ?? "2"
//     );
//     const reviewDays = Number(reviewDaysRaw);

//     if (!String(contractForm.brand.legalName ?? "").trim()) {
//       add("brand.legalName", "Brand legal name is required.");
//     }

//     if (!String(contractForm.influencer.legalName ?? "").trim()) {
//       add("influencer.legalName", "Influencer legal name is required.");
//     }

//     if (!String(contractForm.campaign.campaignTitleOrId ?? "").trim()) {
//       add("campaign.campaignTitleOrId", "Campaign title / ID is required.");
//     }

//     if (!contractForm.scheduleA.commercial.currency) {
//       add("scheduleA.commercial.currency", "Currency is required.");
//     }

//     if (!contractForm.campaign.paymentType) {
//       add("campaign.paymentType", "Payment type is required.");
//     }

//     if (paymentType !== PAYMENT_TYPE.GIFTING) {
//       if (!feeRaw.trim() || Number.isNaN(feeValue) || feeValue < 0) {
//         add("scheduleA.commercial.totalCampaignFee", "Enter a valid non-negative fee.");
//       }
//     }

//     // if (paymentType === PAYMENT_TYPE.MILESTONE) {
//     //   const milestones = contractForm.scheduleA.commercial.milestones || [];

//     //   if (!milestones.length) {
//     //     add("scheduleA.commercial.milestones", "Add at least one milestone.");
//     //   } else {
//     //     const messages: string[] = [];

//     //     milestones.forEach((row, index) => {
//     //       const label = `Milestone #${index + 1}`;
//     //       if (!row.milestoneName.trim()) messages.push(`${label}: name is required.`);
//     //       if (!row.paymentAmount.trim()) messages.push(`${label}: amount is required.`);
//     //       if (!row.triggerEvent.trim()) messages.push(`${label}: trigger event is required.`);
//     //       if (!row.dueDate.trim()) messages.push(`${label}: due date is required.`);
//     //     });

//     //     if (messages.length) {
//     //       add("scheduleA.commercial.milestones", messages.join(" "));
//     //     }
//     //   }
//     // }
//     if (Number.isNaN(revisionValue) || revisionValue < 0) {
//       add("scheduleA.review.includedRevisionRounds", "Revision rounds must be zero or more.");
//     }
//     if (Number.isNaN(reviewDays) || reviewDays < 0) {
//       add(
//         "scheduleA.preShootScriptReviewBusinessDays",
//         "Review business days must be zero or more."
//       );
//     }
//     if (!requestedEffDate) add("requestedEffDate", "Requested effective date is required.");

//     if (!deliverables.length) {
//       add("scheduleA.deliverables", "Add at least one deliverable.");
//     } else {
//       const messages: string[] = [];
//       deliverables.forEach((row, index) => {
//         const label = `Deliverable #${index + 1}`;
//         const qtyNum = Number(row.qty || "");
//         if (!row.deliverableFormat.trim()) {
//           messages.push(`${label}: deliverable format is required.`);
//         }
//         if (!row.platform.trim()) {
//           messages.push(`${label}: platform is required.`);
//         }
//         if (!row.Handle.length) {
//           messages.push(`${label}: platform / handle is required.`);
//         }
//         if (!row.qty.trim() || Number.isNaN(qtyNum) || qtyNum < 1) {
//           messages.push(`${label}: quantity must be at least 1.`);
//         }
//       });
//       if (messages.length) add("scheduleA.deliverables", messages.join(" "));
//     }
//     // ── Date ordering validation ──────────────────────────────────────────────
//     const preShootRequired = getAtPath(
//       contractForm,
//       "scheduleA.preShootScriptRequired",
//       false
//     );
//     const preShootDue = getAtPath(contractForm, "scheduleA.preShootScriptDue");
//     const preShootMs = preShootDue ? new Date(preShootDue).getTime() : 0;

//     const effMs = requestedEffDate ? new Date(requestedEffDate).getTime() : 0;

//     const hasPreShootAfterDraft = deliverables.some((row) => {
//       if (
//         !preShootRequired ||
//         !row.isDraftRequired ||
//         !preShootDue ||
//         !row.draftDue
//       ) {
//         return false;
//       }
//       const draftMs = new Date(row.draftDue).getTime();
//       return preShootMs >= draftMs;
//     });

//     if (hasPreShootAfterDraft) {
//       add(
//         "scheduleA.preShootScriptDue",
//         "Pre-shoot script due date must be before the draft due date."
//       );
//     }

//     if (hasPreShootAfterDraft) {
//       add(
//         "scheduleA.preShootScriptDue",
//         "Pre-shoot script due date must be before the draft due date."
//       );
//     }

//     // Effective date is mandatory
//     if (!requestedEffDate) {
//       add("requestedEffDate", "Requested effective date is required.");
//     }

//     // Pre-shoot date is mandatory if pre-shoot is required
//     if (preShootRequired && !preShootDue) {
//       add(
//         "scheduleA.preShootScriptDue",
//         "Pre-shoot script due date is required when pre-shoot script is required."
//       );
//     }

//     // Pre-shoot must be after effective date
//     if (preShootRequired && preShootDue && effMs && preShootMs <= effMs) {
//       add(
//         "scheduleA.preShootScriptDue",
//         "Pre-shoot script due date must be after the effective date."
//       );
//     }

//     deliverables.forEach((row, index) => {
//       const label = `Deliverable #${index + 1}`;
//       const draftMs = row.draftDue ? new Date(row.draftDue).getTime() : 0;
//       const liveMs = row.liveDate ? new Date(row.liveDate).getTime() : 0;

//       if (row.isDraftRequired && !row.draftDue) {
//         add(
//           "scheduleA.deliverables",
//           `${label}: draft due date is required when draft is required.`
//         );
//       }

//       // if (!row.liveDate) {
//       //   add("scheduleA.deliverables", `${label}: live date is required.`);
//       // }

//       // pre-shoot must be BEFORE draft due
//       if (
//         preShootRequired &&
//         row.isDraftRequired &&
//         preShootDue &&
//         row.draftDue &&
//         preShootMs >= draftMs
//       ) {
//         add(
//           "scheduleA.deliverables",
//           `${label}: pre-shoot script due date must be before the draft due date.`
//         );
//       }

//       // if no draft required, live must still be after pre-shoot
//       if (
//         preShootRequired &&
//         row.isDraftRequired &&
//         preShootDue &&
//         row.draftDue &&
//         preShootMs >= draftMs
//       ) {
//         add(
//           "scheduleA.preShootScriptDue",
//           "Pre-shoot script due date must be before the draft due date."
//         );

//         add(
//           "scheduleA.deliverables",
//           `${label}: pre-shoot script due date must be before the draft due date.`
//         );
//       }

//       // draft must be after effective date
//       if (row.isDraftRequired && row.draftDue && effMs && draftMs <= effMs) {
//         add(
//           "scheduleA.deliverables",
//           `${label}: draft due date must be after the effective date.`
//         );
//       }

//       // live must be after draft if draft exists
//       if (row.isDraftRequired && row.draftDue && row.liveDate && liveMs <= draftMs) {
//         add(
//           "scheduleA.deliverables",
//           `${label}: live date must be after the draft due date.`
//         );
//       }

//       // if no draft required, live must be after effective date
//       if (!row.isDraftRequired && row.liveDate && effMs && liveMs <= effMs) {
//         add(
//           "scheduleA.deliverables",
//           `${label}: live date must be after the effective date.`
//         );
//       }
//     });
//     if (!ok) {
//       toast({ icon: "error", title: "Please fix the highlighted fields" });
//       setTimeout(scrollFirstErrorIntoView, 50);
//     }
//     return ok;
//   }, [
//     clearErrors,
//     contractForm,
//     deliverables,
//     requestedEffDate,
//     scrollFirstErrorIntoView,
//     setErr,
//     activePaymentType
//   ]);

//   const handleGeneratePreview = useCallback(async () => {
//     if (!selectedInf || !campaignId || !brandId) return;
//     if (!validateForPreview()) return;
//     if (isFullyManagedPlan) {
//       toast({
//         icon: "info",
//         title: "Not available on Fully Managed",
//         text: "Contract sending and preview are disabled for Fully Managed brands.",
//       });
//       return;
//     }

//     setIsPreviewLoading(true);

//     try {
//       let res: any;

//       if (panelMode === "send") {
//         res = await api.post(
//           "/contract/initiate",
//           {
//             brandId,
//             campaignId,
//             influencerId: selectedInf.influencerId,
//             content: buildContentPayload(),
//             requestedEffectiveDate: requestedEffDate,
//             requestedEffectiveDateTimezone: requestedEffTz,
//             preview: true,
//           },
//           { responseType: "blob" }
//         );
//       } else if (panelMode === "bulk-send") {
//         const sampleInf = bulkTargets[0];
//         if (!sampleInf) {
//           toast({
//             icon: "error",
//             title: "No influencer selected",
//             text: "Please select at least one influencer.",
//           });
//           return;
//         }

//         res = await api.post(
//           "/contract/initiate",
//           {
//             brandId,
//             campaignId,
//             influencerId: sampleInf.influencerId,
//             content: buildBulkContentPayload(),
//             requestedEffectiveDate: requestedEffDate,
//             requestedEffectiveDateTimezone: requestedEffTz,
//             preview: true,
//           },
//           { responseType: "blob" }
//         );
//       } else {
//         if (!selectedMeta?.contractId) {
//           toast({
//             icon: "error",
//             title: "No contract",
//             text: "No contract found.",
//           });
//           return;
//         }

//         if (isRejectedMeta(selectedMeta)) {
//           // rejected contract => resend preview
//           res = await api.post(
//             "/contract/resend",
//             {
//               contractId: selectedMeta.contractId,
//               content: buildContentPayload(),
//               requestedEffectiveDate: requestedEffDate,
//               requestedEffectiveDateTimezone: requestedEffTz,
//               preview: true,
//             },
//             { responseType: "blob" }
//           );
//         } else {
//           // normal edit => brand update preview
//           res = await api.post(
//             "/contract/brand/update",
//             {
//               contractId: selectedMeta.contractId,
//               brandId,
//               preview: true,
//               brandUpdates: buildBrandUpdatesPayload(),
//               requestedEffectiveDate: requestedEffDate,
//               requestedEffectiveDateTimezone: requestedEffTz,
//             },
//             { responseType: "blob" }
//           );
//         }
//       }

//       setPdfUrl((prev) => {
//         if (prev) URL.revokeObjectURL(prev);
//         return URL.createObjectURL(res.data);
//       });

//       toast({
//         icon: "success",
//         title: "Preview ready",
//         text:
//           panelMode === "bulk-send"
//             ? "Sample preview generated for the first selected influencer."
//             : undefined,
//       });
//     } catch (e: any) {
//       toast({
//         icon: "error",
//         title: "Preview failed",
//         text:
//           e?.response?.data?.message ||
//           e?.message ||
//           "Could not generate preview.",
//       });
//     } finally {
//       setIsPreviewLoading(false);
//     }
//   }, [
//     selectedInf,
//     campaignId,
//     brandId,
//     validateForPreview,
//     isFullyManagedPlan,
//     panelMode,
//     buildContentPayload,
//     bulkTargets,
//     buildBulkContentPayload,
//     selectedMeta,
//     buildBrandUpdatesPayload,
//     requestedEffDate,
//     requestedEffTz,
//   ]);

//   const handleSendContract = useCallback(async () => {
//     if (!selectedInf || !campaignId || !brandId) return;
//     if (!pdfUrl) {
//       toast({ icon: "info", title: "Preview required", text: "Generate preview before sending." });
//       return;
//     }
//     if (!validateForPreview()) return;

//     setIsSendLoading(true);
//     try {
//       await post("/contract/initiate", {
//         brandId,
//         campaignId,
//         influencerId: selectedInf.influencerId,
//         content: buildContentPayload(),
//         requestedEffectiveDate: requestedEffDate,
//         requestedEffectiveDateTimezone: requestedEffTz,
//       });

//       toast({ icon: "success", title: "Sent!", text: "Contract sent to influencer." });
//       closeSidebar();
//       fetchApplicants(debouncedSearch);
//       loadMetaCache(influencers);
//     } catch (e: any) {
//       toast({
//         icon: "error",
//         title: "Send failed",
//         text: e?.response?.data?.message || e?.message || "Failed to send contract.",
//       });
//     } finally {
//       setIsSendLoading(false);
//     }
//   }, [
//     brandId,
//     buildContentPayload,
//     campaignId,
//     closeSidebar,
//     debouncedSearch,
//     fetchApplicants,
//     influencers,
//     loadMetaCache,
//     pdfUrl,
//     requestedEffDate,
//     requestedEffTz,
//     selectedInf,
//     validateForPreview,
//   ]);

//   const handleBulkSendContracts = useCallback(async () => {
//     if (!brandId || !campaignId || !selectedBulkIds.length) return;

//     if (!pdfUrl) {
//       toast({
//         icon: "info",
//         title: "Preview required",
//         text: "Generate preview before bulk sending.",
//       });
//       return;
//     }

//     if (!validateForPreview()) return;

//     setIsSendLoading(true);
//     try {
//       const res: any = await post("/contract/initiate-bulk", {
//         brandId,
//         campaignId,
//         influencerIds: selectedBulkIds,
//         content: buildBulkContentPayload(),
//         requestedEffectiveDate: requestedEffDate,
//         requestedEffectiveDateTimezone: requestedEffTz,
//       });

//       const sentCount = res?.sentCount || res?.data?.sentCount || 0;
//       const failed = res?.failed || res?.data?.failed || [];

//       toast({
//         icon: failed.length ? "info" : "success",
//         title: `${sentCount} contract${sentCount > 1 ? "s" : ""} sent`,
//         text: failed.length
//           ? `${failed.length} failed.`
//           : "Bulk contract send completed.",
//       });

//       setSelectedBulkIds([]);
//       setBulkTargets([]);
//       closeSidebar();
//       fetchApplicants(debouncedSearch);
//       loadMetaCache(influencers);
//     } catch (e: any) {
//       toast({
//         icon: "error",
//         title: "Bulk send failed",
//         text:
//           e?.response?.data?.message ||
//           e?.message ||
//           "Failed to send bulk contracts.",
//       });
//     } finally {
//       setIsSendLoading(false);
//     }
//   }, [
//     brandId,
//     campaignId,
//     selectedBulkIds,
//     pdfUrl,
//     validateForPreview,
//     buildBulkContentPayload,
//     requestedEffDate,
//     requestedEffTz,
//     closeSidebar,
//     fetchApplicants,
//     debouncedSearch,
//     loadMetaCache,
//     influencers,
//   ]);

//   const handleEditContract = useCallback(async () => {
//     if (!selectedMeta?.contractId || !brandId) return;
//     if (!pdfUrl) {
//       toast({ icon: "info", title: "Preview required" });
//       return;
//     }
//     if (!validateForPreview()) return;

//     setIsUpdateLoading(true);
//     try {
//       if (isRejectedMeta(selectedMeta)) {
//         await post("/contract/resend", {
//           contractId: selectedMeta.contractId,
//           content: buildContentPayload(),
//           requestedEffectiveDate: requestedEffDate,
//           requestedEffectiveDateTimezone: requestedEffTz,
//         });
//         toast({ icon: "success", title: "Resent!", text: "New contract sent to influencer." });
//       } else {
//         await post("/contract/brand/update", {
//           contractId: selectedMeta.contractId,
//           brandId,
//           type: 0,
//           brandUpdates: buildBrandUpdatesPayload(),
//         });
//         toast({ icon: "success", title: "Updated", text: "Contract updated and shared." });
//       }

//       closeSidebar();
//       fetchApplicants(debouncedSearch);
//       loadMetaCache(influencers);
//     } catch (e: any) {
//       toast({
//         icon: "error",
//         title: "Action failed",
//         text: e?.response?.data?.message || e?.message || "Failed to update contract.",
//       });
//     } finally {
//       setIsUpdateLoading(false);
//     }
//   }, [
//     brandId,
//     buildBrandUpdatesPayload,
//     buildContentPayload,
//     closeSidebar,
//     debouncedSearch,
//     fetchApplicants,
//     influencers,
//     loadMetaCache,
//     pdfUrl,
//     requestedEffDate,
//     requestedEffTz,
//     selectedMeta,
//     validateForPreview,
//   ]);

//   const handleViewContract = useCallback(
//     async (inf?: Influencer) => {
//       const target = inf || selectedInf;
//       if (!target) return;
//       const activeMeta = metaCache[target.influencerId] ?? (await getLatestContractFor(target));
//       if (!activeMeta?.contractId) {
//         toast({
//           icon: "error",
//           title: "No contract",
//           text: "Please send the contract first.",
//         });
//         return;
//       }
//       try {
//         const res = await api.post(
//           "/contract/viewPdf",
//           { contractId: activeMeta.contractId },
//           { responseType: "blob" }
//         );
//         const url = URL.createObjectURL(res.data);
//         window.open(url, "_blank");
//       } catch (e: any) {
//         toast({
//           icon: "error",
//           title: "Open failed",
//           text: e?.message || "Unable to open contract.",
//         });
//       }
//     },
//     [getLatestContractFor, metaCache, selectedInf]
//   );

//   const handleBrandAccept = useCallback(
//     async (inf?: Influencer) => {
//       const target = inf || selectedInf;
//       if (!target) return;
//       const activeMeta = metaCache[target.influencerId] ?? (await getLatestContractFor(target));
//       if (!activeMeta?.contractId) {
//         toast({ icon: "error", title: "No contract", text: "Send contract first." });
//         return;
//       }

//       const ok = await askConfirm(
//         "Confirm as Brand?",
//         "Once confirmed, the contract can move to signing if the influencer already accepted."
//       );
//       if (!ok) return;

//       try {
//         await post("/contract/brand/confirm", { contractId: activeMeta.contractId });
//         toast({ icon: "success", title: "Brand accepted" });
//         fetchApplicants(debouncedSearch);
//         loadMetaCache(influencers);
//       } catch (e: any) {
//         toast({
//           icon: "error",
//           title: "Confirm failed",
//           text: e?.response?.data?.message || e?.message || "Could not confirm.",
//         });
//       }
//     },
//     [debouncedSearch, fetchApplicants, getLatestContractFor, influencers, loadMetaCache, metaCache, selectedInf]
//   );

//   const openSignModal = useCallback((meta: ContractMeta | null) => {
//     if (!meta?.contractId) {
//       toast({ icon: "error", title: "No contract", text: "No contract found." });
//       return;
//     }
//     setSignTargetMeta(meta);
//     setSignOpen(true);
//   }, []);

//   const tableRows = useMemo<AppliedInfluencerRow[]>(() => {
//     return influencers.map((inf) => {
//       const contractMeta = metaCache[inf.influencerId] || null;
//       const hasContract = !!(
//         contractMeta?.contractId ||
//         inf.contractId ||
//         inf.isAssigned
//       );
//       const rejected = isRejectedMeta(contractMeta);
//       const typeLabel = getAppliedTypeLabel(contractMeta, hasContract);
//       const engagement = getEngagementValue(inf);
//       const platform = normalizePlatform(inf.primaryPlatform);
//       const category = getCategoryLabel(inf);
//       const audience = Number(inf.audienceSize ?? 0);
//       const feeAmountValue = Number(inf.feeAmount ?? 0);

//       return {
//         id: inf.influencerId,
//         profile: {
//           name: inf.name,
//           handle: inf.handle ? sanitizeHandle(inf.handle) : "",
//           avatarUrl: (inf as any)?.avatarUrl || (inf as any)?.profileImage || "",
//         },
//         category,
//         followers: audience,
//         engagement,
//         platforms: [{ platform, followers: audience, engagement }],
//         appliedDate: inf.createdAt || "",
//         status: prettyStatus(contractMeta, hasContract, true),
//         budget: feeAmountValue ? formatMoneyINR(feeAmountValue) : "₹0",
//         rawInfluencer: inf,
//         contractMeta,
//         hasContract,
//         rejected,
//         typeLabel,
//         feeAmountValue,
//       };
//     });
//   }, [influencers, metaCache]);

//   const filteredRows = useMemo(() => {
//     let list = [...tableRows];

//     list = list.filter((row) => {
//       const engagementOk = matchesEngagementFilter(
//         row.engagement ?? 0,
//         filters["Engagement Rate"]
//       );

//       const influencerTypeOk = matchesInfluencerType(
//         row.typeLabel,
//         filters["Influencer Type"]
//       );

//       const categoryOk =
//         filters.Category.length === 0 ||
//         filters.Category.includes("All") ||
//         filters.Category.some((c) => row.category.toLowerCase().includes(c.toLowerCase()));

//       const platformNames = (row.platforms || []).map((p) => p.platform.toLowerCase());
//       const platformOk =
//         filters.Platform.length === 0 ||
//         filters.Platform.includes("All") ||
//         filters.Platform.some((p) => platformNames.includes(p.toLowerCase()));

//       const dateOk = matchesDateFilter(row.appliedDate, filters.Date);
//       const followerTierLabel = getFollowerTierBucket(row.followers ?? 0);
//       const followerOk =
//         !filters.Follower ||
//         filters.Follower === "All" ||
//         filters.Follower.toLowerCase().includes(followerTierLabel.toLowerCase());

//       return (
//         engagementOk &&
//         influencerTypeOk &&
//         categoryOk &&
//         platformOk &&
//         dateOk &&
//         followerOk
//       );
//     });

//     switch (sortValue) {
//       case "Recently added":
//         list.sort(
//           (a, b) =>
//             new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
//         );
//         break;
//       case "Highest engagement":
//         list.sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0));
//         break;
//       case "Highest follower":
//         list.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
//         break;
//       case "Price: Low to High":
//         list.sort((a, b) => a.feeAmountValue - b.feeAmountValue);
//         break;
//       case "Price: HIgh to Low":
//         list.sort((a, b) => b.feeAmountValue - a.feeAmountValue);
//         break;
//       case "Priority":
//       default:
//         list.sort(
//           (a, b) =>
//             new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
//         );
//         break;
//     }

//     return list;
//   }, [filters, sortValue, tableRows]);

//   const selectedBulkRows = useMemo(() => {
//     return filteredRows.filter((row) =>
//       selectedBulkIds.includes(row.rawInfluencer.influencerId)
//     );
//   }, [filteredRows, selectedBulkIds]);

//   const toggleBulkRow = useCallback((influencerId: string) => {
//     setSelectedBulkIds((prev) =>
//       prev.includes(influencerId)
//         ? prev.filter((id) => id !== influencerId)
//         : [...prev, influencerId]
//     );
//   }, []);

//   const toggleBulkAllVisible = useCallback(() => {
//     const eligibleIds = filteredRows
//       .filter(isBulkSelectable)
//       .map((row) => row.rawInfluencer.influencerId);

//     const allSelected =
//       eligibleIds.length > 0 &&
//       eligibleIds.every((id) => selectedBulkIds.includes(id));

//     setSelectedBulkIds((prev) => {
//       if (allSelected) {
//         return prev.filter((id) => !eligibleIds.includes(id));
//       }
//       return Array.from(new Set([...prev, ...eligibleIds]));
//     });
//   }, [filteredRows, isBulkSelectable, selectedBulkIds]);

//   const clearBulkSelection = useCallback(() => {
//     setSelectedBulkIds([]);
//   }, []);



//   function StatusBadge({
//     meta,
//     hasContract,
//   }: {
//     meta: ContractMeta | null;
//     hasContract: boolean;
//   }) {
//     const label = prettyStatus(meta, hasContract, true);
//     const rejected = isRejectedMeta(meta);
//     return (
//       <span
//         className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${rejected ? "bg-black text-white" : "bg-[#F7F7F7] text-[#1A1A1A]"
//           }`}
//       >
//         {label}
//       </span>
//     );
//   }

//   type MilestoneDropdownValue = "add-milestone" | "view-milestone";

//   const MILESTONE_DROPDOWN_OPTIONS: Array<{
//     value: MilestoneDropdownValue;
//     label: string;
//   }> = [
//       { value: "add-milestone", label: "Add Milestone" },
//       { value: "view-milestone", label: "View Milestone" },
//     ];

//   function MilestoneActionsDropdown({
//     onAddMilestone,
//     onViewMilestone,
//     canAddMilestone = true,
//     canViewMilestone = true,
//   }: {
//     onAddMilestone: () => void;
//     onViewMilestone: () => void;
//     canAddMilestone?: boolean;
//     canViewMilestone?: boolean;
//   }) {
//     const [open, setOpen] = React.useState(false);
//     const [selectedValue, setSelectedValue] =
//       React.useState<MilestoneDropdownValue | null>(null);

//     const items = React.useMemo(
//       () => MILESTONE_DROPDOWN_OPTIONS.map((item) => item.value),
//       []
//     );

//     const labelMap = React.useMemo(
//       () =>
//         MILESTONE_DROPDOWN_OPTIONS.reduce<
//           Record<MilestoneDropdownValue, string>
//         >((acc, item) => {
//           acc[item.value] = item.label;
//           return acc;
//         }, {} as Record<MilestoneDropdownValue, string>),
//       []
//     );

//     const isDisabled = React.useCallback(
//       (item: MilestoneDropdownValue) => {
//         if (item === "add-milestone") return !canAddMilestone;
//         if (item === "view-milestone") return !canViewMilestone;
//         return false;
//       },
//       [canAddMilestone, canViewMilestone]
//     );

//     const handleValueChange = React.useCallback(
//       (next: MilestoneDropdownValue | null) => {
//         setSelectedValue(next);

//         if (!next || isDisabled(next)) return;

//         if (next === "add-milestone") onAddMilestone();
//         if (next === "view-milestone") onViewMilestone();

//         setOpen(false);

//         requestAnimationFrame(() => {
//           setSelectedValue(null);
//         });
//       },
//       [isDisabled, onAddMilestone, onViewMilestone]
//     );

//     return (
//       <Combobox
//         items={items}
//         open={open}
//         onOpenChange={setOpen}
//         value={selectedValue}
//         onValueChange={handleValueChange}
//       >
//         <ComboboxTrigger
//           hideIcon
//           aria-label="Open milestone actions"
//           render={
//             <button
//               type="button"
//               className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white transition-colors hover:bg-[#F7F7F7]"
//             />
//           }
//         >
//           <DotsThree size={16} weight="bold" />
//         </ComboboxTrigger>

//         <ComboboxContent
//           align="end"
//           side="bottom"
//           sideOffset={8}
//           className="w-52 p-2"
//         >
//           <ComboboxEmpty>No actions found.</ComboboxEmpty>

//           <ComboboxList className="gap-1 px-0">
//             {(item: MilestoneDropdownValue) => (
//               <ComboboxItem
//                 key={item}
//                 value={item}
//                 showIndicator={false}
//                 disabled={isDisabled(item)}
//                 className="h-9 px-3 text-sm"
//               >
//                 {labelMap[item]}
//               </ComboboxItem>
//             )}
//           </ComboboxList>
//         </ComboboxContent>
//       </Combobox>
//     );
//   }

//   function AppliedCampaignActionCell({
//     row,
//     onOpenPayoutTypeDialog,
//   }: {
//     row: AppliedInfluencerRow;
//     onOpenPayoutTypeDialog: (influencer: AppliedInfluencerRow["rawInfluencer"]) => void;
//   }) {
//     const inf = row.rawInfluencer;
//     const meta = row.contractMeta;
//     const hasContract = row.hasContract;
//     const statusStr = String(meta?.status || "");
//     const locked = isLockedStatus(statusStr);
//     const editable = isEditableStatus(statusStr) || row.rejected;
//     const needsAccept = needsBrandAcceptance(statusStr);
//     const readyToSign = canSignNow(statusStr) && !meta?.signatures?.brand?.signed;

//     const primaryLabel = !hasContract
//       ? "Send Contract"
//       : row.rejected
//         ? "Resend"
//         : editable && !locked
//           ? "Edit Contract"
//           : "View Contract";

//     const handlePrimary = () => {
//       if (!hasContract) {
//         onOpenPayoutTypeDialog(inf);
//         return;
//       }

//       if (editable && !locked) {
//         openSidebar(inf, "edit");
//         return;
//       }

//       handleViewContract(inf);
//     };

//     const handleManageClick = () => {
//       router.push(`/brand/influencers?id=${inf.influencerId}`);
//     };

//     return (
//       <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
//         <button
//           type="button"
//           onClick={handlePrimary}
//           className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#D9D9D9] bg-white px-4 text-[0.875rem] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F7F7]"
//         >
//           {primaryLabel}
//         </button>

//         {needsAccept ? (
//           <button
//             type="button"
//             onClick={() => handleBrandAccept(inf)}
//             className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#E6E6E6] bg-white px-4 text-[0.875rem] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F7F7]"
//           >
//             <SealCheck className="mr-2 h-4 w-4" /> Accept
//           </button>
//         ) : null}

//         {readyToSign ? (
//           <button
//             type="button"
//             onClick={() => openSignModal(meta)}
//             className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#E6E6E6] bg-white px-4 text-[0.875rem] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F7F7]"
//           >
//             <Signature className="mr-2 h-4 w-4" /> Sign
//           </button>
//         ) : null}

//         <button
//           type="button"
//           onClick={handleManageClick}
//           className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#1A1A1A] px-6 text-[0.875rem] font-medium text-white transition-opacity hover:opacity-90"
//         >
//           View Influencer
//         </button>

//         <button
//           type="button"
//           onClick={() => router.push("/brand/inbox")}
//           className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white transition-colors hover:bg-[#F7F7F7]"
//         >
//           <EnvelopeOpen size={16} />
//           {hasContract ? (
//             <span className="absolute right-[0.32rem] top-[0.32rem] h-1.5 w-1.5 rounded-full bg-[#28A745]" />
//           ) : null}
//         </button>

//         <MilestoneActionsDropdown
//           onAddMilestone={() => handleAddMilestone(inf, meta)}
//           onViewMilestone={() => handleViewMilestone(inf, meta)}
//           canAddMilestone={
//             hasContract &&
//             ([CONTRACT_STATUS.CONTRACT_SIGNED, CONTRACT_STATUS.MILESTONES_CREATED] as ContractStatus[]).includes(
//               statusStr as ContractStatus
//             )
//           }
//           canViewMilestone={hasContract}
//         />
//       </div>
//     );
//   }

//   const EmptyState = () => (
//     <div className="space-y-3 p-12 text-center">
//       <div
//         className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
//         style={{ backgroundColor: "#000" }}
//       >
//         <MagnifyingGlass className="h-6 w-6 text-white" />
//       </div>
//       <h3 className="text-lg font-semibold">No applicants found</h3>
//       <p className="text-sm text-gray-600">
//         Try adjusting your search or sorting options.
//       </p>
//     </div>
//   );

//   const MobileCardList = () => (
//     <div className="grid gap-3 md:hidden">
//       {filteredRows.map((row) => {
//         const inf = row.rawInfluencer;
//         const meta = row.contractMeta;
//         const hasContract = row.hasContract;
//         const href = buildHandleUrl(inf.primaryPlatform, inf.handle);
//         const selectable = isBulkSelectable(row);
//         const checked = selectedBulkIds.includes(inf.influencerId);

//         return (
//           <div
//             key={inf.influencerId}
//             id={`inf-card-${inf.influencerId}`}
//             className={`relative rounded-xl border bg-white p-4 transition-all duration-300 ${highlightInfId === inf.influencerId
//               ? "border-[#1A1A1A] bg-[#F5F5F5] shadow-[0_0_0_2px_rgba(26,26,26,0.22),0_18px_45px_rgba(0,0,0,0.18)] animate-pulse scale-[1.02]"
//               : "border-gray-200 hover:-translate-y-[1px] hover:shadow-md"
//               }`}
//           >
//             {highlightInfId === inf.influencerId ? (
//               <span className="absolute -top-2 right-3 rounded-full bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
//                 From notification
//               </span>
//             ) : null}

//             <div className="flex items-start justify-between gap-3">
//               <div className="min-w-0">
//                 <div className="truncate font-semibold" title={inf.name}>
//                   {inf.name}
//                 </div>
//                 <div className="truncate text-sm text-gray-600">
//                   {href ? (
//                     <a href={href} target="_blank" rel="noreferrer" className="text-black hover:underline">
//                       {inf.handle}
//                     </a>
//                   ) : (
//                     <span className="text-gray-500">—</span>
//                   )}
//                 </div>
//                 <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
//                   <Badge className="bg-gray-200 text-gray-800">{row.category}</Badge>
//                   <span>•</span>
//                   <span>{formatCompactAudience(inf.audienceSize)} audience</span>
//                 </div>
//               </div>

//               <StatusBadge meta={meta} hasContract={hasContract} />
//             </div>

//             {selectable ? (
//               <div className="mt-3">
//                 <label className="inline-flex items-center gap-2 text-xs text-gray-600">
//                   <input
//                     type="checkbox"
//                     checked={checked}
//                     onChange={() => toggleBulkRow(inf.influencerId)}
//                     className="h-4 w-4 rounded border-gray-300"
//                   />
//                   Select for bulk contract
//                 </label>
//               </div>
//             ) : null}

//             <div className="mt-3">
//               <AppliedCampaignActionCell
//                 row={row}
//                 onOpenPayoutTypeDialog={openSinglePayoutTypeDialog}
//               />
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );

//   const todayStr = toInputDate(new Date());
//   const updateBtnLabel =
//     selectedMeta && isRejectedMeta(selectedMeta) ? "Resend Contract" : "Update Contract";

//   const sidebarStateFor = useCallback(
//     (key: string) => (formErrors[key] ? ("error" as const) : undefined),
//     [formErrors]
//   );

//   const sidebarErrorFor = useCallback(
//     (key: string) => formErrors[key] || "",
//     [formErrors]
//   );

//   const usageRightOptions = useMemo(
//     () =>
//       contractForm.scheduleA.usageRights.rows.map((row) => ({
//         value: row.usageRight,
//         label: row.usageRight,
//       })),
//     [contractForm.scheduleA.usageRights.rows]
//   );

//   const selectedUsageRights = useMemo(
//     () =>
//       contractForm.scheduleA.usageRights.rows
//         .filter((row) => row.selected)
//         .map((row) => row.usageRight),
//     [contractForm.scheduleA.usageRights.rows]
//   );

//   const setSelectedUsageRights = useCallback(
//     (next: string[]) => {
//       setContractField(
//         "scheduleA.usageRights.rows",
//         contractForm.scheduleA.usageRights.rows.map((row) => ({
//           ...row,
//           selected: next.includes(row.usageRight),
//         }))
//       );
//     },
//     [contractForm.scheduleA.usageRights.rows, setContractField]
//   );
//   const preShootRequired = Boolean(
//     getAtPath(contractForm, "scheduleA.preShootScriptRequired", false)
//   );

//   const preShootDueDateError = useMemo(() => {
//     if (formErrors["scheduleA.preShootScriptDue"]) return formErrors["scheduleA.preShootScriptDue"];
//     if (!preShootRequired) return "";
//     const preShootVal = getAtPath(contractForm, "scheduleA.preShootScriptDue");
//     if (!preShootVal) return "";
//     const preShootMs = new Date(preShootVal).getTime();
//     for (const row of deliverables) {
//       if (row.isDraftRequired && row.draftDue) {
//         const draftMs = new Date(row.draftDue).getTime();
//         if (preShootMs >= draftMs) {
//           return `Pre-shoot date must be before draft due (${new Date(row.draftDue).toLocaleDateString()})`;
//         }
//       }
//     }
//     return "";
//   }, [preShootRequired, contractForm, deliverables, formErrors]);
//   return (
//     <TooltipProvider delayDuration={150}>
//       <div className="mx-auto min-h-screen max-w-full space-y-6 p-4 md:space-y-8 md:p-8">
//         <header className="sticky top-0 flex items-center justify-between rounded-md border-b border-gray-100 bg-white/90 p-2 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:p-4">
//           <h1 className="truncate text-xl font-bold md:text-3xl">Campaign: {pageTitle}</h1>
//           <div className="flex items-center gap-2">
//             <Button size="sm" variant="outline" onClick={() => router.back()}>
//               Back
//             </Button>
//           </div>
//         </header>

//         <InfluencerFilter
//           filters={filters}
//           setFilters={setFilters}
//           search={search}
//           setSearch={setSearch}
//           sortValue={sortValue}
//           setSortValue={setSortValue}
//         />

//         {loading ? (
//           <div className="rounded-md bg-white shadow-sm">
//             <LoadingSkeleton rows={PAGE_SIZE} />
//           </div>
//         ) : error ? (
//           <ErrorMessage>{error}</ErrorMessage>
//         ) : filteredRows.length === 0 ? (
//           <div className="rounded-md bg-white shadow-sm">
//             <EmptyState />
//           </div>
//         ) : (
//           <>


//             <div className="hidden overflow-x-auto rounded-md md:block">
//               <InfluencerTable
//                 rows={filteredRows}
//                 variant="shortlisted"
//                 selectable
//                 selectedIds={selectedBulkIds}
//                 onToggleRow={toggleBulkRow}
//                 onToggleAll={toggleBulkAllVisible}
//                 onClearSelection={clearBulkSelection}
//                 isRowSelectable={(baseRow) => isBulkSelectable(baseRow as AppliedInfluencerRow)}
//                 renderBulkHeader={({ selectedIds, clearSelection }) => (
//                   <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-[#F2F2F2] px-8">
//                     <div className="text-sm font-medium text-gray-800">
//                       {selectedIds.length} influencer{selectedIds.length > 1 ? "s" : ""} selected
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <Button variant="outline" onClick={clearSelection}>
//                         Clear
//                       </Button>

//                       <Button onClick={openBulkPayoutTypeDialog}>
//                         <PaperPlaneTilt className="mr-2 h-4 w-4" />
//                         Bulk Send Contract
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//                 renderStatus={(baseRow) => {
//                   const row = baseRow as AppliedInfluencerRow;

//                   if (row.rejected) {
//                     return (
//                       <div className="space-y-1 text-center">
//                         <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
//                           Rejected
//                         </span>
//                         <p className="max-w-[150px] break-words text-[11px] text-gray-500">
//                           {getRejectReasonFromMeta(row.contractMeta) || "No reason provided"}
//                         </p>
//                       </div>
//                     );
//                   }

//                   return (
//                     <StatusBadge
//                       meta={row.contractMeta}
//                       hasContract={row.hasContract}
//                     />
//                   );
//                 }}
//                 renderShortlistedActions={(baseRow) => (
//                   <AppliedCampaignActionCell
//                     row={baseRow as AppliedInfluencerRow}
//                     onOpenPayoutTypeDialog={openSinglePayoutTypeDialog}
//                   />
//                 )}
//               />
//             </div>

//             <MobileCardList />
//           </>
//         )}

//         {meta.totalPages > 1 ? (
//           <div className="flex items-center justify-center gap-2 md:justify-end">
//             <Button
//               variant="outline"
//               disabled={page === 1}
//               onClick={() => setPage((p) => Math.max(p - 1, 1))}
//               className="text-black"
//               aria-label="Previous page"
//             >
//               <CaretLeft />
//             </Button>
//             <span className="text-sm">
//               Page <strong>{page}</strong> of {meta.totalPages}
//             </span>
//             <Button
//               variant="outline"
//               disabled={page === meta.totalPages}
//               onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
//               className="text-black"
//               aria-label="Next page"
//             >
//               <CaretRight />
//             </Button>
//           </div>
//         ) : null}

//         <ContractSidebar
//           isOpen={sidebarOpen && !isFullyManagedPlan}
//           onClose={closeSidebar}
//           title={
//             panelMode === "bulk-send"
//               ? "Bulk Send Contracts"
//               : panelMode === "send"
//                 ? "Send Contract"
//                 : selectedMeta && isRejectedMeta(selectedMeta)
//                   ? "Resend Contract"
//                   : "Edit Contract"
//           }
//           subtitle={
//             panelMode === "bulk-send"
//               ? bulkInfluencerNames.length > 0
//                 ? bulkInfluencerNames.join(", ")
//                 : `${selectedBulkIds.length} influencer${selectedBulkIds.length > 1 ? "s" : ""} selected`
//               : selectedInf
//                 ? `${pageTitle || "Agreement"} • ${selectedInf.name}`
//                 : pageTitle || "Agreement"
//           }
//           previewUrl={pdfUrl}
//           onClosePreview={clearPreview}
//           isAutoPreviewLoading={isAutoPreviewLoading}
//         >
//           <SidebarSection title="Brand" icon={<FileText className="h-4 w-4" />}>
//             <div className="space-y-3">

//               <FloatingInput
//                 id="brand-legal-name"
//                 label="Brand Legal Name"
//                 value={getAtPath(contractForm, "brand.legalName")}
//                 onValueChange={(value: string) =>
//                   setContractField("brand.legalName", value)
//                 }
//                 info={SIDEBAR_TOOLTIPS.brandLegalName}
//                 state={sidebarStateFor("brand.legalName")}
//                 errorText={sidebarErrorFor("brand.legalName")}
//                 required
//               />

//               <FloatingInput
//                 id="brand-contact-person"
//                 label="Contact Person Name"
//                 info={SIDEBAR_TOOLTIPS.brandContactPerson}
//                 value={getAtPath(contractForm, "brand.contactPersonName")}
//                 onValueChange={(value: string) =>
//                   setContractField("brand.contactPersonName", value)
//                 }
//                 required
//               />

//               {/* <FloatingInput
//                 id="brand-notice-email"
//                 label="Notice Email"
//                 info={SIDEBAR_TOOLTIPS.brandNoticeEmail}
//                 value={getAtPath(contractForm, "brand.noticeEmail")}
//                 onValueChange={(value: string) =>
//                   setContractField("brand.noticeEmail", value)
//                 }
//               /> */}

//               {/* <FloatingInput
//                 id="brand-notice-phone"
//                 label="Notice Phone"
//                 info={SIDEBAR_TOOLTIPS.brandNoticePhone}
//                 value={getAtPath(contractForm, "brand.noticePhone")}
//                 onValueChange={(value: string) =>
//                   setContractField("brand.noticePhone", value)
//                 }
//               /> */}

//               <LabeledTextarea
//                 id="brand-billing-address"
//                 label="Billing Address"
//                 info={SIDEBAR_TOOLTIPS.brandBillingAddress}
//                 value={getAtPath(contractForm, "brand.billingAddress")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("brand.billingAddress", e.target.value)
//                 }
//                 required
//               />
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Campaign Overview"
//             icon={<Info className="h-4 w-4" />}
//           >
//             <div className="space-y-4">
//               <FloatingInput
//                 id="campaign-title"
//                 label="Campaign Title / ID"
//                 info={SIDEBAR_TOOLTIPS.campaignTitle}
//                 value={getAtPath(contractForm, "campaign.campaignTitleOrId")}
//                 onValueChange={(value: string) =>
//                   setContractField("campaign.campaignTitleOrId", value)
//                 }
//                 state={sidebarStateFor("campaign.campaignTitleOrId")}
//                 errorText={sidebarErrorFor("campaign.campaignTitleOrId")}
//                 required
//               />

//               <LabeledTextarea
//                 id="campaign-products-services"
//                 label="Products / Services Covered"
//                 info={SIDEBAR_TOOLTIPS.campaignProductsServices}
//                 value={getAtPath(contractForm, "campaign.productsServicesCovered")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("campaign.productsServicesCovered", e.target.value)
//                 }
//               />

//               <FloatingSelect
//                 label="campaign-payment-type"
//                 value={getAtPath(contractForm, "campaign.paymentType")}
//                 onValueChange={(value) => {
//                   const nextType = normalizePaymentType(value);
//                   setContractForm((prev) => {
//                     const next = deepClone(prev);
//                     next.campaign.paymentType = nextType;
//                     if (nextType === PAYMENT_TYPE.MILESTONE) {
//                       if (!next.scheduleA.commercial.milestones.length) {
//                         next.scheduleA.commercial.milestones =
//                           [createDefaultCommercialMilestone()];
//                       }
//                       next.scheduleA.commercial.paymentStructure = "";
//                     }
//                     if (nextType === PAYMENT_TYPE.FIXED) {
//                       next.scheduleA.commercial.milestones = [];
//                       if (!next.scheduleA.commercial.paymentStructure) { next.scheduleA.commercial.paymentStructure = "50% advance / 50% balance"; }
//                     }
//                     if (nextType === PAYMENT_TYPE.GIFTING) {
//                       next.scheduleA.commercial.milestones = [];
//                       next.scheduleA.commercial.paymentStructure = "";
//                       next.scheduleA.commercial.totalCampaignFee = "0";
//                     } return next;
//                   });
//                 }} searchable={false} state={sidebarStateFor("campaign.paymentType")} errorText={sidebarErrorFor("campaign.paymentType")}
//                 disabled
//                 info={SIDEBAR_TOOLTIPS.paymentType}
//               >                {PAYMENT_TYPE_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>                    {option.label}                  </SelectItem>))}
//               </FloatingSelect>

//               <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                 <FloatingSelect
//                   label="Territory / Target Country"
//                   info={SIDEBAR_TOOLTIPS.campaignTerritory}
//                   value={getAtPath(contractForm, "campaign.territoryTargetCountry")}
//                   onValueChange={(value) =>
//                     setContractField("campaign.territoryTargetCountry", value)
//                   }
//                   searchable
//                   required
//                 >
//                   <SelectItem value="Worldwide">🌍 Worldwide</SelectItem>
//                   {countryOptions.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>

//                 <FloatingDateInput
//                   id="requested-effective-date"
//                   label="Requested Effective Date"
//                   info={SIDEBAR_TOOLTIPS.requestedEffectiveDate}
//                   type="date"
//                   value={requestedEffDate}
//                   min={todayStr}
//                   onValueChange={(value) => {
//                     setRequestedEffDate(value);
//                     setContractField("campaign.effectiveDate", value);

//                     const nextEffMs = value ? new Date(value).getTime() : 0;

//                     // clear pre-shoot if now invalid
//                     const currentPreShoot = getAtPath(contractForm, "scheduleA.preShootScriptDue");
//                     if (currentPreShoot && new Date(currentPreShoot).getTime() <= nextEffMs) {
//                       setContractField("scheduleA.preShootScriptDue", "");
//                     }

//                     // clear invalid deliverable dates
//                     setDeliverables((prev) =>
//                       prev.map((item) => {
//                         const next = { ...item };

//                         if (next.draftDue && new Date(next.draftDue).getTime() <= nextEffMs) {
//                           next.draftDue = "";
//                         }

//                         if (next.liveDate && new Date(next.liveDate).getTime() <= nextEffMs) {
//                           next.liveDate = "";
//                         }

//                         return next;
//                       })
//                     );
//                   }}
//                   state={sidebarStateFor("requestedEffDate")}
//                   errorText={sidebarErrorFor("requestedEffDate")}
//                   required
//                 />

//               </div>

//               <FloatingSelect
//                 label="Timezone"
//                 info={SIDEBAR_TOOLTIPS.timezone}
//                 value={requestedEffTz}
//                 onValueChange={(value) => setRequestedEffTz(value)}
//                 searchable
//               >
//                 {tzOptions.map((option, index) => (
//                   <SelectItem key={`${option.value}-${index}`} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>
//             </div>
//           </SidebarSection>


//           <SidebarSection
//             title="Deliverables & Publication Timeline"
//             icon={<ClipboardText className="h-4 w-4" />}
//           >
//             <div className="space-y-4">
//               {formErrors["scheduleA.deliverables"] ? (
//                 <div className="text-xs text-red-600">
//                   {formErrors["scheduleA.deliverables"]}
//                 </div>
//               ) : null}

//               {deliverables.map((row, index) => (
//                 <div
//                   key={row.id}
//                   className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
//                 >
//                   <div className="flex items-center justify-between gap-2">
//                     <div className="text-sm font-semibold text-gray-800">
//                       Deliverable #{index + 1}
//                     </div>

//                     {deliverables.length > 1 ? (
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setDeliverables((prev) =>
//                             prev.filter((item) => item.id !== row.id)
//                           )
//                         }
//                         className="text-xs text-gray-500 hover:text-red-600"
//                       >
//                         Remove
//                       </button>
//                     ) : null}
//                   </div>

//                   <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                     <FloatingInput
//                       id={`deliverable-sr-${row.id}`}
//                       label="Sr. No."
//                       type="number"
//                       value={String(index + 1)}
//                       onValueChange={() => undefined}
//                       disabled
//                     />


//                     <FloatingSelect
//                       label="Platform"
//                       info={SIDEBAR_TOOLTIPS.platformHandle}
//                       value={row.platform}
//                       onValueChange={(value) =>
//                         setDeliverables((prev) =>
//                           prev.map((item) =>
//                             item.id === row.id ? { ...item, platform: value } : item
//                           )
//                         )
//                       }
//                       searchable={false}
//                       required
//                     >
//                       {PLATFORM_OPTIONS.map((option) => (
//                         <SelectItem key={option.value} value={option.value}>
//                           {option.label}
//                         </SelectItem>
//                       ))}
//                     </FloatingSelect>


//                     <FloatingInput
//                       id={`deliverable-handle-${row.id}`}          // ✅ was duplicate of platform id
//                       label="Handle"
//                       info={SIDEBAR_TOOLTIPS.handle}
//                       value={row.Handle[0] || ""}                  // ✅ was row.Handle (an array)
//                       onValueChange={(value: string) =>
//                         setDeliverables((prev) =>
//                           prev.map((item) =>
//                             item.id === row.id
//                               ? { ...item, Handle: value ? [value] : [] }  // ✅ was platformHandle
//                               : item
//                           )
//                         )
//                       }
//                       required
//                     />

//                     <FloatingInput
//                       id={`deliverable-qty-${row.id}`}
//                       label="Qty"
//                       info={SIDEBAR_TOOLTIPS.qty}
//                       type="number"
//                       value={row.qty}
//                       onValueChange={(value: string) =>
//                         setDeliverables((prev) =>
//                           prev.map((item) =>
//                             item.id === row.id ? { ...item, qty: value } : item
//                           )
//                         )
//                       }
//                     />
//                   </div>

//                   <FloatingSelect
//                     label="Deliverable Format"
//                     info={SIDEBAR_TOOLTIPS.deliverableFormat}
//                     value={row.deliverableFormat}
//                     onValueChange={(value) =>
//                       setDeliverables((prev) =>
//                         prev.map((item) =>
//                           item.id === row.id ? { ...item, deliverableFormat: value } : item
//                         )
//                       )
//                     }
//                     searchable={false}
//                     required
//                   >
//                     {DELIVERABLE_FORMAT_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </FloatingSelect>


//                   <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                     <div className="flex items-center pt-2">
//                       <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
//                         <input
//                           type="checkbox"
//                           checked={row.isDraftRequired}
//                           onChange={(e) =>
//                             setDeliverables((prev) =>
//                               prev.map((item) =>
//                                 item.id === row.id
//                                   ? {
//                                     ...item,
//                                     isDraftRequired: e.target.checked,
//                                     draftDue: e.target.checked ? item.draftDue : "",
//                                   }
//                                   : item
//                               )
//                             )
//                           }
//                           className="h-4 w-4 rounded border-gray-300"
//                         />
//                         Draft Required
//                       </label>
//                     </div>

//                     {row.isDraftRequired ? (
//                       <FloatingDateInput
//                         id={`deliverable-draft-${row.id}`}
//                         label="Draft Due"
//                         info={SIDEBAR_TOOLTIPS.draftDue}
//                         type="date"
//                         value={row.draftDue}
//                         min={
//                           getAtPath(contractForm, "scheduleA.preShootScriptRequired", false)
//                             ? addOneDay(getAtPath(contractForm, "scheduleA.preShootScriptDue")) ||
//                             addOneDay(requestedEffDate) ||
//                             todayStr
//                             : addOneDay(requestedEffDate) || todayStr
//                         }
//                         onValueChange={(value) =>
//                           setDeliverables((prev) =>
//                             prev.map((item) =>
//                               item.id === row.id ? { ...item, draftDue: value } : item
//                             )
//                           )
//                         }
//                       />
//                     ) : (
//                       <div />
//                     )}

//                     <FloatingDateInput
//                       id={`deliverable-live-${row.id}`}
//                       label="Live Date"
//                       info={SIDEBAR_TOOLTIPS.liveDate}
//                       type="date"
//                       value={row.liveDate}
//                       min={
//                         row.isDraftRequired
//                           ? addOneDay(row.draftDue) || todayStr
//                           : getAtPath(contractForm, "scheduleA.preShootScriptRequired", false)
//                             ? addOneDay(getAtPath(contractForm, "scheduleA.preShootScriptDue")) ||
//                             addOneDay(requestedEffDate) ||
//                             todayStr
//                             : addOneDay(requestedEffDate) || todayStr
//                       }
//                       onValueChange={(value) =>
//                         setDeliverables((prev) =>
//                           prev.map((item) =>
//                             item.id === row.id ? { ...item, liveDate: value } : item
//                           )
//                         )
//                       }
//                     />
//                   </div>
//                 </div>
//               ))}

//               <Button
//                 variant="outline"
//                 onClick={() =>
//                   setDeliverables((prev) => [
//                     ...prev,
//                     {
//                       ...createDefaultScheduleDeliverable(),
//                       srNo: prev.length + 1,
//                     },
//                   ])
//                 }
//               >
//                 + Add another deliverable
//               </Button>

//               <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                 <LabeledTextarea
//                   id="minimum-video-specs"
//                   label="Minimum Video Specs"
//                   info={SIDEBAR_TOOLTIPS.minimumVideoSpecs}
//                   value={getAtPath(contractForm, "scheduleA.minimumVideoSpecs")}
//                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                     setContractField("scheduleA.minimumVideoSpecs", e.target.value)
//                   }
//                 />

//                 <FloatingTagInput
//                   label="Mandatory Tags / Mentions / Links / Codes"
//                   info={SIDEBAR_TOOLTIPS.mandatoryTags}
//                   value={csvToTags(
//                     getAtPath(contractForm, "scheduleA.mandatoryTagsMentionsLinksCodes")
//                   )}
//                   options={[]}
//                   onValueChange={(next) =>
//                     setContractField(
//                       "scheduleA.mandatoryTagsMentionsLinksCodes",
//                       tagsToCsv(next)
//                     )
//                   }
//                   dropdownDirection="up"
//                 />
//               </div>

//               <div className="grid grid-cols-1 gap-3 md:grid-cols-3 z-20">
//                 <FloatingSelect
//                   label="Pre-Shoot Script Required"
//                   info={SIDEBAR_TOOLTIPS.preShootScriptRequired}
//                   value={preShootRequired ? "yes" : "no"}
//                   onValueChange={(value) => {
//                     const isYes = value === "yes";

//                     setContractForm((prev) => {
//                       const next = deepClone(prev);
//                       next.scheduleA.preShootScriptRequired = isYes;

//                       if (!isYes) {
//                         next.scheduleA.preShootScriptDue = "";
//                       }

//                       return next;
//                     });

//                     if (!isYes) {
//                       return;
//                     }

//                     // if enabling pre-shoot after draft/live were already selected,
//                     // keep them for now; they will be corrected once pre-shoot date is chosen
//                   }}
//                   searchable={false}
//                 >
//                   {YES_NO_BOOL_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>

//                 {preShootRequired ? (
//                   <>
//                     <FloatingDateInput
//                       id="pre-shoot-script-due"
//                       label="Pre-Shoot Script Due"
//                       info={SIDEBAR_TOOLTIPS.preShootScriptDue}
//                       type="date"
//                       value={getAtPath(contractForm, "scheduleA.preShootScriptDue")}
//                       min={addOneDay(requestedEffDate) || todayStr}
//                       onValueChange={(value) => {
//                         setContractField("scheduleA.preShootScriptDue", value);
//                       }}
//                       state={(() => {
//                         const v = getAtPath(contractForm, "scheduleA.preShootScriptDue");
//                         if (!v) return sidebarStateFor("scheduleA.preShootScriptDue");
//                         const preShootMs = new Date(v).getTime();
//                         for (const row of deliverables) {
//                           if (row.isDraftRequired && row.draftDue && preShootMs >= new Date(row.draftDue).getTime()) {
//                             return "error" as const;
//                           }
//                         }
//                         return sidebarStateFor("scheduleA.preShootScriptDue");
//                       })()}
//                       errorText={(() => {
//                         const v = getAtPath(contractForm, "scheduleA.preShootScriptDue");
//                         if (!v) return sidebarErrorFor("scheduleA.preShootScriptDue");
//                         const preShootMs = new Date(v).getTime();
//                         for (const row of deliverables) {
//                           if (row.isDraftRequired && row.draftDue) {
//                             const draftMs = new Date(row.draftDue).getTime();
//                             if (preShootMs >= draftMs) {
//                               return `Must be before draft due date`;
//                             }
//                           }
//                         }
//                         return sidebarErrorFor("scheduleA.preShootScriptDue");
//                       })()}
//                     />

//                     <FloatingInput
//                       id="pre-shoot-review-days"
//                       label="Script Review Business Days"
//                       info={SIDEBAR_TOOLTIPS.preShootReviewDays}
//                       type="number"
//                       value={getAtPath(contractForm, "scheduleA.preShootScriptReviewBusinessDays")}
//                       onValueChange={(value: string) =>
//                         setContractField("scheduleA.preShootScriptReviewBusinessDays", value)
//                       }
//                       state={sidebarStateFor("scheduleA.preShootScriptReviewBusinessDays")}
//                       errorText={sidebarErrorFor("scheduleA.preShootScriptReviewBusinessDays")}
//                     />
//                   </>
//                 ) : null}
//               </div>
//             </div>
//           </SidebarSection>
//           {activePaymentType === PAYMENT_TYPE.FIXED ? (
//             <SidebarSection
//               title="Fixed Payment terms"
//               icon={<ClipboardText className="h-4 w-4" />}
//             >
//               <div className="space-y-4">
//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                   <FloatingInput
//                     id="fixed-total-campaign-fee"
//                     label="Total Budget"
//                     info={SIDEBAR_TOOLTIPS.totalCampaignFee}
//                     type="number"
//                     value={getAtPath(contractForm, "scheduleA.commercial.totalCampaignFee")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.totalCampaignFee", value)
//                     }
//                     state={sidebarStateFor("scheduleA.commercial.totalCampaignFee")}
//                     errorText={sidebarErrorFor("scheduleA.commercial.totalCampaignFee")}
//                     required
//                   />
//                   <FloatingSelect
//                     label="Currency"
//                     info={SIDEBAR_TOOLTIPS.currency}
//                     value={getAtPath(contractForm, "scheduleA.commercial.currency")}
//                     onValueChange={(value) =>
//                       setContractField("scheduleA.commercial.currency", value)
//                     }
//                     searchable
//                     state={sidebarStateFor("scheduleA.commercial.currency")}
//                     errorText={sidebarErrorFor("scheduleA.commercial.currency")}
//                   >
//                     {currencyOptions.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </FloatingSelect>
//                   <FloatingSelect
//                     label="Payment Structure"
//                     info={SIDEBAR_TOOLTIPS.paymentStructure}
//                     value={getAtPath(contractForm, "scheduleA.commercial.paymentStructure")}
//                     onValueChange={(value) =>
//                       setContractField("scheduleA.commercial.paymentStructure", value)
//                     }
//                     searchable={false}
//                   >
//                     {PAYMENT_STRUCTURE_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </FloatingSelect>
//                 </div>

//                 {getAtPath(contractForm, "scheduleA.commercial.paymentStructure") === "Custom" ? (
//                   <FloatingInput
//                     id="fixed-custom-split"
//                     label="Custom Split Details"
//                     info={SIDEBAR_TOOLTIPS.customSplit}
//                     value={getAtPath(contractForm, "scheduleA.commercial.customSplit")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.customSplit", value)
//                     }
//                   />
//                 ) : null}

//                 <LabeledTextarea
//                   id="fixed-advance-payment-trigger"
//                   label="Advance Payment Trigger"
//                   info={SIDEBAR_TOOLTIPS.advancePaymentTrigger}
//                   value={getAtPath(contractForm, "scheduleA.commercial.advancePaymentTrigger")}
//                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                     setContractField("scheduleA.commercial.advancePaymentTrigger", e.target.value)
//                   }
//                 />

//                 <LabeledTextarea
//                   id="fixed-balance-payment-trigger"
//                   label="Balance Payment Trigger"
//                   info={SIDEBAR_TOOLTIPS.remainingPaymentTrigger}
//                   value={getAtPath(contractForm, "scheduleA.commercial.remainingPaymentTrigger")}
//                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                     setContractField("scheduleA.commercial.remainingPaymentTrigger", e.target.value)
//                   }
//                 />

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                   <FloatingSelect
//                     label="Processor Fees Borne By"
//                     info={SIDEBAR_TOOLTIPS.processorFeesBorneBy}
//                     value={getAtPath(contractForm, "scheduleA.commercial.paymentProcessorFeesBorneBy")}
//                     onValueChange={(value) =>
//                       setContractField("scheduleA.commercial.paymentProcessorFeesBorneBy", value)
//                     }
//                     searchable={false}
//                   >
//                     {PROCESSOR_FEE_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </FloatingSelect>

//                   <FloatingInput
//                     id="processor-fees-notes"
//                     label="Payment Processor Fee Notes"
//                     info={SIDEBAR_TOOLTIPS.processorFeesNotes}
//                     value={getAtPath(contractForm, "scheduleA.commercial.paymentProcessorFeesNotes")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.paymentProcessorFeesNotes", value)
//                     }
//                   />

//                   <FloatingInput
//                     id="fixed-kill-fee"
//                     label="Kill Fee / Pro-Rata"
//                     info={SIDEBAR_TOOLTIPS.killFeeFixed}
//                     value={getAtPath(contractForm, "scheduleA.cancellation.killFeeOrProrata")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.cancellation.killFeeOrProrata", value)
//                     }
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                   <FloatingSelect
//                     label="Payout Method"
//                     value={getAtPath(contractForm, "scheduleA.commercial.payoutMethod")}
//                     onValueChange={(value) =>
//                       setContractField("scheduleA.commercial.payoutMethod", value)
//                     }
//                     searchable={false}
//                     info={SIDEBAR_TOOLTIPS.payoutMethod}
//                   >
//                     {PAYOUT_METHOD_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </FloatingSelect>

//                   {/* <FloatingInput
//                     label="Payout Account Email / ID"
//                     value={getAtPath(contractForm, "scheduleA.commercial.payoutAccountId")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.payoutAccountId", value)
//                     }
//                   /> */}


//                   <FloatingInput
//                     label="Tax ID (if applicable)"
//                     value={getAtPath(contractForm, "scheduleA.commercial.taxId")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.taxId", value)
//                     }
//                   />
//                 </div>
//               </div>
//             </SidebarSection>
//           ) : null}


//           {activePaymentType === PAYMENT_TYPE.MILESTONE ? (
//             <SidebarSection title="Milestone Payment Schedule" icon={<ClipboardText className="h-4 w-4" />}>
//               <div className="space-y-4">
//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                   <FloatingInput
//                     id="milestone-total-campaign-fee"
//                     label="Total Budget (All Milestones)"
//                     info={SIDEBAR_TOOLTIPS.totalCampaignFee}
//                     type="number"
//                     value={getAtPath(contractForm, "scheduleA.commercial.totalCampaignFee")}  // ✅ fixed
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.totalCampaignFee", value)        // ✅ fixed
//                     }
//                     state={sidebarStateFor("scheduleA.commercial.totalCampaignFee")}
//                     errorText={sidebarErrorFor("scheduleA.commercial.totalCampaignFee")}
//                   />

//                   <FloatingSelect
//                     label="Processor Fees Borne By"
//                     info={SIDEBAR_TOOLTIPS.processorFeesBorneBy}
//                     value={getAtPath(contractForm, "scheduleA.commercial.paymentProcessorFeesBorneBy")}  // ✅ fixed
//                     onValueChange={(value) =>
//                       setContractField("scheduleA.commercial.paymentProcessorFeesBorneBy", value)        // ✅ fixed
//                     }
//                     searchable={false}
//                   >
//                     {PROCESSOR_FEE_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
//                     ))}
//                   </FloatingSelect>
//                 </div>

//                 <FloatingInput
//                   id="milestone-kill-fee"
//                   label="Kill Fee"
//                   info={SIDEBAR_TOOLTIPS.killFeeMilestone}
//                   value={getAtPath(contractForm, "scheduleA.cancellation.killFeeOrProrata")}  // ✅ fixed
//                   onValueChange={(value: string) =>
//                     setContractField("scheduleA.cancellation.killFeeOrProrata", value)        // ✅ fixed
//                   }
//                 />

//                 <div>
//                   {/* <div className="mb-2 text-sm font-semibold text-gray-800">Milestones</div> */}
//                   <CommercialMilestonesEditor
//                     rows={contractForm.scheduleA.commercial.milestones}
//                     error={formErrors["scheduleA.commercial.milestones"]}
//                     onChange={(rows) =>
//                       setContractField("scheduleA.commercial.milestones", rows)
//                     }
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                   <FloatingSelect
//                     label="Payout Method"
//                     info={SIDEBAR_TOOLTIPS.payoutMethod}
//                     value={getAtPath(contractForm, "scheduleA.commercial.payoutMethod")}
//                     onValueChange={(value) =>
//                       setContractField("scheduleA.commercial.payoutMethod", value)
//                     }
//                     searchable={false}
//                   >
//                     {PAYOUT_METHOD_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </FloatingSelect>

//                   {/* <FloatingInput
//                     label="Payout Account Email / ID"
//                     value={getAtPath(contractForm, "scheduleA.commercial.payoutAccountId")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.payoutAccountId", value)
//                     }
//                   /> */}


//                   <FloatingInput
//                     label="Tax ID (if applicable)"
//                     value={getAtPath(contractForm, "scheduleA.commercial.taxId")}
//                     onValueChange={(value: string) =>
//                       setContractField("scheduleA.commercial.taxId", value)
//                     }
//                     info={SIDEBAR_TOOLTIPS.taxId}
//                   />
//                 </div>
//               </div>
//             </SidebarSection>
//           ) : null}

//           {/* {activePaymentType === PAYMENT_TYPE.GIFTING ? (
//             <SidebarSection
//               title="Product Gifting"
//               icon={<ClipboardText className="h-4 w-4" />}
//             >
//               <div className="space-y-4">
//                 <FloatingInput
//                   id="estimated-retail-value"
//                   label="Estimated Retail Value (ERV)"
//                   info={SIDEBAR_TOOLTIPS.estimatedRetailValue}
//                   value={getAtPath(contractForm, "estimatedRetailValue")}
//                   onValueChange={(value: string) =>
//                     setContractField("estimatedRetailValue", value)
//                   }
//                 />

//                 <FloatingDateInput
//                   id="receipt-confirmation-deadline"
//                   label="Receipt Confirmation Deadline"
//                   info={SIDEBAR_TOOLTIPS.receiptConfirmationDeadline}
//                   type="date"
//                   value={getAtPath(contractForm, "receiptConfirmationDeadline")}
//                   min={todayStr}
//                   onValueChange={(value) =>
//                     setContractField("receiptConfirmationDeadline", value)
//                   }
//                 />

//                 <FloatingSelect
//                   label="Product Disposition"
//                   info={SIDEBAR_TOOLTIPS.productDisposition}
//                   value={getAtPath(contractForm, "productDisposition")}
//                   onValueChange={(value) => setContractField("productDisposition", value)}
//                   searchable={false}
//                 >
//                   {PRODUCT_DISPOSITION_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>

//                 <FloatingInput
//                   id="return-window"
//                   label="Return Window"
//                   info={SIDEBAR_TOOLTIPS.returnWindowMethod}
//                   value={getAtPath(contractForm, "returnWindow")}
//                   onValueChange={(value: string) => setContractField("returnWindow", value)}
//                 />

//                 <FloatingSelect
//                   label="Return Shipping Method"
//                   info={SIDEBAR_TOOLTIPS.returnShippingMethod}
//                   value={getAtPath(contractForm, "returnShippingMethod")}
//                   onValueChange={(value) => setContractField("returnShippingMethod", value)}
//                   searchable={false}
//                 >
//                   {RETURN_SHIPPING_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>

//                 <LabeledTextarea
//                   id="return-packaging-instructions"
//                   label="Return Instructions"
//                   info={SIDEBAR_TOOLTIPS.returnPackagingInstructions}
//                   value={getAtPath(contractForm, "returnPackagingInstructions")}
//                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                     setContractField("returnPackagingInstructions", e.target.value)
//                   }
//                 />

//                 <FloatingTagInput
//                   label="Items to Keep / Return"
//                   info={SIDEBAR_TOOLTIPS.itemsToKeepReturn}
//                   value={csvToTags(getAtPath(contractForm, "itemsToKeepReturn"))}
//                   options={[]}
//                   onValueChange={(next) => setContractField("itemsToKeepReturn", tagsToCsv(next))}
//                   dropdownDirection="up"
//                 />

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                   <FloatingInput
//                     id="ship-to-name"
//                     label="Ship-To Name"
//                     info={SIDEBAR_TOOLTIPS.shipToName}
//                     value={getAtPath(contractForm, "shipToName")}
//                     onValueChange={(value: string) => setContractField("shipToName", value)}
//                   />

//                   <FloatingInput
//                     id="ship-to-phone"
//                     label="Shipping Phone Number"
//                     info={SIDEBAR_TOOLTIPS.shipToPhone}
//                     value={getAtPath(contractForm, "shippingPhoneNumber")}
//                     onValueChange={(value: string) => setContractField("shippingPhoneNumber", value)}
//                   />
//                 </div>

//                 <LabeledTextarea
//                   id="shipping-address"
//                   label="Shipping Address"
//                   info={SIDEBAR_TOOLTIPS.shippingAddress}
//                   value={getAtPath(contractForm, "shippingAddress")}
//                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                     setContractField("shippingAddress", e.target.value)
//                   }
//                 />

//                 <LabeledTextarea
//                   id="delivery-instructions"
//                   label="Delivery Instructions"
//                   info={SIDEBAR_TOOLTIPS.deliveryInstructions}
//                   value={getAtPath(contractForm, "deliveryInstructions")}
//                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                     setContractField("deliveryInstructions", e.target.value)
//                   }
//                 />
//               </div>
//             </SidebarSection>
//           ) : null} */}
//           <SidebarSection
//             title="Review, Revisions & Reshoots"
//             icon={<PenNib className="h-4 w-4" />}
//           >
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               <FloatingInput
//                 id="included-revision-rounds"
//                 label="Included Revision Rounds"
//                 info={SIDEBAR_TOOLTIPS.includedRevisionRounds}
//                 type="number"
//                 value={getAtPath(contractForm, "scheduleA.review.includedRevisionRounds")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.review.includedRevisionRounds", value)
//                 }
//                 state={sidebarStateFor("scheduleA.review.includedRevisionRounds")}
//                 errorText={sidebarErrorFor("scheduleA.review.includedRevisionRounds")}
//               />

//               <FloatingInput
//                 id="additional-revision-fee"
//                 label="Additional Revision Fee"
//                 info={SIDEBAR_TOOLTIPS.additionalRevisionFee}
//                 value={getAtPath(contractForm, "scheduleA.review.additionalRevisionFee")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.review.additionalRevisionFee", value)
//                 }
//               />

//               <FloatingSelect
//                 label="Reshoot Obligation"
//                 info={SIDEBAR_TOOLTIPS.reshootObligation}
//                 value={getAtPath(contractForm, "scheduleA.review.reshootObligation")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.review.reshootObligation", value)
//                 }
//                 searchable={false}
//               >
//                 {RESHOOT_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>

//               <FloatingInput
//                 id="reshoot-fee"
//                 label="Reshoot Fee"
//                 info={SIDEBAR_TOOLTIPS.reshootFee}
//                 value={getAtPath(contractForm, "scheduleA.review.reshootFee")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.review.reshootFee", value)
//                 }
//               />

//               <FloatingInput
//                 id="minimum-live-period"
//                 label="Minimum Live Period"
//                 info={SIDEBAR_TOOLTIPS.minimumLivePeriod}
//                 value={getAtPath(contractForm, "scheduleA.review.minimumLivePeriod")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.review.minimumLivePeriod", value)
//                 }
//               />
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Commercial Terms"
//             icon={<FileText className="h-4 w-4" />}
//           >
//             <div className="space-y-4">
//               {/* <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                 <FloatingInput
//                   id="total-campaign-fee"
//                   label="Total Campaign Fee"
//                   info={SIDEBAR_TOOLTIPS.totalCampaignFee}
//                   type="number"
//                   value={getAtPath(contractForm, "scheduleA.commercial.totalCampaignFee")}
//                   onValueChange={(value: string) =>
//                     setContractField("scheduleA.commercial.totalCampaignFee", value)
//                   }
//                   state={sidebarStateFor("scheduleA.commercial.totalCampaignFee")}
//                   errorText={sidebarErrorFor("scheduleA.commercial.totalCampaignFee")}
//                 />

//                 <FloatingSelect
//                   label="Currency"
//                   info={SIDEBAR_TOOLTIPS.currency}
//                   value={getAtPath(contractForm, "scheduleA.commercial.currency")}
//                   onValueChange={(value) =>
//                     setContractField("scheduleA.commercial.currency", value)
//                   }
//                   searchable
//                   state={sidebarStateFor("scheduleA.commercial.currency")}
//                   errorText={sidebarErrorFor("scheduleA.commercial.currency")}
//                 >
//                   {currencyOptions.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>
//               </div> */}



//               {/* <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                 <FloatingSelect
//                   label="Payment Processor Fees Borne By"
//                   info={SIDEBAR_TOOLTIPS.processorFeesBorneBy}
//                   value={getAtPath(contractForm, "scheduleA.commercial.paymentProcessorFeesBorneBy")}
//                   onValueChange={(value) =>
//                     setContractField("scheduleA.commercial.paymentProcessorFeesBorneBy", value)
//                   }
//                   searchable={false}
//                 >
//                   {PROCESSOR_FEE_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>

//                 <FloatingInput
//                   id="processor-fees-notes"
//                   label="Payment Processor Fee Notes"
//                   info={SIDEBAR_TOOLTIPS.processorFeesNotes}
//                   value={getAtPath(contractForm, "scheduleA.commercial.paymentProcessorFeesNotes")}
//                   onValueChange={(value: string) =>
//                     setContractField("scheduleA.commercial.paymentProcessorFeesNotes", value)
//                   }
//                 />
//               </div> */}

//               <LabeledTextarea
//                 id="lane-a-marketplace-fee-note"
//                 label="Lane A Marketplace Fee Note"
//                 info={SIDEBAR_TOOLTIPS.laneAMarketplaceFeeNote}
//                 value={getAtPath(contractForm, "scheduleA.commercial.laneAMarketplaceFeeNote")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("scheduleA.commercial.laneAMarketplaceFeeNote", e.target.value)
//                 }
//               />
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Raw Files & Reporting"
//             icon={<ClipboardText className="h-4 w-4" />}
//           >
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               <FloatingSelect
//                 label="Raw / Source File Delivery"
//                 info={SIDEBAR_TOOLTIPS.rawSourceFileDelivery}
//                 value={getAtPath(contractForm, "scheduleA.rawFiles.rawSourceFileDelivery")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.rawFiles.rawSourceFileDelivery", value)
//                 }
//                 searchable={false}
//               >
//                 {RAW_FILE_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>

//               <FloatingInput
//                 id="raw-files-format"
//                 label="Format"
//                 info={SIDEBAR_TOOLTIPS.rawFilesFormat}
//                 value={getAtPath(contractForm, "scheduleA.rawFiles.format")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.rawFiles.format", value)
//                 }
//               />

//               <FloatingDateInput
//                 id="raw-files-delivery-due"
//                 label="Delivery Due"
//                 info={SIDEBAR_TOOLTIPS.rawFilesDeliveryDue}
//                 type="date"
//                 value={getAtPath(contractForm, "scheduleA.rawFiles.deliveryDue")}
//                 min={todayStr}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.rawFiles.deliveryDue", value)
//                 }
//               />

//               <FloatingDateInput
//                 id="analytics-reporting-deadline"
//                 label="Analytics Reporting Deadline"
//                 info={SIDEBAR_TOOLTIPS.analyticsReportingDeadline}
//                 type="date"
//                 value={getAtPath(contractForm, "scheduleA.rawFiles.analyticsReportingDeadline")}
//                 min={todayStr}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.rawFiles.analyticsReportingDeadline", value)
//                 }
//               />

//               <FloatingTagInput
//                 label="Analytics Reporting Items"
//                 info={SIDEBAR_TOOLTIPS.analyticsReportingItems}
//                 value={csvToTags(getAtPath(contractForm, "scheduleA.rawFiles.analyticsReportingItems"))}
//                 options={[]}
//                 onValueChange={(next) =>
//                   setContractField("scheduleA.rawFiles.analyticsReportingItems", tagsToCsv(next))
//                 }
//                 dropdownDirection="up"
//               />
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Shipping & Returns"
//             icon={<Info className="h-4 w-4" />}
//           >
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               <FloatingSelect
//                 label="Product Shipping Applicable"
//                 info={SIDEBAR_TOOLTIPS.productShippingApplicable}
//                 value={getAtPath(contractForm, "scheduleA.shipping.productShippingApplicable")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.shipping.productShippingApplicable", value)
//                 }
//                 searchable={false}
//               >
//                 {SHIPPING_APPLICABLE_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>

//               <FloatingSelect
//                 label="Product Returnable"
//                 info={SIDEBAR_TOOLTIPS.productReturnable}
//                 value={getAtPath(contractForm, "scheduleA.shipping.productReturnable")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.shipping.productReturnable", value)
//                 }
//                 searchable={false}
//               >
//                 {RETURNABLE_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>

//               <FloatingInput
//                 id="ship-to-name"
//                 label="Ship-To Name"
//                 info={SIDEBAR_TOOLTIPS.shipToName}
//                 value={getAtPath(contractForm, "scheduleA.shipping.shipToName")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.shipping.shipToName", value)
//                 }
//               />

//               <FloatingInput
//                 id="ship-to-phone"
//                 label="Ship-To Phone"
//                 info={SIDEBAR_TOOLTIPS.shipToPhone}
//                 value={getAtPath(contractForm, "scheduleA.shipping.shipToPhone")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.shipping.shipToPhone", value)
//                 }
//               />

//               <LabeledTextarea
//                 id="ship-to-address"
//                 label="Ship-To Address"
//                 info={SIDEBAR_TOOLTIPS.shipToAddress}
//                 value={getAtPath(contractForm, "scheduleA.shipping.shipToAddress")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("scheduleA.shipping.shipToAddress", e.target.value)
//                 }
//               />

//               <FloatingDateInput
//                 id="product-receipt-confirmation-deadline"
//                 label="Product Receipt Confirmation Deadline"
//                 info={SIDEBAR_TOOLTIPS.productReceiptConfirmationDeadline}
//                 type="date"
//                 value={getAtPath(contractForm, "scheduleA.shipping.productReceiptConfirmationDeadline")}
//                 min={todayStr}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.shipping.productReceiptConfirmationDeadline", value)
//                 }
//               />

//               <FloatingInput
//                 id="return-window-method"
//                 label="Return Window / Method"
//                 info={SIDEBAR_TOOLTIPS.returnWindowMethod}
//                 value={getAtPath(contractForm, "scheduleA.shipping.returnWindowMethod")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.shipping.returnWindowMethod", value)
//                 }
//               />

//               <LabeledTextarea
//                 id="risk-of-loss-notes"
//                 label="Risk of Loss Notes"
//                 info={SIDEBAR_TOOLTIPS.riskOfLossNotes}
//                 value={getAtPath(contractForm, "scheduleA.shipping.riskOfLossNotes")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("scheduleA.shipping.riskOfLossNotes", e.target.value)
//                 }
//               />
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Usage Rights"
//             icon={<SealCheck className="h-4 w-4" />}
//           >
//             <div className="space-y-4">
//               <FloatingMultiSelect
//                 label="Granted Usage Rights"
//                 info={SIDEBAR_TOOLTIPS.grantedUsageRights}
//                 value={selectedUsageRights}
//                 options={usageRightOptions}
//                 onValueChange={(next) => setSelectedUsageRights(next)}
//                 includeAll={false}
//                 searchable={false}
//               />

//               <div className="space-y-3">
//                 {contractForm.scheduleA.usageRights.rows
//                   .filter((row) => row.selected)
//                   .map((row) => (
//                     <div
//                       key={row.id}
//                       className="rounded-xl border border-gray-200 bg-white p-3"
//                     >
//                       <div className="mb-3 text-sm font-semibold text-gray-800">
//                         {row.usageRight}
//                       </div>

//                       <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                         <FloatingInput
//                           id={`usage-duration-${row.id}`}
//                           label="Duration"
//                           info={SIDEBAR_TOOLTIPS.usageDuration}
//                           value={row.duration}
//                           onValueChange={(value: string) =>
//                             setContractField(
//                               "scheduleA.usageRights.rows",
//                               contractForm.scheduleA.usageRights.rows.map((item) =>
//                                 item.id === row.id ? { ...item, duration: value } : item
//                               )
//                             )
//                           }
//                         />

//                         <FloatingInput
//                           id={`usage-territory-${row.id}`}
//                           label="Territory / Notes"
//                           info={SIDEBAR_TOOLTIPS.usageTerritoryNotes}
//                           value={row.territoryNotes}
//                           onValueChange={(value: string) =>
//                             setContractField(
//                               "scheduleA.usageRights.rows",
//                               contractForm.scheduleA.usageRights.rows.map((item) =>
//                                 item.id === row.id ? { ...item, territoryNotes: value } : item
//                               )
//                             )
//                           }
//                         />
//                       </div>
//                     </div>
//                   ))}
//               </div>

//               <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                 <FloatingSelect
//                   label="Attribution Requirement"
//                   info={SIDEBAR_TOOLTIPS.attributionRequirement}
//                   value={getAtPath(contractForm, "scheduleA.usageRights.attributionRequirement")}
//                   onValueChange={(value) =>
//                     setContractField("scheduleA.usageRights.attributionRequirement", value)
//                   }
//                   searchable={false}
//                 >
//                   {ATTRIBUTION_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>

//                 <FloatingSelect
//                   label="Editing Rights"
//                   info={SIDEBAR_TOOLTIPS.editingRights}
//                   value={getAtPath(contractForm, "scheduleA.usageRights.editingRights")}
//                   onValueChange={(value) =>
//                     setContractField("scheduleA.usageRights.editingRights", value)
//                   }
//                   searchable={false}
//                 >
//                   {EDITING_RIGHTS_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </FloatingSelect>
//               </div>

//               <FloatingInput
//                 id="attribution-text"
//                 label="Attribution Text"
//                 info={SIDEBAR_TOOLTIPS.attributionText}
//                 value={getAtPath(contractForm, "scheduleA.usageRights.attributionText")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.usageRights.attributionText", value)
//                 }
//               />

//               <FloatingSelect
//                 label="Music / Stock Asset Responsibility"
//                 info={SIDEBAR_TOOLTIPS.musicStockAssetResponsibility}
//                 value={getAtPath(contractForm, "scheduleA.usageRights.musicStockAssetResponsibility")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.usageRights.musicStockAssetResponsibility", value)
//                 }
//                 searchable={false}
//               >
//                 {MUSIC_RESPONSIBILITY_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Compliance & Brand Safety"
//             icon={<Info className="h-4 w-4" />}
//           >
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               <LabeledTextarea
//                 id="creative-brief-mandatory-talking-points"
//                 label="Creative Brief / Mandatory Talking Points"
//                 info={SIDEBAR_TOOLTIPS.creativeBrief}
//                 value={getAtPath(contractForm, "scheduleA.compliance.creativeBriefMandatoryTalkingPoints")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("scheduleA.compliance.creativeBriefMandatoryTalkingPoints", e.target.value)
//                 }
//               />

//               <LabeledTextarea
//                 id="restricted-statements"
//                 label="Restricted Statements"
//                 info={SIDEBAR_TOOLTIPS.restrictedStatements}
//                 value={getAtPath(contractForm, "scheduleA.compliance.restrictedStatements")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("scheduleA.compliance.restrictedStatements", e.target.value)
//                 }
//               />
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Exclusivity & Morals"
//             icon={<SealCheck className="h-4 w-4" />}
//           >
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               <FloatingInput
//                 id="competitor-blackout"
//                 label="Competitor Blackout"
//                 info={SIDEBAR_TOOLTIPS.competitorBlackout}
//                 value={getAtPath(contractForm, "scheduleA.exclusivity.competitorBlackout")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.exclusivity.competitorBlackout", value)
//                 }
//               />

//               <FloatingTagInput
//                 label="Category / Competitor List"
//                 info={SIDEBAR_TOOLTIPS.categoryCompetitorList}
//                 value={csvToTags(getAtPath(contractForm, "scheduleA.exclusivity.categoryCompetitorList"))}
//                 options={[]}
//                 onValueChange={(next) =>
//                   setContractField("scheduleA.exclusivity.categoryCompetitorList", tagsToCsv(next))
//                 }
//                 dropdownDirection="up"
//               />

//               <FloatingInput
//                 id="blackout-period"
//                 label="Blackout Period"
//                 info={SIDEBAR_TOOLTIPS.blackoutPeriod}
//                 value={getAtPath(contractForm, "scheduleA.exclusivity.blackoutPeriod")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.exclusivity.blackoutPeriod", value)
//                 }
//               />

//               <FloatingSelect
//                 label="Optional Morals Clause"
//                 info={SIDEBAR_TOOLTIPS.optionalMoralsClause}
//                 value={getAtPath(contractForm, "scheduleA.exclusivity.optionalMoralsClause")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.exclusivity.optionalMoralsClause", value)
//                 }
//                 searchable={false}
//               >
//                 {MORALS_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>

//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Cancellation & Refunds"
//             icon={<Info className="h-4 w-4" />}
//           >
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               {/* <LabeledTextarea
//                 id="kill-fee-or-prorata"
//                 label="Kill Fee / Pro-Rata"
//                 info={SIDEBAR_TOOLTIPS.killFeeOrProrata}
//                 value={getAtPath(contractForm, "scheduleA.cancellation.killFeeOrProrata")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("scheduleA.cancellation.killFeeOrProrata", e.target.value)
//                 }
//               /> */}

//               <LabeledTextarea
//                 id="refund-of-unearned-advance"
//                 label="Refund of Unearned Advance"
//                 info={SIDEBAR_TOOLTIPS.refundOfUnearnedAdvance}
//                 value={getAtPath(contractForm, "scheduleA.cancellation.refundOfUnearnedAdvance")}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                   setContractField("scheduleA.cancellation.refundOfUnearnedAdvance", e.target.value)
//                 }
//               />
//             </div>
//           </SidebarSection>

//           <SidebarSection
//             title="Dispute & Notices"
//             icon={<FileText className="h-4 w-4" />}
//           >
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

//               <FloatingInput
//                 id="governing-law"
//                 label="Governing Law"
//                 info={SIDEBAR_TOOLTIPS.governingLaw}
//                 value={getAtPath(contractForm, "scheduleA.dispute.governingLaw")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.dispute.governingLaw", value)
//                 }
//               />

//               <FloatingSelect
//                 label="Dispute Resolution Method"
//                 info={SIDEBAR_TOOLTIPS.disputeResolutionMethod}
//                 value={getAtPath(contractForm, "scheduleA.dispute.disputeResolutionMethod")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.dispute.disputeResolutionMethod", value)
//                 }
//                 searchable={false}
//               >
//                 {DISPUTE_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>

//               <FloatingInput
//                 id="dispute-venue"
//                 label="Venue"
//                 info={SIDEBAR_TOOLTIPS.disputeVenue}
//                 value={getAtPath(contractForm, "scheduleA.dispute.disputeVenue")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.dispute.disputeVenue", value)
//                 }
//               />

//               <FloatingInput
//                 id="arbitration-seat"
//                 label="Arbitration Seat"
//                 info={SIDEBAR_TOOLTIPS.arbitrationSeat}
//                 value={getAtPath(contractForm, "scheduleA.dispute.arbitrationSeat")}
//                 onValueChange={(value: string) =>
//                   setContractField("scheduleA.dispute.arbitrationSeat", value)
//                 }
//               />

//               <FloatingSelect
//                 label="Attorneys’ Fees"
//                 info={SIDEBAR_TOOLTIPS.attorneysFees}
//                 value={getAtPath(contractForm, "scheduleA.dispute.attorneysFees")}
//                 onValueChange={(value) =>
//                   setContractField("scheduleA.dispute.attorneysFees", value)
//                 }
//                 searchable={false}
//               >
//                 {ATTORNEYS_FEES_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </FloatingSelect>
//             </div>
//           </SidebarSection>

//           <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap justify-end gap-3 bg-white border-t border-gray-200 p-6 z-10">
//             {/* In the sticky footer, update the Preview button: */}
//             <Button
//               variant="outline"
//               onClick={handleGeneratePreview}
//               disabled={isPreviewLoading || isSendLoading || isUpdateLoading || isAutoPreviewLoading}
//               title="Preview is auto-generated. Click to force refresh."
//             >
//               {isPreviewLoading ? (
//                 <><span className="mr-2 animate-spin">⏳</span> Generating…</>
//               ) : (
//                 <><Eye className="mr-2 h-5 w-5" /> Force Refresh</>
//               )}
//             </Button>

//             {panelMode === "bulk-send" ? (
//               <Button
//                 onClick={handleBulkSendContracts}
//                 disabled={!pdfUrl || isSendLoading || isPreviewLoading || isUpdateLoading}
//               >
//                 {isSendLoading ? (
//                   <>
//                     <span className="mr-2 animate-spin">⏳</span> Sending…
//                   </>
//                 ) : (
//                   <>
//                     <PaperPlaneTilt className="mr-2 h-5 w-5" />
//                     Send {selectedBulkIds.length} Contracts
//                   </>
//                 )}
//               </Button>
//             ) : panelMode === "send" ? (
//               <Button
//                 onClick={handleSendContract}
//                 disabled={!pdfUrl || isSendLoading || isPreviewLoading || isUpdateLoading}
//               >
//                 {isSendLoading ? (
//                   <>
//                     <span className="mr-2 animate-spin">⏳</span> Sending…
//                   </>
//                 ) : (
//                   <>
//                     <PaperPlaneTilt className="mr-2 h-5 w-5" /> Send Contract
//                   </>
//                 )}
//               </Button>
//             ) : (
//               <Button
//                 onClick={handleEditContract}
//                 disabled={!pdfUrl || isUpdateLoading || isPreviewLoading || isSendLoading}
//               >
//                 {isUpdateLoading ? (
//                   <>
//                     <span className="mr-2 animate-spin">⏳</span> Updating…
//                   </>
//                 ) : (
//                   updateBtnLabel
//                 )}
//               </Button>
//             )}
//           </div>
//         </ContractSidebar>

//         <SignatureModal
//           isOpen={signOpen}
//           onClose={() => {
//             setSignOpen(false);
//             setSignTargetMeta(null);
//           }}
//           onSigned={async (sigDataUrl: string) => {
//             if (!signTargetMeta?.contractId) return;
//             try {
//               await post("/contract/sign", {
//                 contractId: signTargetMeta.contractId,
//                 role: "brand",
//                 name: signerName,
//                 email: signerEmail,
//                 signatureImageDataUrl: sigDataUrl,
//               });
//               toast({ icon: "success", title: "Signed", text: "Signature recorded." });
//               setSignOpen(false);
//               setSignTargetMeta(null);
//               fetchApplicants(debouncedSearch);
//               loadMetaCache(influencers);
//             } catch (e: any) {
//               toast({
//                 icon: "error",
//                 title: "Sign failed",
//                 text:
//                   e?.response?.data?.message ||
//                   e?.message ||
//                   "Could not sign contract.",
//               });
//             }
//           }}
//         />
//         <AddMilestoneCard
//           open={addMilestoneOpen}
//           onClose={() => {
//             setAddMilestoneOpen(false);
//             setMilestoneTargetInf(null);
//             setMilestoneTargetMeta(null);
//           }}
//           brandId={brandId || ""}
//           contractId={milestoneTargetMeta?.contractId || ""}
//           campaignId={campaignId || ""}
//           influencerId={milestoneTargetInf?.influencerId || ""}
//           influencerName={milestoneTargetInf?.name || ""}
//           onSubmit={() => {
//             setAddMilestoneOpen(false);
//             setMilestoneTargetInf(null);
//             setMilestoneTargetMeta(null);
//             fetchApplicants(debouncedSearch);
//             loadMetaCache(influencers);
//           }}
//         />
//         <Dialog
//           open={isPayoutTypeDialogOpen}
//           onOpenChange={setIsPayoutTypeDialogOpen}
//         >
//           <DialogContent className="sm:max-w-md">
//             <DialogHeader>
//               <DialogTitle>Select campaign payout type</DialogTitle>
//               <DialogDescription>
//                 Choose how this campaign will be structured for the selected influencers.
//               </DialogDescription>
//             </DialogHeader>

//             <div className="grid gap-3 pt-2">
//               <button
//                 type="button"
//                 onClick={() => handleSelectPayoutType(PAYMENT_TYPE.FIXED)}
//                 className="rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50"
//               >
//                 <div className="text-sm font-semibold text-gray-900">Fixed</div>
//                 <div className="mt-1 text-sm text-gray-500">
//                   One fixed payout amount for the campaign.
//                 </div>
//               </button>

//               <button
//                 type="button"
//                 onClick={() => handleSelectPayoutType(PAYMENT_TYPE.MILESTONE)}
//                 className="rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50"
//               >
//                 <div className="text-sm font-semibold text-gray-900">Milestone</div>
//                 <div className="mt-1 text-sm text-gray-500">
//                   Payment is released in stages based on deliverables.
//                 </div>
//               </button>

//               {/* <button
//                 type="button"
//                 onClick={() => handleSelectPayoutType(PAYMENT_TYPE.GIFTING)}
//                 className="rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50"
//               >
//                 <div className="text-sm font-semibold text-gray-900">Gifting</div>
//                 <div className="mt-1 text-sm text-gray-500">
//                   Compensation is provided through product gifting.
//                 </div>
//               </button> */}
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </TooltipProvider>
//   );
// }

// /* ===============================================================
//    Support UI components
//    =============================================================== */
// const LoadingSkeleton = ({ rows }: { rows: number }) => (
//   <div className="p-6 space-y-4">
//     {Array.from({ length: rows }).map((_, i) => (
//       <div
//         key={i}
//         className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
//       >
//         <div className="flex items-center gap-4">
//           <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
//           <div className="space-y-2">
//             <Skeleton className="h-4 w-40 rounded bg-gray-200" />
//             <Skeleton className="h-3 w-28 rounded bg-gray-200" />
//           </div>
//         </div>

//         <div className="hidden md:flex items-center gap-3">
//           <Skeleton className="h-8 w-24 rounded-full bg-gray-200" />
//           <Skeleton className="h-8 w-20 rounded-full bg-gray-200" />
//           <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
//           <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
//         </div>
//       </div>
//     ))}
//   </div>
// );

// const ErrorMessage: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => <p className="p-6 text-center text-red-600">{children}</p>;

// export function Select({
//   id,
//   label,
//   value,
//   onChange,
//   options,
//   disabled = false,
//   error,
//   info,
// }: any) {
//   const flat = (
//     Array.isArray(options[0]) ? (options as any).flat() : (options as any)
//   ) as { value: string; label: string }[];
//   return (
//     <div className="space-y-1.5" data-field-error={!!error}>
//       <label
//         htmlFor={id}
//         className="text-sm font-medium text-gray-700 inline-flex items-center gap-1"
//       >
//         <span>{label}</span>
//         {info ? <InfoTip text={String(info)} /> : null}
//       </label>
//       <select
//         id={id}
//         value={value}
//         onChange={onChange}
//         disabled={disabled}
//         className={`w-full h-[44px] px-3 border-2 rounded-lg text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${disabled
//           ? "opacity-60 cursor-not-allowed border-gray-200"
//           : error
//             ? "border-red-500"
//             : "border-gray-200 focus:border-[#1A1A1A]"
//           }`}
//       >
//         {flat.map((o) => (
//           <option key={o.value} value={o.value}>
//             {o.label}
//           </option>
//         ))}
//       </select>
//       {error && <div className="text-xs text-red-600">{error}</div>}
//     </div>
//   );
// }

// export function SelectWithInfo({
//   id,
//   label,
//   info,
//   value,
//   onChange,
//   options,
//   disabled = false,
//   error,
// }: any) {
//   return (
//     <div className="space-y-1.5" data-field-error={!!error}>
//       <Select
//         id={id}
//         label={label}
//         value={value}
//         onChange={onChange}
//         options={options}
//         disabled={disabled}
//         error={error}
//         info={info}
//       />
//     </div>
//   );
// }

// export function NumberInput({
//   id,
//   label,
//   value,
//   onChange,
//   error,
//   info,
//   ...props
// }: any) {
//   return (
//     <div className="relative" data-field-error={!!error}>
//       <input
//         id={id}
//         type="text"
//         inputMode="decimal"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className={`w-full h-[60px] px-4 pt-5 pb-1.5 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${error ? "border-red-500" : "border-gray-200 focus:border-[#1A1A1A]"
//           }`}
//         {...props}
//       />
//       <label
//         htmlFor={id}
//         className="absolute left-4 top-1.5 text-[11px] text-black font-medium pointer-events-none inline-flex items-center gap-1"
//       >
//         <span>{label}</span>
//         {info ? (
//           <span className="pointer-events-auto">
//             <InfoTip text={String(info)} />
//           </span>
//         ) : null}
//       </label>
//       {error && (
//         <div className="text-xs text-red-600 mt-1">{error}</div>
//       )}
//     </div>
//   );
// }

// export function NumberInputTop({
//   id,
//   label,
//   value,
//   onChange,
//   error,
//   info,
//   ...props
// }: any) {
//   return (
//     <div className="space-y-1.5" data-field-error={!!error}>
//       <label
//         htmlFor={id}
//         className="text-sm font-medium text-gray-700 inline-flex items-center gap-1 mb-1.5"
//       >
//         <span>{label}</span>
//         {info ? <InfoTip text={String(info)} /> : null}
//       </label>
//       <input
//         id={id}
//         type="text"
//         inputMode="decimal"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className={`w-full h-[44px] px-3 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${error ? "border-red-500" : "border-gray-200 focus:border-[#1A1A1A]"
//           }`}
//         {...props}
//       />
//       {error && (
//         <div className="text-xs text-red-600">{error}</div>
//       )}
//     </div>
//   );
// }

// export function Checkbox({
//   id,
//   label,
//   checked,
//   onChange,
//   disabled = false,
// }: any) {
//   return (
//     <label
//       htmlFor={id}
//       className={`flex items-center gap-2 text-sm ${disabled ? "opacity-60 cursor-not-allowed" : ""
//         }`}
//     >
//       <input
//         id={id}
//         type="checkbox"
//         checked={checked}
//         onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//           onChange(e.target.checked)
//         }
//         disabled={disabled}
//         className="h-4 w-4 rounded border-gray-300"
//       />
//       <span className="text-gray-700">{label}</span>
//     </label>
//   );
// }

// export function PlatformSelector({
//   platforms,
//   onChange,
//   disabled = false,
// }: any) {
//   const toggle = (p: string) => {
//     if (disabled) return;
//     const next = platforms.includes(p)
//       ? platforms.filter((x: string) => x !== p)
//       : [...platforms, p];
//     onChange(next);
//   };

//   const opts = ["YouTube", "Instagram", "TikTok"];

//   return (
//     <div className="flex flex-wrap gap-2">
//       {opts.map((p) => {
//         const active = platforms.includes(p);

//         return (
//           <button
//             key={p}
//             type="button"
//             onClick={() => toggle(p)}
//             disabled={disabled}
//             aria-pressed={active}
//             className={[
//               "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
//               disabled ? "cursor-not-allowed opacity-60" : "",
//               active
//                 ? "border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm"
//                 : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
//             ].join(" ")}
//           >
//             {active && <span className="h-1.5 w-1.5 rounded-full bg-white/80" />}
//             {p}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// export function ChipInput({
//   label,
//   items,
//   setItems,
//   placeholder,
//   validator,
//   disabled = false,
//   error,
// }: any) {
//   const [val, setVal] = useState("");

//   const add = () => {
//     if (disabled) return;
//     const v = val.trim();
//     if (!v) return;

//     const parts = v
//       .split(/[,\n]/)
//       .map((s) => s.trim())
//       .filter(Boolean);

//     const validParts = validator ? parts.filter((p) => validator(p)) : parts;
//     if (!validParts.length) return;

//     // items is the controlled prop from parent
//     setItems([...(items as string[]), ...validParts]);
//     setVal("");
//   };

//   const remove = (ix: number) => {
//     if (disabled) return;
//     setItems((items as string[]).filter((_: any, i: any) => i !== ix));
//   };

//   return (
//     <div className="space-y-1.5" data-field-error={!!error}>
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-medium text-gray-700">{label}</div>
//         {error && <div className="text-xs text-red-600">{error}</div>}
//       </div>

//       <div
//         className={`
//           flex items-start gap-2 rounded-lg border-2 p-2
//           ${disabled ? "opacity-60 cursor-not-allowed" : ""}
//           ${error ? "border-red-500" : "border-gray-200"}
//         `}
//       >
//         {/* Chips + input share this flex area */}
//         <div className="flex flex-wrap gap-2 flex-1 min-w-0">
//           {items.map((t: string, i: number) => (
//             <span
//               key={`${t}-${i}`}
//               className="group inline-flex max-w-full items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs"
//               title={t}
//             >
//               {/* text wraps / truncates nicely even for huge links */}
//               <span className="block max-w-[180px] sm:max-w-[260px] break-all">
//                 {t}
//               </span>
//               <button
//                 type="button"
//                 onClick={() => remove(i)}
//                 disabled={disabled}
//                 className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
//                 aria-label="Remove"
//               >
//                 ×
//               </button>
//             </span>
//           ))}

//           {/* Input grows but doesn't disappear */}
//           <input
//             value={val}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//               setVal(e.target.value)
//             }
//             onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
//               if (e.key === "Enter") {
//                 e.preventDefault();
//                 add();
//               }
//             }}
//             placeholder={placeholder}
//             disabled={disabled}
//             className="flex-[1_1_120px] min-w-[80px] border-0 outline-none text-sm bg-transparent"
//           />
//         </div>

//         {/* Add button pinned on the right */}
//         <button
//           type="button"
//           onClick={add}
//           disabled={disabled}
//           className="px-2 py-1 text-xs border rounded whitespace-nowrap disabled:opacity-60"
//         >
//           Add
//         </button>
//       </div>
//     </div>
//   );
// }

// export function TextArea({
//   id,
//   label,
//   value,
//   onChange,
//   rows = 3,
//   placeholder,
//   disabled = false,
//   error,
// }: any) {
//   return (
//     <div className="space-y-1.5" data-field-error={!!error}>
//       <label
//         htmlFor={id}
//         className="text-sm font-medium text-gray-700"
//       >
//         {label}
//       </label>
//       <textarea
//         id={id}
//         value={value}
//         onChange={onChange}
//         rows={rows}
//         placeholder={placeholder}
//         disabled={disabled}
//         className={`w-full px-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${disabled
//           ? "opacity-60 cursor-not-allowed border-gray-200"
//           : error
//             ? "border-red-500"
//             : "border-gray-200 focus:border-[#1A1A1A]"
//           }`}
//       />
//       {error && (
//         <div className="text-xs text-red-600">{error}</div>
//       )}
//     </div>
//   );
// }

// function ContractSidebar({
//   isOpen,
//   onClose,
//   children,
//   title = "Initiate Contract",
//   subtitle = "New Agreement",
//   previewUrl,
//   onClosePreview,
//   isAutoPreviewLoading = false,
// }: any) {
//   return (
//     <div
//       className={`fixed inset-0  z-[120] ${isOpen ? "" : "pointer-events-none"}`}
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="contract-title"
//     >
//       <div
//         className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
//           }`}
//         onClick={onClose}
//       />

//       <div
//         className={`absolute right-0 top-0 h-full w-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
//           }`}
//       >
//         {/* Header — unchanged */}
//         <div className="relative h-36 overflow-hidden border-b border-[#e5e5e5] bg-white">
//           <div className="relative z-10 flex h-full items-start justify-between p-6">
//             <div className="flex items-start gap-4">
//               <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8e8e8] bg-[#f7f7f7] shadow-sm">
//                 <FileText className="h-6 w-6 text-[#1a1a1a]" />
//               </div>
//               <div>
//                 <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9d9d9d]" id="contract-title">
//                   {title}
//                 </div>
//                 <div className="text-2xl font-extrabold leading-tight text-[#1a1a1a]">
//                   {subtitle}
//                 </div>
//               </div>
//             </div>
//             <button
//               type="button"
//               className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#9d9d9d] transition-all duration-150 hover:bg-[#f7f7f7] hover:text-[#1a1a1a]"
//               onClick={onClose}
//               aria-label="Close"
//             >
//               ✕
//             </button>
//           </div>
//         </div>

//         <div className="flex h-[calc(100%-9rem)]">
//           {/* ── Preview pane ── */}
//           <div className="hidden w-1/2 flex-col border-r border-gray-100 p-6 sm:flex">
//             {previewUrl ? (
//               <>
//                 <div className="mb-3 flex items-center justify-between">
//                   <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
//                     <Eye className="h-4 w-4" />
//                     <span>Live Preview</span>
//                     {isAutoPreviewLoading && (
//                       <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
//                         <span className="animate-spin">⏳</span> Refreshing…
//                       </span>
//                     )}
//                   </div>
//                   {onClosePreview && (
//                     <button
//                       type="button"
//                       onClick={onClosePreview}
//                       className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-gray-700 hover:bg-neutral-100"
//                     >
//                       Close preview
//                     </button>
//                   )}
//                 </div>

//                 {/* iframe with loading overlay */}
//                 <div className="relative flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50">
//                   <iframe
//                     src={previewUrl}
//                     width="100%"
//                     height="100%"
//                     className="border-0"
//                     title="Contract PDF"
//                   />
//                   {isAutoPreviewLoading && (
//                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/70 backdrop-blur-[2px]">
//                       <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1A1A1A]" />
//                       <span className="text-xs font-medium text-gray-600">
//                         Updating preview…
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </>
//             ) : (
//               /* Empty state — show spinner if auto-loading, placeholder otherwise */
//               <div className="flex h-full items-center justify-center">
//                 {isAutoPreviewLoading ? (
//                   <div className="flex flex-col items-center gap-3 text-gray-500">
//                     <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#1A1A1A]" />
//                     <span className="text-sm font-medium">Generating preview…</span>
//                     <span className="text-xs text-gray-400">
//                       Fill in the required fields and it will appear here
//                     </span>
//                   </div>
//                 ) : (
//                   <div className="text-center text-gray-400">
//                     <Eye className="mx-auto mb-2 h-8 w-8" />
//                     <div className="text-sm">
//                       Preview will appear here as you fill fields
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* ── Form pane ── */}
//           <div
//             className={`${previewUrl || isAutoPreviewLoading ? "w-full sm:w-1/2" : "w-full"} h-full overflow-auto px-6 space-y-5`}
//           >
//             {children}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ======================
//    Signature Modal
//    ====================== */
// function SignatureModal({
//   isOpen,
//   onClose,
//   onSigned,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onSigned: (signatureDataUrl: string) => Promise<void> | void;
// }) {
//   const [sigDataUrl, setSigDataUrl] = useState<string>("");
//   const [error, setError] = useState<string>("");
//   const [fileName, setFileName] = useState<string>("");
//   const [fileSize, setFileSize] = useState<number | null>(null);
//   const [isDragging, setIsDragging] = useState(false);

//   // ✅ NEW: prevent multiple clicks / double submits
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const dropRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (!isOpen) {
//       setSigDataUrl("");
//       setError("");
//       setFileName("");
//       setFileSize(null);
//       setIsDragging(false);
//       setIsSubmitting(false); // ✅ reset
//     }
//   }, [isOpen]);

//   useEffect(() => {
//     if (!isOpen) return;

//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && !isSubmitting) onClose(); // ✅ don't close while submitting
//     };

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [isOpen, onClose, isSubmitting]);

//   const formatSize = (size: number | null) => {
//     if (!size) return "";
//     if (size < 1024) return `${size} B`;
//     if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
//     return `${(size / (1024 * 1024)).toFixed(2)} MB`;
//   };

//   const handleFile = (file?: File | null) => {
//     if (isSubmitting) return; // ✅ block changes during submit

//     setError("");
//     setIsDragging(false);
//     if (!file) return;

//     setFileName(file.name);
//     setFileSize(file.size);

//     if (!/image\/(png|jpeg)/i.test(file.type)) {
//       setSigDataUrl("");
//       return setError("Please upload a PNG or JPG image.");
//     }

//     if (file.size > 50 * 1024) {
//       setSigDataUrl("");
//       return setError("Signature must be 50 KB or less.");
//     }

//     const reader = new FileReader();
//     reader.onload = () => setSigDataUrl(reader.result as string);
//     reader.readAsDataURL(file);
//   };

//   useEffect(() => {
//     if (!isOpen) return;
//     const el = dropRef.current;
//     if (!el) return;

//     const onDragOver = (e: DragEvent) => {
//       if (isSubmitting) return;
//       e.preventDefault();
//       e.stopPropagation();
//       setIsDragging(true);
//     };

//     const onDragEnter = (e: DragEvent) => {
//       if (isSubmitting) return;
//       e.preventDefault();
//       e.stopPropagation();
//       setIsDragging(true);
//     };

//     const onDragLeave = (e: DragEvent) => {
//       if (isSubmitting) return;
//       e.preventDefault();
//       e.stopPropagation();
//       if (e.target === el) setIsDragging(false);
//     };

//     const onDrop = (e: DragEvent) => {
//       if (isSubmitting) return;
//       e.preventDefault();
//       e.stopPropagation();
//       setIsDragging(false);
//       const f = e.dataTransfer?.files?.[0];
//       handleFile(f || null);
//     };

//     el.addEventListener("dragover", onDragOver);
//     el.addEventListener("dragenter", onDragEnter);
//     el.addEventListener("dragleave", onDragLeave);
//     el.addEventListener("drop", onDrop);

//     return () => {
//       el.removeEventListener("dragover", onDragOver);
//       el.removeEventListener("dragenter", onDragEnter);
//       el.removeEventListener("dragleave", onDragLeave);
//       el.removeEventListener("drop", onDrop);
//     };
//   }, [isOpen, isSubmitting]); // ✅ include isSubmitting

//   if (!isOpen) return null;

//   const handleSignClick = async () => {
//     if (isSubmitting) return; // ✅ double-click guard

//     if (!sigDataUrl) {
//       setError("Please select a signature image first.");
//       return;
//     }

//     try {
//       setIsSubmitting(true); // ✅ lock UI
//       await onSigned(sigDataUrl);
//       // ✅ parent will close modal on success; we don't force close here
//     } finally {
//       // ✅ if parent throws error and modal stays open, unlock
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center">
//       <div
//         className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] ${isSubmitting ? "pointer-events-none" : ""}`}
//         onClick={() => !isSubmitting && onClose()} // ✅ prevent closing while submitting
//       />

//       <div className="relative z-[61] w-[96%] max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
//         <div className="relative h-24">
//           <div
//             className="absolute inset-0"
//             style={{
//               background: "linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)",
//             }}
//           />
//           <div className="relative z-10 h-full px-5 flex items-center justify-between text-white">
//             <div className="flex items-center gap-3">
//               <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-sm font-semibold">
//                 ✍️
//               </div>
//               <div className="flex flex-col">
//                 <span className="font-semibold tracking-wide text-sm sm:text-base">
//                   Sign as Brand
//                 </span>
//                 <span className="text-xs text-white/80">
//                   Upload your official signature to finalize the document.
//                 </span>
//               </div>
//             </div>

//             <button
//               className={`w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//               onClick={() => !isSubmitting && onClose()}
//               aria-label="Close"
//               title="Close"
//               disabled={isSubmitting as any}
//             >
//               ✕
//             </button>
//           </div>
//         </div>

//         <div className="p-5 space-y-4">
//           <div className="flex flex-col gap-2">
//             <p className="text-sm text-gray-700">
//               Upload your signature image{" "}
//               <span className="font-semibold">(PNG/JPG, ≤ 50 KB)</span>. This
//               will be embedded as your brand signature.
//             </p>
//             <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
//               <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
//                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                 Best results with transparent PNG
//               </span>
//               <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
//                 💡 Tip: Use a dark pen on white paper, then scan or crop
//                 neatly.
//               </span>
//             </div>
//           </div>

//           <div
//             ref={dropRef}
//             className={`rounded-xl border-2 border-dashed p-5 text-center text-sm transition-all cursor-pointer select-none ${isDragging
//               ? "border-[#1A1A1A] bg-neutral-100 shadow-sm"
//               : "border-gray-300 bg-gray-50 hover:bg-gray-100/80"
//               }`}
//           >
//             <div className="flex flex-col items-center gap-2">
//               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
//                 <span className="text-lg">📁</span>
//               </div>
//               <div className="font-medium text-gray-800">
//                 {isDragging
//                   ? "Drop your signature here"
//                   : "Drag & drop your signature here"}
//               </div>
//               <div className="text-xs text-gray-500">
//                 or use the file picker below
//               </div>
//             </div>
//           </div>

//           <div className="space-y-1.5">
//             <label className="block text-xs font-medium text-gray-600">
//               Signature file
//             </label>
//             <input
//               type="file"
//               accept="image/png,image/jpeg"
//               disabled={isSubmitting} // ✅ disable file picker
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                 handleFile(e.target.files?.[0])
//               }
//               className="block w-full text-xs sm:text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
//             />

//             <div className="flex justify-between items-center text-[11px] text-gray-500">
//               <span>Allowed: PNG, JPG · Max size: 50 KB</span>
//               {fileSize !== null && (
//                 <span>
//                   Selected size:{" "}
//                   <span className={fileSize > 50 * 1024 ? "text-red-600 font-medium" : ""}>
//                     {formatSize(fileSize)}
//                   </span>
//                 </span>
//               )}
//             </div>

//             {fileName && (
//               <div className="text-[11px] text-gray-600 truncate">
//                 File: <span className="font-medium">{fileName}</span>
//               </div>
//             )}

//             {error && (
//               <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
//                 <span>⚠️</span>
//                 <span>{error}</span>
//               </div>
//             )}
//           </div>

//           {sigDataUrl && (
//             <div className="border rounded-xl p-3 bg-gray-50 flex items-center gap-3">
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="text-xs font-semibold text-gray-700">
//                     Signature preview
//                   </div>

//                   <button
//                     type="button"
//                     disabled={isSubmitting} // ✅ disable clear
//                     onClick={() => {
//                       if (isSubmitting) return;
//                       setSigDataUrl("");
//                       setFileName("");
//                       setFileSize(null);
//                       setError("");
//                     }}
//                     className="text-[11px] text-gray-500 hover:text-gray-700 underline disabled:opacity-60 disabled:cursor-not-allowed"
//                   >
//                     Clear
//                   </button>
//                 </div>

//                 <div className="flex items-center justify-center rounded-lg border bg-white px-3 py-2">
//                   <img
//                     src={sigDataUrl}
//                     alt="Signature preview"
//                     className="max-h-14 object-contain"
//                   />
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="px-5 pb-5 pt-1 flex flex-col sm:flex-row justify-end gap-3">
//           <Button
//             variant="outline"
//             className="text-gray-800 border-gray-300 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
//             onClick={() => !isSubmitting && onClose()}
//             disabled={isSubmitting} // ✅ disable cancel while submitting
//           >
//             Cancel
//           </Button>

//           <Button
//             onClick={handleSignClick}
//             disabled={!sigDataUrl || isSubmitting} // ✅ key line
//           >
//             {isSubmitting ? "Signing..." : "Sign & continue"}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }


// function SidebarSection({ title, children, icon }: any) {
//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
//       <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
//         {icon && (
//           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white">
//             {icon}
//           </div>
//         )}
//         <div className="font-semibold text-gray-800">{title}</div>
//       </div>
//       {children}
//     </div>
//   );
// }

// function LabelWithInfo({
//   text,
//   info,
// }: {
//   text: React.ReactNode;
//   info?: React.ReactNode;
// }) {
//   return (
//     <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
//       {text}
//       {info ? <InfoTip text={String(info)} /> : null}
//     </span>
//   );
// }

// function InfoTip({ text }: { text: string }) {
//   return (
//     <Tooltip>
//       <TooltipTrigger asChild>
//         <button
//           type="button"
//           className="inline-flex items-center"
//           aria-label="Info"
//         >
//           <Info className="w-4 h-4 text-gray-500" />
//         </button>
//       </TooltipTrigger>
//       <TooltipContent
//         side="top"
//         align="center"
//         className="max-w-xs text-sm leading-relaxed bg-gray-800 text-white"
//       >
//         <p>{text}</p>
//       </TooltipContent>
//     </Tooltip>
//   );
// }

// function CommercialMilestonesEditor({
//   rows,
//   onChange,
//   error,
// }: {
//   rows: ContractMilestone[];
//   onChange: (rows: ContractMilestone[]) => void;
//   error?: string;
// }) {
//   const updateRow = (
//     id: string,
//     key: keyof Omit<ContractMilestone, "id">,
//     value: string
//   ) => {
//     onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
//   };

//   const addRow = () => {
//     onChange([...rows, createDefaultCommercialMilestone(rows.length + 1)]);
//   };

//   const removeRow = (id: string) => {
//     onChange(rows.length > 1 ? rows.filter((row) => row.id !== id) : rows);
//   };

//   return (
//     <div className="space-y-3">
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-semibold text-gray-800">Milestones</div>
//         <Button type="button" variant="outline" onClick={addRow}>
//           + Add Milestone
//         </Button>
//       </div>

//       {error ? <div className="text-xs text-red-600">{error}</div> : null}

//       {rows.map((row, index) => (
//         <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
//           <div className="flex items-center justify-between">
//             <div className="text-sm font-medium">Milestone #{index + 1}</div>
//             {rows.length > 1 ? (
//               <button
//                 type="button"
//                 className="text-xs text-red-600"
//                 onClick={() => removeRow(row.id)}
//               >
//                 Remove
//               </button>
//             ) : null}
//           </div>

//           <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//             <FloatingInput
//               label="Milestone Name"
//               value={row.milestoneName}
//               onValueChange={(value: string) =>
//                 updateRow(row.id, "milestoneName", value)
//               }
//             />

//             <FloatingInput
//               label="Payment Amount"
//               type="number"
//               value={row.paymentAmount}
//               onValueChange={(value: string) =>
//                 updateRow(row.id, "paymentAmount", value)
//               }
//             />

//             <FloatingDateInput
//               label="Due Date"
//               type="date"
//               value={row.dueDate}
//               min={toInputDate(new Date())}
//               onValueChange={(value) => updateRow(row.id, "dueDate", value)}
//             />

//             <LabeledTextarea
//               label="Trigger Event"
//               value={row.triggerEvent}
//               onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//                 updateRow(row.id, "triggerEvent", e.target.value)
//               }
//             />
//           </div>
//         </div>
//       ))}

//     </div>
//   );
// }

// const BTN_GRAD =
//   "bg-gradient-to-r from-[#FFA135] to-[#FF7236] text-white hover:from-[#FF7236] hover:to-[#FFA135] shadow-none";
// const BTN_OUTLINE = "border-gray-300 text-black";
// const BTN_BASE = "h-9 px-3 rounded-lg";
