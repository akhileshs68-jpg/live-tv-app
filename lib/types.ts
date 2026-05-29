export interface Channel {
  id: string
  name: string
  logo: string
  url: string
  category: string
  country: string
  language: string
  isLive: boolean
  globalCategory?: string
}

export interface M3UPlaylist {
  channels: Channel[]
}
