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

      {/* Search Bar */}
      {/* <div className="flex items-center space-x-2">
        <Input placeholder="Search for music..." className="w-64" />
        <Button>Search</Button>
      </div> */}

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <Link href="/player" className="hover:text-blue-600">
          Player
        </Link>
        <Link href="/profile" className="hover:text-blue-600">
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
