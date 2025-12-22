// historyStore.ts - 撤销/重做历史记录管理

import { create } from "zustand";
import { TimelineState } from "../types/timeline";
import { produce } from "immer";

/**
 * 历史记录状态
 */
interface HistoryState {
  tracks: TimelineState["tracks"];
}

/**
 * 历史记录 Store
 */
interface HistoryStore {
  past: HistoryState[];
  future: HistoryState[];

  // 添加历史记录
  addToHistory: (state: HistoryState) => void;

  // 撤销
  undo: (getCurrentState: () => HistoryState) => HistoryState | null;

  // 重做
  redo: () => HistoryState | null;

  // 清空历史
  clearHistory: () => void;

  // 检查是否可以撤销/重做
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 50; // 最多保存50条历史记录

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],

  addToHistory: (state) => {
    set(
      produce((draft) => {
        // 添加到 past
        draft.past.push(state);

        // 限制历史记录数量
        if (draft.past.length > MAX_HISTORY) {
          draft.past.shift();
        }

        // 清空 future（新操作后不能重做）
        draft.future = [];
      }),
    );
  },

  undo: (getCurrentState) => {
    const { past, future } = get();

    if (past.length === 0) {
      return null;
    }

    const previous = past[past.length - 1];
    const current = getCurrentState();

    set(
      produce((draft) => {
        // 从 past 移除最后一项
        draft.past.pop();

        // 当前状态加入 future
        draft.future.push(current);
      }),
    );

    return previous;
  },

  redo: () => {
    const { future } = get();

    if (future.length === 0) {
      return null;
    }

    const next = future[future.length - 1];

    set(
      produce((draft) => {
        // 从 future 移除最后一项
        draft.future.pop();

        // 加入 past
        draft.past.push(next);
      }),
    );

    return next;
  },

  clearHistory: () => {
    set({ past: [], future: [] });
  },

  canUndo: () => {
    return get().past.length > 0;
  },

  canRedo: () => {
    return get().future.length > 0;
  },
}));
