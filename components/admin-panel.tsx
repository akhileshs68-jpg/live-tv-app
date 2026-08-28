'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/api-config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertCircle,
  Users,
  TrendingUp,
  Radio,
  Tv,
  Clock,
  Eye,
  RefreshCw,
  Crown,
  DollarSign,
  Layers,
  Sparkles,
  ShieldCheck,
  Megaphone,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { OwnerAnalyticsReport } from '@/lib/types';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-service';
import { GLOBAL_CHANNELS } from '@/lib/global-channels';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('live_now');
  const [searchUser, setSearchUser] = useState('');
  const { piAccessToken } = useAuth();

  const [analyticsReport, setAnalyticsReport] = useState<OwnerAnalyticsReport | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Testnet Pricing State
  const [testnetPrice, setTestnetPrice] = useState<number | null>(0.25);
  const [inputPrice, setInputPrice] = useState('0.25');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceMsg, setPriceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Channel Access Management State
  const [allChannelsList, setAllChannelsList] = useState<typeof GLOBAL_CHANNELS>(GLOBAL_CHANNELS);
  const [channelOverrides, setChannelOverrides] = useState<Record<string, 'FREE' | 'PREMIUM' | 'DISABLED'>>({});
  const [channelSearch, setChannelSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'FREE' | 'PREMIUM' | 'DISABLED'>('ALL');
  const [savingChannelId, setSavingChannelId] = useState<string | null>(null);
  const [channelSuccessMsg, setChannelSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(getApiUrl('/api/channels'))
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.channels) && data.channels.length > 0) {
          setAllChannelsList(data.channels);
        }
      })
      .catch((err) => console.warn('[AdminPanel] Error loading full channel catalogue:', err));
  }, []);

  const fetchChannelAccess = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/channels'));
      if (res.ok) {
        const data = await res.json();
        if (data && data.overrides) {
          setChannelOverrides(data.overrides);
        }
      }
    } catch (e) {
      console.warn('[AdminPanel] Error fetching channel access overrides:', e);
    }
  };

  const handleUpdateChannelAccess = async (channelId: string, status: 'FREE' | 'PREMIUM' | 'DISABLED') => {
    setSavingChannelId(channelId);
    setChannelSuccessMsg(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (piAccessToken) {
        headers['Authorization'] = `Bearer ${piAccessToken}`;
      }

      const res = await fetch(getApiUrl('/api/admin/channels'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ channelId, status }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChannelOverrides((prev) => ({
          ...prev,
          [channelId]: status,
        }));
        setChannelSuccessMsg(`Channel status updated to ${status}`);
        setTimeout(() => setChannelSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Error updating channel access:', err);
    } finally {
      setSavingChannelId(null);
    }
  };

  const fetchPricing = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/pricing'));
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.pricePi === 'number') {
          setTestnetPrice(data.pricePi);
          setInputPrice(String(data.pricePi));
        }
      }
    } catch (e) {
      console.warn('[AdminPanel] Error fetching pricing:', e);
    }
  };

  const handleSavePrice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingPrice(true);
    setPriceMsg(null);
    try {
      const parsed = parseFloat(inputPrice);
      if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
        setPriceMsg({
          type: 'error',
          text: 'Please enter a valid positive decimal amount greater than 0 (e.g. 0.25, 0.5, 1.0).',
        });
        setSavingPrice(false);
        return;
      }

      if (parsed > 10000) {
        setPriceMsg({
          type: 'error',
          text: 'Price exceeds maximum allowed threshold of 10,000 Test-Pi.',
        });
        setSavingPrice(false);
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (piAccessToken) {
        headers['Authorization'] = `Bearer ${piAccessToken}`;
      }

      const res = await fetch(getApiUrl('/api/admin/pricing'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ pricePi: parsed }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestnetPrice(data.pricePi);
        setInputPrice(String(data.pricePi));
        setPriceMsg({
          type: 'success',
          text: `Success! Live TV Premium Testnet monthly price set to ${data.pricePi} Test-Pi.`,
        });
      } else {
        setPriceMsg({
          type: 'error',
          text: data.error || 'Failed to update price.',
        });
      }
    } catch (err: any) {
      setPriceMsg({
        type: 'error',
        text: err?.message || 'Network error updating price.',
      });
    } finally {
      setSavingPrice(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const headers: Record<string, string> = {};
      if (piAccessToken) {
        headers['Authorization'] = `Bearer ${piAccessToken}`;
      }
      const res = await fetch(getApiUrl('/api/admin/analytics'), { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.report) {
          setAnalyticsReport(data.report);
        }
      }
    } catch (e) {
      console.warn('[AdminPanel] Error fetching analytics:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchPricing();
    fetchChannelAccess();
  }, [piAccessToken]);

  const fraudFlags = [
    { id: 1, user: 'suspicious_bot_001', reason: 'Multi-tab abuse attempt', severity: 'high', flaggedAt: '2 hours ago' },
    { id: 2, user: 'rapid_claimer_42', reason: 'Abnormal claim frequency', severity: 'medium', flaggedAt: '5 hours ago' },
    { id: 3, user: 'ip_hopper_88', reason: 'Rapid IP variation', severity: 'low', flaggedAt: '1 day ago' },
  ];

  const stats = [
    {
      label: 'LIVE NOW (Concurrent)',
      value: analyticsReport ? analyticsReport.totalActiveViewers.toString() : '0',
      change: 'Real-time active viewers',
      icon: Radio,
    },
    {
      label: 'Peak Today',
      value: analyticsReport ? analyticsReport.peakTodayViewers.toString() : '1',
      change: 'Daily concurrent peak',
      icon: TrendingUp,
    },
    {
      label: 'Views Today',
      value: analyticsReport ? analyticsReport.viewsToday.toString() : '0',
      change: 'Verified sessions today',
      icon: Eye,
    },
    {
      label: 'Platform Watch Time',
      value: analyticsReport ? `${analyticsReport.totalWatchHours} hrs` : '0 hrs',
      change: analyticsReport?.piWatchHours !== undefined
        ? `Pi: ${analyticsReport.piWatchHours}h | Public: ${analyticsReport.publicWatchHours || 0}h`
        : 'Audited watch heartbeats',
      icon: Clock,
    },
  ];

  const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  const adPlacements = [
    { id: 'banner_top', name: 'Header Banner Slot', type: 'Banner', status: 'Standby / Non-blocking', cap: '1 per session' },
    { id: 'preroll_stream', name: 'Pre-roll Video Slot', type: 'Video', status: 'Disabled (Inactive)', cap: '30 min cap' },
    { id: 'midroll_stream', name: 'Mid-roll Stream Slot', type: 'Video', status: 'Disabled (Inactive)', cap: '60 min cap' },
    { id: 'sponsor_channel', name: 'Sponsored Channel Spotlight', type: 'Native', status: 'Ready for Sponsor', cap: 'Continuous' },
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Telemetry Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-card border-border shadow-xs">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-black text-foreground mt-1 tracking-tight">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 w-full md:w-auto h-auto p-1 gap-1">
            <TabsTrigger value="live_now" className="text-xs">Live & TRP</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
            <TabsTrigger value="premium" className="text-xs">Channels</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs">Plans</TabsTrigger>
            <TabsTrigger value="ads" className="text-xs">Ads</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
          </TabsList>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            disabled={loadingAnalytics}
            className="gap-1.5 text-xs border-border ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>

        {/* 1. Live & TRP Tab */}
        <TabsContent value="live_now" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Channels TRP Ranking */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Tv className="w-4 h-4 text-primary" />
                  Top Channels by TRP & Watch Share
                </CardTitle>
                <CardDescription className="text-xs">Audited viewership share and watch minutes</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsReport && analyticsReport.topChannelsByTRP.length > 0 ? (
                  <div className="space-y-2.5">
                    {analyticsReport.topChannelsByTRP.map((ch, idx) => (
                      <div
                        key={ch.channelId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/50 text-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs font-bold w-5 text-muted-foreground">
                            #{idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-semibold text-foreground text-xs sm:text-sm truncate">{ch.channelName}</p>
                            <p className="text-[11px] text-muted-foreground">{ch.views} stream views</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3 shrink-0">
                          <div>
                            <p className="font-bold text-foreground font-mono text-xs sm:text-sm">{ch.watchMinutes} min</p>
                            <p className="text-[10px] text-muted-foreground">Duration</p>
                          </div>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[11px]">
                            {ch.sharePercentage}% TRP
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
                    Viewing telemetry will populate as viewers watch channels.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Viewership Share Pie Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Audience Watch Share Distribution
                </CardTitle>
                <CardDescription className="text-xs">Proportional platform watch duration</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsReport && analyticsReport.topChannelsByTRP.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsReport.topChannelsByTRP}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ channelName, sharePercentage }) => `${channelName.slice(0, 10)} (${sharePercentage}%)`}
                          outerRadius={85}
                          dataKey="watchMinutes"
                        >
                          {analyticsReport.topChannelsByTRP.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    Awaiting watch event telemetry...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Audience Breakdown: Pi Pioneers vs Public Guests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Pi Pioneers Audience Segment
                </CardTitle>
                <CardDescription className="text-xs">Authenticated Pi Network viewers with Watch Points eligibility</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-sm py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Pioneer Watch Time</span>
                  <span className="font-mono font-bold text-foreground">{analyticsReport?.piWatchHours || 0} hrs</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Estimated Pioneer Viewers</span>
                  <span className="font-mono font-bold text-foreground">{analyticsReport?.piViewers || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-muted-foreground">Watch Points Status</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">
                    Active (500/day cap)
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Public Guests Audience Segment
                </CardTitle>
                <CardDescription className="text-xs">Direct web browser viewers (Chrome/Safari) without Pi Auth</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-sm py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Public Watch Time</span>
                  <span className="font-mono font-bold text-foreground">{analyticsReport?.publicWatchHours || 0} hrs</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Estimated Public Viewers</span>
                  <span className="font-mono font-bold text-foreground">{analyticsReport?.publicViewers || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-muted-foreground">Public Access Status</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[11px]">
                    100% Free / Unlocked
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Trends Tab (7-Day & 30-Day) */}
        <TabsContent value="trends" className="space-y-6">
          {/* 7-Day Audience Growth Trends */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">7-Day Watch Trends & Stream Activity</CardTitle>
              <CardDescription className="text-xs">Daily verified view count and aggregate watch minutes</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsReport && analyticsReport.dailyTrends.length > 0 ? (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsReport.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 15, 25, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Stream Views" strokeWidth={2} />
                      <Line type="monotone" dataKey="watchMinutes" stroke="#10b981" name="Watch Minutes" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  7-Day trend data will appear here as audience sessions occur.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 30-Day Multi-Week Aggregation */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">30-Day Weekly Performance Overview</CardTitle>
              <CardDescription className="text-xs">Audience growth across multi-week periods</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsReport && analyticsReport.monthlyTrends && analyticsReport.monthlyTrends.length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsReport.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 15, 25, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#8b5cf6" name="Views" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="watchMinutes" fill="#3b82f6" name="Watch Min" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Monthly trend data will aggregate over time.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Channels & Status Tab */}
        <TabsContent value="premium" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Channel Access & Monetization Controls
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Initial default for all channels is FREE. Administrator can configure individual channel access permissions (FREE, PREMIUM, DISABLED).
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">
                  Default: All Channels FREE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {channelSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{channelSuccessMsg}</span>
                </div>
              )}

              {/* Filters and search */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative w-full sm:w-64">
                  <Input
                    placeholder="Search channel name or category..."
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['ALL', 'FREE', 'PREMIUM', 'DISABLED'] as const).map((filter) => (
                    <Button
                      key={filter}
                      type="button"
                      variant={channelFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChannelFilter(filter)}
                      className={`h-7 px-2.5 text-xs ${
                        channelFilter === filter
                          ? filter === 'PREMIUM'
                            ? 'bg-amber-500 text-black font-bold'
                            : filter === 'DISABLED'
                            ? 'bg-destructive text-destructive-foreground'
                            : filter === 'FREE'
                            ? 'bg-emerald-600 text-white'
                            : ''
                          : ''
                      }`}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {allChannelsList
                  .filter((ch) => {
                    const currentStatus = channelOverrides[ch.id] || 'FREE';
                    const matchesFilter =
                      channelFilter === 'ALL' ||
                      (channelFilter === 'FREE' && currentStatus === 'FREE') ||
                      (channelFilter === 'PREMIUM' && currentStatus === 'PREMIUM') ||
                      (channelFilter === 'DISABLED' && currentStatus === 'DISABLED');

                    const matchesSearch =
                      !channelSearch ||
                      ch.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
                      (ch.category || '').toLowerCase().includes(channelSearch.toLowerCase());

                    return matchesFilter && matchesSearch;
                  })
                  .slice(0, 100)
                  .map((ch) => {
                    const status = channelOverrides[ch.id] || 'FREE';
                    const isSaving = savingChannelId === ch.id;

                    return (
                      <div
                        key={ch.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/15 border border-border/50 text-xs flex-wrap gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded bg-background flex items-center justify-center p-1 border border-border shrink-0">
                            {ch.logo ? (
                              <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain" />
                            ) : (
                              <Tv className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground truncate">{ch.name}</p>
                              {ch.isHd && (
                                <Badge variant="secondary" className="text-[9px] py-0 px-1 font-mono">
                                  HD
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{ch.category} • {ch.country}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSaving}
                            variant={status === 'FREE' ? 'default' : 'outline'}
                            onClick={() => handleUpdateChannelAccess(ch.id, 'FREE')}
                            className={`h-7 px-2 text-[10px] font-bold ${
                              status === 'FREE'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            FREE
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            disabled={isSaving}
                            variant={status === 'PREMIUM' ? 'default' : 'outline'}
                            onClick={() => handleUpdateChannelAccess(ch.id, 'PREMIUM')}
                            className={`h-7 px-2 text-[10px] font-bold ${
                              status === 'PREMIUM'
                                ? 'bg-amber-500 hover:bg-amber-600 text-black'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            PREMIUM
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            disabled={isSaving}
                            variant={status === 'DISABLED' ? 'default' : 'outline'}
                            onClick={() => handleUpdateChannelAccess(ch.id, 'DISABLED')}
                            className={`h-7 px-2 text-[10px] font-bold ${
                              status === 'DISABLED'
                                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            DISABLED
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Subscription Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {/* Admin Testnet Price Controller */}
          <Card className="bg-card border-border border-amber-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    TESTNET PREMIUM SUBSCRIPTION
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Admin-controlled monthly pricing for Live TV Premium on Pi Testnet (LIVE_TV_PREMIUM_MONTHLY).
                  </CardDescription>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-mono">
                  Active Price: {testnetPrice !== null ? `${testnetPrice} Test-Pi` : '0.25 Test-Pi'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-lg bg-secondary/15 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Current monthly price: <span className="font-bold text-amber-400">{testnetPrice !== null ? `${testnetPrice} Test-Pi` : '0.25 Test-Pi'}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    30-day billing duration. Every new Testnet subscription will immediately use this active price.
                  </p>
                </div>

                <form onSubmit={handleSavePrice} className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-36">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10000"
                      value={inputPrice}
                      onChange={(e) => setInputPrice(e.target.value)}
                      placeholder="0.25"
                      className="text-xs pr-8 font-mono"
                      disabled={savingPrice}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none font-semibold">
                      Pi
                    </span>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingPrice || !inputPrice}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
                  >
                    {savingPrice ? 'Saving...' : 'Save Price'}
                  </Button>
                </form>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] text-muted-foreground">Quick presets:</span>
                {[0.25, 0.5, 0.75, 1.0, 2.0].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputPrice(String(preset));
                    }}
                    className={`h-7 px-2.5 text-xs font-mono ${
                      Number(inputPrice) === preset ? 'border-amber-500 text-amber-400 bg-amber-500/10' : ''
                    }`}
                  >
                    {preset} Pi
                  </Button>
                ))}
              </div>

              {priceMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    priceMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-destructive/10 border border-destructive/30 text-destructive'
                  }`}
                >
                  {priceMsg.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{priceMsg.text}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Subscription Tiers Overview
              </CardTitle>
              <CardDescription className="text-xs">
                Extensible subscription configuration prepared for low-cost Pi plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-xl border ${
                      plan.id === 'free_tier'
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 bg-secondary/10'
                    } flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-foreground">{plan.title}</h4>
                        <Badge
                          variant={plan.isActive ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {plan.isActive ? 'Active' : 'Prepared (Inactive)'}
                        </Badge>
                      </div>
                      <p className="text-lg font-black text-foreground mb-1">
                        {plan.pricePi === 0 ? 'Free' : `${plan.pricePi} Pi`}
                        <span className="text-xs font-normal text-muted-foreground">
                          {plan.billingPeriod === 'monthly' ? ' /month' : plan.billingPeriod === 'yearly' ? ' /year' : ''}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                      <ul className="space-y-1.5 text-xs text-muted-foreground mb-4">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-primary shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Advertising Configuration Tab */}
        <TabsContent value="ads" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                Advertising & Sponsorship Placements
              </CardTitle>
              <CardDescription className="text-xs">
                Clean non-blocking ad slots configured. External ad networks remain disabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2.5">
                {adPlacements.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/15 border border-border/50 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{ad.name}</p>
                      <p className="text-[10px] text-muted-foreground">Type: {ad.type} • Frequency Cap: {ad.cap}</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {ad.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Security & Fraud Detection Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-card border-border border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Security & Anti-Abuse Heartbeat Audit
              </CardTitle>
              <CardDescription className="text-xs">
                Server-side token verification, closed Firestore security rules, and rate-limit guardrails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                <p className="font-semibold">Security Rules Status: Fully Enforced</p>
                <p className="text-[11px] mt-0.5 opacity-90">All analytics writes and reward authorizations occur strictly via Firebase Admin SDK on the server.</p>
              </div>

              {fraudFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-destructive/20 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{flag.user}</p>
                    <p className="text-muted-foreground">{flag.reason}</p>
                    <p className="text-[10px] text-muted-foreground/70">{flag.flaggedAt}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${
                      flag.severity === 'high'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-yellow-500/20 text-yellow-600'
                    } text-[10px]`}
                  >
                    {flag.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
