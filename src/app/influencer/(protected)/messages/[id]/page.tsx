// File: app/influencer/(protected)/messages/[id]/page.tsx
import ChatWindow from "../components/chatWindow";

interface PageProps {
  /** Next.js 15+ now passes params as a Promise */
  params: Promise<{ id: string }>;
}

export default async function MessagePage({ params }: PageProps) {
  const { id } = await params;
  return <ChatWindow params={{ roomId: id }} />;
}
