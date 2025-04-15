"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";

const UserProfilePage = () => {
  const [userData, setUserData] = useState<IUser | undefined>(undefined);
  const [userSongs, setUserSongs] = useState<ISong[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<IPlaylist[]>([]);

  const { data: session } = useSession();
  console.log("Session data:", session);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = session?.user?._id;
        const userResponse = await sendRequest<IBackendRes<IUser>>({
          url: `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          method: "GET",
        });
        setUserData(userResponse.data);
        console.log("User data:", userResponse.data);

        const songsPlaylistsResponse = await sendRequest<
          IBackendRes<ISongsAndPlaylists>
        >({
          url: `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/songs-playlists`,
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          method: "GET",
        });
        setUserSongs(songsPlaylistsResponse.data?.songs || []);
        setUserPlaylists(songsPlaylistsResponse.data?.playlists || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div></div>;
  }

  return (
    <div className={cn("profile-page", "p-6 bg-gray-100 min-h-screen")}>
      {" "}
      {/* Add padding and background */}
      <header
        className={cn("profile-header", "flex items-center space-x-4 mb-6")}
      >
        {" "}
        {/* Flex layout for header */}
        <img
          src={userData.profilePicture || "/default-profile.jpg"} // Placeholder for profile picture
          alt="User Profile"
          className={cn(
            "profile-picture",
            "w-24 h-24 rounded-full border border-gray-300"
          )}
        />
        <div>
          <h1
            className={cn("profile-name", "text-2xl font-bold text-gray-800")}
          >
            {userData.name || userData.email}
          </h1>
          <p className={cn("profile-bio", "text-gray-600")}>{userData.bio}</p>
        </div>
      </header>
      <section className={cn("uploaded-songs", "mb-6")}>
        {" "}
        {/* Section styling */}
        <h2 className={cn("text-xl font-semibold text-gray-800 mb-4")}>
          Uploaded Songs
        </h2>
        <ul className={cn("space-y-2")}>
          {" "}
          {/* Add spacing between list items */}
          {userSongs.map((song) => (
            <li key={song._id} className={cn("p-4 bg-white rounded shadow-sm")}>
              {song.title}
            </li>
          ))}
        </ul>
      </section>
      <section className={cn("user-playlists")}>
        <h2 className={cn("text-xl font-semibold text-gray-800 mb-4")}>
          Playlists
        </h2>
        <ul className={cn("space-y-2")}>
          {" "}
          {/* Add spacing between list items */}
          {userPlaylists.map((playlist) => (
            <li
              key={playlist._id}
              className={cn("p-4 bg-white rounded shadow-sm")}
            >
              {playlist.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default UserProfilePage;
