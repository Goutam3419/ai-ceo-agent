export interface RangoliTemplate {
  id: string;
  title: string;
  category: string; // matches RangoliCategory.key
  isPremium: boolean;
  previewBg: string; // hex color for the gallery thumbnail placeholder
  canvasJSON: object;
}

export const RANGOLI_TEMPLATES: RangoliTemplate[] = [
  {
    id: "yt-bold-red",
    title: "Bold Red Reveal",
    category: "youtube-thumbnail",
    isPremium: false,
    previewBg: "#1A1A1A",
    canvasJSON: {
      version: "5.3.0",
      background: "#1A1A1A",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 560,
          width: 1280,
          height: 160,
          fill: "#FF0000",
        },
        {
          type: "textbox",
          left: 60,
          top: 590,
          width: 1000,
          fontSize: 72,
          fontFamily: "Poppins",
          fontWeight: "700",
          fill: "#FFFFFF",
          text: "YOU WON'T BELIEVE THIS",
        },
      ],
    },
  },
  {
    id: "yt-clean-white",
    title: "Clean Minimal",
    category: "youtube-thumbnail",
    isPremium: true,
    previewBg: "#FFFFFF",
    canvasJSON: {
      version: "5.3.0",
      background: "#FFFFFF",
      objects: [
        {
          type: "textbox",
          left: 80,
          top: 260,
          width: 1100,
          fontSize: 84,
          fontFamily: "Poppins",
          fontWeight: "700",
          fill: "#1A1A1A",
          text: "How I Did It",
        },
        {
          type: "rect",
          left: 80,
          top: 420,
          width: 200,
          height: 12,
          fill: "#FF0000",
        },
      ],
    },
  },
  {
    id: "ig-post-gradient",
    title: "Gradient Announcement",
    category: "instagram-post",
    isPremium: false,
    previewBg: "#E1306C",
    canvasJSON: {
      version: "5.3.0",
      background: "#E1306C",
      objects: [
        {
          type: "textbox",
          left: 100,
          top: 440,
          width: 880,
          fontSize: 64,
          fontFamily: "Poppins",
          fontWeight: "700",
          fill: "#FFFFFF",
          textAlign: "center",
          text: "New Launch",
        },
      ],
    },
  },
  {
    id: "ig-post-quote",
    title: "Quote Card",
    category: "instagram-post",
    isPremium: true,
    previewBg: "#FCE4EC",
    canvasJSON: {
      version: "5.3.0",
      background: "#FCE4EC",
      objects: [
        {
          type: "textbox",
          left: 120,
          top: 400,
          width: 840,
          fontSize: 52,
          fontFamily: "Poppins",
          fontWeight: "600",
          fill: "#2B1B2E",
          textAlign: "center",
          text: '"Dream big, start small."',
        },
      ],
    },
  },
  {
    id: "ig-story-sale",
    title: "Sale Story",
    category: "instagram-story",
    isPremium: false,
    previewBg: "#D6336C",
    canvasJSON: {
      version: "5.3.0",
      background: "#D6336C",
      objects: [
        {
          type: "textbox",
          left: 100,
          top: 800,
          width: 880,
          fontSize: 96,
          fontFamily: "Poppins",
          fontWeight: "700",
          fill: "#FFFFFF",
          textAlign: "center",
          text: "50% OFF",
        },
        {
          type: "textbox",
          left: 100,
          top: 950,
          width: 880,
          fontSize: 40,
          fontFamily: "Inter",
          fill: "#FFFFFF",
          textAlign: "center",
          text: "Today only",
        },
      ],
    },
  },
  {
    id: "ig-story-tip",
    title: "Tip of the Day",
    category: "instagram-story",
    isPremium: true,
    previewBg: "#FFFBF7",
    canvasJSON: {
      version: "5.3.0",
      background: "#FFFBF7",
      objects: [
        {
          type: "textbox",
          left: 100,
          top: 700,
          width: 880,
          fontSize: 60,
          fontFamily: "Poppins",
          fontWeight: "700",
          fill: "#2B1B2E",
          textAlign: "center",
          text: "Tip of the Day",
        },
      ],
    },
  },
  {
    id: "fb-post-event",
    title: "Event Announcement",
    category: "facebook-post",
    isPremium: false,
    previewBg: "#1877F2",
    canvasJSON: {
      version: "5.3.0",
      background: "#1877F2",
      objects: [
        {
          type: "textbox",
          left: 80,
          top: 240,
          width: 1040,
          fontSize: 68,
          fontFamily: "Poppins",
          fontWeight: "700",
          fill: "#FFFFFF",
          text: "Join Us This Weekend",
        },
      ],
    },
  },
  {
    id: "fb-post-offer",
    title: "Special Offer",
    category: "facebook-post",
    isPremium: true,
    previewBg: "#2B1B2E",
    canvasJSON: {
      version: "5.3.0",
      background: "#2B1B2E",
      objects: [
        {
          type: "textbox",
          left: 80,
          top: 250,
          width: 1040,
          fontSize: 68,
          fontFamily: "Poppins",
          fontWeight: "700",
          fill: "#FFFBF7",
          text: "Limited Time Offer",
        },
      ],
    },
  },
];
