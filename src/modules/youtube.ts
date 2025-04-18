import { t, tiktokArgs } from "@/constants";
import { removeHashtagsMentions } from "@/lib/utils";
import { downloadFromInfo, getInfo } from "@resync-tv/yt-dlp";
import { InlineKeyboard, InputFile, NextFunction } from "grammy";
import { deleteMessage, editMessage, errorMessage } from "./bot-util";
import { getThumbnail, getThumbnailFromUrl, urlMatcher } from "./media-util";
// import { bot } from "./setup";
import { sendAudio, sendDocument } from "@/actions/bale-api";
import { cookieArgs } from "@/lib/cookies";
import axios from "axios";
import { Queue } from "./queue";
import { MyContext } from "./setup";
import { checkAndDeductTokens, checkTokenAmount } from "@/actions/token";
import { after } from "next/server";
import { sendPhotoMessage, sendVideoMessage } from "@/actions/message-sender";

// Create an instance of Queue
const queue = new Queue();

export const getYoutubeInfo = async (
  url: string,
  additionalArgs: string[],
  limit: boolean
) => {
  const cookieArgsValue = await cookieArgs();
  const info = await getInfo(url, [
    "-f",
    "b", // Use 'best' instead of 'bestvideo+bestaudio/best'
    "--no-playlist",
    "--format-sort",
    "quality",
    "--prefer-free-formats",

    // "--skip-download",
    // "--write-subs",
    // "--sub-langs",
    // "en",
    // "--max-filesize",
    // "50M",
    ...cookieArgsValue,
    ...additionalArgs,
  ]);

  if (info.duration > 600 && limit) {
    throw new Error("Video duration exceeds 10 minutes.");
  }

  return info;
};
export const sendYoutubeVideoData = async (
  ctx: MyContext,
  next: NextFunction,
  moreInfo: boolean = false
) => {
  if (!ctx.session.youtubeVideoInfo) return await next();
  const url = ctx.session.youtubeVideoInfo.url;
  const [urlTest] = ctx.entities("url");
  if (!url) return await next();

  const processingMessage = await ctx.reply(t.processing, {
    disable_notification: true,
  });
  queue.add(async () => {
    try {
      const thumbnailUrl = getThumbnailFromUrl(url);

      let message = "";
      let titleVideo = "";
      if (moreInfo) {
        const info = await getYoutubeInfo(url, [], false);
        titleVideo = info.title;
        const uploadDate = new Date(info.release_timestamp * 1000);
        const gregorianDate = uploadDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const persianDate = uploadDate.toLocaleDateString("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        message =
          `👤 *کانال:* ${info.uploader}\n` +
          `📹 *عنوان:* ${info.title}\n` +
          `👍 *لایک:* ${info.like_count}\n` +
          `📅 *تاریخ انتشار (میلادی):* ${gregorianDate}\n` +
          `📅 *تاریخ انتشار (شمسی):* ${persianDate}\n\n` +
          `📅 *تاریخ انتشار (شمسی):* ${info.release_date}\n\n` +
          `👁️ *تعداد بازدید:* ${info.view_count}\n` +
          `⏳ *مدت زمان:* ${info.duration} ثانیه\n` +
          `🌍 *زبان:* ${info.language || "N/A"}\n` +
          `📝 *توضیحات:*\n${info.description?.substring(0, 300)}${
            info.description?.length > 300 ? "..." : ""
          }\n\n`;
      } else {
        message = "گزینه مورد نظر رو انتخاب کنید";
      }
      const fileName = titleVideo
        ? `${titleVideo.substring(0, 30)}_thumbnail.jpg`
        : "thumbnail.jpg";
      try {
        if (thumbnailUrl) {
          // ارسال تصویر به صورت فایل
          const keyboard = new InlineKeyboard()
            .row()
            .text("🎥 ویدیو", `download_video`)
            .text("🔉 صدا", `download_audio`)
            .row()
            .text("📃 زیرنویس", `download_subtitle`)
            .text("ℹ️ اطلاعات", `download_info`);
          const photo = new InputFile({ url: thumbnailUrl }, fileName);
          await sendPhotoMessage({
            ctx,
            inputFile: photo,
            options: {
              caption: message,
              reply_markup: keyboard,
            },
          });
        } else {
          await ctx.reply(message, { parse_mode: "Markdown" });
        }
      } catch (error) {
        await ctx.reply(message, { parse_mode: "Markdown" });
      }
    } catch (error) {
      return error instanceof Error
        ? errorMessage(ctx.chat, error.message)
        : errorMessage(ctx.chat, `Couldn't download ${url}`);
    } finally {
      await deleteMessage(processingMessage);
    }
  });
};
export const downloadYoutubeAudio = async (
  ctx: MyContext,
  next: NextFunction
) => {
  if (!ctx.session.youtubeVideoInfo) return await next();
  const url = ctx.session.youtubeVideoInfo.url;
  const [urlTest] = ctx.entities("url");
  if (!url) return await next();

  const processingMessage = await ctx.reply(t.processing, {
    disable_notification: true,
  });

  const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS
    ? process.env.ADMIN_CHAT_IDS.split(",")
    : [];
  if (ADMIN_CHAT_IDS.includes(ctx.chat?.id.toString() ?? "")) {
    ctx.forwardMessage(ctx.chat?.id.toString() ?? "", {
      disable_notification: true,
    });
  }

  queue.add(async () => {
    try {
      const isTiktok = urlMatcher(url, "tiktok.com");
      const isYouTubeMusic = urlMatcher(url, "music.youtube.com");
      const additionalArgs = isTiktok ? tiktokArgs : [];

      const info = await getYoutubeInfo(url, additionalArgs, true);

      const title = removeHashtagsMentions(info.title);

      const stream = downloadFromInfo(info, "-", [
        "-x",
        "--audio-format",
        "mp3",
      ]);
      const audio = new InputFile(stream.stdout);

      if (process.env.IS_YOUTUBE) {
        await ctx.replyWithAudio(audio, {
          caption: title,
          performer: info.uploader,
          title: info.title,
          thumbnail: getThumbnail(info.thumbnails),
          duration: info.duration,
          reply_parameters: {
            message_id: ctx.message?.message_id,
            allow_sending_without_reply: true,
          },
        });
      } else {
        await sendAudio(
          ctx.chat?.id ?? 0,
          stream.stdout,
          `${title}.mp3`,
          title,
          info.uploader,
          info.title
        );
      }
    } catch (error) {
      return error instanceof Error
        ? errorMessage(ctx.chat, error.message)
        : errorMessage(ctx.chat, `Couldn't download ${url}`);
    } finally {
      await deleteMessage(processingMessage);
    }
  });
};

export async function processYoutubeLink(ctx: MyContext, url: string) {
  let title = "";
  let author_name = "";
  const processingMsg = await ctx.reply("🔄 در حال دریافت اطلاعات ویدیو...");
  const chatId = ctx.chat.id;
  try {
    const checkTokenAmountResponse = await checkTokenAmount({
      chatId,
      token: 15,
    });
    if (!checkTokenAmountResponse) {
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply("❌ توکن شما کافی نیست.");
      return;
    }
    const videoInfo = await getYoutubeVideoInfo(url);
    if (!videoInfo) {
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply("❌ ویدیو یافت نشد.");
      return;
    }
    title = videoInfo?.title || "";
    author_name = videoInfo?.channelTitle || "";
    if (videoInfo?.duration) {
      // Convert ISO 8601 duration to minutes
      const durationMatch = videoInfo.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      let minutes = 0;
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]?.replace("H", "") || "0");
        const mins = parseInt(durationMatch[2]?.replace("M", "") || "0");
        const secs = parseInt(durationMatch[3]?.replace("S", "") || "0");
        minutes = hours * 60 + mins + Math.ceil(secs / 60);
      }

      if (minutes > 15) {
        await ctx.api.deleteMessage(chatId, processingMsg.message_id);
        await ctx.reply(
          "❌ مدت زمان ویدیو بیشتر از ۱۵ دقیقه است. لطفاً ویدیوی کوتاه‌تری را انتخاب کنید."
        );
        return;
      }
    }
    queue.add(async () => {
      // دریافت اطلاعات کلی ویدیو
      const YOUTUBE_API_SERVER =
        process.env.YOUTUBE_API_SERVER || "http://localhost:8000";

      const thumbnail_url = getThumbnailFromUrl(url);
      let captions = "";

      try {
        const captionsResponse = await axios.post(
          `${YOUTUBE_API_SERVER}/video-captions`,
          {
            url,
            languages: ["en"],
          }
        );
        captions = `1 ${captionsResponse.data}` || "";
      } catch (captionError) {
        // Fallback to Supadata API
        try {
          const supadataResponse = await axios.get(
            "https://api.supadata.ai/v1/youtube/transcript",
            {
              params: {
                url: url,
                text: true,
              },
              headers: {
                "x-api-key": process.env.SUPADATA_API_KEY,
              },
            }
          );
          console.log("supadataResponse", supadataResponse.data);
          captions = `2 ${supadataResponse.data.content}` || "";
        } catch (error) {
          console.log("errorerrorerrorerrorerror", error);
          captions = "";
        }
      }

      const videoData = {
        title: title,
        author_name,
        thumbnail_url: thumbnail_url,
        captions: captions || "",
        timestamps: [],
      };

      // ذخیره اطلاعات ویدیو در سشن
      ctx.session.youtubeVideoInfo = {
        url: url,
        title: videoData.title,
        captions: videoData.captions || "",
        timestamps: videoData.timestamps || [],
      };

      // ارسال اطلاعات ویدیو
      let message = "";
      message = `🎬 *${videoData.title}*\n\n`;
      message += `👤 *کانال:* ${videoData.author_name}\n`;

      if (videoData.thumbnail_url) {
        try {
          const keyboard = new InlineKeyboard().text(
            "📃 زیرنویس",
            `download_subtitle`
          );

          if (videoData.captions) {
            const captionPreview =
              videoData.captions.substring(0, 100) +
              (videoData.captions.length > 100 ? "..." : "");
            message += `📑 *بخشی از متن ویدیو:*\n\n${captionPreview}\n\n`;
          }
          message +=
            "✅ اکنون می‌توانید سؤال خود را درباره این ویدیو بپرسید و من با استفاده از هوش مصنوعی به شما پاسخ خواهم داد.";

          const fileName = `${videoData.title?.substring(0, 30)}_thumbnail.jpg`;
          const photo = new InputFile(
            { url: videoData.thumbnail_url },
            fileName
          );

          await sendPhotoMessage({
            ctx,
            inputFile: photo,
            options: {
              caption: message,
              reply_markup: keyboard,
            },
          });
        } catch (error) {
          await ctx.reply(message, { parse_mode: "Markdown" });
        }
      } else {
        // اگر thumbnail موجود نبود، فقط متن را ارسال کنیم
        await ctx.reply(message, { parse_mode: "Markdown" });
      }
      after(async () => {
        await checkAndDeductTokens(chatId, 15);
      });
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);

      ctx.session.waitingForYoutubeQuestion = true;
      ctx.session.youtubeActionMode = true;
    });
  } catch (error) {
    await ctx.api.deleteMessage(chatId, processingMsg.message_id);
    await ctx.reply(
      "❌ خطا در دریافت اطلاعات ویدیو. لطفاً مطمئن شوید لینک معتبر است و دوباره تلاش کنید."
    );
  }
}
export const downloadYoutubeSubtitle = async (
  ctx: MyContext,
  next: NextFunction
) => {
  if (!ctx.session.youtubeVideoInfo) return await next();
  const url = ctx.session.youtubeVideoInfo.url;
  if (!url) return await next();

  const chatId = ctx.chat.id;
  const processingMessage = await ctx.reply(t.processing, {
    disable_notification: true,
  });

  try {
    const captionsText = ctx.session.youtubeVideoInfo.captions;
    if (!captionsText) throw new Error("No captions available");
    const buffer = Buffer.from(captionsText, "utf-8");

    const fileName = `${ctx.session.youtubeVideoInfo.title}_captions.txt`;
    const inputFile = new InputFile(buffer, fileName);
    if (process.env.IS_TELEGRAM_BOT === "true") {
      await ctx.api.sendDocument(chatId, inputFile, {
        caption: "📄 متن کامل ویدیو به صورت فایل",
      });
    } else {
      await sendDocument(chatId, inputFile, "📄 متن کامل ویدیو به صورت فایل");
    }
  } catch (error) {
    return error instanceof Error
      ? errorMessage(ctx.chat, error.message)
      : errorMessage(ctx.chat, `Couldn't download ${url}`);
  } finally {
    await deleteMessage(processingMessage);
  }
};

