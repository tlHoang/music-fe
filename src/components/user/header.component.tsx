"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";

const UserHeader = () => {
  const { data: session, status } = useSession();
  // Subscription status state
  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await sendRequest<any>({
          url: "http://localhost:8888/subscriptions/stats",
          method: "GET",
          headers: session?.user?.access_token
            ? { Authorization: `Bearer ${session.user.access_token}` }
            : {},
        });

        if (response.data) {
          setSubscription(response.data.subscription || response.data);
        }
      } catch (e) {
        setSubscription(null);
      } finally {
        setSubLoading(false);
      }
    }
    fetchSubscription();
  }, [session]);

  // Hide header if not logged in
  if (!session) return null;

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-100 shadow-md gap-2 md:gap-0">
      <div className="text-xl font-bold">
        <Link href="/homepage">Music Platform</Link>
      </div>
      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-6">
        <Link href="/homepage/feed" className="hover:text-blue-600 font-medium">
          Feed
        </Link>
        <Link href="/discover" className="hover:text-blue-600 font-medium">
          Discover
        </Link>
        <Link
          href="/playlists/followed"
          className="hover:text-blue-600 font-medium"
        >
          Followed Playlists
        </Link>
        <Link href="/player" className="hover:text-blue-600 font-medium">
          Player
        </Link>
        <Link href="/upload" className="hover:text-blue-600 font-medium">
          Upload
        </Link>
      </div>{" "}
      {/* Subscription Plan */}
      <div className="flex items-center space-x-2 mb-2 md:mb-0">
        {subLoading ? (
          <span className="text-gray-500 text-xs">Loading subscription...</span>
        ) : subscription ? (
          <>
            <span className="text-xs text-gray-700 dark:text-gray-200">
              <b>Plan:</b> {subscription.plan}
            </span>
            <Link href="/pricing">
              <Button size="sm" variant="secondary">
                Upgrade
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="sm" variant="outline">
                Pricing
              </Button>
            </Link>
          </>
        ) : (
          <span className="text-red-500 text-xs">No subscription info</span>
        )}
      </div>
      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <Link href="/profile/my-music" className="hover:text-blue-600">
          My Music
        </Link>
        <Link
          href={`/profile/${process.env.NEXT_PUBLIC_USER_ID || ""}`}
          className="hover:text-blue-600"
        >
          Profile
        </Link>
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="text-red-500 hover:text-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default UserHeader;
