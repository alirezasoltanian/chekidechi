"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateUserTokens(chatId: string, token: number) {
  if (!chatId) {
    return { error: "شناسه کاربر الزامی است", data: "" };
  }

  if (!token || typeof token !== "number") {
    return { error: "مقدار توکن نامعتبر است", data: "" };
  }
  const user = await db.query.users.findFirst({
    where: eq(users.chatId, chatId),
  });
  if (!user) {
    return { error: "کاربر یافت نشد", data: "" };
  }
  const currentTokens = user.token || 0;
  const newTokens = currentTokens + token;

  await db
    .update(users)
    .set({
      gameStartAt: null,
      token: newTokens,
    })
    .where(eq(users.chatId, chatId));

  return { error: "", data: "توکن‌ها با موفقیت به‌روز شد" };
}

export async function getUser(chatId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.chatId, chatId),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      chatId: user.chatId,
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      token: user.token || 0,
      gameStartAt: user.gameStartAt ? new Date(user.gameStartAt) : new Date(),
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  } catch (error) {
    console.error("Error in getUser:", error);
    throw new Error("Failed to retrieve user");
  }
}
