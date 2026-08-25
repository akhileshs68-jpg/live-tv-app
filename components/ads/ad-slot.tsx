"use client";

import React from "react";
import { AdSlotType } from "@/lib/ads/types";
import { AdBanner } from "./ad-banner";
import { AdCard } from "./ad-card";

interface AdSlotProps {
  slot: AdSlotType;
  className?: string;
}

/**
 * AdSlot Component wrapper.
 * Guarantees zero application crashes, fail-silent behavior, and clean layout integration.
 */
export function AdSlot({ slot, className = "" }: AdSlotProps) {
  try {
    if (slot === "native_card") {
      return <AdCard />;
    }
    return <AdBanner slot={slot} className={className} />;
  } catch (error) {
    console.warn("[AdSlot] Fail-silent render catch:", error);
    return null;
  }
}
