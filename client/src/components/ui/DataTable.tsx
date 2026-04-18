import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({ columns, rows, rowKey, empty, loading, onRowClick }: DataTableProps<T>) {
  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading…</div>;
  }
  if (!rows.length) {
    return <div className="py-12 text-center text-sm text-gray-500">{empty ?? "No records"}</div>;
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-border">
            {columns.map((c) => (
              <th key={c.key} className={cn("py-2.5 px-3 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-border/40 last:border-0",
                onRowClick && "cursor-pointer hover:bg-hensek-cream/50",
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("py-3 px-3 align-middle text-hensek-dark", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
