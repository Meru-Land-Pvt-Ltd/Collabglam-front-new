"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/buttonComp"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Star,
  Clock,
  Bell,
  Archive,
  Trash,
  DotsThree,
  CaretLeft,
  CaretRight,
  PencilSimple,
  ArrowBendUpLeft,
  Paperclip,
  ImageSquare,
  Link,
  Smiley,
  Signature,
  Lock,
  TextB,
  TextItalic,
  TextUnderline,
  ArrowCounterClockwise,
  ArrowClockwise,
  ListBullets,
  ListNumbers,
  TextAlignLeft,
  Minus,
  CheckCircle,
  SmileyBlank
} from "@phosphor-icons/react"


type MailDetail = {
  id: string
  subject: string
  from: string
  email: string
  avatar?: string
  fallback: string
  date: string
  body: string[]
  chips: string[]
}

const mailMap: Record<string, MailDetail> = {
  "1": {
    id: "1",
    subject: "Urgent Collaboration Needed",
    from: "Collabglam",
    email: "info@collabglam.com",
    fallback: "C",
    date: "22 Mar'26, (1 day ago)",
    body: [
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five",
    ],
    chips: ["Send contract", "Let's collaborate", "ok done"],
  },
}

const fallbackMail: MailDetail = {
  id: "0",
  subject: "Urgent Collaboration Needed",
  from: "Collabglam",
  email: "info@collabglam.com",
  fallback: "C",
  date: "22 Mar'26, (1 day ago)",
  body: [
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five",
  ],
  chips: ["Send contract", "Let's collaborate", "ok done"],
}

function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-[#707070] transition-colors hover:bg-[#F3F4F6] hover:text-[#111111]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function ActionChip({ label }: { label: string }) {
  return (
    <button className="rounded-full border border-[#D9D9D9] bg-white px-3 py-1.5 text-[11px] font-medium text-[#292929] transition-colors hover:bg-[#F7F7F8]">
      {label}
    </button>
  )
}

function ToolbarButton({
  children,
  active,
}: {
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[#202020] transition-colors hover:bg-[#F3F4F6]",
        active && "bg-[#F3F4F6]"
      )}
      type="button"
    >
      {children}
    </button>
  )
}

