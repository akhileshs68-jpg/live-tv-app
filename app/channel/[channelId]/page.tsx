'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoPlayer } from '@/components/video-player';
import type { CreatorChannel, CreatorVideo, CreatorPlaylist, ChannelSchedule, CreatorProfile } from '@/lib/db-types';
import { Tv, Video, ListVideo, Calendar, ArrowLeft, CheckCircle2, Play, RefreshCw, Clock } from 'lucide-react';

export default function PublicChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const resolvedParams = use(params);
  const channelId = resolvedParams.channelId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [channel, setChannel] = useState<CreatorChannel | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [playlists, setPlaylists] = useState<CreatorPlaylist[]>([]);
  const [schedules, setSchedules] = useState<ChannelSchedule[]>([]);

  const [activePlayingVideo, setActivePlayingVideo] = useState<CreatorVideo | null>(null);

  useEffect(() => {
    async function loadChannel() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/creator/channel-public/${channelId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setChannel(data.channel);
            setCreator(data.creator);
            setVideos(data.videos || []);
            setPlaylists(data.playlists || []);
            setSchedules(data.schedules || []);
            if (data.videos && data.videos.length > 0) {
              setActivePlayingVideo(data.videos[0]);
            }
          } else {
            setError(data.error || 'Channel not found');
          }
        } else {
          setError('Channel not found or unavailable');
        }
      } catch {
        setError('Network error loading channel');
      } finally {
        setLoading(false);
      }
    }

    if (channelId) {
      loadChannel();
    }
  }, [channelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading channel...</p>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center space-y-4">
        <Card className="bg-card border-border max-w-md w-full p-6 text-center space-y-4">
          <Tv className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-lg font-bold text-foreground">Channel Unavailable</h1>
          <p className="text-xs text-muted-foreground">{error || 'The requested channel does not exist.'}</p>
          <Button asChild size="sm" className="min-h-[44px] font-bold w-full">
            <Link href="/">Back to Live TV</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      {/* Top Header */}
      <div className="bg-card/95 border-b border-border sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live TV</span>
          </Link>

          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs py-1">
            Official Channel
          </Badge>
        </div>
      </div>

      {/* Banner & Profile Section */}
      <div className="relative bg-card border-b border-border overflow-hidden">
        {channel.bannerUrl ? (
          <div className="h-32 sm:h-48 w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-next-line @next/next/no-img-element */}
            <img src={channel.bannerUrl} alt={channel.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-28 sm:h-36 w-full bg-gradient-to-r from-primary/20 via-purple-500/15 to-amber-500/20" />
        )}

        <div className="max-w-6xl mx-auto px-4 pb-6 pt-0 -mt-10 sm:-mt-12 flex flex-col sm:flex-row items-start sm:items-end gap-4 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border-4 border-background overflow-hidden shadow-lg flex items-center justify-center shrink-0">
            {channel.logoUrl ? (
              // eslint-disable-next-next-line @next/next/no-img-element
              <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <Tv className="w-10 h-10 text-primary" />
            )}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">{channel.name}</h1>
              <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20 shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground">
              {creator?.displayName || channel.name} • {channel.category || 'General'} • {videos.length} videos
            </p>
            {channel.description && (
              <p className="text-xs text-muted-foreground max-w-2xl line-clamp-2 pt-1">{channel.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Active Player if a video is selected */}
        {activePlayingVideo && (
          <Card className="bg-card border-border overflow-hidden shadow-lg">
            <div className="aspect-video bg-black relative">
              <VideoPlayer
                channel={{
                  id: activePlayingVideo.videoId,
                  name: activePlayingVideo.title,
                  url: activePlayingVideo.videoUrl,
                  category: channel.category || 'VOD',
                  logo: activePlayingVideo.thumbnailUrl || channel.logoUrl || '',
                  country: 'Global',
                  language: channel.language || 'English',
                  isLive: activePlayingVideo.contentType === 'LIVE',
                }}
                onClose={() => setActivePlayingVideo(null)}
              />
            </div>
            <CardContent className="p-4 space-y-1">
              <h2 className="text-base font-bold text-foreground">{activePlayingVideo.title}</h2>
              {activePlayingVideo.description && (
                <p className="text-xs text-muted-foreground">{activePlayingVideo.description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="w-full space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-secondary/40 p-1 rounded-xl">
            <TabsTrigger value="videos" className="text-xs gap-1.5 py-2.5 min-h-[44px]">
              <Video className="w-4 h-4" />
              <span>Videos ({videos.length})</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="text-xs gap-1.5 py-2.5 min-h-[44px]">
              <ListVideo className="w-4 h-4" />
              <span>Playlists ({playlists.length})</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs gap-1.5 py-2.5 min-h-[44px]">
              <Calendar className="w-4 h-4" />
              <span>Schedule ({schedules.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* VIDEOS TAB */}
          <TabsContent value="videos">
            {videos.length === 0 ? (
              <Card className="bg-card border-border p-10 text-center space-y-3">
                <Video className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No public videos available</p>
                <p className="text-xs text-muted-foreground">This creator has not uploaded any public videos yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((vid) => (
                  <Card
                    key={vid.videoId}
                    onClick={() => setActivePlayingVideo(vid)}
                    className={`bg-card border-border overflow-hidden cursor-pointer transition-all hover:border-primary/50 ${
                      activePlayingVideo?.videoId === vid.videoId ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                      {vid.thumbnailUrl ? (
                        // eslint-disable-next-next-line @next/next/no-img-element
                        <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-8 h-8 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px]">
                        {Math.floor(vid.duration / 60)}m {vid.duration % 60}s
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-bold text-foreground line-clamp-1">{vid.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{vid.description || 'No description'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PLAYLISTS TAB */}
          <TabsContent value="playlists">
            {playlists.length === 0 ? (
              <Card className="bg-card border-border p-10 text-center space-y-3">
                <ListVideo className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No playlists available</p>
                <p className="text-xs text-muted-foreground">This creator has not created any public playlists yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {playlists.map((pl) => (
                  <Card key={pl.playlistId} className="bg-card border-border p-4 space-y-2">
                    <h3 className="text-sm font-bold text-foreground">{pl.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{pl.description || 'No description'}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {pl.videoIds?.length || 0} items
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SCHEDULE TAB */}
          <TabsContent value="schedule">
            {schedules.length === 0 ? (
              <Card className="bg-card border-border p-10 text-center space-y-3">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No broadcast schedule programmed</p>
                <p className="text-xs text-muted-foreground">Check back later for continuous 24/7 channel broadcast schedules.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {schedules.map((sch) => {
                  const matchedVideo = videos.find((v) => v.videoId === sch.videoId);
                  return (
                    <Card key={sch.scheduleId} className="bg-card border-border p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {matchedVideo?.title || `Broadcast Slot: ${sch.videoId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sch.startAt).toLocaleString()} → {new Date(sch.endAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {sch.status}
                      </Badge>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
