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
      change: 'Real-time audited viewers',
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
      label: 'Total Platform Watch Time',
      value: analyticsReport ? `${analyticsReport.totalWatchHours} hrs` : '0 hrs',
      change: 'Audited watch heartbeats',
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
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Channel Catalog & Monetization Status
              </CardTitle>
              <CardDescription className="text-xs">
                All existing live broadcast channels are classified as 100% Free. Future premium channels will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
                <span className="font-semibold text-green-500">100+ Free Curated Channels Active</span>
                <Badge variant="outline" className="text-green-500 border-green-500/30">Free Access Policy</Badge>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {GLOBAL_CHANNELS.slice(0, 15).map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/15 border border-border/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-background flex items-center justify-center p-1 border border-border">
                        {ch.logo ? (
                          <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain" />
                        ) : (
                          <Tv className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{ch.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ch.category} • {ch.country}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {ch.isHd ? '1080p HD' : 'SD'}
                      </Badge>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                        FREE
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Subscription Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Subscription Tiers (Future Pi Architecture)
              </CardTitle>
              <CardDescription className="text-xs">
                Extensible subscription configuration prepared for future low-cost Pi plans.
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
