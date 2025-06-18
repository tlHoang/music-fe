"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";

interface PlaylistCoverUploadProps {
  playlistId: string;
  currentCover?: string;
  onUploadSuccess?: (newCoverUrl: string) => void;
}

export default function PlaylistCoverUpload({
  playlistId,
  currentCover,
  onUploadSuccess,
}: PlaylistCoverUploadProps) {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

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

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user?.access_token) {
      toast.error("Please select a file and ensure you are logged in");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("cover", selectedFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/cover`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload cover");
      }

      const result = await response.json();

      if (result.statusCode === 200 && result.data) {
        toast.success("Cover uploaded successfully!");
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "cover-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        if (onUploadSuccess) {
          onUploadSuccess(result.data.cover);
        }
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast.error("Failed to upload cover");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="cover-input" className="block text-sm font-medium">
          Playlist Cover
        </label>

        {currentCover && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Current cover:</p>
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
              <img
                src={currentCover}
                alt="Current playlist cover"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <Input
          id="cover-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
        />

        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected: {selectedFile.name} (
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
          </div>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Upload Cover
          </>
        )}
      </Button>
    </div>
  );
}
