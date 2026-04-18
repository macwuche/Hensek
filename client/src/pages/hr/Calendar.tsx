import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalEvent {
  date: number;
  label: string;
  tone: "yellow" | "green" | "blue";
}

const EVENTS: CalEvent[] = [
  { date: 5, label: "All-hands", tone: "yellow" },
  { date: 12, label: "Reviews", tone: "blue" },
  { date: 18, label: "Payroll cutoff", tone: "green" },
  { date: 22, label: "Onboarding", tone: "yellow" },
  { date: 27, label: "Town Hall", tone: "blue" },
];

const TONE: Record<string, string> = {
  yellow: "bg-hensek-yellow text-hensek-dark",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
};

export default function HRCalendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const baseMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = baseMonth.toLocaleString("en-GB", { month: "long", year: "numeric" });
  const daysInMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = (baseMonth.getDay() + 6) % 7; // Mon-first

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Calendar"
        subtitle="Upcoming HR events and deadlines"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="w-8 h-8 rounded-lg bg-white border border-border hover:bg-hensek-cream flex items-center justify-center"><ChevronLeft size={14} /></button>
            <span className="text-sm font-medium text-hensek-dark min-w-[140px] text-center">{monthName}</span>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="w-8 h-8 rounded-lg bg-white border border-border hover:bg-hensek-cream flex items-center justify-center"><ChevronRight size={14} /></button>
          </div>
        }
      />
      <div className="hensek-card">
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-[11px] text-gray-500 font-semibold uppercase">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            const ev = d ? EVENTS.find((e) => e.date === d) : undefined;
            const isToday = d === today.getDate() && monthOffset === 0;
            return (
              <div key={i} className={cn(
                "aspect-square rounded-xl border p-2 flex flex-col text-xs",
                d ? "bg-white border-border" : "bg-transparent border-transparent",
                isToday && "border-hensek-yellow ring-2 ring-hensek-yellow/30",
              )}>
                {d && <span className={cn("font-semibold", isToday ? "text-hensek-dark" : "text-gray-600")}>{d}</span>}
                {ev && (
                  <span className={cn("mt-auto text-[10px] px-1.5 py-0.5 rounded-md truncate", TONE[ev.tone])}>{ev.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
