"use client";

import React from "react";
import { useSession } from "next-auth/react";

export default function SessionDebugger() {
  const { data: session, status } = useSession();

  return (
    <div className="p-4 mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Session Debugger</h3>
      <p className="mb-2">
        Status: <span className="font-mono">{status}</span>
      </p>

      {session ? (
        <div>
          <p className="mb-1">
            User ID:{" "}
            <span className="font-mono">{session.user?._id || "N/A"}</span>
          </p>
          <p className="mb-1">
            Email:{" "}
            <span className="font-mono">{session.user?.email || "N/A"}</span>
          </p>
          <p className="mb-1">
            Role:{" "}
            <span className="font-mono">{session.user?.role || "N/A"}</span>
          </p>
          <p className="mb-1">
            Token:{" "}
            <span className="font-mono">
              {session.user?.access_token
                ? `${session.user.access_token.substring(0, 20)}...`
                : "No token"}
            </span>
          </p>
          <p className="mb-1">
            Token Length:{" "}
            <span className="font-mono">
              {session.user?.access_token?.length || 0} characters
            </span>
          </p>
        </div>
      ) : (
        <p>No active session</p>
      )}
    </div>
  );
}
