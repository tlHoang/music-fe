"use client";
import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to the properly positioned homepage
  redirect("/homepage");
}
