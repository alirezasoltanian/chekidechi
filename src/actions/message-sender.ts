import { InputFile } from "grammy";

import { MyContext } from "@/modules/setup";
import { sendVideo, sendPhoto } from "./bale-api";

type SendVideoParams = {
  ctx: MyContext;
  options: {
    caption?: string;
    reply_markup?: any;
    reply_parameters?: {
      message_id: number;
      allow_sending_without_reply: boolean;
    };
  };
} & (
  | { fileId: string; inputFile?: never }
  | { inputFile: InputFile; fileId?: never }
);

export async function sendVideoMessage({
  ctx,
  fileId,
  inputFile,
  options,
}: SendVideoParams) {
  if (process.env.IS_TELEGRAM_BOT === "true") {
    return await ctx.replyWithVideo(fileId || inputFile, {
      ...options,
      supports_streaming: true,
      duration: 0,
    });
  } else {
    return await sendVideo({
      chatId: ctx.chat?.id ?? 0,
      fileId,
      inputFile,
      caption: options.caption || "فایل دریافت شده",
      reply_markup: options.reply_markup,
    });
  }
}

type SendPhotoParams = {
  ctx: MyContext;
  options: {
    replyToMessageId?: number;
    caption?: string;
    reply_markup?: any;
  };
} & (
  | { fileId: string; inputFile?: never }
  | { inputFile: InputFile; fileId?: never }
);

export async function sendPhotoMessage({
  ctx,
  fileId,
  inputFile,
  options,
}: SendPhotoParams) {
  console.log("optionsoptionsoptions", options);
  if (process.env.IS_TELEGRAM_BOT === "true") {
    return await ctx.replyWithPhoto(fileId || inputFile, options);
  } else {
    if (!inputFile) {
      throw new Error("InputFile is required for Bale API");
    }
    return await sendPhoto({
      chatId: ctx.chat?.id ?? 0,
      inputFile,
      caption: options.caption || "تصویر دریافت شده",
      reply_markup: options.reply_markup,
    });
  }
}
