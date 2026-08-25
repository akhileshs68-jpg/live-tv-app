'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { CreatorProfile, CreatorChannel, CreatorVideo, CreatorPlaylist, ChannelSchedule } from '@/lib/db-types';
import {
  Tv,
  Video,
  ListVideo,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const { user, piAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile & Channel state
  const [profile, setProfile] = useState<Partial<CreatorProfile>>({});
  const [channel, setChannel] = useState<Partial<CreatorChannel>>({});

  // Collections state
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [playlists, setPlaylists] = useState<CreatorPlaylist[]>([]);
  const [schedules, setSchedules] = useState<ChannelSchedule[]>([]);

  // Form states for modals/drawers
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 120,
    contentType: 'VOD' as 'VOD' | 'SCHEDULED' | 'LIVE',
    visibility: 'public' as 'public' | 'unlisted' | 'private' | 'premium',
  });

  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: '',
    description: '',
    visibility: 'public' as 'public' | 'unlisted' | 'private' | 'premium',
  });

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    videoId: '',
    startAt: new Date().toISOString().substring(0, 16),
    durationMinutes: 30,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCreatorData = useCallback(async () => {
    setLoading(true);
    try {
      const authHeader = { Authorization: `Bearer ${piAccessToken || ''}` };

      const [profileRes, videosRes, playlistsRes, schedulesRes] = await Promise.all([
        fetch('/api/creator/profile', { headers: authHeader }),
        fetch('/api/creator/videos', { headers: authHeader }),
        fetch('/api/creator/playlists', { headers: authHeader }),
        fetch('/api/creator/schedules', { headers: authHeader }),
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.success) {
          if (pData.profile) setProfile(pData.profile);
          if (pData.channel) setChannel(pData.channel);
        }
      }

      if (videosRes.ok) {
        const vData = await videosRes.json();
        if (vData.success) setVideos(vData.videos || []);
      }

      if (playlistsRes.ok) {
        const plData = await playlistsRes.json();
        if (plData.success) setPlaylists(plData.playlists || []);
      }

      if (schedulesRes.ok) {
        const sData = await schedulesRes.json();
        if (sData.success) setSchedules(sData.schedules || []);
      }
    } catch (err) {
      console.error('Error fetching creator data:', err);
    } finally {
      setLoading(false);
    }
  }, [piAccessToken]);

  useEffect(() => {
    fetchCreatorData();
  }, [fetchCreatorData]);

  // Handle Profile/Channel update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/creator/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${piAccessToken || ''}`,
        },
        body: JSON.stringify({
          displayName: profile.displayName || user?.piUsername || 'Pioneer Creator',
          channelName: channel.name || `${profile.displayName || 'Pioneer'}'s Channel`,
          description: channel.description || profile.description || '',
          logoUrl: channel.logoUrl || profile.logoUrl || '',
          bannerUrl: channel.bannerUrl || profile.bannerUrl || '',
          category: channel.category || 'Entertainment',
          language: channel.language || 'English',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          setChannel(data.channel);
          setFeedback({ type: 'success', message: 'Channel profile updated successfully!' });
        }
      } else {
        setFeedback({ type: 'error', message: 'Failed to update channel profile' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error updating channel' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Add Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch('/api/creator/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${piAccessToken || ''}`,
        },
        body: JSON.stringify(newVideo),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVideos((prev) => [...prev, data.video]);
          setShowAddVideo(false);
          setNewVideo({
            title: '',
            description: '',
            videoUrl: '',
            thumbnailUrl: '',
            duration: 120,
            contentType: 'VOD',
            visibility: 'public',
          });
          setFeedback({ type: 'success', message: 'Video added to library!' });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to add video' });
    }
  };

  // Delete Video
  const handleDeleteVideo = async (videoId: string) => {
    try {
      const res = await fetch(`/api/creator/videos?videoId=${videoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${piAccessToken || ''}` },
      });

      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.videoId !== videoId));
        setFeedback({ type: 'success', message: 'Video removed from library' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete video' });
    }
  };

  // Add Playlist
  const handleAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/creator/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${piAccessToken || ''}`,
        },
        body: JSON.stringify(newPlaylist),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlaylists((prev) => [...prev, data.playlist]);
          setShowAddPlaylist(false);
          setNewPlaylist({ title: '', description: '', visibility: 'public' });
          setFeedback({ type: 'success', message: 'Playlist created!' });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to create playlist' });
    }
  };

  // Add Schedule
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.videoId) {
      setFeedback({ type: 'error', message: 'Select a video to schedule' });
      return;
    }

    try {
      const startAtISO = new Date(newSchedule.startAt).toISOString();
      const endAtISO = new Date(new Date(newSchedule.startAt).getTime() + newSchedule.durationMinutes * 60 * 1000).toISOString();

      const res = await fetch('/api/creator/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${piAccessToken || ''}`,
        },
        body: JSON.stringify({
          videoId: newSchedule.videoId,
          startAt: startAtISO,
          endAt: endAtISO,
          status: 'scheduled',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSchedules((prev) => [...prev, data.schedule]);
          setShowAddSchedule(false);
          setFeedback({ type: 'success', message: 'Broadcast schedule slot added!' });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to schedule broadcast' });
    }
  };

  const channelId = channel.channelId || `ch_${user?.piUserId || 'preview'}`;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      {/* Top Bar */}
      <div className="bg-card/95 border-b border-border sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live TV</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/channel/${channelId}`} target="_blank">
              <Button size="sm" variant="outline" className="h-9 px-3 gap-1.5 text-xs">
                <span>View Public Channel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={fetchCreatorData} className="h-9 px-2" title="Refresh Studio">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Creator Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {channel.logoUrl ? (
                // eslint-disable-next-next-line @next/next/no-img-element
                <img src={channel.logoUrl} alt={channel.name || 'Channel'} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Tv className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  {channel.name || profile.channelName || 'Pioneer Creator Channel'}
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Creator Verified
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                @{user?.piUsername || 'Pioneer'} • ID: {channelId}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-sm flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {feedback.message}
            </span>
            <button onClick={() => setFeedback(null)} className="text-xs underline opacity-80 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Tabs */}
        <Tabs defaultValue="channel" className="w-full space-y-6">
          <TabsList className="grid grid-cols-6 w-full bg-secondary/40 p-1 rounded-xl">
            <TabsTrigger value="channel" className="text-xs gap-1 py-2 min-h-[44px]">
              <Tv className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Channel</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-xs gap-1 py-2 min-h-[44px]">
              <Video className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Videos ({videos.length})</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="text-xs gap-1 py-2 min-h-[44px]">
              <ListVideo className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Playlists</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs gap-1 py-2 min-h-[44px]">
              <Calendar className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1 py-2 min-h-[44px]">
              <BarChart3 className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1 py-2 min-h-[44px]">
              <Settings className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MY CHANNEL */}
          <TabsContent value="channel" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Tv className="w-4 h-4 text-primary" />
                  Channel Customization & Metadata
                </CardTitle>
                <CardDescription>
                  Configure public channel branding, description, and display settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Creator Display Name</Label>
                      <Input
                        id="displayName"
                        value={profile.displayName || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                        placeholder="e.g. Pioneer News Network"
                        className="min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="channelName">Public Channel Name</Label>
                      <Input
                        id="channelName"
                        value={channel.name || ''}
                        onChange={(e) => setChannel((c) => ({ ...c, name: e.target.value }))}
                        placeholder="e.g. Pioneer TV 24/7"
                        className="min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Channel Description</Label>
                    <Textarea
                      id="description"
                      value={channel.description || ''}
                      onChange={(e) => setChannel((c) => ({ ...c, description: e.target.value }))}
                      placeholder="Describe your channel content and live streaming schedule..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo Image URL</Label>
                      <Input
                        id="logoUrl"
                        value={channel.logoUrl || ''}
                        onChange={(e) => setChannel((c) => ({ ...c, logoUrl: e.target.value }))}
                        placeholder="https://..."
                        className="min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bannerUrl">Banner Image URL</Label>
                      <Input
                        id="bannerUrl"
                        value={channel.bannerUrl || ''}
                        onChange={(e) => setChannel((c) => ({ ...c, bannerUrl: e.target.value }))}
                        placeholder="https://..."
                        className="min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Primary Category</Label>
                      <Input
                        id="category"
                        value={channel.category || 'Entertainment'}
                        onChange={(e) => setChannel((c) => ({ ...c, category: e.target.value }))}
                        placeholder="e.g. News, Gaming, Music"
                        className="min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Broadcast Language</Label>
                      <Input
                        id="language"
                        value={channel.language || 'English'}
                        onChange={(e) => setChannel((c) => ({ ...c, language: e.target.value }))}
                        placeholder="e.g. English, Spanish"
                        className="min-h-[44px]"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={savingProfile} className="min-h-[44px] font-bold">
                    {savingProfile ? 'Saving...' : 'Save Channel Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: VIDEOS */}
          <TabsContent value="videos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Video Library</h2>
                <p className="text-xs text-muted-foreground">Manage VOD files and scheduled broadcast videos</p>
              </div>
              <Button size="sm" onClick={() => setShowAddVideo(true)} className="gap-1.5 font-bold min-h-[44px]">
                <Plus className="w-4 h-4" />
                <span>Add Video</span>
              </Button>
            </div>

            {/* Modal/Inline Add Video Form */}
            {showAddVideo && (
              <Card className="bg-card border-primary/30 shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Register Video Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddVideo} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={newVideo.title}
                        onChange={(e) => setNewVideo((v) => ({ ...v, title: e.target.value }))}
                        placeholder="Video title"
                        required
                        className="min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Video Stream / Source URL</Label>
                      <Input
                        value={newVideo.videoUrl}
                        onChange={(e) => setNewVideo((v) => ({ ...v, videoUrl: e.target.value }))}
                        placeholder="https://... (MP4 / HLS .m3u8 stream)"
                        required
                        className="min-h-[44px]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Thumbnail URL</Label>
                        <Input
                          value={newVideo.thumbnailUrl}
                          onChange={(e) => setNewVideo((v) => ({ ...v, thumbnailUrl: e.target.value }))}
                          placeholder="https://..."
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={newVideo.duration}
                          onChange={(e) => setNewVideo((v) => ({ ...v, duration: parseInt(e.target.value) || 0 }))}
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" size="sm" className="min-h-[44px]">Save Video</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddVideo(false)} className="min-h-[44px]">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Video List */}
            {videos.length === 0 ? (
              <Card className="bg-card border-border p-8 text-center space-y-3">
                <Video className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No videos in channel library</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Add video metadata entries (HLS streams or VOD files) to populate your channel content library.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((vid) => (
                  <Card key={vid.videoId} className="bg-card border-border overflow-hidden flex flex-col justify-between">
                    <CardContent className="p-3 space-y-2">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative border border-border flex items-center justify-center">
                        {vid.thumbnailUrl ? (
                          // eslint-disable-next-next-line @next/next/no-img-element
                          <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="w-8 h-8 text-muted-foreground" />
                        )}
                        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px]">
                          {Math.floor(vid.duration / 60)}m {vid.duration % 60}s
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground line-clamp-1">{vid.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{vid.description || 'No description'}</p>
                      </div>
                    </CardContent>
                    <div className="p-3 pt-0 flex items-center justify-between border-t border-border/50">
                      <Badge variant="outline" className="text-[10px]">
                        {vid.contentType}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteVideo(vid.videoId)} className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: PLAYLISTS */}
          <TabsContent value="playlists" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Playlists</h2>
                <p className="text-xs text-muted-foreground">Group videos into curated collections</p>
              </div>
              <Button size="sm" onClick={() => setShowAddPlaylist(true)} className="gap-1.5 font-bold min-h-[44px]">
                <Plus className="w-4 h-4" />
                <span>Create Playlist</span>
              </Button>
            </div>

            {showAddPlaylist && (
              <Card className="bg-card border-primary/30 shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">New Playlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPlaylist} className="space-y-3">
                    <Input
                      value={newPlaylist.title}
                      onChange={(e) => setNewPlaylist((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Playlist title"
                      required
                      className="min-h-[44px]"
                    />
                    <Textarea
                      value={newPlaylist.description}
                      onChange={(e) => setNewPlaylist((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Playlist description..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="min-h-[44px]">Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddPlaylist(false)} className="min-h-[44px]">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {playlists.length === 0 ? (
              <Card className="bg-card border-border p-8 text-center space-y-3">
                <ListVideo className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No playlists created</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Create video playlists to organize your content into series or thematic broadcast collections.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {playlists.map((pl) => (
                  <Card key={pl.playlistId} className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold">{pl.title}</CardTitle>
                      <CardDescription>{pl.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground flex justify-between items-center">
                      <span>{pl.videoIds?.length || 0} videos</span>
                      <Badge variant="outline">{pl.visibility}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 4: SCHEDULE */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">24/7 Channel Broadcast Schedule</h2>
                <p className="text-xs text-muted-foreground">Program automated continuous channel schedule slots</p>
              </div>
              <Button size="sm" onClick={() => setShowAddSchedule(true)} className="gap-1.5 font-bold min-h-[44px]">
                <Plus className="w-4 h-4" />
                <span>Add Broadcast Slot</span>
              </Button>
            </div>

            {showAddSchedule && (
              <Card className="bg-card border-primary/30 shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Add Schedule Slot</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSchedule} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Select Video</Label>
                      <select
                        value={newSchedule.videoId}
                        onChange={(e) => setNewSchedule((s) => ({ ...s, videoId: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]"
                      >
                        <option value="">-- Choose video --</option>
                        {videos.map((v) => (
                          <option key={v.videoId} value={v.videoId}>
                            {v.title} ({Math.floor(v.duration / 60)}m)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={newSchedule.startAt}
                          onChange={(e) => setNewSchedule((s) => ({ ...s, startAt: e.target.value }))}
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Duration (Minutes)</Label>
                        <Input
                          type="number"
                          value={newSchedule.durationMinutes}
                          onChange={(e) => setNewSchedule((s) => ({ ...s, durationMinutes: parseInt(e.target.value) || 30 }))}
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" size="sm" className="min-h-[44px]">Schedule Slot</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddSchedule(false)} className="min-h-[44px]">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {schedules.length === 0 ? (
              <Card className="bg-card border-border p-8 text-center space-y-3">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No broadcast schedule slots programmed</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Assign videos to continuous time slots to create a 24/7 automated television schedule for your channel.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {schedules.map((sch) => {
                  const matchedVideo = videos.find((v) => v.videoId === sch.videoId);
                  return (
                    <Card key={sch.scheduleId} className="bg-card border-border p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {matchedVideo?.title || `Video ID: ${sch.videoId}`}
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

          {/* TAB 5: ANALYTICS */}
          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Channel Performance & Audience Health
                </CardTitle>
                <CardDescription>Real-time analytics for creator-owned broadcast streams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Library Videos</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{videos.length}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Active Playlists</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{playlists.length}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Schedule Slots</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{schedules.length}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Monetization Ready</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">Verified</p>
                  </div>
                </div>

                <div className="p-4 bg-secondary/10 rounded-xl border border-border space-y-2 text-xs text-muted-foreground">
                  <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Creator Foundation Mode
                  </p>
                  <p>
                    Audience metrics, view counts, and engagement telemetry are tracked directly from active broadcast playback events.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: SETTINGS */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Channel Administration
                </CardTitle>
                <CardDescription>Server-authoritative ownership and broadcast configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Owner Identity</p>
                  <p className="font-bold text-foreground">Verified Pi UID: {user?.piUserId || 'Unauthenticated'}</p>
                </div>

                <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Channel Identifier</p>
                  <p className="font-bold text-foreground">{channelId}</p>
                </div>

                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Ownership Rule</p>
                    <p className="mt-0.5">
                      Channel settings and video libraries are restricted strictly to your verified Pi identity. Other creators cannot edit or alter your broadcast metadata.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
