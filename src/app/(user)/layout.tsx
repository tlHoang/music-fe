import { auth } from "@/auth";
import UserHeader from "@/components/user/header.component";
import { SessionProvider } from "next-auth/react";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();
  console.log("session", session);

  return (
    <SessionProvider session={session}>
      <UserHeader />
      {children}
    </SessionProvider>
  );
};

export default AdminLayout;
