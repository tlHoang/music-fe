"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Repeat,
  Shuffle,
} from "lucide-react";
import { usePlayer } from "@/components/app/player-context";

interface MusicPlayerProps {
  audioUrl: string;
  title: string;
  artist?: string;
  coverImage?: string;
  onEnded?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  autoPlay?: boolean;
  className?: string;
  isPlaying?: boolean;
}

const MusicPlayer = ({
  audioUrl,
  title,
  artist,
  coverImage = "/default-profile.jpg",
  onEnded,
  onPlayStateChange,
  onPrevious,
  onNext,
  autoPlay = false,
  className,
}: MusicPlayerProps) => {
  // Get the global player context
  const {
    isPlaying: globalIsPlaying,
    togglePlayPause,
    audioElement,
    setIsSeeking,
    playWithSeek,
  } = usePlayer();

  // Local player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  // References
  const progressBarRef = useRef<HTMLDivElement>(null);
  const loadAttemptRef = useRef<number>(0);

  // Handle play/pause using the global player context
  const handleTogglePlay = () => {
    togglePlayPause();

    // Notify parent component about the play state change
    if (onPlayStateChange) {
      onPlayStateChange(!globalIsPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!audioElement) return;

    const newVolume = value[0];
    audioElement.volume = newVolume;
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioElement) return;

    if (isMuted) {
      audioElement.volume = volume;
      setIsMuted(false);
    } else {
      audioElement.volume = 0;
      setIsMuted(true);
    }
  };

  // Format time in minutes:seconds
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle starting a seek operation
  const handleSeekStart = () => {
    setIsDragging(true);
    setIsSeeking(true); // Inform player context that we're seeking
  };

  // Handle seek change (dragging the slider)
  const handleSeekChange = (value: number[]) => {
    const seekTime = value[0];
    console.log(1);
    setSliderValue(seekTime);
    setCurrentTime(seekTime); // Update current time immediately for better UX
  };

  // Handle completing a seek operation
  const handleSeekComplete = () => {
    if (!audioElement) return;

    try {
      // Apply the seek time to the audio element
      if (!isNaN(sliderValue) && isFinite(sliderValue) && sliderValue >= 0) {
        // audioElement.currentTime = sliderValue;
        // console.log(1);
        playWithSeek(audioElement, sliderValue);
        // No need to set current time here as it will be updated by the timeupdate event
      }
    } catch (error) {
      console.error("Error seeking:", error);
    } finally {
      setIsDragging(false);
      // Small delay to prevent race conditions with the timeupdate event
      // setTimeout(() => setIsSeeking(false), 50);
      setIsSeeking(false);
    }
  };

  // Toggle repeat
  const toggleRepeat = () => {
    if (!audioElement) return;

    const newRepeatState = !isRepeat;
    setIsRepeat(newRepeatState);
    audioElement.loop = newRepeatState;
  };

  // Toggle shuffle (this would need more implementation for a playlist)
  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  // Initialize and sync with audio element
  useEffect(() => {
    if (!audioElement) return;
    // console.log("run");

    // Initial setup
    setDuration(audioElement.duration || 0);

    if (!globalIsPlaying) {
      setCurrentTime(audioElement.currentTime || 0);
      setSliderValue(audioElement.currentTime || 0);
    }

    setVolume(audioElement.volume);
    setIsMuted(audioElement.muted);
    setIsRepeat(audioElement.loop);

    // Set initial loading state
    if (audioElement.readyState >= 3) {
      // HAVE_FUTURE_DATA = 3
      setIsLoading(false);
    }

    const updateProgress = () => {
      // Only update the UI if we're not currently dragging the slider
      if (!isDragging) {
        const newTime = audioElement.currentTime;
        setCurrentTime(newTime);
        console.log(2);
        setSliderValue(newTime);
      }
    };

    const handleSeeked = () => {
      // When a seek operation completes, ensure UI is updated
      const newTime = audioElement.currentTime;
      setCurrentTime(newTime);
      console.log(3);
      setSliderValue(newTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
      setIsLoading(false);
    };

    const handleEnded = () => {
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setError("Failed to load audio file");
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    // Add event listeners
    audioElement.addEventListener("timeupdate", updateProgress);
    audioElement.addEventListener("seeked", handleSeeked);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);
    audioElement.addEventListener("canplay", handleCanPlay);

    // Cleanup
    return () => {
      audioElement.removeEventListener("timeupdate", updateProgress);
      audioElement.removeEventListener("seeked", handleSeeked);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
      audioElement.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioElement, isDragging, onEnded]);

  // Create a direct DOM click handler for the slider track
  useEffect(() => {
    // Find the slider track element
    const sliderTrack = document.querySelector(
      '.music-player-slider [data-slot="slider-track"]'
    );
    if (!sliderTrack || !audioElement) return;

    const handleSliderTrackClick = (event: Event) => {
      // Set seeking state to true before changing time position
      setIsSeeking(true);

      const mouseEvent = event as MouseEvent; // Explicitly cast to MouseEvent
      // Calculate position
      const track = mouseEvent.currentTarget as HTMLElement;
      const rect = track.getBoundingClientRect();
      const ratio = (mouseEvent.clientX - rect.left) / rect.width;
      const value = ratio * (duration || 100);

      // Make sure the value is valid
      if (audioElement && isFinite(value) && value >= 0) {
        // Update UI first for responsiveness
        setCurrentTime(value);
        setSliderValue(value);

        // Then update actual audio time
        try {
          audioElement.currentTime = value;

          // If we're playing, ensure playback continues
          if (globalIsPlaying && audioElement.paused) {
            audioElement
              .play()
              .catch((e) => console.error("Error resuming playback:", e));
          }
        } catch (err) {
          console.error("Error setting time directly:", err);
        }
      }

      // Reset seeking state after a small delay
      setTimeout(() => setIsSeeking(false), 50);
    };

    sliderTrack.addEventListener("click", handleSliderTrackClick);

    return () => {
      sliderTrack.removeEventListener("click", handleSliderTrackClick);
    };
  }, [audioElement, duration, globalIsPlaying, setIsSeeking]);

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-full relative",
        className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg z-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      {/* Track info */}
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 min-w-16 rounded-md overflow-hidden mr-4">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow overflow-hidden">
          <h3 className="text-lg font-semibold truncate dark:text-white">
            {title}
          </h3>
          {artist && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {artist}
            </p>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mb-3">
        <Slider
          value={[sliderValue]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeekChange}
          onValueCommit={handleSeekComplete}
          onPointerDown={handleSeekStart}
          className="w-full music-player-slider"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            className={cn(
              isShuffle ? "text-primary" : "text-gray-500 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <Shuffle size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <SkipBack size={20} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleTogglePlay}
            className="mx-1 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
          >
            {globalIsPlaying ? (
              <Pause size={20} className="text-primary" />
            ) : (
              <Play size={20} className="ml-0.5 text-primary" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <SkipForward size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRepeat}
            className={cn(
              isRepeat ? "text-primary" : "text-gray-500 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <Repeat size={18} />
          </Button>
        </div>
        {/* Volume control - with enhanced visibility */}
        <div className="flex items-center gap-2 ml-auto bg-gray-50 dark:bg-gray-700/50 py-1 px-2 rounded-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 h-8 w-8"
          >
            {isMuted ? (
              <VolumeX size={18} />
            ) : volume > 0.5 ? (
              <Volume2 size={18} />
            ) : (
              <Volume1 size={18} />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
