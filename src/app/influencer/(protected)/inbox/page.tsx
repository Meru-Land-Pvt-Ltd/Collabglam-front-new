import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page

// "use client";
// import React, { useState, useRef } from "react";
// import dynamic from "next/dynamic";
// import {
//   Bold,
//   Italic,
//   Underline,
//   Undo,
//   Redo,
//   AlignLeft,
//   AlignCenter,
//   AlignRight,
//   List,
//   ListOrdered,
//   Paperclip,
//   Send,
//   Sparkles,
//   Trash2,
// } from "lucide-react";
// import { Button } from "@/components/ui/buttonComp";
// import {
//     ArrowBendUpLeftIcon,
//   ArrowSquareInIcon,
//   ArrowSquareOutIcon,
//   DotsThreeIcon,
//   ImageIcon,
//   LinkIcon,
//   LockSimpleIcon,
//   MinusIcon,
//   SealCheckIcon,
//   SignatureIcon,
//   SmileyIcon,
//   XIcon,
// } from "@phosphor-icons/react";
// import FontDropdown from "@/components/ui/fontDropdown";
// import ColorPicker from "@/components/ui/colorPicker";

// const QuillEditor = dynamic(() => import("@/components/ui/quillEditor"), {
//   ssr: false,
// });

// // ─── Mock conversation data ───────────────────────────────────────────────────
// const CONVERSATIONS = [
//   {
//     id: 1,
//     name: "ljustine",
//     email: "ljustin@mail.com",
//     time: "11:35",
//     preview:
//       "Lorem ipsum is simply dummy text of the printing and typesetting in...",
//     avatar: "L",
//     avatarBg: "#e91e8c",
//     unread: false,
//     active: true,
//   },
//   {
//     id: 2,
//     name: "Aditya",
//     email: "aditya.mail.co...",
//     time: "10:12",
//     preview:
//       "Hey, just wanted to follow up on the campaign details we discussed...",
//     avatar: "A",
//     avatarBg: "#7c3aed",
//     unread: true,
//     active: false,
//   },
//   {
//     id: 3,
//     name: "Sarah K.",
//     email: "sarah.k@mail.com",
//     time: "Yesterday",
//     preview:
//       "The media kit looks great! Can we schedule a call to go over the...",
//     avatar: "S",
//     avatarBg: "#0ea5e9",
//     unread: false,
//     active: false,
//   },
//   {
//     id: 4,
//     name: "Marcus Lee",
//     email: "marcus.l@mail.com",
//     time: "Yesterday",
//     preview:
//       "I have reviewed the contract and have a few notes on section 3...",
//     avatar: "M",
//     avatarBg: "#f59e0b",
//     unread: true,
//     active: false,
//   },
//   {
//     id: 5,
//     name: "Priya Sharma",
//     email: "priya.s@brand.com",
//     time: "Mon",
//     preview:
//       "Attached is the updated brief for the spring collection launch...",
//     avatar: "P",
//     avatarBg: "#10b981",
//     unread: false,
//     active: false,
//   },
//   {
//     id: 6,
//     name: "Tom Nguyen",
//     email: "tom.n@mail.com",
//     time: "Mon",
//     preview: "Quick question — are we still on track for the Feb 28 deadline?",
//     avatar: "T",
//     avatarBg: "#ef4444",
//     unread: false,
//     active: false,
//   },
// ];

// // ─── Left panel ───────────────────────────────────────────────────────────────
// const MailList = ({
//   selectedId,
//   onSelect,
// }: {
//   selectedId: number;
//   onSelect: (id: number) => void;
// }) => (
//   <div className="flex flex-col  w-full h-full rounded-[1rem] border border-[#D6D6D6] bg-white  overflow-hidden">
//     {/* Panel header */}
//     <div className="flex items-center justify-between px-4 py-3 border-b border-[#D6D6D6]">
//       <span className="text-sm font-semibold text-gray-800">Messages</span>
//       <span className="text-xs text-white bg-gray-900 rounded-full px-2 py-0.5">
//         {CONVERSATIONS.filter((c) => c.unread).length} new
//       </span>
//     </div>

