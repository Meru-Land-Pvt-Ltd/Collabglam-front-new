import ChatWindow from "../components/chatWindow";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MessagePage({ params }: PageProps) {
  const { id } = await params;
  return <ChatWindow params={{ groupId: id }} />;
}