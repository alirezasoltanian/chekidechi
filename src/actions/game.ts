"use server";

import { db } from "@/db";
import { leaderboard, users } from "@/db/schema";
import * as crypto from "crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import CryptoJS from "crypto-js";
import { updateUserTokens } from "./user";
export async function validateBaleWebAppData(initData: string) {
  // جدا کردن هش و داده‌های خام
  const initDataComponents = initData.split("&");
  const hashComponent = initDataComponents.find((c) => c.startsWith("hash="));

  if (!hashComponent) return false;

  const hash = decodeURIComponent(hashComponent.split("=")[1] || "");

  // ساخت رشته داده برای بررسی
  const dataCheckString = initDataComponents
    .filter((c) => !c.startsWith("hash="))
    .sort()
    .join("\n");

  // ساخت hmac با کلید بات شما
  const botToken = process.env.BOT_TOKEN!;
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // مقایسه هش‌ها
  return hmac === hash;
}

export async function checkResultGame({
  encryptedData,
  chatId,
  initData,
}: {
  encryptedData: string;
  chatId: string;
  initData: string;
}) {
  // const response = await validateBaleWebAppData(initData);
  // if (!response) return null;
  const decryptedData = CryptoJS.AES.decrypt(encryptedData, "alsolop").toString(
    CryptoJS.enc.Utf8
  );
  const [token] = decryptedData.split("-");

  await updateUserTokens(chatId, Number(token));
}
export async function setStartedAtGame({
  initData,
  chatId,
}: {
  initData: string;
  chatId: string;
}) {
  // const response = await validateBaleWebAppData(initData);
  // if (!response) return null;
  const user = await db
    .update(users)
    .set({
      gameStartAt: new Date(),
    })
    .where(eq(users.chatId, chatId))
    .returning();

  return user[0];
}
// actions/leaderboard.ts

export interface LeaderboardData {
  chatId: string;
  username: string;
  score: number;
  time: number;
  name: string;
  tokens: number;
}

export interface LeaderboardData {
  chatId: string;
  username: string;
  score: number;
  time: number;
  name: string;
  tokens: number;
}
export async function upsertLeaderboardEntry(data: LeaderboardData) {
  try {
    // بررسی وجود رکورد با chatId و name مشخص
    const existingEntry = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.chatId, data.chatId),
          eq(leaderboard.name, data.name)
        )
      )
      .limit(1);

    if (existingEntry.length > 0) {
      const currentEntry = existingEntry[0];
      if (
        currentEntry &&
        (data.score > currentEntry.score ||
          (currentEntry.score === data.score && currentEntry.time > data.time))
      ) {
        await db
          .update(leaderboard)
          .set({
            score: data.score,
            time: data.time,
            tokens: data.tokens,
            username: data.username, // به‌روزرسانی نام کاربری در صورت تغییر
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(leaderboard.chatId, data.chatId),
              eq(leaderboard.name, data.name)
            )
          );

        return {
          success: true,
          action: "updated",
          message: "رکورد با موفقیت به‌روزرسانی شد",
        };
      } else {
        return {
          success: true,
          action: "unchanged",
          message: "امتیاز جدید کمتر یا مساوی امتیاز قبلی است",
        };
      }
    } else {
      // اگر رکورد وجود نداشت، یک رکورد جدید ایجاد کن
      await db.insert(leaderboard).values({
        chatId: data.chatId,
        username: data.username,
        score: data.score,
        time: data.time,
        name: data.name,
        tokens: data.tokens,
      });

      return {
        success: true,
        action: "inserted",
        message: "رکورد جدید با موفقیت ثبت شد",
      };
    }
  } catch (error) {
    console.error("خطا در ثبت یا به‌روزرسانی رکورد:", error);
    return {
      success: false,
      error,
      message: "خطا در ثبت یا به‌روزرسانی رکورد",
    };
  }
}

export async function getUserRankInLeaderboard(
  chatId: string,
  gameName: string
) {
  try {
    // دریافت تمام رکوردها برای بازی مشخص
    const leaderboardEntries = await db
      .select()
      .from(leaderboard)
      .where(eq(leaderboard.name, gameName))
      .orderBy((desc(leaderboard.score), asc(leaderboard.time)));

    // پیدا کردن رتبه کاربر
    const userEntry = leaderboardEntries.find(
      (entry) => entry.chatId === chatId
    );
    if (!userEntry) {
      return {
        success: false,
        message: "کاربر در لیدربورد وجود ندارد",
      };
    }

    const rank =
      leaderboardEntries.findIndex((entry) => entry.chatId === chatId) + 1;
    return {
      success: true,
      rank,
      message: "رتبه کاربر با موفقیت دریافت شد",
    };
  } catch (error) {
    console.error("خطا در دریافت رتبه کاربر:", error);
    return {
      success: false,
      error,
      message: "خطا در دریافت رتبه کاربر",
    };
  }
}
export async function TopTwenty(gameName: string) {
  const leaderboardEntries = await db
    .select()
    .from(leaderboard)
    .where(eq(leaderboard.name, gameName))
    .orderBy((desc(leaderboard.score), asc(leaderboard.time)))
    .limit(20);
  return leaderboardEntries;
}
