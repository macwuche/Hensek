import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/hooks/useAuth";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hensek-card">
      <h3 className="text-sm font-semibold text-hensek-dark mb-3">{title}</h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-hensek-dark font-medium">{value}</span>
    </div>
  );
}

export default function HRSettings() {
  const { user } = useAuth();
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Settings" subtitle="HR workspace preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Profile">
          <Row label="Name" value={user?.name ?? "—"} />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Role" value={user?.role.toUpperCase() ?? "—"} />
          <Row label="Employee ID" value={user?.employeeId ?? "—"} />
        </Section>
        <Section title="Notifications">
          <Row label="New applications" value={<span className="hensek-badge hensek-badge-green">On</span>} />
          <Row label="Pending approvals" value={<span className="hensek-badge hensek-badge-green">On</span>} />
          <Row label="Daily digest" value={<span className="hensek-badge hensek-badge-gray">Off</span>} />
          <Row label="SMS alerts" value={<span className="hensek-badge hensek-badge-gray">Off</span>} />
        </Section>
        <Section title="Workspace">
          <Row label="Time zone" value="Africa/Accra (GMT)" />
          <Row label="Locale" value="en-GB" />
          <Row label="Default dashboard" value="HR Overview" />
        </Section>
        <Section title="Security">
          <Row label="Two-factor auth" value={<span className="hensek-badge hensek-badge-gray">Off</span>} />
          <Row label="Active sessions" value="1" />
          <Row label="Last sign-in" value="Today" />
        </Section>
      </div>
    </div>
  );
}
