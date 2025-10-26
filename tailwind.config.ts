import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sandstone: "#d9c9a9",
        "steel-gray": "#2f3b4c",
        "muted-green": "#7a9a8c",
        "mist": "#f4f1ea"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      boxShadow: {
        card: "0 10px 25px -15px rgba(15, 23, 42, 0.6)"
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addVariant }) => {
      addVariant("hocus", ["&:hover", "&:focus"]);
    })
  ]
};

export default config;
