'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Bell, Lock, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    twoFactor: false,
    publicProfile: true,
  });

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pi Username</label>
                  <Input
                    value={user?.piUsername}
                    readOnly
                    className="bg-muted border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Wallet Address</label>
                  <Input
                    value={user?.walletAddress}
                    readOnly
                    className="bg-muted border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Joined</label>
                  <Input
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                    readOnly
                    className="bg-muted border-border"
                  />
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90">
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Account Statistics</CardTitle>
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
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <span className="font-bold text-accent">{user?.dailyStreak || 0} days</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Control how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Get alerts for rewards and achievements</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Email Updates</p>
                    <p className="text-sm text-muted-foreground">Weekly summary of your earnings</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Referral Notifications</p>
                    <p className="text-sm text-muted-foreground">Alert when someone joins your referral link</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">Promotions and special offers</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Protect your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Current Password</label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-input border-border"
                  />
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90">
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add extra security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-4">
                  Not Enabled
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone when you sign in.
                </p>
                <Button variant="outline" className="w-full">
                  Enable 2FA
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <Badge className="bg-accent/20 text-accent border-0">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium text-foreground">2 months ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
