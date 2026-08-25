"use client";

import React, { useState, useEffect } from "react";
import { AdItem } from "@/lib/ads/types";
import { AdManager } from "@/lib/ads/ad-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, ShieldCheck } from "lucide-react";

export function AdCard() {
  const [ad, setAd] = useState<AdItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNativeCard() {
      try {
        const fetchedAd = await AdManager.getAd("native_card");
        if (isMounted && fetchedAd) {
          setAd(fetchedAd);
          AdManager.recordImpression(fetchedAd.id, "native_card");
        }
      } catch (err) {
        AdManager.handleAdFailure("native_card_load", "native_card", err);
      }
    }

    loadNativeCard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!ad) {
    return null;
  }

  const handleClick = () => {
    try {
      AdManager.recordClick(ad.id, "native_card");
      if (ad.ctaUrl) {
        if (ad.ctaUrl.startsWith("http")) {
          window.open(ad.ctaUrl, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = ad.ctaUrl;
        }
      }
    } catch (e) {
      console.warn("[AdCard] handleClick note:", e);
    }
  };

  return (
    <Card className="bg-card/80 border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-md overflow-hidden flex flex-col justify-between">
      <CardContent className="p-4 flex flex-col h-full justify-between space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold shrink-0">
              {ad.icon || <Sparkles className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground line-clamp-1">{ad.title}</h4>
              <p className="text-[11px] text-muted-foreground">{ad.sponsorName}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-500 font-semibold shrink-0">
            <ShieldCheck className="w-3 h-3 mr-0.5" />
            Ad
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>

        <Button
          type="button"
          onClick={handleClick}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-9 text-xs gap-1.5"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
