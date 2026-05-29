'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { VideoPlayer } from '@/components/video-player-new';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  reward: number;
  category: string;
  watched: boolean;
  url: string;
}

export default function WatchPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [category, setCategory] = useState('all');

  const mockVideos: Video[] = [
    {
      id: '1',
      title: 'Cryptocurrency Basics',
      description: 'Learn the fundamentals of blockchain and crypto',
      thumbnail: '/placeholder.svg?width=300&height=169',
      duration: 300,
      reward: 25,
      category: 'education',
      watched: false,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    },
    {
      id: '2',
      title: 'Bitcoin Market Analysis',
      description: 'Weekly Bitcoin price trends and predictions',
      thumbnail: '/placeholder.svg?width=300&height=169',
      duration: 420,
      reward: 35,
      category: 'news',
      watched: false,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4',
    },
    {
      id: '3',
      title: 'DeFi Opportunities',
      description: 'Explore decentralized finance opportunities',
      thumbnail: '/placeholder.svg?width=300&height=169',
      duration: 480,
      reward: 50,
      category: 'education',
      watched: true,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4',
    },
    {
      id: '4',
      title: 'Pi Network Update',
      description: 'Latest news from Pi Network ecosystem',
      thumbnail: '/placeholder.svg?width=300&height=169',
      duration: 360,
      reward: 30,
      category: 'news',
      watched: false,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerEscapes.mp4',
    },
  ];

  const filteredVideos = category === 'all' ? mockVideos : mockVideos.filter(v => v.category === category);
  const categories = ['all', ...new Set(mockVideos.map(v => v.category))];

  const handleClaimReward = (amount: number) => {
    console.log(`Reward claimed: ${amount} coins`);
    alert(`Successfully claimed ${amount} coins!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Watch & Earn</h1>
          <p className="text-muted-foreground">Watch videos and earn reward coins. Minimum 30 seconds watch time required.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Player */}
          <div className="lg:col-span-2">
            {selectedVideo ? (
              <VideoPlayer
                videoUrl={selectedVideo.url}
                title={selectedVideo.title}
                reward={selectedVideo.reward}
                minWatchTime={30}
                onRewardClaim={handleClaimReward}
              />
            ) : (
              <Card className="bg-card border-border aspect-video flex items-center justify-center">
                <CardContent className="text-center">
                  <Play className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a video to watch</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Video List */}
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Videos Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={category === cat ? 'default' : 'outline'}
                      onClick={() => setCategory(cat)}
                      className="text-xs"
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className={`bg-card border cursor-pointer transition-all ${
                    selectedVideo?.id === video.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedVideo(video)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-16 h-12 rounded bg-secondary/20 flex-shrink-0 flex items-center justify-center">
                        <Play className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{video.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-0">
                            +{video.reward}
                          </Badge>
                          {video.watched && (
                            <Badge variant="secondary" className="text-xs">
                              Watched
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
