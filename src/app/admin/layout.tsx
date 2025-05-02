import { auth, signOut } from "@/auth";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();
  console.log("session", session);

  // Check if user is authenticated and has ADMIN role
  // This is a strict check - only users with exact role "ADMIN" can access
  if (!session?.user) {
    console.log("Access denied: No user session found");
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    console.log(
      "Access denied: User has role",
      session.user.role,
      "but needs ADMIN role"
    );
    redirect("/");
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-gray-100">
        {/* Admin Sidebar */}
        <div className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="p-4 font-bold text-xl">Sound Admin</div>
          <nav className="mt-6 flex-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Users
            </Link>
            <Link
              href="/admin/tracks"
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              Tracks
            </Link>
            <Link
              href="/admin/playlists"
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Playlists
            </Link>
            <Link
              href="/admin/activity"
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Activity
            </Link>
          </nav>

          {/* Logout Button */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-auto mb-6"
          >
            <button
              type="submit"
              className="flex items-center px-6 py-3 w-full text-left text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0011 2H4a1 1 0 00-1 1zm9 4a1 1 0 00-1-1H8a1 1 0 00-1 1v8a1 1 0 001 1h3a1 1 0 001-1V7z"
                  clipRule="evenodd"
                />
                <path d="M7 10.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zm-1-3a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-1z" />
              </svg>
              Logout
            </button>
          </form>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow">
            <div className="px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <div className="flex items-center">
                {session?.user?.name && (
                  <span className="mr-4 text-gray-600">
                    Welcome, {session.user.name}
                  </span>
                )}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                  className="inline-block"
                >
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
};

export default AdminLayout;