//     {/* Conversation list */}
//     <div className="flex-1 overflow-y-auto">
//       {CONVERSATIONS.map((c) => (
//         <button
//           key={c.id}
//           onClick={() => onSelect(c.id)}
//           className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-[#F0F0F0] transition-colors
//                         ${
//                           selectedId === c.id
//                             ? "bg-gray-50"
//                             : "bg-white hover:bg-gray-50"
//                         }`}
//         >
//           <div
//             className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
//             style={{ background: c.avatarBg }}
//           >
//             {c.avatar}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center justify-between gap-1">
//               <span
//                 className={`text-sm truncate ${
//                   c.unread
//                     ? "font-semibold text-gray-900"
//                     : "font-medium text-gray-700"
//                 }`}
//               >
//                 {c.name}
//               </span>
//               <span className="text-[0.625rem] text-gray-400 flex-shrink-0">
//                 {c.time}
//               </span>
//             </div>
//             <p className="text-xs text-gray-400 truncate mt-0.5 leading-4">
//               {c.preview}
//             </p>
//           </div>
//           {c.unread && (
//             <div className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0 mt-1.5" />
//           )}
//         </button>
//       ))}
//     </div>
//   </div>
// );

// // ─── Attachment preview card ──────────────────────────────────────────────────
// const AttachmentPreview = ({
//   file,
//   onRemove,
// }: {
//   file: File;
//   onRemove: () => void;
// }) => {
//   const isImage = file.type.startsWith("image/");
//   const isPdf = file.type === "application/pdf";
//   const objectUrl = React.useMemo(() => URL.createObjectURL(file), [file]);

//   React.useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

//   return (
//     <div className="relative flex-shrink-0 group w-[4.5rem]">
//       {/* Thumbnail */}
//       <div className="w-[4.5rem] h-[3.25rem] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
//         {isImage ? (
//           <img
//             src={objectUrl}
//             alt={file.name}
//             className="w-full h-full object-cover"
//           />
//         ) : isPdf ? (
//           // PDF preview: red badge + icon
//           <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full bg-red-50">
//             <svg
//               width="20"
//               height="20"
//               viewBox="0 0 24 24"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
//                 fill="#FEE2E2"
//                 stroke="#EF4444"
//                 strokeWidth="1.5"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//               <path
//                 d="M14 2V8H20"
//                 stroke="#EF4444"
//                 strokeWidth="1.5"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//               <text
//                 x="7"
//                 y="17"
//                 fontSize="5.5"
//                 fontWeight="700"
//                 fill="#EF4444"
//                 fontFamily="sans-serif"
//               >
//                 PDF
//               </text>
//             </svg>
//           </div>
//         ) : (
//           // Generic file
//           <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full">
//             <Paperclip size={16} className="text-gray-400" />
//           </div>
//         )}
//       </div>

//       {/* File name */}
//       <p className="text-[0.6rem] text-gray-500 truncate mt-1 leading-3 text-center w-full">
//         {file.name}
//       </p>

//       {/* Remove button — visible on hover */}
//       <button
//         onClick={onRemove}
//         className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
//       >
//         <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
//           <path
//             d="M8 2L2 8M2 2l6 6"
//             stroke="currentColor"
//             strokeWidth="1.8"
//             strokeLinecap="round"
//           />
//         </svg>
//       </button>
//     </div>
//   );
// };

// // ─── Compose panel ────────────────────────────────────────────────────────────
// interface MailComposeProps {
//   quillRef: React.RefObject<any>;
//   activeFormats: Record<string, any>;
//   onUpdateFormats: () => void;
//   onClose?: () => void;
//   onMinimize?: () => void;
//   onMaximize?: () => void;
//   isMaximized?: boolean;
//   type?: "compose" | "reply";
//   // reply-only: sender info shown in the compact header
//   replyToEmail?: string;
//   replyToAvatarFallback?: string;
//   replyToAvatarBg?: string;
// }

// const EMOJIS = [
//   "😀",
//   "😂",
//   "😍",
//   "🥰",
//   "😎",
//   "🤔",
//   "😅",
//   "🙏",
//   "👍",
//   "👎",
//   "❤️",
//   "🔥",
//   "✨",
//   "🎉",
//   "👏",
//   "💪",
//   "🤝",
//   "💡",
//   "📎",
//   "📧",
//   "✅",
//   "❌",
//   "⚠️",
//   "📌",
//   "🗓️",
//   "💬",
//   "📝",
//   "🚀",
//   "🌟",
//   "💯",
// ];

