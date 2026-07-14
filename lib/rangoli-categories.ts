export interface RangoliCategory {
  key: string;
  name: string;
  emoji: string;
  colorClass: string; // tailwind bg class
  width: number;
  height: number;
}

export const RANGOLI_CATEGORIES: RangoliCategory[] = [
  {
    key: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    emoji: "▶️",
    colorClass: "bg-ytred",
    width: 1280,
    height: 720,
  },
  {
    key: "instagram-post",
    name: "Instagram Post",
    emoji: "📷",
    colorClass: "bg-igpink",
    width: 1080,
    height: 1080,
  },
  {
    key: "instagram-story",
    name: "Instagram Story",
    emoji: "📱",
    colorClass: "bg-igpink",
    width: 1080,
    height: 1920,
  },
  {
    key: "facebook-post",
    name: "Facebook Post",
    emoji: "👍",
    colorClass: "bg-fbblue",
    width: 1200,
    height: 630,
  },
];
