"use client";

import { useEffect } from "react";

import { recordLessonPosition } from "@/app/learn/actions";

export function LessonPositionTracker({ lessonSlug, stepStableKey }: { lessonSlug: string; stepStableKey: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    void recordLessonPosition?.({ lessonSlug, stepStableKey });
  }, [lessonSlug, stepStableKey]);
  return null;
}