// const SIGNATURES = [
//   {
//     label: "Professional",
//     text: "Best regards,\nNike\nCollabGlam Brand Manager\nnike@collabglam.com",
//   },
//   { label: "Casual", text: "Cheers,\nNike 🌟" },
//   { label: "Formal", text: "Yours sincerely,\nNike\nCollabGlam Inc." },
// ];

// export const MailCompose = ({
//     quillRef,
//     activeFormats,
//     onUpdateFormats,
//     onClose,
//     onMinimize,
//     onMaximize,
//     isMaximized,
//     type = 'compose',
//     replyToEmail = 'info@collabglam.com',
//     replyToAvatarFallback = 'G',
//     replyToAvatarBg = 'linear-gradient(135deg, #f7c948 0%, #e8830a 60%, #c0392b 100%)',
// }: MailComposeProps) => {
//     const isReply = type === 'reply'

//     const [subject,         setSubject]         = useState('')
//     const [showCc,          setShowCc]          = useState(false)
//     const [showBcc,         setShowBcc]         = useState(false)
//     const [cc,              setCc]              = useState('')
//     const [bcc,             setBcc]             = useState('')
//     const [attachments,     setAttachments]     = useState<File[]>([])
//     const [showLinkPopover, setShowLinkPopover] = useState(false)
//     const [linkUrl,         setLinkUrl]         = useState('')
//     const [linkText,        setLinkText]        = useState('')
//     const [showEmojiPicker, setShowEmojiPicker] = useState(false)
//     const [showSignature,   setShowSignature]   = useState(false)
//     const [isSecure,        setIsSecure]        = useState(true)

//     const fileInputRef  = useRef<HTMLInputElement>(null)
//     const imageInputRef = useRef<HTMLInputElement>(null)

//     // ── Format helpers ────────────────────────────────────────────────────────
//     const execFormat = (format: string, value: any = true) => {
//         const editor = quillRef.current?.getEditor()
//         if (!editor) return
//         const current = editor.getFormat()
//         editor.format(format, current[format] === value ? false : value)
//         editor.focus()
//         onUpdateFormats()
//     }

//     const execHistory = (action: 'undo' | 'redo') => {
//         const editor = quillRef.current?.getEditor()
//         if (!editor) return
//         action === 'undo' ? editor.history.undo() : editor.history.redo()
//         editor.focus()
//         onUpdateFormats()
//     }

//     const isActive = (format: string, value: any = true): boolean => {
//         if (format === 'align') {
//             if (value === false) return !activeFormats['align']
//             return activeFormats['align'] === value
//         }
//         return value === true ? !!activeFormats[format] : activeFormats[format] === value
//     }

//     // ── File helpers ──────────────────────────────────────────────────────────
//     const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (!e.target.files) return
//         setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
//         e.target.value = ''
//     }

//     const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0]
//         if (!file) return
//         const reader = new FileReader()
//         reader.onload = () => {
//             const editor = quillRef.current?.getEditor()
//             if (!editor) return
//             const range = editor.getSelection(true)
//             editor.insertEmbed(range.index, 'image', reader.result)
//             editor.setSelection(range.index + 1)
//         }
//         reader.readAsDataURL(file)
//         e.target.value = ''
//     }

//     const handleInsertLink = () => {
//         const editor = quillRef.current?.getEditor()
//         if (!editor || !linkUrl) return
//         const range = editor.getSelection(true)
//         const text  = linkText || linkUrl
//         editor.insertText(range.index, text, 'link', linkUrl)
//         editor.setSelection(range.index + text.length)
//         setLinkUrl(''); setLinkText(''); setShowLinkPopover(false)
//         editor.focus()
//     }

//     const handleInsertEmoji = (emoji: string) => {
//         const editor = quillRef.current?.getEditor()
//         if (!editor) return
//         const range = editor.getSelection(true)
//         editor.insertText(range.index, emoji)
//         editor.setSelection(range.index + emoji.length)
//         setShowEmojiPicker(false)
//         editor.focus()
//     }

