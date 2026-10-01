import { Inbox } from "lucide-react";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Inbox size={21} /></div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
