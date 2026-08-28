'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CheckCircle2, ShieldCheck, Zap, Tv, Coins, RefreshCw, ArrowLeft, Info, Lock, Loader2, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { ProductCatalogItem } from '@/lib/db-types';
import { PI_NETWORK_CONFIG } from '@/lib/system-config';
import { getApiUrl } from '@/lib/api-config';

export default function PremiumPage() {
  const { user, premiumStatus, piAccessToken, syncPremiumStatus } = useAuth();
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const isPremium = Boolean(premiumStatus?.active);
  const isSandbox = PI_NETWORK_CONFIG.SANDBOX;

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(getApiUrl('/api/pi/products'));
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.products)) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.warn('Failed to load products catalog:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchCatalog();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPaymentError(null);
    try {
      await syncPremiumStatus();
    } catch (e) {
      console.warn('Failed to refresh entitlement:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handlePiPayment = async (product: ProductCatalogItem) => {
    setPurchasingProductId(product.productId);
    setPaymentStep('Preparing payment specifications...');
    setPaymentError(null);
    setPaymentSuccessMsg(null);

    try {
      // Step 1: Request payment specs from server
      const prepareRes = await fetch(getApiUrl('/api/pi/create-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${piAccessToken || ''}`,
        },
        body: JSON.stringify({ productId: product.productId }),
      });

      const prepareData = await prepareRes.json();
      if (!prepareRes.ok || !prepareData.success) {
        throw new Error(prepareData.error || 'Failed to prepare payment specs from server');
      }

      const { paymentData } = prepareData;

      // Check if window.Pi SDK is available
      if (typeof window === 'undefined' || !window.Pi || !window.Pi.createPayment) {
        throw new Error('Pi Browser SDK is unavailable. Please open inside Pi Browser app to pay with Pi.');
      }

      setPaymentStep('Opening Pi Payment window...');

      // Step 2: Trigger official Pi SDK window.Pi.createPayment
      window.Pi.createPayment(
        {
          amount: paymentData.amount,
          memo: paymentData.memo,
          metadata: paymentData.metadata,
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setPaymentStep('Server approving payment with Pi Network...');
            try {
              const approveRes = await fetch(getApiUrl('/api/pi/approve'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${piAccessToken || ''}`,
                },
                body: JSON.stringify({ paymentId, productId: product.productId }),
              });

              const approveData = await approveRes.json();
              if (!approveRes.ok || !approveData.success) {
                throw new Error(approveData.error || 'Server approval failed');
              }
              setPaymentStep('Approved! Please confirm transaction in your Pi Wallet...');
            } catch (appErr: any) {
              setPaymentError(appErr?.message || 'Failed server approval');
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setPaymentStep('Verifying blockchain transaction and granting Premium...');
            try {
              const completeRes = await fetch(getApiUrl('/api/pi/complete'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${piAccessToken || ''}`,
                },
                body: JSON.stringify({ paymentId, txid }),
              });

              const completeData = await completeRes.json();
              if (!completeRes.ok || !completeData.success) {
                throw new Error(completeData.error || 'Server completion verification failed');
              }

              setPaymentSuccessMsg(`🎉 Success! Premium membership granted for ${product.durationDays} days.`);
              setPaymentStep(null);
              await syncPremiumStatus();
            } catch (compErr: any) {
              setPaymentError(compErr?.message || 'Failed server verification');
            } finally {
              setPurchasingProductId(null);
            }
          },

          onCancel: async (paymentId: string) => {
            console.log('Payment cancelled by user:', paymentId);
            setPaymentStep(null);
            setPurchasingProductId(null);
            setPaymentError('Payment was cancelled in Pi Wallet.');

            try {
              await fetch(getApiUrl('/api/pi/cancel'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${piAccessToken || ''}`,
                },
                body: JSON.stringify({ paymentId }),
              });
            } catch (cErr) {
              // silent catch
            }
          },

          onError: (error: Error, payment?: any) => {
            console.error('Pi Payment SDK Error:', error, payment);
            setPaymentStep(null);
            setPurchasingProductId(null);
            setPaymentError(error?.message || 'An error occurred during Pi Payment.');
          },
        }
      );
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setPaymentStep(null);
      setPurchasingProductId(null);
      setPaymentError(err?.message || 'Could not initiate Pi Payment.');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      {/* Header */}
      <div className="bg-card/95 border-b border-border sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live TV</span>
          </Link>

          <div className="flex items-center gap-2">
            {isSandbox && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                Testnet Sandbox
              </Badge>
            )}

            <Badge className={isPremium ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-secondary text-secondary-foreground'}>
              {isPremium ? (
                <span className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                  PREMIUM PIONEER
                </span>
              ) : (
                'FREE PIONEER'
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-primary/10 border border-amber-500/20 p-6 sm:p-10 text-center shadow-lg">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 shadow-sm">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 fill-amber-400/20" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            PI LIVE TV PREMIUM
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Elevate your Live TV streaming with an ad-free experience, priority Watch Points rewards, and exclusive Pioneer privileges.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Revalidate Entitlement
            </Button>
          </div>
        </div>

        {/* Feedback banners */}
        {paymentError && (
          <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Payment Note</p>
              <p className="text-xs mt-0.5">{paymentError}</p>
            </div>
          </div>
        )}

        {paymentSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Entitlement Activated</p>
              <p className="text-xs mt-0.5">{paymentSuccessMsg}</p>
            </div>
          </div>
        )}

        {/* Current Entitlement Status */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Server-Authoritative Entitlement
              </CardTitle>
              <Badge variant={isPremium ? "default" : "outline"} className={isPremium ? "bg-amber-500 text-black font-bold" : ""}>
                {isPremium ? "Active" : "Free Plan"}
              </Badge>
            </div>
            <CardDescription>
              Verified for @{user?.piUsername || 'Pioneer'} via official Pi Browser authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground font-medium">Membership Tier</p>
                <p className="font-bold text-foreground mt-0.5">{isPremium ? "Premium Pioneer" : "Free Pioneer"}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground font-medium">Ad Experience</p>
                <p className={`font-bold mt-0.5 ${isPremium ? "text-emerald-400" : "text-amber-400"}`}>
                  {isPremium ? "Ad-Free Suppressed" : "Sponsor Banners Active"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground font-medium">Expiration Status</p>
                <p className="font-bold text-foreground mt-0.5">
                  {premiumStatus?.expiresAt
                    ? new Date(premiumStatus.expiresAt).toLocaleDateString()
                    : isPremium
                    ? "Lifetime / Unbound"
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pi Payment Subscription Products Catalog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Select Premium Plan</h2>
              <p className="text-xs text-muted-foreground">Pay with official Pi Cryptocurrency (π) via Pi Browser SDK</p>
            </div>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
              Official Pi Payment SDK
            </Badge>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-card animate-pulse rounded-2xl border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((prod) => {
                const isPurchasing = purchasingProductId === prod.productId;

                return (
                  <Card
                    key={prod.productId}
                    className={`bg-card border-border flex flex-col justify-between hover:border-amber-500/50 transition-all ${
                      prod.productId === 'premium_30d' ? 'border-amber-500/60 shadow-md ring-1 ring-amber-500/20' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      {prod.productId === 'premium_30d' && (
                        <div className="mb-2">
                          <Badge className="bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5">
                            MOST POPULAR
                          </Badge>
                        </div>
                      )}
                      <CardTitle className="text-lg font-bold text-foreground">{prod.name}</CardTitle>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-extrabold text-amber-400">{prod.pricePi}</span>
                        <span className="text-sm font-bold text-foreground">π</span>
                        <span className="text-xs text-muted-foreground ml-1">/ {prod.durationDays} days</span>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {prod.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>100% Ad-Free Streaming</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Priority Watch Points</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Premium Pioneer Badge</span>
                        </li>
                      </ul>

                      <Button
                        onClick={() => handlePiPayment(prod)}
                        disabled={Boolean(purchasingProductId)}
                        className={`w-full font-bold text-xs h-10 ${
                          prod.productId === 'premium_30d'
                            ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-sm'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                      >
                        {isPurchasing ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          `Upgrade with ${prod.pricePi} π`
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {paymentStep && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 font-bold text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>{paymentStep}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Verified by official Pi Network payment infrastructure and PI LIVE TV server
              </p>
            </div>
          )}
        </div>

        {/* Premium Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Tv className="w-4 h-4 text-primary" />
                100% Ad-Free Live TV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All sponsor banners, native stream ads, and promotional cards are completely suppressed across the entire application shell.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Priority Watch Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stream audit heartbeats automatically grant Watch Points rewards with priority server verification and higher daily thresholds.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Premium Pioneer Badge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Display an exclusive Premium Pioneer badge on your account header and profile across Pi Network interactions.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Future Exclusive Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get early access to future high-bitrate live channels, exclusive events, and premium streaming categories.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Concept Differentiation Box */}
        <Card className="bg-secondary/20 border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Understanding Ecosystem Assets
            </CardTitle>
            <CardDescription>
              Clear distinction between Watch Points, Premium Membership, and Pi Network Cryptocurrency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
              <Coins className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Watch Points (⭐)</p>
                <p className="text-xs text-muted-foreground">
                  In-app utility reward tokens earned by watching Live TV channels. Used for platform features, streak bonuses, and community achievements. Not converted directly into Premium status.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
              <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Premium Membership (👑)</p>
                <p className="text-xs text-muted-foreground">
                  A server-authoritative account entitlement status that unlocks an ad-free experience, exclusive badges, and priority privileges across Pi Live TV.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
              <span className="text-base font-bold text-primary shrink-0">π</span>
              <div>
                <p className="font-bold text-foreground">Pi Network (π)</p>
                <p className="text-xs text-muted-foreground">
                  The official cryptocurrency of the Pi Network ecosystem. Used for web3 payments and blockchain transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
