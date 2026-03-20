"use client";

import { useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/use-ui-store";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function useGlobalShortcuts() {
  const { toggleSidebar, openCommandPalette } = useUIStore();

  useKeyboardShortcuts([
    {
      key: "k",
      meta: true,
      description: "Open command palette",
      action: openCommandPalette,
    },
    {
      key: "b",
      meta: true,
      description: "Toggle sidebar",
      action: toggleSidebar,
    },
  ]);
}

export const SHORTCUT_GROUPS = [
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⌘", "B"], description: "Toggle sidebar" },
      { keys: ["G", "H"], description: "Go to Home" },
      { keys: ["G", "T"], description: "Go to My Tasks" },
      { keys: ["G", "I"], description: "Go to Inbox" },
      { keys: ["G", "P"], description: "Go to Projects" },
    ],
  },
  {
    name: "Tasks",
    shortcuts: [
      { keys: ["N"], description: "New task" },
      { keys: ["⌘", "Enter"], description: "Complete task" },
      { keys: ["⌘", "E"], description: "Edit task" },
      { keys: ["⌘", "Backspace"], description: "Delete task" },
    ],
  },
  {
    name: "General",
    shortcuts: [
      { keys: ["⌘", "/"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close dialog / Cancel" },
    ],
  },
];
