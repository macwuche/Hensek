import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ChartCard from "@/components/ui/ChartCard";
import RatingsBars from "@/components/ui/RatingsBars";
import DataTable, { Column } from "@/components/ui/DataTable";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TrendingUp, Star, Award } from "lucide-react";
import { getInitials } from "@/lib/utils";

const TEAM_SCORES = [
  { team: "Safety", score: 88 },
  { team: "Security", score: 81 },
  { team: "Operations", score: 76 },
  { team: "HR", score: 92 },
  { team: "Field Ops", score: 84 },
];

const TOP = [
  { id: 1, name: "Akosua Boateng", role: "Site Lead", score: 96 },
  { id: 2, name: "Daniel Owusu", role: "Safety Officer", score: 94 },
  { id: 3, name: "Mavis Asare", role: "HR Generalist", score: 92 },
  { id: 4, name: "Kwabena Osei", role: "Security Lead", score: 90 },
  { id: 5, name: "Yaa Mensah", role: "Operations", score: 89 },
];

const RATINGS = [
  { label: "Productivity", value: 86, color: "#EAB308" },
  { label: "Punctuality", value: 92, color: "#22C55E" },
  { label: "Collaboration", value: 81, color: "#8B5CF6" },
  { label: "Initiative", value: 74, color: "#F97316" },
];

export default function HRPerformance() {
  const cols: Column<typeof TOP[number]>[] = [
    {
      key: "n",
      header: "Employee",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-hensek-yellow/30 flex items-center justify-center text-xs font-bold text-hensek-dark">{getInitials(r.name)}</div>
          <div>
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-[10px] text-gray-400">{r.role}</p>
          </div>
        </div>
      ),
    },
    { key: "s", header: "Score", render: (r) => <span className="font-semibold text-hensek-dark">{r.score}</span> },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Performance" subtitle="Team and individual performance overview" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Avg Team Score" value="84.2" hint="+3.1 vs last quarter" icon={<TrendingUp size={18} />} trend={{ value: "+3.1%", positive: true }} />
        <StatCard label="Top Performers" value={TOP.length} hint="Score ≥ 90" icon={<Star size={18} />} />
        <StatCard label="Reviews Due" value={11} hint="This month" icon={<Award size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <ChartCard title="Scores by Team" subtitle="Average performance score" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TEAM_SCORES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0E2" vertical={false} />
                <XAxis dataKey="team" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F3F0E2", fontSize: 12 }} />
                <Bar dataKey="score" fill="#EAB308" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Ratings Breakdown" subtitle="Across categories">
          <RatingsBars items={RATINGS} />
        </ChartCard>
      </div>

      <div className="hensek-card">
        <h3 className="text-sm font-semibold text-hensek-dark mb-3">Top Performers</h3>
        <DataTable columns={cols} rows={TOP} rowKey={(r) => String(r.id)} />
      </div>
    </div>
  );
}