//     const handleInsertSignature = (text: string) => {
//         const editor = quillRef.current?.getEditor()
//         if (!editor) return
//         const length = editor.getLength()
//         editor.insertText(length - 1, '\n\n' + text)
//         editor.setSelection(length - 1 + text.length + 2)
//         setShowSignature(false)
//         editor.focus()
//     }

//     const baseClass     = '!text-gray-800 !w-[1.75rem] !h-[1.75rem] !p-0 !min-w-0 !aspect-square border-none shadow-none transition-colors flex items-center justify-center'
//     const activeClass   = '!bg-gray-100 !text-black !rounded-full'
//     const inactiveClass = '!bg-white !rounded-[0.5rem]'

//     return (
//         <div className={`relative border border-[#D6D6D6] rounded-[1rem] flex flex-col bg-white overflow-hidden transition-all duration-200
//             ${isReply
//                 ? 'w-full h-auto'
//                 : isMaximized ? 'w-full h-full mx-auto' : 'w-full h-full'
//             }`}
//         >
//             {/* ── Header ── */}
//             {isReply ? (
//                 // Reply header: avatar + ↩ sender email + expand / more
//                 <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D6D6D6]">
//                     <div
//                         className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
//                         style={{ background: replyToAvatarBg }}
//                     >
//                         {replyToAvatarFallback}
//                     </div>
//                     <div className="flex items-center gap-1.5 flex-1 min-w-0">
//                         <ArrowBendUpLeftIcon size={14} color="#969696" />
//                         <span className="text-sm font-medium text-gray-800 truncate">{replyToEmail}</span>
//                     </div>
//                     <div className="flex items-center gap-1 shrink-0">
//                         <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
//                             <ArrowSquareOutIcon size={18} />
//                         </button>
//                         <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
//                             <DotsThreeIcon size={18} weight="bold" />
//                         </button>
//                     </div>
//                 </div>
//             ) : (
//                 // Compose header: "New Message" + minimize / maximize / close
//                 <div className="flex items-center justify-between px-4 py-3 border-b border-[#D6D6D6]">
//                     <span className="text-sm font-semibold text-gray-800">New Message</span>
//                     <div className="flex items-center gap-2">
//                         <button onClick={onMinimize} className="text-gray-400 hover:text-gray-600 transition-colors"><MinusIcon size={20} /></button>
//                         <button onClick={onMaximize} className="text-gray-400 hover:text-gray-600 transition-colors">
//                             {isMaximized ? <ArrowSquareInIcon size={20} /> : <ArrowSquareOutIcon size={20} />}
//                         </button>
//                         <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon size={20} /></button>
//                     </div>
//                 </div>
//             )}

//             {/* ── From / To / Cc / Bcc / Subject — compose only ── */}
//             {!isReply && (
//                 <>
//                     {/* From */}
//                     <div className="flex h-[3.25rem] w-full p-[0.75rem] gap-[0.75rem] items-center border-b border-[#D6D6D6]">
//                         <span className="text-sm text-gray-400 w-12">From</span>
//                         <div className="flex items-center gap-2 flex-1">
//                             <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#111' }}>N</div>
//                             <span className="text-sm font-medium text-gray-800">Nike@Collabglam.com</span>
//                         </div>
//                     </div>

//                     {/* To */}
//                     <div className="flex w-full h-[3rem] py-[0.625rem] px-[0.75rem] items-center gap-3 border-b border-[#D6D6D6]">
//                         <span className="text-sm text-gray-400 w-12">To</span>
//                         <div className="flex items-center gap-2 flex-1 flex-wrap">
//                             <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
//                                 <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#e91e8c' }}>L</div>
//                                 <span className="text-sm text-gray-700">ljustine</span>
//                             </div>
//                             <input type="text" className="flex-1 text-sm outline-none placeholder-gray-300 min-w-24" placeholder="Add recipient..." />
//                         </div>
//                         <div className="flex gap-[0.5rem]">
//                             <Button variant="outline" onClick={() => setShowCc(!showCc)} className="text-xs !h-[1.75rem] !w-[2.1875rem] px-[0.5rem] border-[#E6E6E6] shadow-none font-medium text-gray-400 hover:text-gray-600 rounded-[0.75rem] hover:bg-gray-50 transition-colors">Cc</Button>
//                             <Button variant="outline" onClick={() => setShowBcc(!showBcc)} className="text-xs !h-[1.75rem] !w-[2.1875rem] px-[0.5rem] border-[#E6E6E6] shadow-none font-medium text-gray-400 hover:text-gray-600 rounded-[0.75rem] hover:bg-gray-50 transition-colors">Bcc</Button>
//                         </div>
//                     </div>

