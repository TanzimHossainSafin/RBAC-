import { ResourcePanel } from "@/components/resource-panel";

export default function LeadsPage() {
  return <ResourcePanel title="Leads" endpoint="/leads" emptyMessage="No leads available for this account." />;
}
