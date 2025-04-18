import { stat } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const path =
  process.env.NODE_ENV === "production"
    ? "../../vaaski-telegram-ytdl/cookies.txt"
    : "../../vaaski-telegram-ytdl/cookies.txt";
export const COOKIE_FILE = resolve(__dirname, path);
export const cookieArgs = async () => {
  try {
    const stats = await stat(COOKIE_FILE);
    if (stats.isFile()) {
      return ["--cookies", COOKIE_FILE];
    }
  } catch {}

  return [];
};