//                     {/* Cc */}
//                     {showCc && (
//                         <div className="flex items-center gap-3 px-5 py-2 border-b border-[#D6D6D6]">
//                             <span className="text-sm text-gray-400 w-12">Cc</span>
//                             <input type="text" value={cc} onChange={(e) => setCc(e.target.value)} className="flex-1 text-sm outline-none placeholder-gray-300" placeholder="Add Cc recipients..." />
//                         </div>
//                     )}

//                     {/* Bcc */}
//                     {showBcc && (
//                         <div className="flex items-center gap-3 px-5 py-2 border-b border-[#D6D6D6]">
//                             <span className="text-sm text-gray-400 w-12">Bcc</span>
//                             <input type="text" value={bcc} onChange={(e) => setBcc(e.target.value)} className="flex-1 text-sm outline-none placeholder-gray-300" placeholder="Add Bcc recipients..." />
//                         </div>
//                     )}

//                     {/* Subject */}
//                     <div className="flex h-[2.75rem] w-full items-center gap-3 p-[0.75rem] border-b border-[#D6D6D6]">
//                         <span className="text-sm text-gray-400 w-12">Subject</span>
//                         <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 text-sm outline-none placeholder-gray-300 text-gray-800" placeholder="Subject" />
//                     </div>
//                 </>
//             )}

//             {/* ── Toolbar (shared) ── */}
//             <div className="flex h-[2.75rem] w-full items-center gap-2 px-4 border-b border-[#D6D6D6]">
//                 <div className="flex items-center gap-3 shrink-0">
//                     <FontDropdown quillRef={quillRef} />
//                     <ColorPicker quillRef={quillRef} />
//                 </div>
//                 <div className="w-px h-5 bg-gray-200 shrink-0" />
//                 {[
//                     { icon: Bold,      format: 'bold'      },
//                     { icon: Italic,    format: 'italic'    },
//                     { icon: Underline, format: 'underline' },
//                 ].map(({ icon: Icon, format }) => (
//                     <Button key={format} variant="outline"
//                         onMouseDown={(e) => { e.preventDefault(); execFormat(format) }}
//                         className={`${baseClass} ${isActive(format) ? activeClass : inactiveClass}`}
//                     ><Icon size={18} /></Button>
//                 ))}
//                 <div className="w-px h-5 bg-gray-200 shrink-0" />
//                 {([{ icon: Undo, action: 'undo' }, { icon: Redo, action: 'redo' }] as const).map(({ icon: Icon, action }) => (
//                     <Button key={action} variant="outline"
//                         onMouseDown={(e) => { e.preventDefault(); execHistory(action) }}
//                         className={`${baseClass} ${inactiveClass}`}
//                     ><Icon size={18} /></Button>
//                 ))}
//                 <div className="w-px h-5 bg-gray-200 shrink-0" />
//                 {[
//                     { icon: AlignLeft,   format: 'align', value: false    },
//                     { icon: AlignCenter, format: 'align', value: 'center' },
//                     { icon: AlignRight,  format: 'align', value: 'right'  },
//                 ].map(({ icon: Icon, format, value }) => (
//                     <Button key={String(value)} variant="outline"
//                         onMouseDown={(e) => { e.preventDefault(); execFormat(format, value) }}
//                         className={`${baseClass} ${isActive(format, value) ? activeClass : '!bg-white'}`}
//                     ><Icon size={18} /></Button>
//                 ))}
//                 <div className="w-px h-5 bg-gray-200 shrink-0" />
//                 {[
//                     { icon: List,        format: 'list', value: 'bullet'  },
//                     { icon: ListOrdered, format: 'list', value: 'ordered' },
//                 ].map(({ icon: Icon, format, value }) => (
//                     <Button key={value} variant="outline"
//                         onMouseDown={(e) => { e.preventDefault(); execFormat(format, value) }}
//                         className={`${baseClass} ${isActive(format, value) ? activeClass : '!bg-white'}`}
//                     ><Icon size={18} /></Button>
//                 ))}
//                 <div className="ml-auto shrink-0">
//                     <Button variant="outline" className="flex !h-[1.25rem] hover:bg-white items-center border-none shadow-none rounded-lg font-medium transition-colors">
//                         <div className="flex items-center gap-[0.5rem]">
//                             <Sparkles size={13} className="text-amber-400" />
//                             <span className="bg-gradient-to-r from-[#FFBF00] via-[#F3584E] to-[#E078D1] bg-clip-text text-transparent text-sm">Compose with AI</span>
//                         </div>
//                     </Button>
//                 </div>
//             </div>

