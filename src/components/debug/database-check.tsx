"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DirectDatabaseCheck() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Make a direct API call to check the database connection
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/system-check`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 mb-6 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <h3 className="text-lg font-semibold mb-2">Database Connection Check</h3>
      <Button onClick={checkDatabase} disabled={loading} className="mb-4">
        {loading ? "Checking..." : "Check Database Connection"}
      </Button>

      {result && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <pre className="whitespace-pre-wrap break-words text-xs">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
