"use client";
import { useState, useEffect, useCallback } from "react";
import { apiGetJson } from "../lib/api";

export function useRescheduleStatus(
  planId: string | undefined,
  currentVersion: number | undefined,
  onRescheduled: () => void
) {
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    if (!planId || currentVersion === undefined || !isRescheduling) return;

    const intervalId = setInterval(async () => {
      try {
        const { ok, data } = await apiGetJson(`/api/v1/plans/${planId}`);
        // If version has incremented, background job is finished
        if (ok && data?.data?.version !== undefined && data.data.version > currentVersion) {
          setIsRescheduling(false);
          onRescheduled(); // Call callback to trigger a full refresh in the parent component
        }
      } catch (err) {
        console.error("Failed to poll for reschedule status", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [planId, currentVersion, isRescheduling, onRescheduled]);

  const triggerReschedulePoll = useCallback(() => {
    setIsRescheduling(true);
  }, []);

  return { isRescheduling, triggerReschedulePoll };
}
