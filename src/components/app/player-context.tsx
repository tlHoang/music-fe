"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  artist?: string;
  coverImage?: string;
  visibility?: string;
  duration?: number;
  uploadDate?: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  playlist: Track[];
  setPlaylist: (tracks: Track[]) => void;
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
  audioElement: HTMLAudioElement | null;
  isSeeking: boolean;
  setIsSeeking: (isSeeking: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const playbackOperationRef = useRef<Promise<void> | null>(null);
  const lastActionTimestampRef = useRef<number>(0);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // Set up event listeners
      audioRef.current.addEventListener("ended", handleTrackEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleTrackEnded);
      }
    };
  }, []);

  // Ensure the audio URL is complete with the API base URL if needed
  const getFullAudioUrl = (url: string) => {
    if (!url) return "";

    try {
      // Check if it's already a fully-formed URL with our proxy
      if (url.startsWith("/api/audio?url=")) {
        return url;
      }

      // Otherwise, build the proxy URL properly
      return `/api/audio?url=${encodeURIComponent(url)}`;
    } catch (e) {
      console.error("Error formatting audio URL:", e);
      return "";
    }
  };

  // Safe play function that handles race conditions
  const safePlayAudio = async () => {
    if (!audioRef.current) return;

    // Prevent rapid fire play/pause requests
    const now = Date.now();
    if (now - lastActionTimestampRef.current < 300) {
      return;
    }
    lastActionTimestampRef.current = now;

    try {
      // Cancel any pending playback operation
      if (playbackOperationRef.current) {
        // We can't actually cancel the Promise, but we can track that we've moved on
        playbackOperationRef.current = null;
      }

      // Create a new playback operation
      const playPromise = audioRef.current.play();
      playbackOperationRef.current = playPromise;

      // Wait for it to complete
      await playPromise;

      // Only update state if this was the most recent operation
      if (playbackOperationRef.current === playPromise) {
        playbackOperationRef.current = null;
      }
    } catch (error: any) {
      // Handle errors only if they're not related to interruption
      if (
        error.name !== "AbortError" &&
        error.message !==
          "The play() request was interrupted by a call to pause()."
      ) {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      }
    }
  };

  // Safe pause function that handles race conditions
  const safePauseAudio = () => {
    if (!audioRef.current) return;

    // Prevent rapid fire play/pause requests
    const now = Date.now();
    if (now - lastActionTimestampRef.current < 300) {
      return;
    }
    lastActionTimestampRef.current = now;

    try {
      // If there's a pending play operation, wait for it to finish (or fail)
      // before calling pause
      if (playbackOperationRef.current) {
        playbackOperationRef.current
          .catch(() => {})
          .finally(() => {
            if (audioRef.current) {
              audioRef.current.pause();
            }
          });
      } else {
        audioRef.current.pause();
      }

      // Clear the current operation reference
      playbackOperationRef.current = null;
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  };

  // Update audio source when currentTrack changes
  useEffect(() => {
    if (currentTrack && audioRef.current && !isSeeking) {
      try {
        // Process the URL to make sure it's properly formatted
        const processedUrl = getFullAudioUrl(currentTrack.audioUrl);

        // Only update the source if the track has actually changed
        // This prevents resetting the audio element during seeking operations
        if (processedUrl !== currentAudioUrlRef.current) {
          // Reset playback operation tracking
          playbackOperationRef.current = null;

          // Add timestamp to avoid caching issues
          const url = processedUrl.includes("?")
            ? `${processedUrl}&_t=${Date.now()}`
            : `${processedUrl}?_t=${Date.now()}`;

          audioRef.current.src = url;
          currentAudioUrlRef.current = processedUrl;

          if (isPlaying) {
            // Use the safe play method
            safePlayAudio();
          }
        }
      } catch (error) {
        console.error("Error setting audio source:", error);
      }
    }
  }, [currentTrack, isSeeking]);

  // Handle play/pause state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        safePlayAudio();
      } else {
        safePauseAudio();
      }
    }
  }, [isPlaying]);

  const handleTrackEnded = () => {
    nextTrack();
  };

  const playTrack = (track: Track) => {
    // Check if this is the same track we're already playing
    if (currentTrack && track._id === currentTrack._id) {
      // If it's the same track, just toggle play state
      setIsPlaying(true);
    } else {
      // Otherwise, set the new track
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const pauseTrack = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    if (playlist.length > 0) {
      // Reset playback operation tracking before changing tracks
      playbackOperationRef.current = null;

      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(playlist[nextIndex]);
      setIsPlaying(true);
    }
  };

  const previousTrack = () => {
    if (playlist.length > 0) {
      // Reset playback operation tracking before changing tracks
      playbackOperationRef.current = null;

      const prevIndex =
        currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      setCurrentTrack(playlist[prevIndex]);
      setIsPlaying(true);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playTrack,
        pauseTrack,
        togglePlayPause,
        nextTrack,
        previousTrack,
        playlist,
        setPlaylist,
        currentTrackIndex,
        setCurrentTrackIndex,
        audioElement: audioRef.current,
        isSeeking,
        setIsSeeking,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
