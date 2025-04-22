"use client";

import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const UserHeader = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-100 shadow-md">
      {/* Logo */}
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
        <Link href="/player" className="hover:text-blue-600 font-medium">
          Player
        </Link>
        <Link href="/upload" className="hover:text-blue-600 font-medium">
          Upload
        </Link>
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
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-red-500 hover:text-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default UserHeader;
