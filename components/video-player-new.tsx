'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, Maximize2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  reward: number;
  minWatchTime: number;
  onRewardClaim?: (amount: number) => void;
}

export function VideoPlayer({ videoUrl, title, reward, minWatchTime, onRewardClaim }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [canClaimReward, setCanClaimReward] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if user watched enough to claim reward
    if (currentTime >= minWatchTime) {
      setCanClaimReward(true);
    }
  }, [currentTime, minWatchTime]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const claimReward = () => {
    if (onRewardClaim) {
      onRewardClaim(reward);
    }
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Reward: {reward} coins</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-all"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Progress bar with watch time requirement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Watch {minWatchTime}s to earn reward
            </span>
            <span className="text-foreground font-semibold">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${(minWatchTime / duration) * 100}%` }}
                />
              </div>
              <span className="text-xs text-accent font-medium">{minWatchTime}s</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className="gap-2"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>

          {canClaimReward ? (
            <Button
              size="sm"
              onClick={claimReward}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Claim {reward} Coins
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Watch more to claim
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