//             {/* ── Quill body (shared) ── */}
//             <div className={'flex-1 overflow-hidden'}>
//                 <QuillEditor
//                     quillRef={quillRef}
//                     placeholder={isReply ? 'Write your reply...' : 'Lorem ipsum dolor, sit amet consectetur adipisicing elit...'}
//                     onChangeSelection={onUpdateFormats}
//                     onTextChange={onUpdateFormats}
//                 />
//             </div>

//             {/* Hidden file inputs */}
//             <input ref={fileInputRef}  type="file" multiple      className="hidden" onChange={handleAttachFile}  />
//             <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertImage} />

//             {/* ── Footer (shared) ── */}
//             <div className={isReply ? 'flex flex-col border-t border-gray-100 bg-white' : 'absolute bottom-0 inset-x-0 flex flex-col border-t border-gray-100 bg-white'}>

//                 {/* Link popover */}
//                 {showLinkPopover && (
//                     <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
//                         <LinkIcon size={14} color="#6b7280" />
//                         <input autoFocus type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link text (optional)" className="text-xs outline-none bg-transparent placeholder-gray-300 w-36 border-r border-gray-200 pr-2" />
//                         <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInsertLink()} placeholder="https://..." className="text-xs outline-none bg-transparent placeholder-gray-300 flex-1" />
//                         <button onClick={handleInsertLink} className="text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-md transition-colors">Insert</button>
//                         <button onClick={() => setShowLinkPopover(false)} className="text-gray-400 hover:text-gray-600">
//                             <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
//                         </button>
//                     </div>
//                 )}

//                 {/* Emoji picker */}
//                 {showEmojiPicker && (
//                     <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
//                         <div className="grid grid-cols-10 gap-1">
//                             {EMOJIS.map((emoji) => (
//                                 <button key={emoji} onClick={() => handleInsertEmoji(emoji)} className="w-7 h-7 flex items-center justify-center text-base rounded hover:bg-gray-200 transition-colors">{emoji}</button>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Signature picker */}
//                 {showSignature && (
//                     <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex flex-col gap-1.5">
//                         <span className="text-xs font-medium text-gray-500">Choose a signature</span>
//                         <div className="flex gap-2">
//                             {SIGNATURES.map((sig) => (
//                                 <button key={sig.label} onClick={() => handleInsertSignature(sig.text)} className="flex flex-col items-start px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors text-left">
//                                     <span className="text-xs font-semibold text-gray-700">{sig.label}</span>
//                                     <span className="text-[10px] text-gray-400 mt-0.5 whitespace-pre-line leading-3">{sig.text.split('\n')[0]}...</span>
//                                 </button>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Attachment previews */}
//                 {attachments.length > 0 && (
//                     <div className="flex items-end gap-3 px-4 pt-3 pb-1 border-b border-gray-100 overflow-x-auto">
//                         {attachments.map((file, i) => (
//                             <AttachmentPreview key={`${file.name}-${i}`} file={file} onRemove={() => setAttachments(prev => prev.filter((_, j) => j !== i))} />
//                         ))}
//                     </div>
//                 )}

