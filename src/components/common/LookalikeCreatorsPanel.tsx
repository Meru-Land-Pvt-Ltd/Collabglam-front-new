import { ArrowUpRight } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { buildInitials, type LookalikeCreator } from "./viewModashShared";

export function LookalikeCreatorsPanel({ items }: { items: LookalikeCreator[] }) {
  const openProfile = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <SectionCard
      title="Lookalike Creators"
      action={
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#7d7569]">
          Discover more <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => openProfile(item.url)}
            onKeyDown={(e) => {
              if (!item.url) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProfile(item.url);
              }
            }}
            tabIndex={item.url ? 0 : -1}
            role={item.url ? "button" : undefined}
            className={`rounded-2xl border border-[#efe8dd] bg-[#fffdfa] p-4 text-center transition ${
              item.url ? "cursor-pointer hover:shadow-sm hover:bg-[#fdf8f1]" : ""
            }`}
          >
            <div className="mx-auto h-14 w-14 overflow-hidden rounded-full bg-[#ece4d8]">
              {item.avatar ? (
                <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs font-bold text-[#5d5349]">
                  {buildInitials(item.name)}
                </div>
              )}
            </div>

            <div className="mt-3 text-sm font-semibold text-[#1f1f1f]">{item.name}</div>
            <div className="text-xs text-[#8a8175]">{item.handle}</div>

            <div className="mt-4 flex items-center justify-between border-t border-[#efe8dd] pt-3 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#ab9f8e]">
                  Reach
                </div>
                <div className="font-semibold text-[#1f1f1f]">{item.followers}</div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#ab9f8e]">
                  ER
                </div>
                <div className="font-semibold text-[#1f1f1f]">{item.engagement}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}