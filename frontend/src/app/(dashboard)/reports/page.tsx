import { ResourcePanel } from "@/components/resource-panel";

export default function ReportsPage() {
  return <ResourcePanel title="Reports" endpoint="/reports" emptyMessage="No reports available for this account." />;
}
