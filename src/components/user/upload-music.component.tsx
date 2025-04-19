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
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);
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
      console.log(data);
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
          <label>File:</label>
          <input type="file" onChange={handleFileChange} required />
        </div>
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadMusic;
