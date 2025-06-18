"use client";
import { redirect } from "next/navigation";

export default function DiscoverAllPage() {
  // Redirect to the homepage which now contains all discover functionality
  redirect("/homepage");
}
