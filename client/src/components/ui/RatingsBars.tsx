interface Rating {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

interface RatingsBarsProps {
  items: Rating[];
}

export default function RatingsBars({ items }: RatingsBarsProps) {
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const max = it.max ?? 100;
        const pct = Math.max(0, Math.min(100, (it.value / max) * 100));
        return (
          <li key={it.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">{it.label}</span>
              <span className="font-semibold text-hensek-dark">{it.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-hensek-warm overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: it.color ?? "#EAB308" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
