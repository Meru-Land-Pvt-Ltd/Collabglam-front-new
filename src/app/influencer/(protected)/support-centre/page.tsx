"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MessageSquareText,
  History,
  Headphones,
  PlusCircle,
  HelpCircle,
  Megaphone,
  FileText,
  CreditCard,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import RaiseIssueModal from "./RaiseIssueModal";
import DisputeHistorySection from "./DisputeHistorySection";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQSection = {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
};

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
};

const faqSections: FAQSection[] = [
  {
    title: "Campaigns",
    icon: <Megaphone className="h-4 w-4" />,
    items: [
      {
        question: "How do I apply to a campaign?",
        answer:
          "Browse campaigns in the marketplace, open the campaign brief, check eligibility, then click Apply to submit your application for brand review.",
      },
      {
        question: "How do I receive campaign invitations?",
        answer:
          "Brands may invite influencers directly. You’ll receive a dashboard notification and email. Open the invitation, review the brief, and accept.",
      },
      {
        question: "Can I edit a campaign after publishing?",
        answer:
          "Influencers cannot edit campaigns. Only brands manage campaign details. Influencers can update deliverables or communicate with brands if changes are needed.",
      },
    ],
  },
  {
    title: "Deliverables",
    icon: <FileText className="h-4 w-4" />,
    items: [
      {
        question: "How do I review influencer deliverables?",
        answer:
          "Open the active campaign, go to the Deliverables section, upload your content or link, then submit it for brand review.",
      },
      {
        question: "Can I request revisions?",
        answer:
          "Yes. If brands request revisions, update the deliverable according to feedback and resubmit the content through the Deliverables section.",
      },
    ],
  },
  {
    title: "Payments",
    icon: <CreditCard className="h-4 w-4" />,
    items: [
      {
        question: "When are payments released?",
        answer:
          "Payments are released after deliverables are approved and any platform holding period is completed, depending on campaign payment terms.",
      },
      {
        question: "How do milestone payments work?",
        answer:
          "Milestone payments are released after completing specific campaign stages like draft approval, content submission, or final campaign completion.",
      },
    ],
  },
  {
    title: "Disputes",
    icon: <ShieldAlert className="h-4 w-4" />,
    items: [
      {
        question: "How do I raise an issue?",
        answer:
          "Open the campaign, navigate to the dispute section, click Raise Issue, provide details and evidence, and submit for review.",
      },
      {
        question: "What evidence should I provide?",
        answer:
          "Provide screenshots, content links, campaign brief references, communication records, or proof of submission supporting your dispute claim.",
      },
      {
        question: "How long does dispute resolution take?",
        answer:
          "Disputes are typically reviewed within 3–7 business days depending on complexity, evidence provided, and responses from both influencer and brand.",
      },
    ],
  },
];

function ActionCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}: ActionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-black">
        {icon}
      </div>
      <h3 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mx-auto mt-4 max-w-sm text-center text-base leading-7 text-slate-600">
        {description}
      </p>
      <button
        onClick={onClick}
        className="mt-8 w-full rounded-xl border border-black bg-white px-4 py-3 text-base font-medium text-black transition hover:bg-slate-50"
      >
        {buttonText}
      </button>
    </div>
  );
}

function FAQAccordion({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-slate-700">
        <span className="text-black">{section.icon}</span>
        <h3 className="text-2xl font-semibold tracking-tight">
          {section.title}
        </h3>
      </div>

      <div className="space-y-3">
        {section.items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={item.question}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-lg font-medium text-slate-900">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-black transition-transform ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-base leading-7 text-slate-600">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRaiseIssueOpen, setIsRaiseIssueOpen] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const disputeCreated = searchParams.get("disputeCreated");
    const ticket = searchParams.get("ticket");

    if (disputeCreated === "1") {
      setToast({
        show: true,
        title: "Issue submitted successfully",
        message: ticket
          ? `Your dispute has been created successfully. Ticket ID: ${ticket}.`
          : "Your dispute has been created successfully. Our team will review it shortly.",
      });

      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      
      const params = new URLSearchParams(searchParams.toString());
      params.delete("disputeCreated");
      params.delete("ticket");

      const nextUrl = params.toString()
        ? `/influencer/support-centre?${params.toString()}`
        : "/influencer/support-centre";

      router.replace(nextUrl, { scroll: false });

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
          {toast?.show ? (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {toast.title}
                </p>
                <p className="mt-1 text-sm text-emerald-700">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-full p-1 text-emerald-700 transition hover:bg-emerald-100"
                aria-label="Close success message"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          ) : null}

          <section>
            <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Help &amp; Support
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              Find quick answers, browse our documentation, or raise an issue
              related to your campaigns and payments.
            </p>

            <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm sm:flex-row">
              <div className="flex min-h-[56px] flex-1 items-center gap-3 rounded-2xl bg-white px-4">
                <Search className="h-5 w-5 text-black" />
                <input
                  type="text"
                  placeholder="Search help topics, FAQs, or dispute IDs..."
                  className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <button className="rounded-2xl bg-black px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800">
                Search
              </button>
            </div>
          </section>

          <section className="mt-16">
            <div className="mb-6 flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-black" />
              <h2 className="text-3xl font-bold tracking-tight">
                Quick Actions
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <ActionCard
                icon={<MessageSquareText className="h-8 w-8 text-black" />}
                title="Raise an Issue"
                description="Report problems related to campaigns, payments, or deliverables directly to our team."
                buttonText="Open Ticket"
                onClick={() => setIsRaiseIssueOpen(true)}
              />
              <ActionCard
                icon={<History className="h-8 w-8 text-black" />}
                title="Dispute History"
                description="Track the status of previously raised issues and view resolution outcomes."
                buttonText="View History"
                onClick={() => router.push("/influencer/support-centre#dispute-history") }
              />
              <ActionCard
                icon={<Headphones className="h-8 w-8 text-black" />}
                title="Contact Support"
                description="Reach out to the CollabGlam support team for direct assistance with your account."
                buttonText="Send Message"
              />
            </div>
          </section>

          <section className="mt-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-black" />
                <h2 className="text-3xl font-bold tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <button className="text-sm font-semibold text-black transition hover:text-slate-700">
                Browse full documentation
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <FAQAccordion section={faqSections[0]} />
              <FAQAccordion section={faqSections[1]} />
              <FAQAccordion section={faqSections[2]} />
              <FAQAccordion section={faqSections[3]} />
            </div>
          </section>

          <DisputeHistorySection />
        </div>
      </div>

      <RaiseIssueModal
        open={isRaiseIssueOpen}
        onClose={() => setIsRaiseIssueOpen(false)}
      />
    </>
  );
}