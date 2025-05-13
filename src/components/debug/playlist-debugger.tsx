"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SessionDebugger from "@/components/debug/session-debugger";
import DatabaseCheck from "@/components/debug/database-check";
import APIResponse from "@/components/debug/api-response";

export default function PlaylistDebugger() {
  const { data: session } = useSession();
  const [playlistId, setPlaylistId] = useState("");
  const [songId, setSongId] = useState("");

  const createTestPlaylist = async () => {
    if (!session?.user?.access_token) {
      alert("No access token found");
      return;
    }

    try {
      const name = `Test Playlist ${new Date().toISOString().substring(0, 19)}`;

      console.log("Creating test playlist:", {
        name,
        userId: session.user._id,
        token: session.user.access_token.substring(0, 10) + "...",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            visibility: "PUBLIC",
            userId: session.user._id,
          }),
        }
      );

      const responseText = await response.text();

      try {
        // Try to parse as JSON
        const result = JSON.parse(responseText);
        console.log("Create playlist result:", result);

        alert(
          `Playlist created! Response: ${JSON.stringify(result).substring(0, 100)}...`
        );
      } catch (e) {
        console.error("Failed to parse response:", responseText);
        alert(`Got non-JSON response: ${responseText.substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const fetchUserPlaylists = async () => {
    if (!session?.user?.access_token) {
      alert("No access token found");
      return;
    }

    try {
      console.log(
        "Fetching playlists with token:",
        session.user.access_token.substring(0, 10) + "..."
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/user`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await response.text();
      console.log("Raw response:", responseText.substring(0, 200) + "...");

      try {
        // Try to parse as JSON
        const result = JSON.parse(responseText);
        console.log("Playlists response:", result);

        // Extract playlists from nested structure
        let playlists = [];
        if (
          result.statusCode === 200 &&
          result.data &&
          result.data.success &&
          Array.isArray(result.data.data)
        ) {
          playlists = result.data.data;
        } else if (result.success && Array.isArray(result.data)) {
          playlists = result.data;
        } else if (Array.isArray(result)) {
          playlists = result;
        } else if (result.data && Array.isArray(result.data)) {
          playlists = result.data;
        }

        alert(`Found ${playlists.length} playlists. See console for details.`);
      } catch (e) {
        console.error("Failed to parse response:", e);
        alert(`Got non-JSON response: ${responseText.substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.error("Error fetching playlists:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const addSongToPlaylist = async () => {
    if (!session?.user?.access_token || !playlistId || !songId) {
      alert("Missing required data: token, playlist ID, or song ID");
      return;
    }

    try {
      console.log("Adding song to playlist:", {
        playlistId,
        songId,
        tokenPreview: session.user.access_token.substring(0, 10) + "...",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs/${songId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      try {
        // Try to parse as JSON
        const result = JSON.parse(responseText);
        console.log("Add song response:", result);

        alert(
          `Result: ${JSON.stringify(result, null, 2).substring(0, 200)}...`
        );
      } catch (e) {
        console.error("Failed to parse response:", e);
        alert(`Got non-JSON response: ${responseText.substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.error("Error adding song to playlist:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const checkPlaylistDetails = async () => {
    if (!session?.user?.access_token || !playlistId) {
      alert("Missing required data: token or playlist ID");
      return;
    }

    try {
      console.log("Checking playlist details:", {
        playlistId,
        tokenPreview: session.user.access_token.substring(0, 10) + "...",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      try {
        // Try to parse as JSON
        const result = JSON.parse(responseText);
        console.log("Playlist details:", result);

        if (result.success && result.data) {
          const playlist = result.data;
          console.log("Songs in playlist:", playlist.songs);

          if (playlist.songs && playlist.songs.length > 0) {
            console.log("First song details:", playlist.songs[0]);
          }

          alert(
            `Found playlist "${playlist.name}" with ${playlist.songs?.length || 0} songs. See console for details.`
          );
        } else {
          alert(
            `Could not find playlist. Response: ${JSON.stringify(result).substring(0, 100)}...`
          );
        }
      } catch (e) {
        console.error("Failed to parse response:", e);
        alert(`Got non-JSON response: ${responseText.substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.error("Error checking playlist details:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const debugPlaylist = async () => {
    if (!session?.user?.access_token || !playlistId) {
      alert("Missing required data: token or playlist ID");
      return;
    }

    try {
      console.log("Debugging playlist:", playlistId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/debug`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Debug results:", data);

      if (data.success) {
        const stats = data.data.songStats;
        alert(
          `Playlist Debug Results:\n` +
            `Total songs: ${stats.total}\n` +
            `Valid IDs: ${stats.validIds}\n` +
            `Invalid IDs: ${stats.invalidIds}\n\n` +
            `See console for full details.`
        );
      } else {
        alert(`Debug failed: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error debugging playlist:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const fixPlaylist = async () => {
    if (!session?.user?.access_token || !playlistId) {
      alert("Missing required data: token or playlist ID");
      return;
    }

    try {
      console.log("Fixing playlist:", playlistId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/fix-songs`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Fix results:", data);

      if (data.success) {
        alert(
          `Playlist Fix Results:\n` +
            `Removed ${data.data.removedCount} invalid references\n` +
            `Original count: ${data.data.originalCount}\n` +
            `New count: ${data.data.newCount}\n`
        );
      } else {
        alert(`Fix failed: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error fixing playlist:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4">Playlist Debugger</h2>

      <div className="flex space-x-4 mb-6">
        <Button
          variant="outline"
          onClick={createTestPlaylist}
          className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
        >
          Create Test Playlist
        </Button>

        <Button
          variant="outline"
          onClick={fetchUserPlaylists}
          className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
        >
          Fetch User Playlists
        </Button>
      </div>

      <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-3">Debug Playlists</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Add Song To Playlist
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="Playlist ID"
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                />
                <Input
                  placeholder="Song ID"
                  value={songId}
                  onChange={(e) => setSongId(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={addSongToPlaylist}
                  disabled={!playlistId || !songId}
                >
                  Add Song
                </Button>
              </div>
            </div>

            <div>
              {" "}
              <p className="text-sm text-muted-foreground mb-2">
                Check Playlist Details
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="Playlist ID"
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={checkPlaylistDetails}
                    disabled={!playlistId}
                  >
                    Check Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={debugPlaylist}
                    disabled={!playlistId}
                  >
                    Debug
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={fixPlaylist}
                    disabled={!playlistId}
                  >
                    Fix Playlist
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="session">
        <TabsList className="mb-2">
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        <TabsContent value="session">
          <SessionDebugger />
        </TabsContent>
        <TabsContent value="database">
          <DatabaseCheck />
        </TabsContent>
        <TabsContent value="api">
          <APIResponse />
        </TabsContent>
      </Tabs>
    </div>
  );
}
