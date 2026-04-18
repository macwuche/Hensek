import PageHeader from "./PageHeader";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PlaceholderPage({ title, subtitle, children }: PlaceholderPageProps) {
  return (
    <div className="hensek-page-shell">
      <PageHeader title={title} subtitle={subtitle} />
      {children ?? (
        <div className="hensek-card">
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-hensek-yellow/15 flex items-center justify-center text-hensek-dark">
              <Construction size={22} />
            </div>
            <h3 className="text-base font-semibold text-hensek-dark">{title} — coming soon</h3>
            <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
              This section is part of the new HR workspace. Live data wiring is on the roadmap; for now you can preview the layout and navigation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
