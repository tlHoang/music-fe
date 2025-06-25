"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

interface UploadMusicResponse {
  _id: string;
  title: string;
  audioUrl: string;
  userId: string;
  visibility: string;
  duration: number;
  uploadDate: string;
}

interface Genre {
  _id: string;
  name: string;
  description?: string;
}

const UploadPage = () => {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [genresLoading, setGenresLoading] = useState(false);
  const [cover, setCover] = useState<File | null>(null);

  const [genreSearchQuery, setGenreSearchQuery] = useState("");
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

  const filteredGenres = availableGenres.filter(
    (genre) =>
      genre.name.toLowerCase().includes(genreSearchQuery.toLowerCase()) &&
      !selectedGenreIds.includes(genre._id)
  );

  // Fetch all available genres when the component mounts
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setGenresLoading(true);

        // Get auth token from session
        const token = session?.user?.access_token;
        if (!token) {
          console.warn("No auth token available");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/genres`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch genres");
        }

        const result = await response.json();
        // Extract genres from the data property in the response
        const genres = result.data || [];
        console.log("Fetched genres:", genres);
        setAvailableGenres(Array.isArray(genres) ? genres : []);
      } catch (error) {
        console.error("Error fetching genres:", error);
      } finally {
        setGenresLoading(false);
      }
    };

    // Only fetch genres when session is available
    if (session) {
      fetchGenres();
    }
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const MAX_COVER_SIZE_MB = 2; // 2MB limit

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > MAX_COVER_SIZE_MB * 1024 * 1024) {
        setMessage(`Cover image must be less than ${MAX_COVER_SIZE_MB}MB.`);
        setCover(null);
        // Optionally reset the input value
        e.target.value = "";
        return;
      }
      setCover(selected);
    }
  };

  const handleGenreChange = (genreId: string) => {
    setSelectedGenreIds((prevSelected) => {
      if (prevSelected.includes(genreId)) {
        return prevSelected.filter((id) => id !== genreId);
      } else {
        return [...prevSelected, genreId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title) {
      setMessage("Please provide a file and title.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);
    if (cover) formData.append("cover", cover);
    formData.append("title", title);
    formData.append("visibility", visibility);
    if (selectedGenreIds.length > 0) {
      selectedGenreIds.forEach((genreId) => {
        formData.append("genres", genreId);
      });
    }

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

      const data = await response.json();

      // Check for the new structured error format first
      if (
        data.success === false ||
        (data.data && data.data.success === false)
      ) {
        // Extract the error message from the nested structure
        const errorMessage = data.data ? data.data.message : data.message;
        setMessage(errorMessage || "Upload failed. Please try again.");
        setLoading(false);
        setTimeout(() => setProgress(0), 1000);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to upload music");
      }

      setMessage("Upload successful!");
      setTitle("");
      setVisibility("PUBLIC");
      setSelectedGenreIds([]);
      setFile(null);
      setCover(null);

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
              Genres (Optional)
            </label>
            {genresLoading ? (
              <p className="text-sm text-gray-500">Loading genres...</p>
            ) : (
              <div className="space-y-2">
                {/* Selected genres tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedGenreIds.length > 0 ? (
                    selectedGenreIds.map((id) => {
                      const genre = availableGenres.find((g) => g._id === id);
                      return genre ? (
                        <div
                          key={genre._id}
                          className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md flex items-center text-sm"
                        >
                          {genre.name}
                          <button
                            type="button"
                            onClick={() => handleGenreChange(genre._id)}
                            className="ml-1.5 text-indigo-600 hover:text-indigo-800"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : null;
                    })
                  ) : (
                    <div className="text-sm text-gray-500">
                      No genres selected
                    </div>
                  )}
                </div>

                {/* Search input and dropdown */}
                <div className="relative">
                  <Input
                    id="genre-search"
                    type="text"
                    value={genreSearchQuery}
                    onChange={(e) => {
                      setGenreSearchQuery(e.target.value);
                      if (!isGenreDropdownOpen) setIsGenreDropdownOpen(true);
                    }}
                    onFocus={() => setIsGenreDropdownOpen(true)}
                    placeholder="Search and select genres..."
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Dropdown for genre selection - moved inside input container for better positioning */}
                  {isGenreDropdownOpen && (
                    <div className="absolute left-0 right-0 z-10 mt-1 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {filteredGenres.length > 0 ? (
                        <ul className="max-h-48 overflow-y-auto">
                          {filteredGenres.map((genre) => (
                            <li
                              key={genre._id}
                              onClick={() => {
                                handleGenreChange(genre._id);
                                setGenreSearchQuery("");
                              }}
                              className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                            >
                              {genre.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          {genreSearchQuery
                            ? "No matching genres found"
                            : "No more genres available"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Click outside handler */}
                {isGenreDropdownOpen && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsGenreDropdownOpen(false)}
                  />
                )}
              </div>
            )}
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

          <div className="space-y-2">
            <label
              htmlFor="cover-input"
              className="block text-sm font-medium text-gray-700"
            >
              Cover Image (Optional, max 2MB)
            </label>
            <input
              id="cover-input"
              name="cover-input"
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {cover && (
              <p className="text-sm text-indigo-600 mt-2">
                Selected: {cover.name} (
                {(cover.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
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
