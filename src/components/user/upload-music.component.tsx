// This component is deprecated and no longer used. All upload logic is now handled in the /upload route page.
// You can safely delete this file.

import React, { useState } from "react";
import { useSession } from "next-auth/react";

interface UploadMusicResponse {
  data: {
    url: string;
    message: string;
  };
}

const UploadMusic = () => {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);
  };

  const handleCoverChange = (e: any) => {
    setCover(e.target.files[0]);
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

    try {
      const token = session?.user?.access_token;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/upload-with-data`,
        {
          method: "POST",
          headers: {
            Content: "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload music");
      }

      const data: UploadMusicResponse = await response.json();
      setMessage("Upload successful!");
      // console.log(data);
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Upload failed. Please try again.");
    }
  };

  return (
    <div>
      <h1>Upload Music</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Visibility:</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
        <div>
          <label>Audio File:</label>
          <input type="file" onChange={handleFileChange} required />
        </div>
        <div>
          <label>Cover Image:</label>
          <input type="file" accept="image/*" onChange={handleCoverChange} />
        </div>
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadMusic;
