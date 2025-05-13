"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function APIResponse() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testAPIResponse = async () => {
    if (!token) {
      setError("Please enter an authentication token");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/playlists/user`;
      console.log("Testing API endpoint:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      try {
        // Try to parse as JSON
        const responseData = JSON.parse(responseText);
        console.log("API Response:", responseData);
        setResponse(responseData);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        setResponse({
          rawText: responseText,
          parseError: String(parseError),
        });
      }
    } catch (error: any) {
      console.error("Error testing API:", error);
      setError(`API request failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Format the response for display
  const formatResponse = (data: any): string => {
    return JSON.stringify(data, null, 2);
  };

  // Create a visualization of the response structure
  const visualizeStructure = (data: any) => {
    if (!data) return null;

    const renderObject = (obj: any, level = 0, path = "") => {
      const indent = "  ".repeat(level);

      return (
        <div className="ml-4">
          {Object.entries(obj).map(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            const valueType = Array.isArray(value) ? "array" : typeof value;

            return (
              <div key={currentPath} className="my-1">
                <span className="font-medium text-blue-500">{key}</span>:
                <span className="ml-2 text-gray-500">{valueType}</span>
                {value !== null && typeof value === "object" ? (
                  renderObject(value, level + 1, currentPath)
                ) : (
                  <span className="ml-2 text-green-600">
                    {value === null ? "null" : String(value).substring(0, 50)}
                    {typeof value === "string" && value.length > 50
                      ? "..."
                      : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="mt-4 p-4 border rounded bg-gray-50 dark:bg-gray-900 overflow-auto">
        <h3 className="font-bold mb-2">Response Structure</h3>
        {typeof data === "object" && data !== null
          ? renderObject(data)
          : String(data)}
      </div>
    );
  };

  return (
    <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-semibold mb-2">API Response Debugger</h3>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">
          Authentication Token
        </label>
        <Input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your auth token here"
          className="w-full mb-2"
        />

        <Button onClick={testAPIResponse} disabled={loading} className="mt-2">
          {loading ? "Testing..." : "Test API Response"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {response && (
        <>
          {visualizeStructure(response)}

          <div className="mt-4">
            <h3 className="font-bold mb-2">Raw JSON</h3>
            <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
              {formatResponse(response)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
