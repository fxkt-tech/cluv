"use client";

import { useState, useEffect } from "react";
import { platform } from "@tauri-apps/plugin-os";

export type PlatformType = "windows" | "macos" | "linux";

// 在模块级别检测平台，避免重复检测和 React 警告
let cachedPlatform: PlatformType | null = null;

function detectPlatform(): PlatformType {
  if (cachedPlatform) {
    return cachedPlatform;
  }

  try {
    const currentPlatform = platform();

    if (currentPlatform === "macos") {
      cachedPlatform = "macos";
    } else if (currentPlatform === "linux") {
      cachedPlatform = "linux";
    } else {
      cachedPlatform = "windows";
    }
  } catch (error) {
    console.error("Platform detection failed:", error);
    // Default to windows on error
    cachedPlatform = "windows";
  }

  return cachedPlatform;
}

/**
 * Hook to detect the current platform
 * Uses a cached value to avoid repeated platform detection
 * @returns The current platform type
 */
export function usePlatform(): PlatformType {
  const [platformType] = useState<PlatformType>(() => detectPlatform());

  useEffect(() => {
    // Set platform attribute on body for CSS selectors (backward compatibility)
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-platform", platformType);
    }
  }, [platformType]);

  return platformType;
}
