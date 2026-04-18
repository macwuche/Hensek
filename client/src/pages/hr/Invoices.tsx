import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DataTable, { Column } from "@/components/ui/DataTable";
import { Receipt, FileCheck, Clock } from "lucide-react";
import { capitalize, getStatusColor } from "@/lib/utils";

interface Invoice {
  id: string;
  vendor: string;
  amount: string;
  due: string;
  status: string;
}

const INVOICES: Invoice[] = [
  { id: "INV-3041", vendor: "Acme PPE Supplies", amount: "GHS 14,200", due: "Apr 24, 2026", status: "pending" },
  { id: "INV-3040", vendor: "Sunbeam Cleaning", amount: "GHS 6,800", due: "Apr 21, 2026", status: "approved" },
  { id: "INV-3039", vendor: "Vault Cyber Security", amount: "GHS 22,900", due: "Apr 30, 2026", status: "pending" },
  { id: "INV-3038", vendor: "BlueRock Insurance", amount: "GHS 41,400", due: "Apr 14, 2026", status: "approved" },
  { id: "INV-3037", vendor: "Shore Logistics", amount: "GHS 9,520", due: "Apr 09, 2026", status: "rejected" },
];

export default function HRInvoices() {
  const cols: Column<Invoice>[] = [
    { key: "i", header: "Invoice", render: (r) => <span className="font-medium">{r.id}</span> },
    { key: "v", header: "Vendor", render: (r) => <span className="text-xs text-gray-600">{r.vendor}</span> },
    { key: "a", header: "Amount", render: (r) => <span className="text-xs font-semibold">{r.amount}</span>, className: "hidden sm:table-cell" },
    { key: "d", header: "Due", render: (r) => <span className="text-xs text-gray-500">{r.due}</span>, className: "hidden md:table-cell" },
    { key: "s", header: "Status", render: (r) => <span className={`hensek-badge ${getStatusColor(r.status)}`}>{capitalize(r.status)}</span> },
  ];
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Invoices" subtitle="Vendor invoices awaiting review" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Open Invoices" value={3} hint="Awaiting decision" icon={<Receipt size={18} />} />
        <StatCard label="Approved (MTD)" value="GHS 48,200" icon={<FileCheck size={18} />} />
        <StatCard label="Avg Cycle Time" value="2.3d" hint="Submission → approval" icon={<Clock size={18} />} />
      </div>
      <div className="hensek-card">
        <DataTable columns={cols} rows={INVOICES} rowKey={(r) => r.id} />
      </div>
    </div>
  );
}
