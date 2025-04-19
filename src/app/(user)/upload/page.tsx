"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface UploadMusicResponse {
  _id: string;
  title: string;
  audioUrl: string;
  userId: string;
  visibility: string;
  duration: number;
  uploadDate: string;
}

const UploadPage = () => {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [genre, setGenre] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title) {
      setMessage("Please provide a file and title.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("visibility", visibility);
    if (genre) formData.append("genre", genre);

    try {
      setLoading(true);
      setProgress(10);

      const token = session?.user?.access_token;
      if (!token) {
        setMessage("You must be logged in to upload music.");
        setLoading(false);
        return;
      }

      // Simulate progress during upload for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/upload-with-data`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error("Failed to upload music");
      }

      const data: UploadMusicResponse = await response.json();
      setMessage("Upload successful!");
      setTitle("");
      setVisibility("PUBLIC");
      setGenre("");
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Upload New Track</h1>
        <Link href="/profile/my-music">
          <Button variant="outline">Back to My Tracks</Button>
        </Link>
      </div>

      {message && (
        <div
          className={cn(
            "px-4 py-3 rounded mb-6 text-sm",
            message.includes("successful")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          )}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Track Title*
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your track a name"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="visibility"
              className="block text-sm font-medium text-gray-700"
            >
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="PUBLIC">Public - Anyone can listen</option>
              <option value="PRIVATE">Private - Only you can listen</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="genre"
              className="block text-sm font-medium text-gray-700"
            >
              Genre (Optional)
            </label>
            <Input
              id="genre"
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Rock, Electronic, Hip-Hop"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="file-input"
              className="block text-sm font-medium text-gray-700"
            >
              Audio File* (MP3, WAV)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-input"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-input"
                      name="file-input"
                      type="file"
                      accept="audio/mp3,audio/wav"
                      className="sr-only"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">MP3 or WAV up to 50MB</p>
                {file && (
                  <p className="text-sm text-indigo-600 mt-2">
                    Selected: {file.name} (
                    {(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </div>

          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? "Uploading..." : "Upload Track"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
