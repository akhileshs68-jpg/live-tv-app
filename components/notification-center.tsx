'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationCenter({ notifications, onDismiss }: NotificationCenterProps) {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

function Notification({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(onDismiss, 300);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, onDismiss]);

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-accent" />,
    error: <AlertCircle className="w-5 h-5 text-destructive" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-primary" />,
  };

  const bgMap = {
    success: 'bg-accent/10 border-accent/30',
    error: 'bg-destructive/10 border-destructive/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    info: 'bg-primary/10 border-primary/30',
  };

  return (
    <Card
      className={cn(
        'bg-card border transition-all duration-300',
        bgMap[notification.type],
        isClosing && 'opacity-0 translate-x-full'
      )}
    >
      <CardContent className="p-4 flex items-start gap-3">
        {iconMap[notification.type]}
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-xs font-medium text-primary hover:text-primary/80 mt-2"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setIsClosing(true);
            setTimeout(onDismiss, 300);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