export const downloadYoutube = async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.session.youtubeVideoInfo) return await next();
  const url = ctx.session.youtubeVideoInfo.url;
  const [urlTest] = ctx.entities("url");
  if (!url) return await next();

  const processingMessage = await ctx.reply(t.processing, {
    disable_notification: true,
  });

  const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS
    ? process.env.ADMIN_CHAT_IDS.split(",")
    : [];
  if (ADMIN_CHAT_IDS.includes(ctx.chat?.id.toString() ?? "")) {
    ctx.forwardMessage(ctx.chat?.id.toString() ?? "", {
      disable_notification: true,
    });
  }

  queue.add(async () => {
    try {
      const isTiktok = urlMatcher(url, "tiktok.com");
      const isYouTubeMusic = urlMatcher(url, "music.youtube.com");
      const additionalArgs = isTiktok ? tiktokArgs : [];

      const info = await getYoutubeInfo(url, additionalArgs, true);
      await editMessage(processingMessage, "...فایل دریافت شده از یوتیوب");

      const [download] = info.requested_downloads ?? [];
      if (!download || !download.url) throw new Error("No download available");

      const title = removeHashtagsMentions(info.title);

      if (download.vcodec !== "none" && !isYouTubeMusic) {
        let video: InputFile | string;

        if (isTiktok) {
          const stream = downloadFromInfo(info, "-");
          video = new InputFile(stream.stdout, title);
        } else {
          video = new InputFile({ url: download.url }, title);
        }
        await sendVideoMessage({
          ctx,
          inputFile: video,
          options: {
            caption: title,
            reply_parameters: {
              message_id: ctx.update.callback_query.message?.message_id ?? 0,
              allow_sending_without_reply: true,
            },
          },
        });
      } else if (download.acodec !== "none") {
        const stream = downloadFromInfo(info, "-", [
          "-x",
          "--audio-format",
          "mp3",
        ]);
        const audio = new InputFile(stream.stdout);

        if (process.env.IS_YOUTUBE) {
          await ctx.replyWithAudio(audio, {
            caption: title,
            performer: info.uploader,
            title: info.title,
            thumbnail: getThumbnail(info.thumbnails),
            duration: info.duration,
            reply_parameters: {
              message_id: ctx.message?.message_id,
              allow_sending_without_reply: true,
            },
          });
        } else {
          await sendAudio(
            ctx.chat?.id ?? 0,
            stream.stdout,
            `${title}.mp3`,
            title,
            info.uploader,
            info.title
          );
        }
      } else {
        throw new Error("No download available");
      }
    } catch (error) {
      return error instanceof Error
        ? errorMessage(ctx.chat, error.message)
        : errorMessage(ctx.chat, `Couldn't download ${url}`);
    } finally {
      await deleteMessage(processingMessage);
    }
  });
};
type YoutubeVideoInfo = {
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
};
export const extractYoutubeIdFromUrl = (url: string) => {
  // Handle standard YouTube URL format (youtube.com/watch?v=...)
  const standardMatch = url.match(/[?&]v=([^&]+)/);
  if (standardMatch) return standardMatch[1];

  // Handle shortened YouTube URL format (youtu.be/...)
  const shortenedMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortenedMatch) return shortenedMatch[1];

  throw new Error("Invalid YouTube URL");
};
export async function getYoutubeVideoInfo(
  videoUrl: string
): Promise<YoutubeVideoInfo | null> {
  try {
    // استخراج ID ویدیو از URL
    const videoId = extractYoutubeIdFromUrl(videoUrl);

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    if (!data.items || data.items.length === 0)
      throw new Error("Video not found");

    const video = data.items[0];

    return {
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high.url,
      duration: video.contentDetails.duration, // مقدار ISO 8601 (مثلاً PT5M30S)
      publishedAt: video.snippet.publishedAt,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
    };
  } catch (error) {
    return null;
  }
}
