import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();
  console.log("session", session);

  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AdminLayout;
