"use client";

import React, { useState, useEffect, useRef } from "react";
import { sendRequest } from "@/utils/api";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeadphonesIcon,
  Music,
  Sparkles,
  Disc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/app/player-context";
import FeaturedPlaylists from "@/components/user/playlist/featured-playlists";
import ArtistRecommendations from "@/components/user/recommendations/artist-recommendations";
import { useSession } from "next-auth/react";

// Same interfaces as before
interface User {
  _id: string;
  name?: string;
  username: string;
  profilePicture?: string;
}

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  visibility: string;
  userId: string;
  user: User;
  artist?: string;
  coverImage?: string;
  cover?: string;
  duration: number;
  uploadDate: string;
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  genre?: string;
}

const HomePage = () => {
  const { data: session } = useSession();
  const [featuredSongs, setFeaturedSongs] = useState<Track[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [recentSongs, setRecentSongs] = useState<Track[]>([]);
  const [genreSongs, setGenreSongs] = useState<Track[]>([]);
  const [forYouSongs, setForYouSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>(
    {}
  );
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<string>("Pop");
  const genres = [
    "Pop",
    "Rock",
    "Hip Hop",
    "Electronic",
    "Jazz",
    "Classical",
    "R&B",
  ];
  useEffect(() => {
    fetchTrendingSongs();
    fetchRecentSongs();
    fetchFeaturedSongs();
    fetchGenreSongs(selectedGenre); // Fetch default genre songs
    fetchForYouSongs(); // Fetch personalized recommendations

    // Log for debugging
    console.log(
      "Fetching data from API:",
      `${process.env.NEXT_PUBLIC_API_URL}/songs/search`
    );
  }, []);
  const fetchFeaturedSongs = async () => {
    try {
      console.log("Fetching featured songs");
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/search`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      console.log("Featured songs response:", response);
      if (response.data) {
        // Get the top 5 songs with the highest play counts
        setFeaturedSongs(response.data.data || []);
        console.log("Featured songs set:", response.data.data);
      } else {
        console.log("No featured songs data found");
        // If no songs from API, let's add a dummy song for demonstration
        setFeaturedSongs([
          {
            _id: "dummy1",
            title: "Summer Vibes",
            audioUrl: "https://example.com/audio/sample.mp3",
            visibility: "PUBLIC",
            userId: "user1",
            duration: 240,
            uploadDate: new Date().toISOString(),
            playCount: 1200,
            genre: "Pop",
            user: {
              _id: "user1",
              name: "DJ Example",
              username: "djexample",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?artist",
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching featured songs:", error);
      // Add fallback data if API fails
      setFeaturedSongs([
        {
          _id: "dummy1",
          title: "Summer Vibes",
          audioUrl: "https://example.com/audio/sample.mp3",
          visibility: "PUBLIC",
          userId: "user1",
          duration: 240,
          uploadDate: new Date().toISOString(),
          playCount: 1200,
          genre: "Pop",
          user: {
            _id: "user1",
            name: "DJ Example",
            username: "djexample",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?artist",
          },
        },
      ]);
    }
  };
  const fetchTrendingSongs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sendRequest<any>({
        // url: `${process.env.NEXT_PUBLIC_API_URL}/songs/search?sort=popular&order=desc&limit=6&visibility=PUBLIC`,
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/search`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setTrendingSongs(response.data.data);
        console.log("Trending songs:", response.data.data);
      } else {
        console.log("No trending songs found, using demo data");
        // Add demo data if no songs from API
        const demoTrending = [
          {
            _id: "demo1",
            title: "Midnight Dreams",
            audioUrl: "https://example.com/audio/midnight.mp3",
            visibility: "PUBLIC",
            userId: "user1",
            duration: 195,
            uploadDate: new Date().toISOString(),
            playCount: 4500,
            genre: "Electronic",
            user: {
              _id: "user1",
              name: "Nightwave",
              username: "nightwave",
              profilePicture: "https://source.unsplash.com/random/300x300/?dj",
            },
          },
          {
            _id: "demo2",
            title: "Ocean Breeze",
            audioUrl: "https://example.com/audio/ocean.mp3",
            visibility: "PUBLIC",
            userId: "user2",
            duration: 221,
            uploadDate: new Date().toISOString(),
            playCount: 3200,
            genre: "Chill",
            user: {
              _id: "user2",
              name: "WaveRider",
              username: "waverider",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?musician",
            },
          },
          {
            _id: "demo3",
            title: "Urban Jungle",
            audioUrl: "https://example.com/audio/urban.mp3",
            visibility: "PUBLIC",
            userId: "user3",
            duration: 183,
            uploadDate: new Date().toISOString(),
            playCount: 2800,
            genre: "Hip Hop",
            user: {
              _id: "user3",
              name: "MC Beatbox",
              username: "mcbeatbox",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?rapper",
            },
          },
        ];
        setTrendingSongs(demoTrending);
      }
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      setError("Failed to load trending songs. Please try again later.");

      // Provide demo data even when there's an error
      const demoTrending = [
        {
          _id: "demo1",
          title: "Midnight Dreams",
          audioUrl: "https://example.com/audio/midnight.mp3",
          visibility: "PUBLIC",
          userId: "user1",
          duration: 195,
          uploadDate: new Date().toISOString(),
          playCount: 4500,
          genre: "Electronic",
          user: {
            _id: "user1",
            name: "Nightwave",
            username: "nightwave",
            profilePicture: "https://source.unsplash.com/random/300x300/?dj",
          },
        },
        {
          _id: "demo2",
          title: "Ocean Breeze",
          audioUrl: "https://example.com/audio/ocean.mp3",
          visibility: "PUBLIC",
          userId: "user2",
          duration: 221,
          uploadDate: new Date().toISOString(),
          playCount: 3200,
          genre: "Chill",
          user: {
            _id: "user2",
            name: "WaveRider",
            username: "waverider",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?musician",
          },
        },
      ];
      setTrendingSongs(demoTrending);
    } finally {
      setLoading(false);
    }
  };
  const fetchRecentSongs = async () => {
    try {
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/search`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setRecentSongs(response.data.data);
        console.log("Recent songs:", response.data.data);
      } else {
        console.log("No recent songs found, using demo data");
        // Generate demo data for recent uploads with dates from the last few days
        const demoRecentSongs = [
          {
            _id: "recent1",
            title: "Just Released",
            audioUrl: "https://example.com/audio/new-release.mp3",
            visibility: "PUBLIC",
            userId: "user7",
            duration: 204,
            uploadDate: new Date().toISOString(), // Today
            playCount: 42,
            genre: "Pop",
            user: {
              _id: "user7",
              name: "New Artist",
              username: "newartist",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?newcomer",
            },
          },
          {
            _id: "recent2",
            title: "Fresh Beat",
            audioUrl: "https://example.com/audio/fresh.mp3",
            visibility: "PUBLIC",
            userId: "user8",
            duration: 187,
            uploadDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            playCount: 128,
            genre: "Electronic",
            user: {
              _id: "user8",
              name: "Beat Producer",
              username: "beatproducer",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?producer",
            },
          },
          {
            _id: "recent3",
            title: "New Wave",
            audioUrl: "https://example.com/audio/wave.mp3",
            visibility: "PUBLIC",
            userId: "user9",
            duration: 235,
            uploadDate: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
            playCount: 86,
            genre: "Indie",
            user: {
              _id: "user9",
              name: "Indie Band",
              username: "indieband",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?band",
            },
          },
          {
            _id: "recent4",
            title: "Tomorrow's Sound",
            audioUrl: "https://example.com/audio/tomorrow.mp3",
            visibility: "PUBLIC",
            userId: "user10",
            duration: 192,
            uploadDate: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
            playCount: 204,
            genre: "Alternative",
            user: {
              _id: "user10",
              name: "Future Music",
              username: "futuremusic",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?futuristic",
            },
          },
        ];
        setRecentSongs(demoRecentSongs);
      }
    } catch (error) {
      console.error("Error fetching recent songs:", error);
      // Add fallback data even on error
      const demoRecentSongs = [
        {
          _id: "recent1",
          title: "Just Released",
          audioUrl: "https://example.com/audio/new-release.mp3",
          visibility: "PUBLIC",
          userId: "user7",
          duration: 204,
          uploadDate: new Date().toISOString(), // Today
          playCount: 42,
          genre: "Pop",
          user: {
            _id: "user7",
            name: "New Artist",
            username: "newartist",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?newcomer",
          },
        },
        {
          _id: "recent2",
          title: "Fresh Beat",
          audioUrl: "https://example.com/audio/fresh.mp3",
          visibility: "PUBLIC",
          userId: "user8",
          duration: 187,
          uploadDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          playCount: 128,
          genre: "Electronic",
          user: {
            _id: "user8",
            name: "Beat Producer",
            username: "beatproducer",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?producer",
          },
        },
      ];
      setRecentSongs(demoRecentSongs);
    }
  };
  const fetchGenreSongs = async (genre: string) => {
    try {
      setSelectedGenre(genre);
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/search`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setGenreSongs(response.data.data);
        console.log(`${genre} songs:`, response.data.data);
      } else {
        console.log(`No ${genre} songs found, using demo data`);
        // Generate demo data for the specific genre
        const demoGenreSongs = generateDemoSongsForGenre(genre, 4);
        setGenreSongs(demoGenreSongs);
      }
    } catch (error) {
      console.error(`Error fetching ${genre} songs:`, error);
      // Generate demo data even on error
      const demoGenreSongs = generateDemoSongsForGenre(genre, 3);
      setGenreSongs(demoGenreSongs);
    }
  };

  // Helper function to generate demo songs data for a specific genre
  const generateDemoSongsForGenre = (genre: string, count: number): Track[] => {
    const genreSpecificData: {
      [key: string]: { titles: string[]; artists: string[] };
    } = {
      Pop: {
        titles: [
          "Summer Hit",
          "Dancing in the Dark",
          "Neon Lights",
          "Heart Beat",
        ],
        artists: ["Pop Star", "The Melodies", "Rhythm Crew", "Voice Angel"],
      },
      Rock: {
        titles: [
          "Highway Dreams",
          "Electric Storm",
          "Stone Cold",
          "Breaking Free",
        ],
        artists: [
          "Rock Giants",
          "Metal Heads",
          "Guitar Heroes",
          "Drum Masters",
        ],
      },
      "Hip Hop": {
        titles: ["Urban Flow", "City Beats", "Rhythm & Streets", "Word Play"],
        artists: ["MC Flow", "Beat Dropper", "Lyric Master", "Rhythm Poet"],
      },
      Electronic: {
        titles: [
          "Digital Waves",
          "Synthesize",
          "Circuit Beat",
          "Electronic Dreams",
        ],
        artists: ["DJ Pulse", "Wave Maker", "Voltage", "Binary Beats"],
      },
      Jazz: {
        titles: [
          "Smooth Saxophone",
          "Blue Notes",
          "Midnight Jazz",
          "Swing Time",
        ],
        artists: [
          "Jazz Ensemble",
          "Saxophone Soul",
          "Blues Quartet",
          "Night Club",
        ],
      },
      Classical: {
        titles: [
          "Symphony No. 9",
          "Moonlight Sonata",
          "Rhapsody",
          "Concerto in G",
        ],
        artists: [
          "Orchestra Master",
          "Piano Virtuoso",
          "String Quartet",
          "Harmony",
        ],
      },
      "R&B": {
        titles: [
          "Soul Searching",
          "Rhythm Feel",
          "Smooth Groove",
          "Heart & Soul",
        ],
        artists: [
          "Soul Singer",
          "Groove Master",
          "Velvet Voice",
          "Harmony Group",
        ],
      },
    };

    // Default data if the genre isn't in our mapping
    const defaultData = {
      titles: ["Amazing Track", "Great Song", "Top Melody", "Best Hit"],
      artists: ["Music Artist", "Great Performer", "Top Singer", "Star Voice"],
    };

    const data = genreSpecificData[genre] || defaultData;
    return Array.from({ length: count }, (_, i) => ({
      _id: `${genre.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`,
      title: data.titles[i % data.titles.length],
      audioUrl: `https://example.com/audio/${genre.toLowerCase().replace(/\s+/g, "-")}-${i + 1}.mp3`,
      visibility: "PUBLIC",
      userId: `user-${genre}-${i + 1}`,
      duration: 180 + Math.floor(Math.random() * 120),
      uploadDate: new Date().toISOString(),
      playCount: 500 + Math.floor(Math.random() * 5000),
      genre: genre,
      user: {
        _id: `user-${genre}-${i + 1}`,
        name: data.artists[i % data.artists.length],
        username: data.artists[i % data.artists.length]
          .toLowerCase()
          .replace(/\s+/g, ""),
        profilePicture: `https://source.unsplash.com/random/300x300/?${encodeURIComponent(genre.toLowerCase())}-musician`,
      },
    }));
  };
  const fetchForYouSongs = async () => {
    try {
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/search`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setForYouSongs(response.data.data);
        console.log("For You songs:", response.data.data);
      } else {
        // Provide demo personalized recommendations
        const demoForYou = [
          {
            _id: "rec1",
            title: "Starlight Serenade",
            audioUrl: "https://example.com/audio/starlight.mp3",
            visibility: "PUBLIC",
            userId: "user4",
            duration: 212,
            uploadDate: new Date().toISOString(),
            playCount: 1800,
            genre: "Ambient",
            user: {
              _id: "user4",
              name: "Stellar Sounds",
              username: "stellarsounds",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?singer",
            },
          },
          {
            _id: "rec2",
            title: "Mountain Echo",
            audioUrl: "https://example.com/audio/mountain.mp3",
            visibility: "PUBLIC",
            userId: "user5",
            duration: 267,
            uploadDate: new Date().toISOString(),
            playCount: 2100,
            genre: "Folk",
            user: {
              _id: "user5",
              name: "Alpine",
              username: "alpine",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?guitarist",
            },
          },
          {
            _id: "rec3",
            title: "Electric Pulse",
            audioUrl: "https://example.com/audio/electric.mp3",
            visibility: "PUBLIC",
            userId: "user6",
            duration: 198,
            uploadDate: new Date().toISOString(),
            playCount: 3700,
            genre: "Electronic",
            user: {
              _id: "user6",
              name: "Voltage",
              username: "voltage",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?producer",
            },
          },
        ];
        setForYouSongs(demoForYou);
      }
    } catch (error) {
      console.error("Error fetching personalized songs:", error);

      // Add fallback data
      const demoForYou = [
        {
          _id: "rec1",
          title: "Starlight Serenade",
          audioUrl: "https://example.com/audio/starlight.mp3",
          visibility: "PUBLIC",
          userId: "user4",
          duration: 212,
          uploadDate: new Date().toISOString(),
          playCount: 1800,
          genre: "Ambient",
          user: {
            _id: "user4",
            name: "Stellar Sounds",
            username: "stellarsounds",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?singer",
          },
        },
        {
          _id: "rec2",
          title: "Mountain Echo",
          audioUrl: "https://example.com/audio/mountain.mp3",
          visibility: "PUBLIC",
          userId: "user5",
          duration: 267,
          uploadDate: new Date().toISOString(),
          playCount: 2100,
          genre: "Folk",
          user: {
            _id: "user5",
            name: "Alpine",
            username: "alpine",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?guitarist",
          },
        },
      ];
      setForYouSongs(demoForYou);
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (playTrack) {
      const audioUrl = track.audioUrl.startsWith("/api/audio")
        ? track.audioUrl
        : `/api/audio?url=${encodeURIComponent(track.audioUrl)}`;

      playTrack({
        ...track,
        audioUrl,
      });
    }
  };

  const handlePlayToggle = (track: Track) => {
    if (currentTrack?._id === track._id) {
      togglePlayPause();
    } else {
      handlePlayTrack(track);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Helper to get the most appropriate cover image URL
  const getCoverImage = (track: Track) => {
    return track.coverImage || track.cover || "/default-profile.jpg";
  };

  // Handle image loading errors
  const handleImageError = (trackId: string) => {
    setImageErrors((prev) => ({ ...prev, [trackId]: true }));
  };

  // Ignore API errors for artists and playlists and show empty UI
  // Patch: Hide error messages for ArtistRecommendations and FeaturedPlaylists

  // Patch ArtistRecommendations and FeaturedPlaylists to not show error messages
  // If these components accept an 'onError' or 'error' prop, pass a no-op or empty string
  // If not, override their error handling with a wrapper

  // Example wrapper for ArtistRecommendations
  const SafeArtistRecommendations = () => {
    try {
      return <ArtistRecommendations />;
    } catch (e) {
      return null;
    }
  };

  // Example wrapper for FeaturedPlaylists
  const SafeFeaturedPlaylists = () => {
    try {
      return <FeaturedPlaylists />;
    } catch (e) {
      return null;
    }
  };

  // Carousel navigation
  const slideLeft = () => {
    if (carouselRef.current) {
      const newSlide = Math.max(0, currentSlide - 1);
      setCurrentSlide(newSlide);
      carouselRef.current.scrollTo({
        left: newSlide * carouselRef.current.offsetWidth,
        behavior: "smooth",
      });
    }
  };

  const slideRight = () => {
    if (carouselRef.current && featuredSongs.length > 0) {
      const newSlide = Math.min(featuredSongs.length - 1, currentSlide + 1);
      setCurrentSlide(newSlide);
      carouselRef.current.scrollTo({
        left: newSlide * carouselRef.current.offsetWidth,
        behavior: "smooth",
      });
    }
  };

  // Format a number with commas for better readability
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="px-4 py-8 md:px-6 lg:px-8">
      {/* Featured Songs Carousel */}
      {featuredSongs.length > 0 && (
        <div className="mb-16 relative">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <HeadphonesIcon className="mr-2 text-purple-500" size={24} />
            Featured Songs
          </h2>

          <div className="relative group">
            <div
              ref={carouselRef}
              className="flex overflow-hidden scroll-smooth rounded-2xl relative"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {featuredSongs.map((song, index) => (
                <div
                  key={song._id}
                  className="min-w-full h-96 relative flex-shrink-0 scroll-snap-align-start"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {/* Background image with overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/30 z-10" />
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={
                        !imageErrors[song._id]
                          ? getCoverImage(song)
                          : "/default-profile.jpg"
                      }
                      alt={song.title}
                      fill
                      className="object-cover blur-sm scale-110 transform transition-transform"
                      quality={80}
                      onError={() => handleImageError(song._id)}
                      unoptimized={getCoverImage(song).startsWith(
                        "https://source.unsplash.com/"
                      )}
                    />
                  </div>

                  {/* Song content */}
                  <div className="absolute inset-0 z-20 flex items-center">
                    <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                      {/* Album cover */}
                      <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 shadow-2xl rounded-lg overflow-hidden border-2 border-white/10">
                        <Image
                          src={
                            !imageErrors[song._id]
                              ? getCoverImage(song)
                              : "/default-profile.jpg"
                          }
                          alt={song.title}
                          fill
                          className="object-cover"
                          quality={100}
                          onError={() => handleImageError(song._id)}
                          unoptimized={getCoverImage(song).startsWith(
                            "https://source.unsplash.com/"
                          )}
                        />
                      </div>

                      {/* Song details */}
                      <div className="flex flex-col text-white max-w-xl text-center md:text-left">
                        <h3 className="text-3xl md:text-4xl font-bold mb-2">
                          {song.title}
                        </h3>
                        <Link
                          href={`/profile/${song.user?._id}`}
                          className="text-xl md:text-2xl text-white/80 hover:text-white transition mb-4"
                        >
                          {song.user?.name ||
                            song.user?.username ||
                            song.artist ||
                            "Unknown Artist"}
                        </Link>

                        <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
                          <div className="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatDuration(song.duration || 0)}
                          </div>
                          <div className="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                            <BarChart className="w-4 h-4 mr-2" />
                            {formatNumber(song.playCount || 0)} plays
                          </div>
                          {song.genre && (
                            <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                              {song.genre}
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handlePlayToggle(song)}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-full w-fit mx-auto md:mx-0"
                        >
                          {currentTrack?._id === song._id && isPlaying ? (
                            <>
                              <Pause className="mr-2" size={18} /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="mr-2" size={18} fill="white" />{" "}
                              Play Song
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Slide indicator */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30">
                    {featuredSongs.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentSlide(i);
                          carouselRef.current?.scrollTo({
                            left: i * carouselRef.current.offsetWidth,
                            behavior: "smooth",
                          });
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentSlide === i
                            ? "bg-white w-4"
                            : "bg-white/40 hover:bg-white/60"
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            <button
              onClick={slideLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous slide"
              disabled={currentSlide === 0}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={slideRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next slide"
              disabled={currentSlide === featuredSongs.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}{" "}
      {/* Hero section with decorative elements */}{" "}
      <div className="relative w-full h-80 md:h-[420px] mb-16 rounded-2xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/90 via-purple-800/90 to-violet-800/90 transition-all duration-700 group-hover:from-indigo-700/90 group-hover:via-purple-700/90 group-hover:to-violet-700/90" />

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/10 to-pink-500/20 animate-gradient-shift"></div>

        <img
          src="/pattern.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 transition-opacity duration-700 group-hover:opacity-40"
        />

        {/* Audio wave visualization */}
        <div className="absolute top-0 right-0 w-40 md:w-60 h-full">
          <img
            src="/waveform.png"
            alt=""
            className="h-full object-contain object-right opacity-30 transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        {/* Decorative glowing orbs */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center md:items-start justify-center h-full text-white p-8 md:p-12">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-center md:text-left drop-shadow-md">
            Discover New{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200">
              Music
            </span>
          </h1>
          <p className="text-lg md:text-xl text-center md:text-left max-w-lg mb-8 drop-shadow text-purple-50">
            Listen to the most trending songs and discover new artists every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() =>
                window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
              }
              className="bg-white text-purple-900 hover:bg-purple-100 drop-shadow-lg px-6 py-6 text-lg"
              size="lg"
            >
              <HeadphonesIcon className="mr-2 h-5 w-5" /> Explore Popular Tracks
            </Button>
            <Button
              onClick={() => fetchGenreSongs("Pop")}
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 drop-shadow-lg px-6 py-6 text-lg"
              size="lg"
            >
              Browse Genres
            </Button>
          </div>
        </div>
      </div>
      {/* Featured Playlists Section */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 shadow-md border border-indigo-100 dark:border-indigo-800/20">
          <SafeFeaturedPlaylists />
        </div>
      </section>
      {/* For You Section - Personalized Recommendations */}{" "}
      <section className="mb-12 py-8 px-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/50 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 md:w-40 h-full opacity-10">
          <img src="/waveform.png" alt="" className="h-full object-contain" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-600/10 dark:to-indigo-600/10 rounded-full blur-3xl opacity-50"></div>
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold">For You</h2>
          </div>
          <Link
            href="/discover"
            className="text-purple-600 hover:underline font-medium flex items-center gap-1"
          >
            View More
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forYouSongs.map((track) => (
            <div
              key={track._id}
              className="group bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="relative aspect-video w-full">
                <Image
                  src={
                    !imageErrors[track._id]
                      ? getCoverImage(track)
                      : "/default-profile.jpg"
                  }
                  alt={track.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  onError={() => handleImageError(track._id)}
                  unoptimized={getCoverImage(track).startsWith(
                    "https://source.unsplash.com/"
                  )}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => handlePlayToggle(track)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-purple-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {currentTrack?._id === track._id && isPlaying ? (
                    <Pause size={20} />
                  ) : (
                    <Play size={20} fill="none" />
                  )}
                </button>
                <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded-tl-md">
                  {formatDuration(track.duration || 0)}
                </div>
                {track.playCount && track.playCount > 0 && (
                  <div className="absolute top-0 right-0 bg-purple-600/90 text-white text-xs px-2 py-1 rounded-bl-md flex items-center gap-1">
                    <BarChart size={12} />
                    {formatNumber(track.playCount)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate">{track.title}</h3>
                <Link
                  href={`/profile/${track.user?._id}`}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                >
                  {track.user?.name ||
                    track.user?.username ||
                    track.artist ||
                    "Unknown Artist"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Trending Songs Section */}{" "}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
              <BarChart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold">Trending Songs</h2>
          </div>
          <Link
            href="/discover"
            className="text-purple-600 hover:underline font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl h-64"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingSongs.map((track) => (
              <div
                key={track._id}
                className="group bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="relative aspect-video w-full">
                  <Image
                    src={
                      !imageErrors[track._id]
                        ? getCoverImage(track)
                        : "/default-profile.jpg"
                    }
                    alt={track.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    onError={() => handleImageError(track._id)}
                    unoptimized={getCoverImage(track).startsWith(
                      "https://source.unsplash.com/"
                    )}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={() => handlePlayToggle(track)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-purple-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {currentTrack?._id === track._id && isPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} fill="none" />
                    )}
                  </button>
                  <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded-tl-md">
                    {formatDuration(track.duration || 0)}
                  </div>
                  {track.playCount && track.playCount > 0 && (
                    <div className="absolute top-0 right-0 bg-purple-600/90 text-white text-xs px-2 py-1 rounded-bl-md flex items-center gap-1">
                      <BarChart size={12} />
                      {formatNumber(track.playCount)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate">{track.title}</h3>
                  <Link
                    href={`/profile/${track.user?._id}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                  >
                    {track.user?.name ||
                      track.user?.username ||
                      track.artist ||
                      "Unknown Artist"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>{" "}
      {/* Genre-Based Recommendations Section */}{" "}
      <section className="mb-12 relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl blur opacity-30 -z-10"></div>
        <div className="flex flex-col mb-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg">
                <Music className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold">Browse by Genre</h2>
            </div>
            <Link
              href="/discover"
              className="text-purple-600 hover:underline font-medium flex items-center gap-1"
            >
              View All Genres
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex flex-nowrap gap-3 mb-8 overflow-x-auto pb-3 scrollbar-hide">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => fetchGenreSongs(genre)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all flex-shrink-0 shadow-sm ${
                  selectedGenre === genre
                    ? "bg-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-900 shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 hover:shadow-md"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {genreSongs.length > 0 ? (
            genreSongs.map((track) => (
              <div
                key={track._id}
                className="group bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="relative aspect-video w-full">
                  <Image
                    src={
                      !imageErrors[track._id]
                        ? getCoverImage(track)
                        : "/default-profile.jpg"
                    }
                    alt={track.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    onError={() => handleImageError(track._id)}
                    unoptimized={getCoverImage(track).startsWith(
                      "https://source.unsplash.com/"
                    )}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={() => handlePlayToggle(track)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-purple-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {currentTrack?._id === track._id && isPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} fill="none" />
                    )}
                  </button>
                  <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded-tl-md">
                    {formatDuration(track.duration || 0)}
                  </div>
                  {track.playCount && track.playCount > 0 && (
                    <div className="absolute top-0 right-0 bg-purple-600/90 text-white text-xs px-2 py-1 rounded-bl-md flex items-center gap-1">
                      <BarChart size={12} />
                      {formatNumber(track.playCount)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate">{track.title}</h3>
                  <Link
                    href={`/profile/${track.user?._id}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                  >
                    {track.user?.name ||
                      track.user?.username ||
                      track.artist ||
                      "Unknown Artist"}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-10 text-center text-gray-500 dark:text-gray-400">
              No songs found for {selectedGenre} genre
            </div>
          )}
        </div>
      </section>
      {/* Recent Uploads Section */}{" "}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Disc className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold">Recent Uploads</h2>
          </div>
          <Link
            href="/discover"
            className="text-purple-600 hover:underline font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentSongs.map((track) => (
            <div
              key={track._id}
              className="group bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="relative aspect-video w-full">
                <Image
                  src={
                    !imageErrors[track._id]
                      ? getCoverImage(track)
                      : "/default-profile.jpg"
                  }
                  alt={track.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  onError={() => handleImageError(track._id)}
                  unoptimized={getCoverImage(track).startsWith(
                    "https://source.unsplash.com/"
                  )}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => handlePlayToggle(track)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-purple-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {currentTrack?._id === track._id && isPlaying ? (
                    <Pause size={20} />
                  ) : (
                    <Play size={20} fill="none" />
                  )}
                </button>
                <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded-tl-md">
                  {formatDuration(track.duration || 0)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate">{track.title}</h3>
                <Link
                  href={`/profile/${track.user?._id}`}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                >
                  {track.user?.name ||
                    track.user?.username ||
                    track.artist ||
                    "Unknown Artist"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Featured Playlists Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Disc className="mr-2 h-5 w-5 text-purple-600" />
            Featured Playlists
          </h2>
          <Link href="/discover" className="text-purple-600 hover:underline">
            View All
          </Link>
        </div>

        <FeaturedPlaylists />
      </section>
      {/* Artist Recommendations */}
      <section className="mb-12">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-8 shadow-md border border-indigo-100/50 dark:border-indigo-800/20">
          <ArtistRecommendations />
        </div>
      </section>
      {/* Weekly Picks - Curated by editors */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 rounded-2xl p-8 shadow-md border border-rose-100/50 dark:border-rose-800/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-rose-200 to-orange-200 dark:from-rose-600/20 dark:to-orange-600/20 opacity-30"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-rose-200 to-orange-200 dark:from-rose-600/10 dark:to-orange-600/10 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Weekly Picks</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Handpicked by our music editors
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(trendingSongs.slice(0, 2) || []).map((track) => (
                <div
                  key={track._id}
                  className="flex bg-white dark:bg-gray-800/80 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 group"
                >
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Image
                      src={
                        !imageErrors[track._id]
                          ? getCoverImage(track)
                          : "/default-profile.jpg"
                      }
                      alt={track.title}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(track._id)}
                      unoptimized={getCoverImage(track).startsWith(
                        "https://source.unsplash.com/"
                      )}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handlePlayToggle(track)}
                        className="bg-white/90 text-rose-600 p-3 rounded-full shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all"
                      >
                        {currentTrack?._id === track._id && isPlaying ? (
                          <Pause size={20} />
                        ) : (
                          <Play size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">
                        {track.title}
                      </h3>
                      <Link
                        href={`/profile/${track.user?._id}`}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 truncate block"
                      >
                        {track.user?.name ||
                          track.user?.username ||
                          track.artist ||
                          "Unknown Artist"}
                      </Link>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{formatDuration(track.duration || 0)}</span>
                      {track.playCount && (
                        <span className="flex items-center gap-1">
                          <BarChart size={12} />
                          {formatNumber(track.playCount)} plays
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
