"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CreatePlaylistPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    visibility: "PUBLIC",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVisibilityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, visibility: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.access_token) {
      toast.error("You must be logged in to create a playlist");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please provide a playlist name");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            visibility: formData.visibility,
            userId: session.user._id, // Add the userId from the session
          }),
        }
      );

      const data = await response.json();
      console.log("Create playlist response:", data); // For debugging

      // Check for different response formats
      if (response.ok) {
        let playlistId;
        
        // Handle direct _id return format
        if (data._id) {
          playlistId = data._id;
        } 
        // Handle nested data structure format
        else if (data.data && data.data._id) {
          playlistId = data.data._id;
        }
        // Handle nested success.data format
        else if (data.success && data.success.data && data.success.data._id) {
          playlistId = data.success.data._id;
        }
        
        if (playlistId) {
          toast.success("Playlist created successfully!");
          router.push(`/playlist/${playlistId}`);
          return;
        }
      }
      
      // If we got here, something went wrong
      throw new Error(data.message || "Failed to create playlist");
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Playlist</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="My Awesome Playlist"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={handleVisibilityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public - Anyone can listen</SelectItem>
                <SelectItem value="PRIVATE">Private - Only you can listen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}