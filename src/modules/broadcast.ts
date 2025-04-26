import { Bot, InlineKeyboard, InputFile } from "grammy";
import { db } from "@/db";
import { type MyContext } from "./setup";
import { sendVideo } from "@/actions/bale-api";
import fs from "fs";

const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS
  ? process.env.ADMIN_CHAT_IDS.split(",")
  : [];

// تابع ارسال پیام به تمام کاربران
async function sendBroadcastMessage(bot: Bot<MyContext>, text: string) {
  // دریافت لیست تمام کاربران از دیتابیس
  const allUsers = await db.query.users
    .findMany
    //   {
    //   where: (users) => eq(users.chatId, "1576895162"),
    // }
    ();
  //   1014626950
  let successful = 0;
  let failed = 0;

  // ارسال پیام به هر کاربر با فاصله زمانی کوتاه برای جلوگیری از محدودیت‌های API

  for (const user of allUsers) {
    // const videoPath = "./public/videos/complete.mp4";
    // const videoBuffer = fs.readFileSync(videoPath);
    // const video = new InputFile(videoBuffer, "complete.mp4");
    try {
      // await sendVideo({
      //   chatId: Number(user.chatId),
      //   inputFile: video,
      //   caption: text,
      // });
      await bot.api.sendMessage(user.chatId, text);
      successful++;
      // if (user.token) {
      //   await db
      //     .update(users)
      //     .set({ token: user.token + 100 })
      //     .where(eq(users.chatId, user.chatId));
      // }

      // اضافه کردن تأخیر کوتاه بین ارسال‌ها برای جلوگیری از محدودیت سرعت API
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`خطا در ارسال پیام به کاربر ${user.chatId}:`, error);
      failed++;
    }
  }

  return { successful, failed };
}

// تابع اصلی برای ثبت دستورات ارسال انبوه
export function registerBroadcastHandlers(bot: Bot<MyContext>) {
  // دستور ارسال پیام به همه کاربران (فقط برای ادمین)
  bot.hears("/broadcast", async (ctx) => {
    const chatId = ctx.chat.id.toString();

    // بررسی دسترسی ادمین
    if (!ADMIN_CHAT_IDS.includes(chatId)) {
      await ctx.reply("❌ شما اجازه دسترسی به این دستور را ندارید.");
      return;
    }

    // فعال کردن حالت انتظار برای دریافت متن پیام
    ctx.session.waitingForBroadcastText = true;

    await ctx.reply(
      "📝 لطفاً متن پیامی که می‌خواهید به تمام کاربران ارسال شود را وارد کنید:"
    );
  });

  // دریافت متن پیام برای ارسال انبوه
  bot.on("message:text", async (ctx) => {
    // اگر کاربر در حالت انتظار برای ارسال متن پیام انبوه نیست، این هندلر را نادیده بگیر
    if (!ctx.session.waitingForBroadcastText) return;

    const chatId = ctx.chat.id.toString();

    // بررسی دسترسی ادمین
    if (!ADMIN_CHAT_IDS.includes(chatId)) {
      return;
    }

    // دریافت متن پیام
    const text = ctx.message?.text || "";

    // غیرفعال کردن حالت انتظار
    ctx.session.waitingForBroadcastText = false;

    // ارسال پیام تأیید با نمایش پیش‌نمایش پیام
    const keyboard = new InlineKeyboard()
      .text(
        "✅ تأیید و ارسال",
        `confirm_broadcast:${Buffer.from(text).toString("base64")}`
      )
      .row()
      .text("❌ لغو", "cancel_broadcast");

    await ctx.reply(
      "⚠️ آیا از ارسال پیام زیر به تمام کاربران اطمینان دارید؟\n\n" +
        "📝 پیش‌نمایش پیام:\n" +
        "———————————\n" +
        text +
        "\n———————————",
      { reply_markup: keyboard }
    );
  });

  // پردازش دکمه‌های تأیید یا لغو ارسال انبوه
  bot.callbackQuery(/confirm_broadcast:(.+)/, async (ctx) => {
    console.log("firstfirstfirstfirst");
    const chatId = ctx.chat?.id.toString();

    // بررسی دسترسی ادمین
    if (!chatId || !ADMIN_CHAT_IDS.includes(chatId)) {
      try {
        await ctx.answerCallbackQuery(
          "❌ شما اجازه دسترسی به این عملیات را ندارید."
        );
      } catch (error) {
        console.error("خطا در پاسخ به کالبک:", error);
      }
      return;
    }

    // دریافت متن پیام از داده‌های callback
    const base64Text = ctx.match[1];
    if (!base64Text) {
      try {
        await ctx.answerCallbackQuery("❌ خطا در پردازش داده‌ها.");
      } catch (error) {
        console.error("خطا در پاسخ به کالبک:", error);
      }
      return;
    }

    const broadcastText = Buffer.from(base64Text, "base64").toString();

    // حذف answerCallbackQuery اضافی
    // پیام را ویرایش کنید
    if (ctx.callbackQuery.message) {
      await ctx.api.editMessageText(
        chatId,
        ctx.callbackQuery.message.message_id,
        "🔄 در حال ارسال پیام به تمام کاربران..."
      );
    }

    try {
      const result = await sendBroadcastMessage(bot, broadcastText);
      await ctx.reply(
        `✅ پیام با موفقیت به ${result.successful} کاربر ارسال شد.\n` +
          `❌ ارسال ناموفق به ${result.failed} کاربر.`
      );
    } catch (error) {
      console.error("خطا در ارسال پیام انبوه:", error);
      await ctx.reply("❌ خطا در ارسال پیام. لطفاً دوباره تلاش کنید.");
    }
  });

  bot.callbackQuery("cancel_broadcast", async (ctx) => {
    const chatId = ctx.chat?.id.toString();

    // بررسی دسترسی ادمین
    if (!chatId || !ADMIN_CHAT_IDS.includes(chatId)) {
      try {
        await ctx.answerCallbackQuery(
          "❌ شما اجازه دسترسی به این عملیات را ندارید."
        );
      } catch (error) {
        console.error("خطا در پاسخ به کالبک:", error);
      }
      return;
    }

    if (ctx.callbackQuery.message) {
      await ctx.api.editMessageText(
        chatId,
        ctx.callbackQuery.message.message_id,
        "⛔ ارسال پیام لغو شد."
      );
    }
  });
}
