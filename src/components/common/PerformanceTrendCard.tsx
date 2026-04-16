import { LineChart } from "@mui/x-charts/LineChart";
import { SectionCard } from "./SectionCard";
import { monthLabels } from "./viewModashShared";

export function PerformanceTrendCard({
  organicTrend,
  sponsoredTrend,
  trendLabels,
}: {
  organicTrend: number[];
  sponsoredTrend: number[];
  trendLabels?: string[];
}) {
  const labels = trendLabels ?? monthLabels;

  return (
    <SectionCard
      title="Performance Trend (12 Intervals)"
      eyebrow="Followers, engagement, sponsored impact"
    >
      <div className="rounded-[20px] border border-[#efe8dd] bg-[#fffdfa] p-14">
        <div className="mb-3 flex items-center justify-end gap-4 text-xs text-[#6f6a61]">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c07ac4]" /> Avg Likes
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e1a31a]" /> Followers
          </div>
        </div>

        <LineChart
          height={290}
          xAxis={[{ scaleType: "point", data: labels }]}
          yAxis={[{ min: 0 }]}
          series={[
            {
              id: "organic",
              data: organicTrend,
              color: "#c07ac4",
              curve: "monotoneX",
              label: "Avg Likes",
            },
            {
              id: "sponsored",
              data: sponsoredTrend,
              color: "#e1a31a",
              curve: "monotoneX",
              label: "Followers",
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ top: 10, right: 20, bottom: 20, left: 40 }}
          sx={{
            "& .MuiChartsAxis-line": { stroke: "#ece4d8" },
            "& .MuiChartsGrid-line": { stroke: "#f2ebdf" },
            "& .MuiChartsLegend-root": { display: "none" },
          }}
        />
      </div>
    </SectionCard>
  );
}