export default function BrandInboxMailDetailPage() {
  const router = useRouter()
  const params = useParams<{ mailId: string }>()
  const mail = mailMap[params.mailId] ?? fallbackMail

  const [showReply, setShowReply] = React.useState(false)
  const [replyText, setReplyText] = React.useState(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry..."
  )

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 md:p-6">
      <div className="mx-auto min-h-[calc(100vh-2rem)] w-full max-w-full rounded-[24px] border border-[#E7E7E8] bg-white shadow-[0_8px_30px_rgba(17,24,39,0.04)]">
        <div className="flex items-center justify-between border-b border-[#EFEFEF] px-5 py-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/brand/inbox")}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-[#7B7B7B] transition-colors hover:bg-[#F3F4F6] hover:text-[#111111]"
            >
              <ArrowLeft size={12} />
              Back
            </button>
            <IconButton aria-label="Star">
              <Star size={16} />
            </IconButton>
            <IconButton aria-label="Snooze">
              <Clock size={16} />
            </IconButton>
            <IconButton aria-label="Notifications">
              <Bell size={16} />
            </IconButton>
            <IconButton aria-label="Archive">
              <Archive size={16} />
            </IconButton>
            <IconButton aria-label="Delete">
              <Trash size={16} />
            </IconButton>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[12px] text-[#A1A1A1]">
              <span>1-20</span>
              <span>of</span>
              <span>550</span>
              <IconButton aria-label="Previous">
                <CaretLeft size={14} />
              </IconButton>
              <IconButton aria-label="Next">
                <CaretRight size={14} />
              </IconButton>
            </div>

            <Button className="h-10 rounded-[12px] bg-[#111111] px-4 text-sm font-medium text-white hover:bg-black">
              <PencilSimple size={16} weight="bold" className="mr-2" />
              Compose
            </Button>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <h1 className="mb-5 text-[30px] font-semibold tracking-[-0.02em] text-[#111111]">
              {mail.subject}
            </h1>

            <div className="mb-7 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 border border-[#ECECEC]">
                  <AvatarImage src={mail.avatar} alt={mail.from} />
                  <AvatarFallback className="bg-[#FFC61B] text-base font-semibold text-[#AD2E00]">
                    {mail.fallback}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="text-[16px] font-semibold text-[#1B1B1B]">{mail.from}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[13px] text-[#8A8A8A]">
                    <span>To me</span>
                    <CaretRight size={10} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 text-[12px] text-[#A1A1A1]">
                <span>{mail.date}</span>
                <IconButton aria-label="Star thread" className="h-7 w-7">
                  <Star size={20} />
                </IconButton>
                <IconButton aria-label="More details" className="h-7 w-7">
                  <Smiley size={20} />
                </IconButton>
                <IconButton aria-label="More actions" className="h-7 w-7">
                  <DotsThree size={20} />
                </IconButton>
              </div>
            </div>

            <div className="max-w-[1120px] space-y-8 pl-[56px]">
              {mail.body.map((paragraph, index) => (
                <p
                  key={index}
                  className="max-w-[980px] text-[13px] leading-[1.7] text-[#3D3D3D]"
                >
                  {paragraph}
                </p>
              ))}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {mail.chips.map((chip) => (
                  <ActionChip key={chip} label={chip} />
                ))}
              </div>

              {!showReply ? (
                <Button
                  onClick={() => setShowReply(true)}
                  variant="outline"
                  className="h-10 rounded-[10px] border-[#2D2D2D] bg-white px-4 text-sm font-medium text-[#111111] hover:bg-[#F8F8F8]"
                >
                  <ArrowBendUpLeft size={16} className="mr-2" />
                  Reply
                </Button>
              ) : (
                <div className="overflow-hidden rounded-[16px] border border-[#E1E1E1] bg-white shadow-[0_6px_24px_rgba(17,24,39,0.05)]">
                  <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-[#ECECEC]">
                        <AvatarFallback className="bg-[#111111] text-xs font-semibold text-white">
                          CG
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-[14px] font-semibold text-[#111111]">{mail.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <IconButton aria-label="Pop out" className="h-7 w-7">
                        <Minus size={14} />
                      </IconButton>
                      <IconButton aria-label="More" className="h-7 w-7">
                        <DotsThree size={16} />
                      </IconButton>
                    </div>
                  </div>

                  <div className="border-b border-[#EEEEEE] px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ToolbarButton>
                        <span className="text-[12px]">Inter</span>
                      </ToolbarButton>
                      <ToolbarButton>
                        <div className="h-4 w-4 rounded-full bg-[#111111]" />
                      </ToolbarButton>
                      <ToolbarButton>
                        <TextB size={16} weight="bold" />
                      </ToolbarButton>
                      <ToolbarButton>
                        <TextItalic size={16} />
                      </ToolbarButton>
                      <ToolbarButton>
                        <TextUnderline size={16} />
                      </ToolbarButton>
                      <ToolbarButton>
                        <ArrowCounterClockwise size={16} />
                      </ToolbarButton>
                      <ToolbarButton>
                        <ArrowClockwise size={16} />
                      </ToolbarButton>
                      <ToolbarButton>
                        <CheckCircle size={16} />
                      </ToolbarButton>
                      <ToolbarButton>
                        <TextAlignLeft size={16} />
                      </ToolbarButton>
                      <ToolbarButton>
                        <ListBullets size={16} />
                      </ToolbarButton>
                      <ToolbarButton>
                        <ListNumbers size={16} />
                      </ToolbarButton>
                      <button
                        type="button"
                        className="ml-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-[#F59E0B] transition-colors hover:bg-[#FFF7E6]"
                      >
                        Compose with AI
                      </button>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[150px] w-full resize-none border-0 bg-transparent text-[13px] leading-[1.7] text-[#3D3D3D] outline-none placeholder:text-[#A3A3A3]"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-[#EEEEEE] px-4 py-3">
                    <div className="flex items-center gap-1">
                      <IconButton aria-label="Attach file">
                        <Paperclip size={16} />
                      </IconButton>
                      <IconButton aria-label="Insert image">
                        <ImageSquare size={16} />
                      </IconButton>
                      <IconButton aria-label="Insert link">
                        <Link size={16} />
                      </IconButton>
                      <IconButton aria-label="Emoji">
                        <Smiley size={16} />
                      </IconButton>
                      <IconButton aria-label="Signature">
                        <Signature size={16} />
                      </IconButton>
                      <IconButton aria-label="Confidential mode">
                        <Lock size={16} />
                      </IconButton>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="rounded-md border border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2 text-[12px] font-medium text-[#111111] transition-colors hover:bg-[#F2F2F2]">
                        Save to draft
                      </button>
                      <Button className="h-9 rounded-[10px] bg-[#111111] px-4 text-xs font-medium text-white hover:bg-black">
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
