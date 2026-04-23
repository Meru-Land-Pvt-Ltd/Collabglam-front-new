import { LineChart } from "@mui/x-charts/LineChart";
import { SectionCard } from "./SectionCard";
import { monthLabels } from "./viewModashShared";

type PerformanceTrendCardProps = {
  organicTrend: number[];
  sponsoredTrend: number[];
  trendLabels?: string[];
  secondaryLabel?: string;
  primaryValue?: number;
  secondaryValue?: number;
};

function formatCompact(value?: number) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${Math.round(num)}`;
}

function hasRealSeries(values: number[]) {
  return values.length >= 2 && values.some((value) => Number(value) > 0);
}

export function PerformanceTrendCard({
  organicTrend,
  sponsoredTrend,
  trendLabels,
  secondaryLabel = "Followers",
  primaryValue = 0,
  secondaryValue = 0,
}: PerformanceTrendCardProps) {
  const useRealOrganic = hasRealSeries(organicTrend);
  const useRealSecondary = hasRealSeries(sponsoredTrend);

  const fallbackLabels =
    trendLabels && trendLabels.length >= 6
      ? trendLabels.slice(-6)
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const labels =
    trendLabels && trendLabels.length >= 2
      ? trendLabels
      : fallbackLabels;

  const likesSeries =
    useRealOrganic
      ? labels.map((_, index) => Number(organicTrend?.[index] ?? organicTrend[organicTrend.length - 1] ?? 0))
      : labels.map(() => Number(primaryValue ?? 0));

  const secondarySeries =
    useRealSecondary
      ? labels.map((_, index) => Number(sponsoredTrend?.[index] ?? sponsoredTrend[sponsoredTrend.length - 1] ?? 0))
      : labels.map(() => Number(secondaryValue ?? 0));

  return (
    <SectionCard
      title="Performance Trend"
      eyebrow="Likes and audience growth over time"
    >
      <div className="rounded-[20px] border border-[#efe8dd] bg-[#fffdfa] p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-[#6f6a61]">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c07ac4]" />
            Avg Likes
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e1a31a]" />
            {secondaryLabel}
          </div>
        </div>

        <LineChart
          height={320}
          xAxis={[
            {
              scaleType: "point",
              data: labels,
            },
          ]}
          yAxis={[
            {
              id: "likes",
              min: 0,
              valueFormatter: (value: number | string) => formatCompact(Number(value)),
            },
            {
              id: "secondary",
              min: 0,
              position: "right",
              valueFormatter: (value: number | string) => formatCompact(Number(value)),
            },
          ]}
          series={[
            {
              id: "organic",
              data: likesSeries,
              color: "#c07ac4",
              curve: "monotoneX",
              label: "Avg Likes",
              showMark: true,
            },
            {
              id: "secondary-series",
              data: secondarySeries,
              color: "#e1a31a",
              curve: "monotoneX",
              label: secondaryLabel,
              showMark: true,
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ top: 16, right: 56, bottom: 28, left: 56 }}
          sx={{
            "& .MuiChartsAxis-line": { stroke: "#ece4d8" },
            "& .MuiChartsAxis-tick": { stroke: "#d8d0c4" },
            "& .MuiChartsAxis-tickLabel": {
              fill: "#7c7468",
              fontSize: 11,
            },
            "& .MuiChartsGrid-line": { stroke: "#f2ebdf" },
            "& .MuiLineElement-root": { strokeWidth: 3 },
            "& .MuiMarkElement-root": { strokeWidth: 2 },
            "& .MuiChartsLegend-root": { display: "none" },
          }}
        />
      </div>
    </SectionCard>
  );
}