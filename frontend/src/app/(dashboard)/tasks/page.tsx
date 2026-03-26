import { ResourcePanel } from "@/components/resource-panel";

export default function TasksPage() {
  return <ResourcePanel title="Tasks" endpoint="/tasks" emptyMessage="No tasks available for this account." />;
}
