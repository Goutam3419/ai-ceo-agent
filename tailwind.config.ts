import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cloud: "#FBF9F5",
        ink: "#2D2A26",
        slate: "#6B675F",
        iris: "#6C5CE7",
        irissoft: "#EFECFF",
        photo: "#FF9F5A",
        video: "#2FBF9F",
        audio: "#FF6FA0",
        code: "#4C8DFF",
        blog: "#4CAF7D",
        website: "#A78BFA",
        // Rangoli brand — separate identity from CEO Agent
        rangolibg: "#FFFBF7",
        rangoliink: "#2B1B2E",
        rangoli: "#D6336C",
        rangolisoft: "#FCE4EC",
        ytred: "#FF0000",
        igpink: "#E1306C",
        fbblue: "#1877F2",
        waGreen: "#25D366",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        rangoli: ["var(--font-rangoli-display)"],
        rangolibody: ["var(--font-rangoli-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
