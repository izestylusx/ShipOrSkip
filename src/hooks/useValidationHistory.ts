"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ValidationHistoryItem } from "@/components/validator/types";

const STORAGE_KEY = "shipOrSkip_history";
const MAX_ITEMS = 20;
const GOAL_TARGET = 10;

function readStorage(): ValidationHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ValidationHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: ValidationHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Ignore storage failures.
  }
}

export function useValidationHistory() {
  const [history, setHistory] = useState<ValidationHistoryItem[]>([]);

  useEffect(() => {
    setHistory(readStorage());
  }, []);

  const saveValidation = useCallback((item: ValidationHistoryItem) => {
    setHistory((current) => {
      const next = [item, ...current].slice(0, MAX_ITEMS);
      writeStorage(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeStorage([]);
  }, []);

  const progress = useMemo(() => {
    const count = history.length;
    const percent = Math.min(100, Math.round((count / GOAL_TARGET) * 100));
    return { count, target: GOAL_TARGET, percent };
  }, [history.length]);

  return { history, saveValidation, clearHistory, progress };
}
