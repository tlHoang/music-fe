"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FeaturedPlaylists from "@/components/user/playlist/featured-playlists";

const Homepage = () => {
  return (
    <div className="p-6">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome to Music Platform</h1>
        <div className="flex items-center space-x-2">
          <Input placeholder="Search for music..." className="w-64" />
          <Button>Search</Button>
        </div>
      </header>

      {/* Featured Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Featured Songs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Placeholder for featured songs */}
          <div className="p-4 border rounded shadow">Song 1</div>
          <div className="p-4 border rounded shadow">Song 2</div>
          <div className="p-4 border rounded shadow">Song 3</div>
          <div className="p-4 border rounded shadow">Song 4</div>
        </div>
      </section>

      {/* Featured Playlists Section */}
      <section className="mb-8">
        <FeaturedPlaylists />
      </section>

      {/* Trending Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Trending Now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Placeholder for trending songs */}
          <div className="p-4 border rounded shadow">Trending Song 1</div>
          <div className="p-4 border rounded shadow">Trending Song 2</div>
          <div className="p-4 border rounded shadow">Trending Song 3</div>
          <div className="p-4 border rounded shadow">Trending Song 4</div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