//                 {/* Main footer bar */}
//                 <div className="flex items-center px-4 py-3">
//                     <div className="flex items-center gap-1">
//                         <Button title="Attach file" onClick={() => fileInputRef.current?.click()} className="!h-[2rem] !w-[2rem] !bg-white shadow-none hover:!bg-gray-100 transition-colors">
//                             <Paperclip size={20} color="#1A1A1A" />
//                         </Button>
//                         <Button title="Insert image" onClick={() => imageInputRef.current?.click()} className="!h-[2rem] !w-[2rem] !bg-white shadow-none hover:!bg-gray-100 transition-colors">
//                             <ImageIcon size={22} color="#1A1A1A" />
//                         </Button>
//                         <Button title="Insert link" onClick={() => { setShowLinkPopover(p => !p); setShowEmojiPicker(false); setShowSignature(false) }} className={`!h-[2rem] !w-[2rem] shadow-none hover:!bg-gray-100 transition-colors ${showLinkPopover ? '!bg-gray-100' : '!bg-white'}`}>
//                             <LinkIcon size={22} color="#1A1A1A" />
//                         </Button>
//                         <Button title="Emoji" onClick={() => { setShowEmojiPicker(p => !p); setShowLinkPopover(false); setShowSignature(false) }} className={`!h-[2rem] !w-[2rem] shadow-none hover:!bg-gray-100 transition-colors ${showEmojiPicker ? '!bg-gray-100' : '!bg-white'}`}>
//                             <SmileyIcon size={22} color="#1A1A1A" />
//                         </Button>
//                         <Button title="Signature" onClick={() => { setShowSignature(p => !p); setShowLinkPopover(false); setShowEmojiPicker(false) }} className={`!h-[2rem] !w-[2rem] shadow-none hover:!bg-gray-100 transition-colors ${showSignature ? '!bg-gray-100' : '!bg-white'}`}>
//                             <SignatureIcon size={22} color="#1A1A1A" />
//                         </Button>
//                         <Button title={isSecure ? 'Encrypted' : 'Not encrypted'} onClick={() => setIsSecure(p => !p)} className="!w-[2rem] !h-[2rem] rounded-lg !bg-white shadow-none hover:!bg-gray-100 transition-colors">
//                             <span className="relative inline-flex w-5 h-5 items-center justify-center">
//                                 <LockSimpleIcon size={24} className="absolute inset-0 m-auto" color="#1A1A1A" />
//                                 <SealCheckIcon size={16} className="absolute left-2 top-1.5" color={isSecure ? '#53B96A' : '#D1D5DB'} weight="fill" />
//                             </span>
//                         </Button>
//                     </div>

//                     <div className="ml-auto flex items-center gap-2 shrink-0">
//                         <Button variant="outline" title="Delete" className="!px-[0.5rem] !w-[1.875rem] !h-[2rem] rounded-lg border-[#E6E6E6] bg-white hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors">
//                             <Trash2 size={14} color="#1A1A1A" />
//                         </Button>
//                         <Button variant="outline" className="!w-[5.6875rem] !h-[2rem] !px-[0.5rem] rounded-[0.75rem] border-[#E6E6E6] font-semibold !text-[0.75rem] text-[#1A1A1A] bg-white hover:bg-gray-200 transition-colors">
//                             Save to draft
//                         </Button>
//                         {/* Send (compose) / Reply (reply) */}
//                         <Button className="flex items-center gap-1 !w-[4.375rem] !h-[2rem] !px-[0.5rem] rounded-[0.75rem] !text-[0.75rem] font-semibold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: '#111' }}>
//                             <span>{isReply ? 'Reply' : 'Send'}</span>
//                             <Send size={14} />
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// // ─── Root orchestrator ────────────────────────────────────────────────────────
// const MailEditor = ({ onClose }: { onClose?: () => void }) => {
//   const [selectedConversation, setSelectedConversation] = useState(1);
//   const [activeFormats, setActiveFormats] = useState<Record<string, any>>({});
//   const quillRef = useRef<any>(null);

//   const updateActiveFormats = () => {
//     const editor = quillRef.current?.getEditor();
//     if (!editor) return;
//     const selection = editor.getSelection();
//     if (!selection) return;
//     setActiveFormats(editor.getFormat());
//   };

//   return (
//     <div className="flex w-11/12 h-screen  p-[0.5rem] mx-auto my-[1.5rem] gap-[0.5rem]">
//       <MailList
//         selectedId={selectedConversation}
//         onSelect={setSelectedConversation}
//       />
//       <MailCompose
//         quillRef={quillRef}
//         activeFormats={activeFormats}
//         onUpdateFormats={updateActiveFormats}
//         onClose={onClose}
//       />
//     </div>
//   );
// };

// export default MailEditor;
