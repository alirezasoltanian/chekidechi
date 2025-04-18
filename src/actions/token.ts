"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "./user";

export async function checkTokenAmount({
  chatId,
  token,
}: {
  chatId: number;
  token: number;
}) {
  const user = await getUser(chatId);

  if (!user || user.token < token) {
    return null; // توکن کافی نیست
  }
  return true;
}
// تابع بررسی و کسر توکن
export async function checkAndDeductTokens(
  chatId: number,
  token: number
): Promise<boolean> {
  try {
    // دریافت اطلاعات کاربر
    const user = await getUser(chatId);

    if (!user || user.token < token) {
      return false; // توکن کافی نیست
    }

    // کسر توکن
    await db
      .update(users)
      .set({
        token: user.token - token,
      })
      .where(eq(users.chatId, chatId.toString()));

    return true; // توکن با موفقیت کسر شد
  } catch (error) {
    console.error("Error checking and deducting tokens:", error);
    return false;
  }
}
