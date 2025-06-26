"use client";

import { useEffect } from "react";
import { installGlobalModalFix } from "@/utils/modalFix";

// Global modal fix component - automatically installs the fix
export const GlobalModalFix = () => {
  useEffect(() => {
    installGlobalModalFix();
  }, []);

  return null; // This component renders nothing
};
