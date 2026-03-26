import { ResourcePanel } from "@/components/resource-panel";

export default function AuditLogPage() {
  return <ResourcePanel title="Audit Log" endpoint="/audit-logs" emptyMessage="No audit activity recorded yet." />;
}
