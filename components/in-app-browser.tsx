'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCcw, ExternalLink, Search, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InAppBrowser() {
  const [searchInput, setSearchInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [recentLinks, setRecentLinks] = useState<{ name: string; url: string }[]>([]);

  const quickLinks = [
    { name: 'Google', url: 'https://www.google.com', color: 'from-blue-500 to-blue-600', icon: '🔍' },
    { name: 'YouTube', url: 'https://www.youtube.com', color: 'from-red-500 to-red-600', icon: '▶️' },
    { name: 'Instagram', url: 'https://www.instagram.com', color: 'from-pink-500 to-purple-600', icon: '📷' },
    { name: 'X', url: 'https://x.com', color: 'from-gray-800 to-black', icon: '𝕏' },
    { name: 'Gmail', url: 'https://mail.google.com', color: 'from-red-500 to-red-600', icon: '✉️' },
    { name: 'Facebook', url: 'https://www.facebook.com', color: 'from-blue-600 to-blue-700', icon: 'f' },
  ];

  // Open link with universal deep linking strategy
  const openLink = useCallback((url: string, linkName?: string) => {
    setShowLoadingSpinner(true);
    setIsTransitioning(true);

    // Store recent link
    if (linkName) {
      setRecentLinks(prev => {
        const filtered = prev.filter(l => l.url !== url);
        return [{ name: linkName, url }, ...filtered].slice(0, 3);
      });
    }

    // YouTube app detection (special case - use app protocol)
    if (url.includes('youtube.com') && navigator.userAgent.includes('Android')) {
      const youtubeAppUrl = 'vnd.youtube://';
      
      // Try to open YouTube app first
      const timer = setTimeout(() => {
        // Fallback to browser if app doesn't respond
        window.location.href = url;
        setShowLoadingSpinner(false);
        setIsTransitioning(false);
      }, 500);

      window.location.href = youtubeAppUrl;

      // Cleanup
      return () => clearTimeout(timer);
    }

    // For all other links - use window.location.href (works reliably in Pi Browser)
    // This method works across Pi Browser, Android WebView, and standard browsers
    // No flags needed - direct navigation preserves sessions and avoids WebView restrictions
    window.location.href = url;

    // Minimal delay for smooth animation
    setTimeout(() => {
      setShowLoadingSpinner(false);
      setIsTransitioning(false);
    }, 800);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchInput)}`;
      openLink(searchUrl, 'Search');
      setSearchInput('');
    }
  }, [searchInput, openLink]);

  const handleQuickLink = useCallback((url: string, name: string) => {
    openLink(url, name);
  }, [openLink]);

  const handleGoHome = useCallback(() => {
    openLink('https://www.google.com', 'Google');
  }, [openLink]);

  const handleRefresh = useCallback(() => {
    if (recentLinks.length > 0) {
      const lastLink = recentLinks[0];
      openLink(lastLink.url, lastLink.name);
    }
  }, [recentLinks, openLink]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 flex flex-col">
      {/* Smooth transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/20 z-50 animate-fade-in" />
      )}

      {/* Browser Header - Sticky & Optimized */}
      <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          {/* Control Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoHome}
              className="p-2 hover:bg-secondary rounded-lg transition-colors active:scale-95"
              title="Home"
              aria-label="Go to Google"
            >
              <Globe className="w-5 h-5 text-foreground" />
            </button>

            <button
              onClick={handleRefresh}
              disabled={recentLinks.length === 0 || showLoadingSpinner}
              className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              title="Refresh last link"
              aria-label="Refresh"
            >
              <RotateCcw className={cn('w-5 h-5 text-foreground', showLoadingSpinner && 'animate-spin')} />
            </button>

            {showLoadingSpinner && (
              <div className="flex items-center gap-1.5 ml-2 animate-fade-in">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Opening...</span>
              </div>
            )}

            <button
              onClick={() => {
                if (recentLinks.length > 0) {
                  window.open(recentLinks[0].url, '_blank', 'noopener,noreferrer');
                }
              }}
              disabled={recentLinks.length === 0}
              className="p-2 hover:bg-secondary rounded-lg transition-colors ml-auto disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              title="Open in external browser"
              aria-label="Open externally"
            >
              <ExternalLink className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Search Bar - Optimized Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 border border-transparent hover:border-border transition-colors">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search Google..."
                className="flex-1 bg-transparent border-none outline-none py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Go
            </button>
          </form>

          {/* Quick Links - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {quickLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleQuickLink(link.url, link.name)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium text-white whitespace-nowrap transition-all hover:scale-105 active:scale-95 flex-shrink-0',
                  `bg-gradient-to-r ${link.color}`
                )}
              >
                <span className="mr-1">{link.icon}</span>
                {link.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-4 py-8">
        {recentLinks.length === 0 ? (
          // Initial State - Welcome Screen
          <div className="text-center space-y-6 max-w-md animate-fade-in">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Fast Browser</h1>
              <p className="text-sm text-muted-foreground">
                Open any website instantly. Click quick links or search Google to get started.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Quick Start</p>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.slice(0, 4).map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleQuickLink(link.url, link.name)}
                    className={cn(
                      'px-3 py-3 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 active:scale-95',
                      `bg-gradient-to-r ${link.color}`
                    )}
                  >
                    {link.icon} {link.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                ✓ Instant link opening
              </p>
              <p className="text-xs text-muted-foreground">
                ✓ Session preserved for login
              </p>
              <p className="text-xs text-muted-foreground">
                ✓ YouTube app support
              </p>
            </div>
          </div>
        ) : (
          // Recent Links State
          <div className="space-y-6 w-full max-w-md">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Recent Links</h2>
              <p className="text-xs text-muted-foreground">Tap to reopen</p>
            </div>

            <div className="space-y-2">
              {recentLinks.map((link) => (
                <button
                  key={link.url}
                  onClick={() => openLink(link.url, link.name)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors active:scale-95 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {link.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {new URL(link.url).hostname}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4">
              {quickLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleQuickLink(link.url, link.name)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 active:scale-95',
                    `bg-gradient-to-r ${link.color}`
                  )}
                >
                  {link.icon} {link.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-card border-t border-border px-4 py-2 text-center">
        <p className="text-xs text-muted-foreground">
          Links open in your device browser. Google login fully supported.
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 200ms ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
