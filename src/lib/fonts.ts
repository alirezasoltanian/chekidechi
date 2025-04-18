import localFont from "next/font/local";

// Font files can be colocated inside of `pages`
export const fontBase = localFont({
  src: "../assets/fonts/IRANSansWebFaNum-Light.woff2",
  variable: "--font-base",
});
export const fontMedium = localFont({
  src: "../assets/fonts/IRANSansWebFaNum-Medium.woff2",
  variable: "--font-medium",
});
