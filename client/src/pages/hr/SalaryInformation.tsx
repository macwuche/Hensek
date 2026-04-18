import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DataTable, { Column } from "@/components/ui/DataTable";
import ChartCard from "@/components/ui/ChartCard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, Users } from "lucide-react";

interface Band {
  level: string;
  count: number;
  min: string;
  median: string;
  max: string;
}

const BANDS: Band[] = [
  { level: "L1 — Entry", count: 38, min: "GHS 1,200", median: "GHS 1,580", max: "GHS 2,000" },
  { level: "L2 — Junior", count: 51, min: "GHS 2,100", median: "GHS 2,650", max: "GHS 3,200" },
  { level: "L3 — Mid", count: 33, min: "GHS 3,400", median: "GHS 4,200", max: "GHS 5,300" },
  { level: "L4 — Senior", count: 16, min: "GHS 5,800", median: "GHS 7,400", max: "GHS 9,200" },
  { level: "L5 — Lead", count: 4, min: "GHS 10,500", median: "GHS 12,800", max: "GHS 15,400" },
];

const TREND = [
  { month: "Jan", median: 3950 },
  { month: "Feb", median: 3990 },
  { month: "Mar", median: 4040 },
  { month: "Apr", median: 4120 },
  { month: "May", median: 4180 },
  { month: "Jun", median: 4220 },
];

export default function HRSalaryInformation() {
  const cols: Column<Band>[] = [
    { key: "l", header: "Level", render: (b) => <span className="font-medium">{b.level}</span> },
    { key: "n", header: "Headcount", render: (b) => <span className="text-xs">{b.count}</span> },
    { key: "min", header: "Min", render: (b) => <span className="text-xs text-gray-600">{b.min}</span>, className: "hidden sm:table-cell" },
    { key: "med", header: "Median", render: (b) => <span className="text-xs font-semibold">{b.median}</span> },
    { key: "max", header: "Max", render: (b) => <span className="text-xs text-gray-600">{b.max}</span>, className: "hidden md:table-cell" },
  ];
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Salary Information" subtitle="Compensation bands and median trend" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Median Salary" value="GHS 4,220" hint="All staff" icon={<DollarSign size={18} />} trend={{ value: "+1.0% MoM", positive: true }} />
        <StatCard label="Salary Bands" value={BANDS.length} icon={<Users size={18} />} />
        <StatCard label="6m Median Trend" value="+6.8%" icon={<TrendingUp size={18} />} trend={{ value: "Above target", positive: true }} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <ChartCard title="Median Salary Trend">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="med" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0E2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F3F0E2", fontSize: 12 }} />
                <Area type="monotone" dataKey="median" stroke="#22C55E" strokeWidth={2.5} fill="url(#med)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <div className="hensek-card">
          <h3 className="text-sm font-semibold text-hensek-dark mb-3">Salary Bands</h3>
          <DataTable columns={cols} rows={BANDS} rowKey={(b) => b.level} />
        </div>
      </div>
    </div>
  );
}
