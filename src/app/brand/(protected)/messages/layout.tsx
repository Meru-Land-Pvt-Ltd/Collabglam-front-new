import { ReactNode } from "react";
import MessagesList from "./components/messagesList";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      <aside className="w-1/4 border-r bg-white shadow-sm overflow-hidden flex flex-col">
        <MessagesList />
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        {children}
      </main>
    </div>
  );
}