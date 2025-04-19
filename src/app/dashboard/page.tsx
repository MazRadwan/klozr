import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ClientDashboard from "./ClientDashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  return <ClientDashboard />;
}
