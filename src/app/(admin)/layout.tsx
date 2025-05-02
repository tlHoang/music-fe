import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated and has ADMIN role
  // This is a strict check - only users with exact role "ADMIN" can access
  if (!session?.user || session.user.role !== "ADMIN") {
    console.log("Access denied: User doesn't have ADMIN role");
    redirect("/");
  }

  return <>{children}</>;
}
