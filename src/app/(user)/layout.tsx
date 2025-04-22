import { auth } from "@/auth";
import UserHeader from "@/components/user/header.component";
import { SessionProvider } from "next-auth/react";
import { PlayerProvider } from "@/components/app/player-context";
import { LikeProvider } from "@/components/app/like-context";
import PersistentPlayer from "@/components/user/persistent-player";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();
  console.log("session", session);

  return (
    <SessionProvider session={session}>
      <PlayerProvider>
        <LikeProvider>
          <div className="flex flex-col min-h-screen">
            <UserHeader />
            <main className="flex-grow pb-16">{children}</main>
            <PersistentPlayer />
          </div>
        </LikeProvider>
      </PlayerProvider>
    </SessionProvider>
  );
};

export default AdminLayout;
