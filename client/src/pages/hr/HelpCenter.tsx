import PageHeader from "@/components/ui/PageHeader";
import { LifeBuoy, BookOpen, Mail } from "lucide-react";

const TOPICS = [
  { title: "Approving new staff accounts", desc: "How to review and approve pending registrations." },
  { title: "Publishing announcements", desc: "Send updates to one or more roles, including urgent flags." },
  { title: "Reviewing applications", desc: "Approve, reject, or escalate staff applications to MD." },
  { title: "Managing departments", desc: "Create departments and view staff counts per department." },
  { title: "Running payroll", desc: "Cycle cutoffs, gross/net calculations and historical runs." },
  { title: "Hiring workflow", desc: "Track open roles, applicants, and time-to-hire metrics." },
];

export default function HRHelpCenter() {
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Help & Center" subtitle="Guides, FAQs and support" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <a href="mailto:support@hensek.com" className="hensek-card flex items-center gap-3 hover:bg-hensek-cream/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-hensek-yellow/15 text-hensek-dark flex items-center justify-center"><Mail size={18} /></div>
          <div>
            <p className="text-sm font-semibold">Contact Support</p>
            <p className="text-xs text-gray-500">support@hensek.com</p>
          </div>
        </a>
        <div className="hensek-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hensek-yellow/15 text-hensek-dark flex items-center justify-center"><BookOpen size={18} /></div>
          <div>
            <p className="text-sm font-semibold">Documentation</p>
            <p className="text-xs text-gray-500">Guides & how-to articles</p>
          </div>
        </div>
        <div className="hensek-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hensek-yellow/15 text-hensek-dark flex items-center justify-center"><LifeBuoy size={18} /></div>
          <div>
            <p className="text-sm font-semibold">System Status</p>
            <p className="text-xs text-gray-500">All services operational</p>
          </div>
        </div>
      </div>

      <div className="hensek-card">
        <h3 className="text-sm font-semibold text-hensek-dark mb-3">Popular topics</h3>
        <ul className="divide-y divide-border/50">
          {TOPICS.map((t) => (
            <li key={t.title} className="py-3">
              <p className="font-medium text-sm text-hensek-dark">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
