export type ToolIconKey =
  | 'youtube'
  | 'facebook'
  | 'tiktok'
  | 'instagram'
  | 'x'
  | 'whatsapp'
  | 'linkedin'
  | 'pinterest'
  | 'snapchat'
  | 'telegram'
  | 'reddit'
  | 'twitch'
  | 'spotify'
  | 'globe';

export interface Tool {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  isCustom: boolean;
  createdAt: string;
  iconKey?: ToolIconKey;
}
