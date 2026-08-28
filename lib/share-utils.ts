// Comprehensive Live TV and Referral Sharing Utilities

export interface ShareOptions {
  title: string
  text: string
  url: string
}

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin
  }
  return 'https://pinetwork-livetv.vercel.app'
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // 1. Try modern navigator.clipboard
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('[ShareUtils] navigator.clipboard failed, attempting fallback:', err)
    }
  }

  // 2. Fallback to hidden textarea execution
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('[ShareUtils] Clipboard copy error:', err)
    return false
  }
}

export async function shareContent(options: ShareOptions): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof window === 'undefined') return 'failed'

  // Attempt Web Share API if available (e.g. mobile Safari, Chrome, Pi Browser)
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(options)) {
    try {
      await navigator.share(options)
      return 'shared'
    } catch (err: any) {
      // If user aborted/cancelled the native sheet, don't show an error
      if (err?.name === 'AbortError') {
        return 'shared'
      }
      console.warn('[ShareUtils] Web Share API notice:', err)
    }
  }

  // Fallback to copying URL to clipboard
  const copied = await copyTextToClipboard(options.url)
  return copied ? 'copied' : 'failed'
}

export function getChannelShareUrl(channelId: string): string {
  const base = getAppBaseUrl()
  return `${base}/?channel=${encodeURIComponent(channelId)}`
}

export function getReferralShareUrl(referralCode: string): string {
  const base = getAppBaseUrl()
  return `${base}/?ref=${encodeURIComponent(referralCode)}`
}

export function getOrCreateAnonSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    const key = 'pi_livetv_anon_session_id';
    let id = localStorage.getItem(key);
    if (!id || id.length < 10) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}

export function getSocialShareLinks(url: string, title: string, text: string) {
  const fullText = `${text}\n${url}`
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(fullText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  }
}
