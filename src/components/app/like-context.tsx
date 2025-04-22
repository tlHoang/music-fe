"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type LikesState = {
  [songId: string]: boolean;
};

type LikeContextType = {
  likedSongs: LikesState;
  setLikeStatus: (songId: string, isLiked: boolean) => void;
  isLiked: (songId: string) => boolean;
};

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export function LikeProvider({ children }: { children: ReactNode }) {
  const [likedSongs, setLikedSongs] = useState<LikesState>({});

  // Function to update the like status for a specific song
  const setLikeStatus = (songId: string, isLiked: boolean) => {
    setLikedSongs((prev) => ({
      ...prev,
      [songId]: isLiked,
    }));
  };

  // Function to check if a song is liked
  const isLiked = (songId: string) => {
    return !!likedSongs[songId];
  };

  return (
    <LikeContext.Provider value={{ likedSongs, setLikeStatus, isLiked }}>
      {children}
    </LikeContext.Provider>
  );
}

export const useLike = () => {
  const context = useContext(LikeContext);
  if (context === undefined) {
    throw new Error("useLike must be used within a LikeProvider");
  }
  return context;
};
