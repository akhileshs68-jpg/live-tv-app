"use client";

import React, { useState, useEffect } from "react";
import { AdItem, AdSlotType } from "@/lib/ads/types";
import { AdManager } from "@/lib/ads/ad-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";

interface AdBannerProps {
  slot: AdSlotType;
  className?: string;
}

export function AdBanner({ slot, className = "" }: AdBannerProps) {
  const [ad, setAd] = useState<AdItem | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAd() {
      try {
        const fetchedAd = await AdManager.getAd(slot);
        if (isMounted && fetchedAd) {
          setAd(fetchedAd);
          AdManager.recordImpression(fetchedAd.id, slot);
        }
      } catch (err) {
        AdManager.handleAdFailure("banner_load", slot, err);
      }
    }

    loadAd();

    return () => {
      isMounted = false;
    };
  }, [slot]);

  if (!ad || dismissed) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      AdManager.recordDismiss(ad.id, slot);
      setDismissed(true);
    } catch {
      setDismissed(true);
    }
  };

  const handleClick = () => {
    try {
      AdManager.recordClick(ad.id, slot);
      if (ad.ctaUrl) {
        if (ad.ctaUrl.startsWith("http")) {
          window.open(ad.ctaUrl, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = ad.ctaUrl;
        }
      }
    } catch (e) {
      console.warn("[AdBanner] handleClick note:", e);
    }
  };

  return (
    <div
      className={`relative w-full rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-secondary/10 border border-amber-500/25 p-3 sm:p-4 shadow-sm transition-all text-foreground overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500 font-bold text-lg">
            {ad.icon || <Sparkles className="w-5 h-5 text-amber-500" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-500 font-medium">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {ad.badge || "Sponsor"}
              </Badge>
              <span className="text-[11px] text-muted-foreground truncate">{ad.sponsorName}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">{ad.title}</h4>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{ad.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={handleClick}
            className="h-9 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1 shrink-0"
          >
            <span>{ad.ctaText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 shrink-0"
            aria-label="Dismiss Ad"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
