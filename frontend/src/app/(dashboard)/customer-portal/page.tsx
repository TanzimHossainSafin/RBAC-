import { ResourcePanel } from "@/components/resource-panel";

export default function CustomerPortalPage() {
  return <ResourcePanel title="Customer Portal" endpoint="/customer-portal" emptyMessage="No customer records available." />;
}
