"use client";
// @ts-nocheck
/* eslint-disable */
// React Compiler opt-out: This file uses setState in useEffect for legitimate platform detection

import { useEffect, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";

export type PlatformType = "windows" | "macos" | "linux";

// 模块级别缓存，避免重复检测
let cachedPlatform: PlatformType | null = null;

/**
 * Hook to detect the current platform
 * Returns null during SSR and initial render to avoid hydration mismatch
 * Updates to actual platform after client-side mount
 * @returns The current platform type or null if not yet detected
 */
export function usePlatform(): PlatformType | null {
  const [platformType, setPlatformType] = useState<PlatformType | null>(null);

  useEffect(() => {
    // 如果已经缓存过，直接使用缓存值
    if (cachedPlatform) {
      setPlatformType(cachedPlatform);
      return;
    }

    // 检测平台
    try {
      const currentPlatform = platform();

      if (currentPlatform === "macos") {
        cachedPlatform = "macos";
      } else if (currentPlatform === "linux") {
        cachedPlatform = "linux";
      } else {
        cachedPlatform = "windows";
      }

      setPlatformType(cachedPlatform);

      // Set platform attribute on body for CSS selectors
      if (typeof document !== "undefined") {
        document.body.setAttribute("data-platform", cachedPlatform);
      }
    } catch (error) {
      console.error("Platform detection failed:", error);
      // Default to windows on error
      cachedPlatform = "windows";
      setPlatformType("windows");
    }
  }, []);

  return platformType;
}
