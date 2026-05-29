'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { EarningManager } from '@/lib/earning-manager';
import { getRewardEmoji } from '@/lib/reward-utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'earning' | 'achievement' | 'referral' | 'milestone';
  amount?: number;
  icon: string;
  timestamp: number;
}

export function RewardNotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load notifications from storage
    const stored = localStorage.getItem(`notifications_${user.id}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Only show notifications from last 30 seconds
        const recent = data.filter((n: Notification) => Date.now() - n.timestamp < 30000);
        setNotifications(recent);
        setVisible(recent.length > 0);
      } catch (e) {
        console.log('[v0] Failed to load notifications');
      }
    }
  }, [user]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotif: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: Date.now(),
    };
    
    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    setVisible(true);

    if (user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify([newNotif]));
    }

    // Auto-hide after 5 seconds
    setTimeout(() => setVisible(false), 5000);
  };

  // Expose globally for reward triggers
  useEffect(() => {
    (window as any).addRewardNotification = addNotification;
  }, []);

  if (!visible || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-xs">
      {notifications.slice(0, 3).map((notif) => (
        <Card
          key={notif.id}
          className="bg-gradient-to-r from-accent/90 to-primary/90 border-0 text-white shadow-lg animate-in slide-in-from-right duration-300"
        >
          <div className="p-3 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{notif.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{notif.title}</p>
              <p className="text-xs opacity-90">{notif.message}</p>
              {notif.amount && (
                <p className="text-sm font-bold mt-1">+{notif.amount} coins</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Helper to trigger notifications from anywhere
export function triggerRewardNotification(
  type: 'earning' | 'achievement' | 'referral' | 'milestone',
  title: string,
  message: string,
  amount?: number,
  icon?: string
) {
  if (typeof window !== 'undefined' && (window as any).addRewardNotification) {
    (window as any).addRewardNotification({
      type,
      title,
      message,
      amount,
      icon: icon || '✨',
    });
  }
}
