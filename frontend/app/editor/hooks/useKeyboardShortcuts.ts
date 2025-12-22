// useKeyboardShortcuts Hook - 键盘快捷键系统

import { useEffect, useCallback } from "react";
import { useTimelineStore } from "../stores/timelineStore";

interface KeyboardShortcutsOptions {
  enabled?: boolean;
  currentTime: number;
  duration: number;
  onPlayPause?: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onSeek?: (time: number) => void;
}

/**
 * 键盘快捷键 Hook
 *
 * 支持的快捷键：
 * - Space: 播放/暂停
 * - Delete/Backspace: 删除选中的片段
 * - Cmd/Ctrl + Z: 撤销
 * - Cmd/Ctrl + Shift + Z: 重做
 * - Cmd/Ctrl + C: 复制
 * - Cmd/Ctrl + V: 粘贴
 * - Cmd/Ctrl + D: 复制片段
 * - Cmd/Ctrl + A: 全选
 * - Escape: 取消选择
 * - ←/→: 移动播放头（1/30秒）
 * - Shift + ←/→: 移动播放头（1秒）
 * - Cmd/Ctrl + ←/→: 跳到开始/结束
 * - +/-: 缩放
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const {
    enabled = true,
    currentTime,
    duration,
    onPlayPause,
    onStepForward,
    onStepBackward,
    onSeek,
  } = options;

  // Timeline store
  const selectedClipIds = useTimelineStore((state) => state.selectedClipIds);
  const deleteSelectedClips = useTimelineStore(
    (state) => state.deleteSelectedClips,
  );
  const clearSelection = useTimelineStore((state) => state.clearSelection);
  const zoomIn = useTimelineStore((state) => state.zoomIn);
  const zoomOut = useTimelineStore((state) => state.zoomOut);
  const tracks = useTimelineStore((state) => state.tracks);
  const selectClip = useTimelineStore((state) => state.selectClip);
  const duplicateClip = useTimelineStore((state) => state.duplicateClip);
  const splitSelectedClips = useTimelineStore(
    (state) => state.splitSelectedClips,
  );

  // 复制的片段 ID（简单实现，后续可以用更复杂的剪贴板）
  const copyClip = useCallback(() => {
    if (selectedClipIds.length > 0) {
      // 存储到 sessionStorage
      sessionStorage.setItem("copiedClipIds", JSON.stringify(selectedClipIds));
      console.log("已复制片段:", selectedClipIds);
    }
  }, [selectedClipIds]);

  const pasteClip = useCallback(() => {
    const copiedIds = sessionStorage.getItem("copiedClipIds");
    if (copiedIds) {
      try {
        const ids = JSON.parse(copiedIds) as string[];
        ids.forEach((id) => {
          duplicateClip(id);
        });
        console.log("已粘贴片段");
      } catch (error) {
        console.error("粘贴失败:", error);
      }
    }
  }, [duplicateClip]);

  const selectAllClips = useCallback(() => {
    tracks.forEach((track) => {
      track.clips.forEach((clip, index) => {
        selectClip(clip.id, index > 0);
      });
    });
  }, [tracks, selectClip]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // 忽略在输入框中的按键
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Space: 播放/暂停
      if (e.code === "Space") {
        e.preventDefault();
        onPlayPause?.();
      }

      // Delete/Backspace: 删除选中片段
      else if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedClipIds.length > 0) {
          e.preventDefault();
          deleteSelectedClips();
        }
      }

      // Cmd/Ctrl + Z: 撤销
      else if (cmdOrCtrl && e.code === "KeyZ" && !e.shiftKey) {
        e.preventDefault();
        const undo = useTimelineStore.getState().undo;
        undo();
      }

      // Cmd/Ctrl + Shift + Z: 重做
      else if (cmdOrCtrl && e.shiftKey && e.code === "KeyZ") {
        e.preventDefault();
        const redo = useTimelineStore.getState().redo;
        redo();
      }

      // Cmd/Ctrl + C: 复制
      else if (cmdOrCtrl && e.code === "KeyC") {
        e.preventDefault();
        copyClip();
      }

      // Cmd/Ctrl + V: 粘贴
      else if (cmdOrCtrl && e.code === "KeyV") {
        e.preventDefault();
        pasteClip();
      }

      // Cmd/Ctrl + D: 复制片段
      else if (cmdOrCtrl && e.code === "KeyD") {
        e.preventDefault();
        if (selectedClipIds.length > 0) {
          selectedClipIds.forEach((id) => {
            duplicateClip(id);
          });
        }
      }

      // Cmd/Ctrl + B: 分割选中的 Clip
      else if (cmdOrCtrl && e.code === "KeyB") {
        e.preventDefault();
        if (selectedClipIds.length > 0) {
          splitSelectedClips(currentTime);
        }
      }

      // Cmd/Ctrl + A: 全选
      else if (cmdOrCtrl && e.code === "KeyA") {
        e.preventDefault();
        selectAllClips();
      }

      // Escape: 取消选择
      else if (e.code === "Escape") {
        e.preventDefault();
        clearSelection();
      }

      // 左箭头: 后退
      else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (cmdOrCtrl) {
          // Cmd/Ctrl + ←: 跳到开始
          onSeek?.(0);
        } else if (e.shiftKey) {
          // Shift + ←: 后退1秒
          onSeek?.(Math.max(0, currentTime - 1));
        } else {
          // ←: 后退1帧
          onStepBackward?.();
        }
      }

      // 右箭头: 前进
      else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (cmdOrCtrl) {
          // Cmd/Ctrl + →: 跳到结束
          onSeek?.(duration);
        } else if (e.shiftKey) {
          // Shift + →: 前进1秒
          onSeek?.(Math.min(duration, currentTime + 1));
        } else {
          // →: 前进1帧
          onStepForward?.();
        }
      }

      // +/=: 放大
      else if (
        (e.code === "Equal" || e.code === "NumpadAdd") &&
        (cmdOrCtrl || e.shiftKey)
      ) {
        e.preventDefault();
        zoomIn();
      }

      // -: 缩小
      else if (
        (e.code === "Minus" || e.code === "NumpadSubtract") &&
        (cmdOrCtrl || e.shiftKey)
      ) {
        e.preventDefault();
        zoomOut();
      }
    },
    [
      enabled,
      selectedClipIds,
      deleteSelectedClips,
      clearSelection,
      currentTime,
      duration,
      onSeek,
      zoomIn,
      zoomOut,
      onPlayPause,
      onStepForward,
      onStepBackward,
      copyClip,
      pasteClip,
      duplicateClip,
      selectAllClips,
      splitSelectedClips,
    ],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
