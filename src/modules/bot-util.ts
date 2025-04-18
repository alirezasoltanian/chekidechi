import type { Chat, Message } from "grammy/types";

import { bot } from "./setup";
import { bold, code, mention } from "@/constants";
import { cutoffWithNotice } from "@/lib/utils";

export const deleteMessage = (message: Message) => {
  return bot.api.deleteMessage(message.chat.id, message.message_id);
};
export const editMessage = async (message: Message, newText: string) => {
  try {
    await bot.api.editMessageText(
      message.chat.id,
      message.message_id,
      newText,
      {
        parse_mode: "Markdown", // or "HTML" based on your needs
        reply_markup: undefined,
      }
    );
  } catch (error) {
    console.error("Error editing message:", error);
  }
};
export const errorMessage = (chat: Chat, error?: string) => {
  if (chat.type !== "private") return;

  let message = bold("An error occurred.");
  if (error) message += `\n\n${code(cutoffWithNotice(error))}`;

  const tasks = [bot.api.sendMessage(chat.id, message, { parse_mode: "HTML" })];

  let adminMessage = `Error in chat ${mention("user", chat.id)}`;
  if (error) adminMessage += `\n\n${code(cutoffWithNotice(error))}`;

  console.error("Error in chat", chat.id, error);
  const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS
    ? process.env.ADMIN_CHAT_IDS.split(",")
    : [];
  if (ADMIN_CHAT_IDS.includes(chat.id.toString())) {
    tasks.push(
      bot.api.sendMessage(chat.id.toString(), adminMessage, {
        parse_mode: "HTML",
      })
    );
  }

  return Promise.all(tasks);
};
