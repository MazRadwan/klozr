import ContactsPanel from "../ContactsPanel";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";

export default function ContactsPage() {
  return (
    <ClientDashboardLayout>
      <div className="p-4 sm:p-8">
        {/* Future: Add filters, search, and action buttons here */}
        <ContactsPanel />
      </div>
    </ClientDashboardLayout>
  );
}
