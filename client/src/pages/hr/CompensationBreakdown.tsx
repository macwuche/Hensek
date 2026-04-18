import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import StatCard from "@/components/ui/StatCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon, Banknote, Gift } from "lucide-react";

const SLICES = [
  { name: "Base Salary", value: 68, color: "#EAB308" },
  { name: "Bonuses", value: 11, color: "#22C55E" },
  { name: "Allowances", value: 9, color: "#3B82F6" },
  { name: "Benefits", value: 8, color: "#8B5CF6" },
  { name: "Overtime", value: 4, color: "#F97316" },
];

export default function HRCompensationBreakdown() {
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Compensation Breakdown" subtitle="How total compensation is distributed" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Total Comp Spend" value="GHS 5.12M" hint="Year to date" icon={<Banknote size={18} />} />
        <StatCard label="Bonus Pool" value="GHS 564k" icon={<Gift size={18} />} />
        <StatCard label="Categories" value={SLICES.length} icon={<PieIcon size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Distribution" subtitle="% of total compensation">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SLICES} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84} paddingAngle={2}>
                  {SLICES.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F3F0E2", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <div className="hensek-card">
          <h3 className="text-sm font-semibold text-hensek-dark mb-3">Category Detail</h3>
          <ul className="space-y-2.5">
            {SLICES.map((s) => (
              <li key={s.name} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-sm flex-1">{s.name}</span>
                <span className="text-sm font-semibold text-hensek-dark">{s.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
