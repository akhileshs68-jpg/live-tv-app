'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Bell, Shield, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, premiumStatus, isAdmin, logout } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isPremium = Boolean(premiumStatus?.active);

  const handleSavePreferences = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your Pi Network account and preferences</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Pi Network Identity</CardTitle>
                <CardDescription>Verified identity details from Pi Browser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pi Username</label>
                  <Input
                    value={user?.piUsername ? `@${user.piUsername}` : 'Pioneer Guest'}
                    readOnly
                    className="bg-muted border-border font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pi User ID</label>
                  <Input
                    value={user?.piUserId || user?.id || 'Unauthenticated'}
                    readOnly
                    className="bg-muted border-border font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Wallet Information</label>
                  <Input
                    value={user?.walletAddress || 'Pi Account Linked'}
                    readOnly
                    className="bg-muted border-border text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Authenticated</label>
                  <Input
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    readOnly
                    className="bg-muted border-border text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Reward Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Total Coins Earned</span>
                  <span className="font-bold text-accent">{user?.lifetimeEarnings?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                  <span className="font-bold text-primary">{user?.totalCoins?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Referral Earnings</span>
                  <span className="font-bold text-secondary">{user?.referralEarnings?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Daily Login Streak</span>
                  <span className="font-bold text-accent">{user?.dailyStreak || 1} days</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Control your in-app reward notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Reward Popups</p>
                    <p className="text-sm text-muted-foreground">Show coin popups when streaming channels</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Referral Bonus Alerts</p>
                    <p className="text-sm text-muted-foreground">Notify when a Pioneer joins using your code</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                </div>

                <Button onClick={handleSavePreferences} className="w-full bg-primary hover:bg-primary/90">
                  {saveSuccess ? 'Preferences Saved!' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Pi Authentication</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified Pioneer
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Membership Entitlement</p>
                    <p className="text-xs text-muted-foreground">{isPremium ? "Ad-Free Premium Pioneer" : "Free Pioneer (Sponsor Ads Enabled)"}</p>
                  </div>
                  <Button asChild size="sm" variant={isPremium ? "default" : "outline"} className={isPremium ? "bg-amber-500 text-black font-bold" : ""}>
                    <a href="/premium">
                      {isPremium ? "Premium Active" : "View Premium"}
                    </a>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Creator Studio & Channel</p>
                    <p className="text-xs text-muted-foreground">Manage your own broadcast channel, VOD videos, and 24/7 schedules</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="font-bold border-primary/40 text-primary hover:bg-primary/10">
                    <a href="/creator">
                      Creator Studio
                    </a>
                  </Button>
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-amber-400">Owner & Admin Dashboard</p>
                        <Badge className="bg-amber-500/20 text-amber-400 text-[10px] py-0 px-1.5 font-mono">
                          TRP & ANALYTICS
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Live TRP audience stats, channel management, and telemetry</p>
                    </div>
                    <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                      <a href="/admin">
                        Open Admin
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Session Management</CardTitle>
                <CardDescription>Sign out of this Pi Live TV session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out Session
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
