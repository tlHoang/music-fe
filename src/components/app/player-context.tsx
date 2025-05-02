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
  // New queue management methods
  addToQueue: (track: Track) => void;
  addNextToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
  playWithSeek: (
    audioElement: HTMLAudioElement,
    seekTime?: number
  ) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [originalPlaylist, setOriginalPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

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

  // Apply shuffle state when it changes
  useEffect(() => {
    if (isShuffle) {
      if (playlist.length > 1) {
        // Save the original playlist order
        setOriginalPlaylist([...playlist]);

        // Get current track to keep it in place
        const currentTrack = playlist[currentTrackIndex];

        // Shuffle the rest of the tracks
        const remainingTracks = playlist.filter(
          (_, i) => i !== currentTrackIndex
        );
        shuffleArray(remainingTracks);

        // Put the current track back at the current index
        const newPlaylist = [...remainingTracks];
        newPlaylist.splice(currentTrackIndex, 0, currentTrack);

        setPlaylist(newPlaylist);
      }
    } else {
      // Restore original playlist if it exists and has items
      if (originalPlaylist.length > 0) {
        // Find the current track in the original playlist
        const currentTrack = playlist[currentTrackIndex];
        const originalIndex = originalPlaylist.findIndex(
          (track) => track._id === currentTrack._id
        );

        setPlaylist(originalPlaylist);
        // Update current track index to match its position in the original playlist
        if (originalIndex !== -1) {
          setCurrentTrackIndex(originalIndex);
        }
      }
    }
  }, [isShuffle]);

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // Track play count by calling the backend API
  const trackPlayCount = async (trackId: string) => {
    if (!trackId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/${trackId}/plays`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            // Add auth token if needed
            ...(audioRef.current?.dataset?.token
              ? { Authorization: `Bearer ${audioRef.current.dataset.token}` }
              : {}),
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to update play count");
      }
    } catch (error) {
      console.error("Error updating play count:", error);
    }
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

      // Record play count after a short delay to ensure
      // it was actually played, not just loaded
      setTimeout(() => {
        trackPlayCount(track._id);
      }, 2000);
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

  // Add a track to the end of the queue
  const addToQueue = (track: Track) => {
    const newPlaylist = [...playlist, track];
    setPlaylist(newPlaylist);

    // If this is the first track, set it as current
    if (playlist.length === 0) {
      setCurrentTrackIndex(0);
      setCurrentTrack(track);
    }

    // Also update original playlist for shuffle state
    if (!isShuffle) {
      setOriginalPlaylist(newPlaylist);
    } else if (originalPlaylist.length > 0) {
      setOriginalPlaylist([...originalPlaylist, track]);
    }
  };

  // Add a track to play next (right after the current track)
  const addNextToQueue = (track: Track) => {
    const newPlaylist = [...playlist];
    newPlaylist.splice(currentTrackIndex + 1, 0, track);
    setPlaylist(newPlaylist);

    // Also update original playlist for shuffle state
    if (!isShuffle) {
      setOriginalPlaylist(newPlaylist);
    } else if (originalPlaylist.length > 0) {
      // Try to insert at a similar relative position in original
      const currentTrackInOriginal = originalPlaylist.findIndex(
        (t) => t._id === playlist[currentTrackIndex]._id
      );

      if (currentTrackInOriginal !== -1) {
        const newOriginal = [...originalPlaylist];
        newOriginal.splice(currentTrackInOriginal + 1, 0, track);
        setOriginalPlaylist(newOriginal);
      } else {
        // Fallback if we can't find the current track
        setOriginalPlaylist([...originalPlaylist, track]);
      }
    }
  };

  // Remove a track from the queue
  const removeFromQueue = (index: number) => {
    if (index < 0 || index >= playlist.length) return;

    const trackToRemove = playlist[index];
    const newPlaylist = playlist.filter((_, i) => i !== index);

    // Update current track index if needed
    let newIndex = currentTrackIndex;

    if (index === currentTrackIndex) {
      // We're removing the current track
      if (newPlaylist.length === 0) {
        // Queue is now empty
        setCurrentTrack(null);
        setIsPlaying(false);
        newIndex = 0;
      } else if (index >= newPlaylist.length) {
        // We removed the last track, go to the new last track
        newIndex = newPlaylist.length - 1;
        setCurrentTrack(newPlaylist[newIndex]);
      } else {
        // Keep the same index and play the next track
        setCurrentTrack(newPlaylist[index]);
      }
    } else if (index < currentTrackIndex) {
      // We removed a track that was before the current one
      newIndex = currentTrackIndex - 1;
    }

    setPlaylist(newPlaylist);
    setCurrentTrackIndex(newIndex);

    // Update original playlist if needed
    if (!isShuffle) {
      setOriginalPlaylist(newPlaylist);
    } else if (originalPlaylist.length > 0) {
      // Find and remove the track from the original playlist
      const newOriginal = originalPlaylist.filter(
        (t) => t._id !== trackToRemove._id
      );
      setOriginalPlaylist(newOriginal);
    }
  };

  // Clear the queue
  const clearQueue = () => {
    setPlaylist([]);
    setOriginalPlaylist([]);
    setCurrentTrackIndex(0);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  // Shuffle the queue
  const shuffleQueue = () => {
    if (playlist.length <= 1) return;

    // Save the original playlist order if not already in shuffle mode
    if (!isShuffle) {
      setOriginalPlaylist([...playlist]);
    }

    // Get current track
    const currentTrack = playlist[currentTrackIndex];

    // Create a new array with all tracks except current
    const remainingTracks = playlist.filter((_, i) => i !== currentTrackIndex);

    // Shuffle the remaining tracks
    shuffleArray(remainingTracks);

    // Create the new playlist with current track at index 0
    const newPlaylist = [currentTrack, ...remainingTracks];

    // Update state
    setPlaylist(newPlaylist);
    setCurrentTrackIndex(0);
    setIsShuffle(true);
  };

  // Toggle shuffle mode
  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const playWithSeek = (
    audioElement: HTMLAudioElement,
    seekTime = 0
  ): Promise<void> => {
    console.log("playWithSeek called with seekTime:", seekTime);
    // const isPlaying = isAudioPlaying(audioElement);
    return new Promise((resolve) => {
      audioElement.addEventListener(
        "loadedmetadata",
        () => {
          audioElement.currentTime = seekTime;
        },
        { once: true }
      );

      audioElement.addEventListener(
        "canplaythrough",
        () => {
          if (isPlaying) {
            audioElement.play();
          }
          resolve();
        },
        { once: true }
      );

      audioElement.load();
    });
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
        addToQueue,
        addNextToQueue,
        removeFromQueue,
        clearQueue,
        shuffleQueue,
        isShuffle,
        toggleShuffle,
        playWithSeek,
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
