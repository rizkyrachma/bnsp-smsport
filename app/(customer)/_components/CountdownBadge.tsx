"use client";

import { useEffect, useState, useRef } from "react";
import { HOLD_DURATION_MINUTES } from "@/lib/constants";

interface CountdownBadgeProps {
  createdAt: string; // ISO String from database
  onExpire?: () => void;
}

export default function CountdownBadge({ createdAt, onExpire }: CountdownBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdTime = new Date(createdAt).getTime();
      const expiredTime = createdTime + HOLD_DURATION_MINUTES * 60 * 1000;
      const now = Date.now();
      const diff = expiredTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
        return false;
      }

      setTimeLeft(diff);
      setIsExpired(false);
      return true;
    };

    const active = calculateTimeLeft();
    if (!active) return;

    const timer = setInterval(() => {
      const active = calculateTimeLeft();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  if (isExpired || timeLeft <= 0) {
    return (
      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/60 flex items-center gap-1.5 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-red-600" />
        Expired
      </span>
    );
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#fef3c7] text-[#78350f] border border-amber/30 flex items-center gap-1.5 whitespace-nowrap">
      <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
      Pending (Sisa {formattedTime})
    </span>
  );
}
