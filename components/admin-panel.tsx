'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { AlertCircle, Users, TrendingUp, DollarSign, Flag } from 'lucide-react';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchUser, setSearchUser] = useState('');

  // Mock data
  const chartData = [
    { name: 'Mon', earnings: 12500, users: 450 },
    { name: 'Tue', earnings: 14200, users: 520 },
    { name: 'Wed', earnings: 11800, users: 480 },
    { name: 'Thu', earnings: 15600, users: 590 },
    { name: 'Fri', earnings: 18900, users: 710 },
    { name: 'Sat', earnings: 22100, users: 850 },
    { name: 'Sun', earnings: 19500, users: 780 },
  ];

  const fraudFlags = [
    { id: 1, user: 'suspicious_bot_001', reason: 'Multi-tab abuse', severity: 'high', flaggedAt: '2 hours ago' },
    { id: 2, user: 'rapid_claimer_42', reason: 'Rapid claim pattern', severity: 'medium', flaggedAt: '5 hours ago' },
    { id: 3, user: 'ip_hopper_88', reason: 'IP change within 1 hour', severity: 'medium', flaggedAt: '1 day ago' },
  ];

  const stats = [
    { label: 'Total Users', value: '125,430', change: '+12%', icon: Users },
    { label: 'Total Coins Distributed', value: '2.5M', change: '+8%', icon: DollarSign },
    { label: 'Active Today', value: '45,320', change: '+23%', icon: TrendingUp },
    { label: 'Fraud Alerts', value: '3', change: '↑ 2 today', icon: Flag },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  </div>
                  <Icon className="w-5 h-5 text-primary opacity-50" />
                </div>
                <p className="text-xs text-accent mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Weekly Earnings & Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 20, 40, 0.8)',
                      border: '1px solid rgba(147, 51, 234, 0.3)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#9333ea"
                    dot={false}
                    name="Coins Distributed"
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#22c55e"
                    dot={false}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Earning Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Watch Videos', value: 45 },
                        { name: 'Tasks', value: 25 },
                        { name: 'Referrals', value: 20 },
                        { name: 'Streaks', value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#9333ea" />
                      <Cell fill="#22c55e" />
                      <Cell fill="#06b6d4" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { user: 'user_12345', action: 'Watched video', amount: 25 },
                  { user: 'user_67890', action: 'Referral bonus', amount: 100 },
                  { user: 'user_11111', action: 'Task completed', amount: 50 },
                  { user: 'user_22222', action: 'Streak bonus', amount: 75 },
                ].map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-secondary/10">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{tx.user}</p>
                      <p className="text-xs text-muted-foreground">{tx.action}</p>
                    </div>
                    <span className="text-sm font-semibold text-accent">+{tx.amount}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search by username or wallet address..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="bg-input border-border"
              />

              <div className="space-y-3">
                {['user_12345', 'user_67890', 'user_11111'].map((user, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{user}</p>
                      <p className="text-xs text-muted-foreground">Coins: 5,230 | Streak: 15 days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        Suspend
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Detection Tab */}
        <TabsContent value="fraud" className="space-y-4">
          <Card className="bg-card border-border border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Active Fraud Alerts
              </CardTitle>
              <CardDescription>Flagged accounts and suspicious activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fraudFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-destructive/20"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{flag.user}</p>
                    <p className="text-sm text-muted-foreground">{flag.reason}</p>
                    <p className="text-xs text-muted-foreground">{flag.flaggedAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`${
                        flag.severity === 'high'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-yellow-500/20 text-yellow-600'
                      }`}
                    >
                      {flag.severity}
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      Ban
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Manage and approve user-generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No pending content for moderation</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
