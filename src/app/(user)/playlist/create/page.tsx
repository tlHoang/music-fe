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
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setSelectedCoverFile(file);
    }
  };

  const uploadCoverForPlaylist = async (
    playlistId: string,
    coverFile: File
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("cover", coverFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/cover`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload cover");
      }

      const result = await response.json();
      return result.coverUrl || result.data?.coverUrl || null;
    } catch (error) {
      console.error("Error uploading cover:", error);
      return null;
    }
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
          // If there's a cover file, upload it after playlist creation
          if (selectedCoverFile) {
            try {
              await uploadCoverForPlaylist(playlistId, selectedCoverFile);
              toast.success("Playlist created with cover successfully!");
            } catch (coverError) {
              // Playlist was created but cover upload failed
              toast.success(
                "Playlist created successfully! Cover upload failed - you can add it later."
              );
            }
          } else {
            toast.success("Playlist created successfully!");
          }

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
          {" "}
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
          </div>{" "}
          <div className="space-y-2">
            <Label>Playlist Cover (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Upload a cover image for your playlist
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                {selectedCoverFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {selectedCoverFile.name}
                  </p>
                )}
              </div>
            </div>
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
                <SelectItem value="PUBLIC">
                  Public - Anyone can listen
                </SelectItem>
                <SelectItem value="PRIVATE">
                  Private - Only you can listen
                </SelectItem>
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
