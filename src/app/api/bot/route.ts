// export const dynamic = "force-dynamic";

// export const fetchCache = "force-no-store";

import { checkAndDeductTokens, checkTokenAmount } from "@/actions/token";
import { db } from "@/db";
import { channelLists, channels, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Keyboard, InlineKeyboard, webhookCallback } from "grammy";
import { after } from "next/server";
import OpenAI from "openai";
import axios from "axios";
import { mdBold, mdItalic, t } from "@/constants";
import {
  downloadYoutube,
  downloadYoutubeAudio,
  downloadYoutubeSubtitle,
  processYoutubeLink,
  sendYoutubeVideoData,
} from "@/modules/youtube";
import { bot, MyContext } from "@/modules/setup";
import { deleteMessage } from "@/modules/bot-util";
import { Updater } from "@/modules/updater";

import { sendGhibliMeme } from "@/modules/ghibli-meme";
import {
  handleFeatureClick,
  sendAllFeatures,
  sendAllItems,
  createFeaturesKeyboard,
} from "@/modules/features";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
interface ChannelInfo {
  success: boolean;
  id?: number;
  title?: string;
  error?: string;
}

interface Message {
  text: string;
  date: number;
}

// تعریف نوع برای پست‌های کانال
interface ChannelPost {
  text?: string;
  image_url?: string;
  video_url?: string;
  post_id?: string;
  datetime?: string;
  error?: string;
}

// تعریف نوع برای session

const BASE_URL = process.env.BASE_URL!;
function finishPreviousMode(ctx: MyContext) {
  ctx.session.summarizationMode = false;
  ctx.session.collectiveSummarizationMode = false;
  ctx.session.collectiveTexts = [];
  ctx.session.lastCompleteButtonMessageId = undefined;
  ctx.session.waitingForQuestion = false;
  ctx.session.youtubeMode = false;
  ctx.session.youtubeActionMode = false;
  ctx.session.waitingForYoutubeQuestion = false;
  ctx.session.youtubeVideoInfo = undefined;
  ctx.session.editingState = undefined;
  ctx.session.channelListCreationMode = false;
  ctx.session.waitingForVideoForward = false;
  ctx.session.waitingForFileName = false;
  ctx.session.pendingVideo = undefined;
  ctx.session.waitingForFileId = false;
}
// اضافه کردن میدلور برای گزارش خطاها
bot.catch((err) => {
  console.error("خطا در بات:", err);
});

// اضافه کردن میدلور session

// اضافه کردن لاگ برای تمام پیام‌ها

bot.command("start", handleStart);

bot.hears("start", handleStart);
bot.hears("/start", handleStart);
// ثبت ماژول ارسال انبوه

// سپس دستورات را ثبت می‌کنیم (قبل از message handlers)

bot.command("help", async (ctx) => {
  const keyboard = createFeaturesKeyboard();
  await ctx.reply(
    "🔰 راهنمای استفاده از ربات:\n\n" +
      "1️⃣ برای خلاصه‌سازی پیام‌های یک کانال، کافیست دستور زیر را ارسال کنید:\n" +
      "/summarize @channelname\n\n" +
      "2️⃣ توجه داشته باشید که:\n" +
      "- ربات باید در کانال مورد نظر عضو باشد\n" +
      "- فقط 10 پیام آخر کانال خلاصه می‌شود\n" +
      "- خلاصه‌سازی ممکن است چند ثانیه طول بکشد\n\n" +
      "3️⃣ برای شروع مجدد می‌توانید از دستور /start استفاده کنید",
    {
      reply_markup: keyboard,
    }
  );
});
bot.command("about", async (ctx) => {
  await ctx.reply(
    "🤖 ربات خلاصه‌ساز کانال\n\n" +
      "نسخه: 1.0.0\n" +
      "توسعه‌دهنده: @YourUsername\n\n" +
      "این ربات با استفاده از هوش مصنوعی، پیام‌های کانال‌های بله را خلاصه می‌کند."
  );
});
bot.command("summarize", async (ctx) => {
  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length !== 2) {
    await ctx.reply(
      "لطفاً نام کانال را به این صورت وارد کنید: /summarize @channelname"
    );
    return;
  }

  const channelUsername = parts[1];
  await handleSummarizeCommand(ctx, channelUsername as string);
});

bot.hears("/cancel", async (ctx) => {
  if (ctx.session.summarizationMode) {
    ctx.session.summarizationMode = false;
    await ctx.reply("از حالت خلاصه‌سازی خارج شدید.");
  } else if (ctx.session.waitingForQuestion) {
    ctx.session.waitingForQuestion = false;
    ctx.session.collectiveTexts = [];
    await ctx.reply("از حالت پرسش و پاسخ خارج شدید.");
  } else if (ctx.session.collectiveSummarizationMode) {
    ctx.session.collectiveSummarizationMode = false;
    ctx.session.collectiveTexts = [];
    if (ctx.session.lastCompleteButtonMessageId) {
      try {
        await ctx.api.deleteMessage(
          ctx.chat.id,
          ctx.session.lastCompleteButtonMessageId
        );
      } catch (error) {
        // Error handling without console.log
      }
      ctx.session.lastCompleteButtonMessageId = undefined;
    }
    await ctx.reply("از حالت خلاصه‌ساز جمعی خارج شدید.");
  } else if (ctx.session.youtubeActionMode) {
    ctx.session.youtubeActionMode = false;
    await ctx.reply("از حالت یوتیوب خارج شدید.");
  } else if (ctx.session.youtubeMode) {
    ctx.session.youtubeMode = false;
    ctx.session.waitingForYoutubeQuestion = false;
    ctx.session.youtubeVideoInfo = undefined;
    await ctx.reply("از حالت چت با یوتیوب خارج شدید.");
  } else if (ctx.session.youtubeActionMode) {
    ctx.session.youtubeActionMode = false;
    await ctx.reply("از حالت یوتیوب خارج شدید.");
  } else {
    await ctx.reply("شما در هیچ حالت خاصی نیستید.");
  }
});

// بعد از دستورات، سایر handlers را ثبت می‌کنیم
bot.hears("start", handleStart);
bot.hears("/start", handleStart);
bot.hears("📝 خلاصه‌سازی متن", async (ctx) => {
  // ریست کردن سایر حالت‌ها
  ctx.session.collectiveSummarizationMode = false;
  ctx.session.waitingForQuestion = false;
  ctx.session.youtubeMode = false;
  ctx.session.waitingForYoutubeQuestion = false;
  ctx.session.youtubeVideoInfo = undefined;

  // فعال کردن حالت خلاصه‌سازی
  ctx.session.summarizationMode = true;

  await ctx.reply(
    "لطفاً متن مورد نظر خود را برای خلاصه‌سازی ارسال کنید.\n\nبرای خروج از حالت خلاصه‌سازی، دستور /cancel را ارسال کنید."
  );
});

// اضافه کردن هندلر برای دکمه بازی کن و توکن
bot.hears("🎮 سرگرمی و توکن", async (ctx) => {
  try {
    const keyboard = new InlineKeyboard()
      .webApp("تمام سرگرمیها", `${BASE_URL}`)
      .row()
      .webApp("گردونه شانس", `${BASE_URL}/wheel`)
      .webApp("میم ساز", `${BASE_URL}/meme`)
      .webApp("بسکتبال", `${BASE_URL}/basketball`);

    await ctx.reply(
      "با بازی کردن می‌توانید توکن رایگان دریافت کنید! روی دکمه زیر کلیک کنید:",
      { reply_markup: keyboard }
    );
  } catch (error) {
    await ctx.reply(
      "متأسفانه در حال حاضر امکان باز کردن بازی وجود ندارد. لطفاً بعداً تلاش کنید."
    );
  }
});

bot.hears("❓ راهنما", async (ctx) => {
  const keyboard = createFeaturesKeyboard();
  await ctx.reply(
    `${mdBold("سولوپ - دستیار هوشمند مدیریت محتوا")} 🤖\n\n` +
      `${mdItalic(
        "اگه کانال‌های زیادی داری که دوست داری دنبال کنی ولی وقت نمی‌کنی"
      )} ⏳${mdBold("، سولوپ به کمکت میاد!")} 🚀\n\n` +
      `با سولوپ می‌تونی:\n` +
      `• ${mdBold("همه‌ی اون‌ها رو یه جا جمع کنی")} 📌\n` +
      `• ${mdBold("خلاصه‌ای از مطالبشون داشته باشی")} 📖\n` +
      `• ${mdBold(
        "با پرسش و پاسخ، دقیقاً همون چیزایی که لازم داری رو استخراج کنی"
      )} 🎯\n\n` +
      `${mdItalic(
        "اینجا می‌تونی با بازی کردن سرگرم بشی و برای کارت توکن کسب کنی"
      )} 🎮💎`,
    {
      reply_markup: keyboard,
    }
  );
});

bot.hears("📋 ایجاد لیست کانال‌ها", async (ctx) => {
  finishPreviousMode(ctx);
  ctx.session.channelListCreationMode = true;
  const keyboard = new InlineKeyboard()
    .row()
    .copyText("کپی مثال", "@channel1 @channel2 name-of-list");
  await ctx.reply(
    "لطفاً لیست کانال‌ها تلگرامی و نام لیست را به این صورت وارد کنید:\n" +
      " @channel1 @channel2 @channel3 name-of-list\n\n" +
      "مثال:\n" +
      "@tech @news @science tech-news",
    {
      reply_markup: keyboard,
    }
  );
});
bot.hears("📜 نمایش لیست‌ها", async (ctx) => {
  finishPreviousMode(ctx);
  await showUserLists(ctx);
});
bot.hears("💬 چت با یوتیوب", async (ctx) => {
  ctx.session.youtubeMode = true;
  ctx.session.youtubeVideoInfo = undefined;
  ctx.session.waitingForYoutubeQuestion = false;
  ctx.session.collectiveSummarizationMode = false;
  ctx.session.summarizationMode = false;
  ctx.session.waitingForQuestion = false;

  if (ctx.session.lastCompleteButtonMessageId) {
    try {
      await ctx.api.deleteMessage(
        ctx.chat.id,
        ctx.session.lastCompleteButtonMessageId
      );
    } catch (error) {
      // Error handling without console.log
    }
    ctx.session.lastCompleteButtonMessageId = undefined;
  }

  await ctx.reply(
    "🎬 لطفاً لینک ویدیوی یوتیوب مورد نظر خود را ارسال کنید.\n\n" +
      "مثال: https://www.youtube.com/watch?v=tPZauAYgVRQ\n\n https://www.youtube.com/watch?v=4Leardp_AGc&pp=ygUNY2FudmFzIGdlbWluaQ%3D%3D\n\n" +
      "برای خروج از این حالت، دستور /cancel را ارسال کنید."
  );
});
bot.hears("🔴 یوتیوب", async (ctx) => {
  console.log("firstfirstfirst");

  ctx.session.youtubeMode = false;
  ctx.session.youtubeActionMode = true;
  ctx.session.youtubeVideoInfo = undefined;
  ctx.session.waitingForYoutubeQuestion = false;

  // Explicitly turn off other modes to avoid conflicts
  ctx.session.collectiveSummarizationMode = false;
  ctx.session.summarizationMode = false;
  ctx.session.waitingForQuestion = false;

  // Clean up any existing "end" messages
  if (ctx.session.lastCompleteButtonMessageId) {
    try {
      await ctx.api.deleteMessage(
        ctx.chat.id,
        ctx.session.lastCompleteButtonMessageId
      );
    } catch (error) {
      console.error("Error deleting previous message:", error);
    }
    ctx.session.lastCompleteButtonMessageId = undefined;
  }

  await ctx.reply(
    "🎬 لطفاً لینک ویدیوی یوتیوب مورد نظر خود را ارسال کنید.\n\n" +
      "مثال: https://www.youtube.com/watch?v=tPZauAYgVRQ\n\n https://www.youtube.com/watch?v=4Leardp_AGc&pp=ygUNY2FudmFzIGdlbWluaQ%3D%3D\n\n" +
      "برای خروج از این حالت، دستور /cancel را ارسال کنید."
  );
});

bot.hears("📚 خلاصه‌ساز جمعی", async (ctx) => {
  finishPreviousMode(ctx);
  ctx.session.collectiveSummarizationMode = true;
  ctx.session.collectiveTexts = [];
  ctx.session.lastCompleteButtonMessageId = undefined;

  await ctx.reply(
    "📚 حالت خلاصه‌ساز جمعی فعال شد.\n\n" +
      "🔹 متن‌های خود را یکی پس از دیگری ارسال کنید.\n" +
      "🔹 پس از هر متن، دکمه «/end» نمایش داده می‌شود.\n" +
      "🔹 هر زمان که خواستید به ارسال متن‌ها پایان دهید، روی دکمه «/end» کلیک کنید.\n\n" +
      "برای خروج از این حالت، دستور /cancel را ارسال کنید."
  );
});
bot.hears("💰 مانده توکن", async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const user = await db.query.users.findFirst({
      where: eq(users.chatId, chatId.toString()),
    });

    if (!user) {
      await ctx.reply("❌ شما هنوز در سیستم ثبت نشده‌اید.");
      return;
    }

    // نمایش تعداد توکن‌های کاربر
    await ctx.reply(`💰 موجودی توکن شما: ${user?.token || 0} توکن`);
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    await ctx.reply("❌ خطا در دریافت اطلاعات توکن. لطفاً دوباره تلاش کنید.");
  }
});
// registerBroadcastHandlers(bot);
// در آخر، message handler عمومی را ثبت می‌کنیم
const updater = new Updater();
bot.on(":web_app_data", async (ctx) => {
  try {
    const webAppData = ctx.message.web_app_data;

    if (!webAppData) {
      await ctx.reply("❌ داده‌ای از مینی‌اپ دریافت نشد.");
      return;
    }

    const data = JSON.parse(webAppData.data);

    if (data.action === "button_click") {
      await ctx.reply(`✅ عملیات موفق: کلیک در تاریخ ${data.timestamp}`);
    } else {
      await ctx.reply("✅ داده‌های شما با موفقیت دریافت شد.");
    }
  } catch (error) {
    await ctx.reply("❌ خطا در پردازش داده‌های مینی‌اپ.");
  }
});

bot.on("message:text", async (ctx, next) => {
  if (updater.updating) {
    const maintenanceNotice = await ctx.replyWithHTML(t.maintenanceNotice);
    await updater.updating;
    await deleteMessage(maintenanceNotice);
    await next();
  }

  console.log("Text message received:", ctx.message);
  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const isForwarded =
    "forward_from" in ctx.message || "forward_from_chat" in ctx.message;
  if (ctx.session.channelListCreationMode) {
    await handleCreateListCommand(ctx, text);
    ctx.session.channelListCreationMode = false;
    return;
  }
  if (isForwarded && ctx.session.collectiveSummarizationMode === true) {
    // اضافه کردن متن به آرایه متن‌ها
    if (!ctx.session.collectiveTexts) {
      ctx.session.collectiveTexts = [];
    }
    ctx.session.collectiveTexts.push(text);

    // حذف دکمه تمام قبلی اگر وجود داشته باشد
    if (ctx.session.lastCompleteButtonMessageId) {
      try {
        await ctx.api.deleteMessage(
          chatId,
          ctx.session.lastCompleteButtonMessageId
        );
      } catch (error) {
        console.error("Error deleting previous complete button:", error);
      }
    }
    // تنظیم پیام بر اساس تعداد پیام‌های فوروارد شده
    const messageCount = ctx.session.collectiveTexts.length;
    if (messageCount === 1) {
      const confirmationMessage =
        messageCount > 1
          ? `✅ پیام های فوروارد شده دریافت شد. برای اتمام ارسال متن‌ها و مشاهده گزینه‌ها، روی /end کلیک کنید.`
          : "✅ پیام فوروارد شده دریافت شد. برای اتمام ارسال متن‌ها و مشاهده گزینه‌ها، روی /end کلیک کنید.";
      const completeMsg = await ctx.reply(confirmationMessage);
      ctx.session.lastCompleteButtonMessageId = completeMsg.message_id;
    }

    return;
  }

  // پردازش دستور تمام در حالت خلاصه‌ساز جمعی
  if (text === "/end" && ctx.session.collectiveSummarizationMode) {
    await handleCompleteCommand(ctx);
    return;
  }

  // Check if user is in edit mode
  const editingState = ctx.session.editingState;
  if (editingState) {
    await confirmEdit(ctx, text);
    return;
  }

  // فقط اگر کاربر در حالت خلاصه‌سازی باشد، متن را خلاصه کن
  // این شرط باید قبل از بررسی حالت چت با یوتیوب قرار بگیرد
  if (ctx.session.summarizationMode === true && !text.startsWith("/")) {
    // Send "در حال خلاصه‌سازی" message and store its message ID
    const processingMsg = await ctx.reply("🔄 در حال خلاصه‌سازی متن...");

    try {
      const summary = await summarizeText(text, chatId);
      if (!summary) {
        await ctx.reply("❌ توکن شما کافی نیست.");
        return;
      }
      // Delete the processing message
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      // Send the summary
      await ctx.reply(
        `📝 خلاصه متن شما:\n\n${summary}\n\n برای خلاصه‌سازی متن دیگر، آن را ارسال کنید یا برای خروج /cancel را بزنید.`
      );
    } catch (error) {
      // If there's an error, delete the processing message and show error
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply(
        "❌ متأسفانه در خلاصه‌سازی متن خطایی رخ داد. لطفاً دوباره تلاش کنید."
      );
    }
    return;
  }
  console.log(
    "firstfirstfirst1",
    ctx.session.youtubeMode,
    ctx.session.youtubeActionMode
  );

  // بررسی حالت چت با یوتیوب - این باید بعد از بررسی حالت خلاصه‌سازی قرار بگیرد
  if (ctx.session.youtubeMode === true && !text.startsWith("/")) {
    if (isYoutubeLink(text)) {
      console.log("thirdthirdthird1");
      await processYoutubeLink(ctx, text);
    } else if (ctx.session.waitingForYoutubeQuestion) {
      await answerYoutubeQuestion(ctx, text);
    } else {
      await ctx.reply(
        "❌ لطفاً یک لینک معتبر یوتیوب ارسال کنید.\n" +
          "مثال: https://www.youtube.com/watch?v=tPZauAYgVRQ\n\nhttps://www.youtube.com/watch?v=4Leardp_AGc&pp=ygUNY2FudmFzIGdlbWluaQ%3D%3D https://www.youtube.com/watch?v=4Leardp_AGc&pp=ygUNY2FudmFzIGdlbWluaQ%3D%3D\n\n" +
          "برای خروج از این حالت، دستور /cancel را ارسال کنید."
      );
    }
    return;
  }
  if (ctx.session.youtubeActionMode === true && !text.startsWith("/")) {
    if (isYoutubeLink(text)) {
      ctx.session.youtubeVideoInfo = { url: text };
      await sendYoutubeVideoData(ctx, next);
      return;
    } else {
      await ctx.reply("❌ لینک معتبر وارد کنید");
    }
    return;
  }

  // پردازش سؤال در حالت پرسش و پاسخ
  if (ctx.session.waitingForQuestion && !text.startsWith("/")) {
    const question = text;
    const texts = ctx.session.collectiveTexts || [];

    // غیرفعال کردن حالت انتظار برای سؤال - موقتاً این خط را کامنت می‌کنیم
    // ctx.session.waitingForQuestion = false;

    // همچنین خلاصه‌ساز جمعی را هم غیرفعال می‌کنیم تا سؤال به عنوان متن جدید در نظر گرفته نشود
    ctx.session.collectiveSummarizationMode = false;

    if (texts.length === 0) {
      await ctx.reply("هیچ متنی برای پاسخ به سؤال یافت نشد.");
      return;
    }

    // ارسال پیام در حال پردازش
    const processingMsg = await ctx.reply("🔄 در حال پردازش سؤال شما...");

    try {
      const answer = await answerQuestionBasedOnTexts(question, texts, chatId);
      // حذف پیام در حال پردازش
      await ctx.api.deleteMessage(ctx.chat.id, processingMsg.message_id);
      // ارسال پاسخ
      await ctx.reply(
        `📝 پاسخ سؤال شما:\n\n${answer}\n\n📌 شما می‌توانید سؤال دیگری بپرسید یا برای خروج از حالت پرسش و پاسخ، /cancel را ارسال کنید.`
      );

      // پاکسازی داده‌ها را انجام نمی‌دهیم تا بتوان سؤالات بیشتری پرسید
      // ctx.session.collectiveTexts = [];
    } catch (error) {
      // در صورت خطا، حذف پیام در حال پردازش و نمایش خطا
      await ctx.api.deleteMessage(ctx.chat.id, processingMsg.message_id);
      await ctx.reply(
        "❌ متأسفانه در پاسخگویی به سؤال شما خطایی رخ داد. لطفاً دوباره تلاش کنید."
      );
    }
    return;
  }
  if (
    ctx.session.collectiveSummarizationMode === true &&
    !text.startsWith("/")
  ) {
    if (!ctx.session.collectiveTexts) {
      ctx.session.collectiveTexts = [];
    }
    ctx.session.collectiveTexts.push(text);
    if (ctx.session.lastCompleteButtonMessageId) {
      try {
        await ctx.api.deleteMessage(
          chatId,
          ctx.session.lastCompleteButtonMessageId
        );
      } catch (error) {
        console.error("Error deleting previous complete button:", error);
      }
    }
    const keyboard = new InlineKeyboard()
      .row()
      .text("اتمام ارسال پیام", `end_task`);

    const completeMsg = await ctx.reply(
      "متن شما دریافت شد. برای اتمام ارسال متن‌ها و مشاهده گزینه‌ها، روی /end کلیک کنید.",
      { reply_markup: keyboard }
    );
    ctx.session.lastCompleteButtonMessageId = completeMsg.message_id;

    return;
  }

  // اگر کاربر در هیچ حالتی نیست، هیچ اقدامی انجام نده
});

// تابع مجزا برای پردازش دستور start
async function handleStart(ctx: MyContext) {
  ctx.session.summarizationMode = false;
  ctx.session.collectiveSummarizationMode = false;
  ctx.session.collectiveTexts = [];
  ctx.session.lastCompleteButtonMessageId = undefined;
  ctx.session.waitingForQuestion = false;
  ctx.session.youtubeActionMode = false;
  ctx.session.youtubeMode = false;
  ctx.session.waitingForYoutubeQuestion = false;
  ctx.session.youtubeVideoInfo = undefined;
  ctx.session.editingState = undefined;

  try {
    const keyboard = new Keyboard()
      .text("📝 خلاصه‌سازی متن")
      .text("📚 خلاصه‌ساز جمعی")
      .row()
      .text("🎮 سرگرمی و توکن")
      .text("💰 مانده توکن")
      .row()
      .text("📋 ایجاد لیست کانال‌ها")
      .text("📜 نمایش لیست‌ها")
      .row()
      .text("💬 چت با یوتیوب")
      .row()
      .text("❓ راهنما")
      .resized();
    if (ctx.chat) {
      const chatId = ctx.chat.id;
      const existingUser = await db.query.users.findFirst({
        where: eq(users.chatId, chatId.toString()),
      });
      if (!existingUser) {
        await db.insert(users).values({
          chatId: chatId.toString(),
          username: ctx.from?.username || null,
          firstName: ctx.from?.first_name || null,
          lastName: ctx.from?.last_name || null,
          token: 200,
        });
        const firstName = ctx.from?.first_name || "کاربر";
        await ctx.reply(
          `👋 سلام ${firstName}! خوش آمدید!\n` +
            ' ربات "چکیده‌چی" هستم. می‌تونی درباره مطالب مختلف با من پرسش و پاسخ داشته باشی یا اینکه من برات خلاصه‌شون کنم. برای آشنایی بیشتر، به لیست دکمه‌ها برو.\nاگر نیاز به راهنمایی داشتی، می‌تونی روی "راهنما ❓" کلیک کنی. 😊\n' +
            `شما در حال حاضر 200 توکن دارید تا از کاربردهای این بازو استفاده کنی و می‌توانید با بازی کردن توکن‌های بیشتری کسب کنید.`,
          { reply_markup: keyboard }
        );
      }
    }

    await ctx.reply(
      'سلام! 👋\nمن ربات "چکیده‌چی" هستم. می‌تونی درباره مطالب مختلف با من پرسش و پاسخ داشته باشی یا اینکه من برات خلاصه‌شون کنم. برای آشنایی بیشتر، به لیست دکمه‌ها برو.\nاگر نیاز به راهنمایی داشتی، می‌تونی روی "راهنما ❓" کلیک کنی. 😊',
      {
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    // Error handling without console.log
  }
}

// پردازش callback queries
bot.on("callback_query", async (ctx, next) => {
  const data = ctx.callbackQuery.data;

  if (!data) {
    await ctx.reply("خطا در پردازش درخواست");
    return;
  }

  if (data === "summarize_channel_messages") {
    if (
      !ctx.session.collectiveTexts ||
      ctx.session.collectiveTexts.length === 0
    ) {
      await ctx.reply("❌ متنی برای خلاصه‌سازی یافت نشد.");
      return;
    }

    const processingMsg = await ctx.reply("🔄 در حال خلاصه‌سازی پیام‌ها...");

    try {
      const summary = await summarizeCollectiveTexts(
        ctx.session.collectiveTexts,
        ctx.chat.id
      );
      if (!summary) {
        await ctx.reply("❌ توکن شما کافی نیست.");
        return;
      }
      await ctx.api.deleteMessage(ctx.chat.id, processingMsg.message_id);
      await ctx.reply(`📝 خلاصه پیام‌ها:\n\n${summary}`);
    } catch (error) {
      await ctx.api.deleteMessage(ctx.chat.id, processingMsg.message_id);
      await ctx.reply("❌ خطا در خلاصه‌سازی پیام‌ها.");
    }
  } else if (data === "qa_channel_messages") {
    ctx.session.waitingForQuestion = true;
    await ctx.reply(
      "🤔 لطفاً سؤال خود را درباره پیام‌های نمایش داده شده بپرسید.\n" +
        "برای خروج از حالت پرسش و پاسخ، دستور /cancel را ارسال کنید."
    );
  } else if (data === "back_to_main") {
    // حذف answerCallbackQuery
    await ctx.reply("بازگشت به منوی اصلی");
    // ارسال منوی اصلی
    const keyboard = new Keyboard()
      .text("📝 خلاصه‌سازی متن")
      .text("📚 خلاصه‌ساز جمعی")
      .row()
      .text("🎮 سرگرمی و توکن")
      .text("💰 مانده توکن")
      .row()
      .text("📋 ایجاد لیست کانال‌ها")
      .text("📜 نمایش لیست‌ها")
      .row()
      .text("💬 چت با یوتیوب")
      .row()
      .text("❓ راهنما")
      .resized();

    await ctx.reply("لطفاً یکی از گزینه‌های زیر را انتخاب کنید:", {
      reply_markup: keyboard,
    });
  } else if (data === "back_to_lists") {
    // حذف answerCallbackQuery
    await showUserLists(ctx);
  } else if (data.startsWith("show_list_channels_")) {
    // حذف answerCallbackQuery
    const listId = parseInt(data.replace("show_list_channels_", ""));
    await showListChannels(ctx, listId);
  } else if (data.startsWith("delete_list_")) {
    // حذف answerCallbackQuery
    const listId = parseInt(data.replace("delete_list_", ""));
    await deleteList(ctx, listId);
  } else if (data.startsWith("edit_list_")) {
    // حذف answerCallbackQuery
    const listId = parseInt(data.replace("edit_list_", ""));
    await startEditList(ctx, listId);
  } else if (data === "cancel_edit") {
    // حذف answerCallbackQuery
    await cancelEdit(ctx);
  } else if (data.startsWith("activity_list_")) {
    // حذف answerCallbackQuery
    const listId = parseInt(data.replace("activity_list_", ""));

    const keyboard = new InlineKeyboard()
      .row()
      .text("5 پیام آخر", `activity_5_${listId}`)
      .row()
      .text("3 پیام آخر", `activity_3_${listId}`)
      .row()
      // .text("📅 پیام‌های امروز", `activity_today_${listId}`)
      // .row()
      .text("🔙 بازگشت به لیست‌ها", "show_lists");

    await ctx.reply(
      "🔍 لطفاً تعداد پیام‌های آخر هر کانال را که می‌خواهید بررسی شوند انتخاب کنید:",
      { reply_markup: keyboard }
    );
  } else if (data.startsWith("activity_5_")) {
    // حذف answerCallbackQuery
    const listId = parseInt(data.replace("activity_5_", ""));
    await processChannelMessages(ctx, listId, 5);
  } else if (data.startsWith("activity_3_")) {
    // حذف answerCallbackQuery
    const listId = parseInt(data.replace("activity_3_", ""));
    await processChannelMessages(ctx, listId, 3);
  } else if (data.startsWith("activity_today_")) {
    // حذف answerCallbackQuery
    const listId = parseInt(data.replace("activity_today_", ""));
    await processChannelMessages(ctx, listId, "today");
  } else if (data === "ghibli-mode") {
    await ctx.reply("ghibli-mode");
    sendGhibliMeme(ctx);
  } else if (data === "collective_summarize") {
    if (
      !ctx.session.collectiveTexts ||
      ctx.session.collectiveTexts.length === 0
    ) {
      await ctx.reply("هیچ متنی برای خلاصه‌سازی یافت نشد.");
      return;
    }

    // ارسال پیام در حال پردازش
    const processingMsg = await ctx.reply("🔄 در حال خلاصه‌سازی متن‌ها...");

    if (!ctx?.chat?.id) return;
    try {
      const summary = await summarizeCollectiveTexts(
        ctx.session.collectiveTexts,
        ctx?.chat?.id
      );
      if (!summary) {
        await ctx.reply("❌ توکن شما کافی نیست.");
        return;
      }
      // حذف پیام در حال پردازش
      await ctx.api.deleteMessage(ctx?.chat?.id, processingMsg.message_id);
      // ارسال خلاصه
      await ctx.reply(`📝 خلاصه متن‌های شما:\n\n${summary}`);

      // پاکسازی داده‌های خلاصه‌ساز جمعی و خروج از حالت
      ctx.session.collectiveSummarizationMode = false;
      ctx.session.collectiveTexts = [];
    } catch (error) {
      // در صورت خطا، حذف پیام در حال پردازش و نمایش خطا
      await ctx.api.deleteMessage(ctx?.chat?.id, processingMsg.message_id);
      await ctx.reply(
        "❌ متأسفانه در خلاصه‌سازی متن‌ها خطایی رخ داد. لطفاً دوباره تلاش کنید."
      );
    }
  } else if (data === "end_task") {
    await handleCompleteCommand(ctx);
  } else if (data === "collective_qa") {
    if (
      !ctx.session.collectiveTexts ||
      ctx.session.collectiveTexts.length === 0
    ) {
      await ctx.reply("هیچ متنی برای پرسش و پاسخ یافت نشد.");
      return;
    }

    ctx.session.waitingForQuestion = true;

    await ctx.reply(
      "سؤال خود را درباره متن‌های ارسالی بنویسید. ربات با استفاده از اطلاعات موجود در متن‌ها به شما پاسخ خواهد داد."
    );
  } else if (data === "download_video") {
    console.log("downloaddownloaddownload");
    await downloadYoutube(ctx, next);
  } else if (data === "download_audio") {
    await downloadYoutubeAudio(ctx, next);
  } else if (data === "download_subtitle") {
    console.log("download_subtitle", ctx.session.youtubeVideoInfo?.url);
    await downloadYoutubeSubtitle(ctx, next);
  } else if (data === "download_info") {
    await sendYoutubeVideoData(ctx, next, true);
  } else if (data.startsWith("feature_")) {
    const featureIndex = parseInt(data.replace("feature_", ""));
    await handleFeatureClick(ctx, featureIndex);
  } else if (data === "all_features") {
    await sendAllFeatures(ctx);
  } else if (data === "all_items") {
    await sendAllItems(ctx);
  }
});
bot.on("message", async (ctx) => {
  console.log("Received message:", {
    type: ctx.message?.web_app_data ? "web_app_data" : "other",
    data: ctx.message,
  });
});
async function showUserLists(ctx: MyContext) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    const userLists = await db.query.channelLists.findMany({
      where: eq(channelLists.userId, chatId.toString()),
    });

    if (!userLists || userLists.length === 0) {
      await ctx.reply("شما هنوز هیچ لیستی نساخته‌اید!");
      return;
    }

    const keyboard = new InlineKeyboard();

    userLists.forEach((list) => {
      keyboard.row().text(`📋 ${list.name}`, `show_list_channels_${list.id}`);
    });

    keyboard.row().text("🔙 بازگشت به منوی اصلی", "back_to_main");

    await ctx.reply(
      "لیست‌های شما:\nبرای مشاهده کانال‌های هر لیست، روی آن کلیک کنید.",
      { reply_markup: keyboard }
    );
  } catch (error) {
    console.error("Error showing user lists:", error);
    await ctx.reply("❌ خطا در نمایش لیست‌ها. لطفاً دوباره تلاش کنید.");
  }
}

// خلاصه‌سازی متن‌های جمعی
async function summarizeCollectiveTexts(
  texts: string[],
  chatId: number
): Promise<string | null> {
  try {
    const allTexts = texts.join("\n\n---------\n\n");
    const checkTokenAmountResponse = await checkTokenAmount({
      chatId,
      token: 10,
    });
    if (!checkTokenAmountResponse) {
      return null;
    }

    const response = await openai.chat.completions.create({
      model: process.env.DEFAULT_MODEL!,
      messages: [
        {
          role: "system",
          content:
            "خلاصه‌ای جامع و مفید از مجموعه متن‌های زیر ارائه دهید. مهم‌ترین نکات را استخراج کنید و ارتباط میان آن‌ها را نشان دهید.",
        },
        {
          role: "user",
          content: allTexts,
        },
      ],
      max_tokens: 1000,
    });
    after(async () => {
      await checkAndDeductTokens(chatId, response.usage?.total_tokens || 0);
    });
    return response.choices[0]!.message.content || "خلاصه‌ای یافت نشد.";
  } catch (error) {
    console.error("Error summarizing collective texts:", error);
    return "خطا در خلاصه‌سازی متن‌ها.";
  }
}
async function cancelEdit(ctx: MyContext) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  delete ctx.session.editingState;
  await ctx.reply("❌ ویرایش لغو شد.");
  await showUserLists(ctx);
}
async function showListChannels(ctx: MyContext, listId: number) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    const list = await db.query.channelLists.findFirst({
      where: and(
        eq(channelLists.userId, chatId.toString()),
        eq(channelLists.id, listId)
      ),
    });

    if (!list) {
      await ctx.reply("❌ لیست مورد نظر یافت نشد.");
      return;
    }

    const channelsList = list.channels.join("\n");
    const keyboard = new InlineKeyboard()
      .row()
      .text("🗑️ حذف", `delete_list_${listId}`)
      .text("✏️ اصلاح", `edit_list_${listId}`)
      .row()
      .text("📊 فعالیت", `activity_list_${listId}`)
      .row()
      .text("🔙 بازگشت به لیست‌ها", "back_to_lists");

    await ctx.reply(`📋 کانال‌های لیست "${list.name}":\n\n${channelsList}`, {
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error("Error showing list channels:", error);
    await ctx.reply("❌ خطا در نمایش کانال‌ها. لطفاً دوباره تلاش کنید.");
  }
}

async function startEditList(ctx: MyContext, listId: number) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    const list = await db.query.channelLists.findFirst({
      where: and(
        eq(channelLists.userId, chatId.toString()),
        eq(channelLists.id, listId)
      ),
    });

    if (!list) {
      await ctx.reply("❌ لیست مورد نظر یافت نشد.");
      return;
    }

    // Store the editing state in session
    ctx.session.editingState = { listId, name: list.name };

    const currentChannels = list.channels.join(" ");
    const keyboard = new InlineKeyboard()
      .row()
      .copyText("کپی لیست", `${currentChannels} ${list.name}`);
    await ctx.reply(
      `لطفاً لیست جدید را به فرمت زیر وارد کنید:\n` +
        `${currentChannels} ${list.name}\n\n` +
        "می‌توانید کانال‌ها و نام را تغییر دهید.",
      {
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error("Error starting edit:", error);
    await ctx.reply("❌ خطا در شروع ویرایش. لطفاً دوباره تلاش کنید.");
  }
}

async function deleteList(ctx: MyContext, listId: number) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    await db
      .delete(channelLists)
      .where(
        and(
          eq(channelLists.userId, chatId.toString()),
          eq(channelLists.id, listId)
        )
      );

    await ctx.reply("✅ لیست با موفقیت حذف شد.");
    await showUserLists(ctx); // نمایش لیست‌های باقیمانده
  } catch (error) {
    console.error("Error deleting list:", error);
    await ctx.reply("❌ خطا در حذف لیست. لطفاً دوباره تلاش کنید.");
  }
}
async function processChannelMessages(
  ctx: MyContext,
  listId: number,
  range: number | "today"
) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    // Get the list of channels from the database
    const list = await db.query.channelLists.findFirst({
      where: and(
        eq(channelLists.userId, chatId.toString()),
        eq(channelLists.id, listId)
      ),
    });

    if (!list) {
      await ctx.reply("❌ لیست مورد نظر یافت نشد.");
      return;
    }

    // Send processing message
    const processingMsg = await ctx.reply(
      "🔄 در حال دریافت پیام‌های کانال‌ها..."
    );

    // Extract channel names without @ symbol
    const channelNames = list.channels.map((channel) =>
      channel.startsWith("@") ? channel.substring(1) : channel
    );

    if (channelNames.length === 0) {
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply("❌ هیچ کانالی در این لیست وجود ندارد.");
      return;
    }

    // Call the API to get channel posts
    const cleanChannelNames = channelNames.map((name) =>
      name.startsWith("@") ? name.substring(1) : name
    );
    const API_URL = `${YOUTUBE_API_SERVER}/telegram-channel-posts`;

    try {
      const response = await axios.post(API_URL, {
        channel_names: cleanChannelNames,
      });

      await ctx.api.deleteMessage(chatId, processingMsg.message_id);

      if (!response.data) {
        await ctx.reply("❌ خطا در دریافت پیام‌های کانال‌ها.");
        return;
      }

      // Format and send the results
      const results = response.data;
      console.log("firstfirstfirstfirst5", results);

      // For each channel, format and send its posts
      for (const channelName of channelNames) {
        const channelData = results[channelName];

        if (!channelData || "error" in channelData) {
          await ctx.reply(
            `❌ خطا در دریافت پیام‌های کانال @${channelName}: ${
              channelData?.error || "خطای نامشخص"
            }`
          );
          continue;
        }

        // Now we know channelData is an array of posts
        const channelPosts = channelData as ChannelPost[];

        // Filter posts based on range
        let filteredPosts: ChannelPost[] = channelPosts;
        if (typeof range === "number") {
          filteredPosts = channelPosts.slice(0, range);
        } else if (range === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          filteredPosts = channelPosts.filter((post: ChannelPost) => {
            if (post.datetime) {
              const postDate = new Date(post.datetime);
              return postDate >= today;
            }
            return false;
          });
        }

        if (filteredPosts.length === 0) {
          await ctx.reply(
            `📢 کانال @${channelName}: هیچ پیامی در بازه زمانی مورد نظر یافت نشد.`
          );
          continue;
        }

        // Send channel header
        await ctx.reply(`📢 پیام‌های کانال @${channelName}:`);

        // Send each post
        for (const post of filteredPosts) {
          let message = "";

          // Add text if available
          if (post.text) {
            message += post.text.substring(0, 3000); // Limit text length
            if (post.text.length > 3000) {
              message += "...";
            }
          }

          // Add post metadata
          if (post.datetime) {
            const postDate = new Date(post.datetime);
            message += `\n\n📅 تاریخ: ${postDate.toLocaleDateString("fa-IR")}`;
          }

          // Add post link if available
          if (post.post_id) {
            message += `\n🔗 لینک: https://t.me/${channelName}/${post.post_id}`;
          }

          // Send the message
          const prevTexts = ctx.session.collectiveTexts || [];
          ctx.session.collectiveTexts = [...prevTexts, message];
          await ctx.reply(message);

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Send summary and buttons
      const keyboard = new InlineKeyboard()
        .row()
        .text("❓ پرسش و پاسخ", "qa_channel_messages")
        .row()
        .text("📝 خلاصه‌سازی پیام‌ها", "summarize_channel_messages");

      await ctx.reply(`✅ نمایش پیام‌های کانال‌ها به پایان رسید.`, {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Error calling Telegram Tools API:", error);
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply(
        "❌ خطا در دریافت پیام‌های کانال‌ها. لطفاً دوباره تلاش کنید."
      );
    }
  } catch (error) {
    console.error("Error processing channel messages:", error);
    await ctx.reply("❌ خطا در پردازش پیام‌ها. لطفاً دوباره تلاش کنید.");
  }
}
async function handleSummarizeCommand(ctx: MyContext, channelUsername: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    const channelInfo = await getChannelInfo(channelUsername);
    if (!channelInfo.success || !channelInfo.id || !channelInfo.title) {
      await ctx.reply(channelInfo.error || "خطا در دریافت اطلاعات کانال");
      return;
    }
    await db
      .insert(channels)
      .values({
        channelId: channelInfo.id.toString(),
        title: channelInfo.title,
        username: channelUsername,
      })
      .onConflictDoUpdate({
        target: channels.channelId,
        set: {
          title: channelInfo.title,
          username: channelUsername,
        },
      });
    const messages = await getChannelMessages(channelUsername);
    const summary = await summarizeMessages(messages, chatId);
    if (!summary) {
      await ctx.reply("❌ توکن شما کافی نیست.");
      return;
    }
    await ctx.reply(`خلاصه پیام‌های کانال ${channelInfo.title}:\n\n${summary}`);
  } catch (error) {
    console.error("Error processing channel:", error);
    await ctx.reply("خطا در پردازش کانال. لطفاً دوباره تلاش کنید.");
  }
}

// تابع جدید برای مدیریت ایجاد لیست
async function handleCreateListCommand(ctx: MyContext, text: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const parts = text.split(" ");
  if (parts.length < 2) {
    await ctx.reply(
      "❌ فرمت نادرست. لطفاً حداقل یک کانال و یک نام برای لیست وارد کنید.\n" +
        "مثال: @channel1 @channel2 list-name"
    );
    return;
  }

  const name = parts[parts.length - 1];
  const channelUsernames = parts.slice(0, -1);

  // بررسی معتبر بودن کانال‌ها
  for (const channel of channelUsernames) {
    if (!channel.startsWith("@")) {
      await ctx.reply(
        `نام کانال ${channel} نامعتبر است. لطفاً از فرمت @channelname استفاده کنید.`
      );
      return;
    }
  }

  try {
    // بقیه کد تابع بدون تغییر...
    // بررسی وجود کاربر قبل از ایجاد لیست
    const existingUser = await db.query.users.findFirst({
      where: eq(users.chatId, chatId.toString()),
    });

    if (!existingUser) {
      await ctx.reply("❌ خطا: کاربر در سیستم ثبت نشده است.");
      return;
    }

    // ذخیره در دیتابیس با ساختار جدید
    const [list] = await db
      .insert(channelLists)
      .values({
        userId: chatId.toString(),
        name: name as string,
        channels: channelUsernames,
      })
      .returning();
    if (!list) {
      await ctx.reply("❌ خطا در ایجاد لیست. لطفاً دوباره تلاش کنید.");
      return;
    }
    const keyboard = new InlineKeyboard()
      .row()
      .text("🗑️ حذف", `delete_list_${list.id}`)
      .text("✏️ اصلاح", `edit_list_${list.id}`)
      .row()
      .text("📊 فعالیت", `activity_list_${list.id}`)
      .row()
      .text("🔙 لیست‌ها", "back_to_lists");

    await ctx.reply(
      `✅ لیست "${name}" با موفقیت ایجاد شد!\n\n` +
        `کانال‌های اضافه شده:\n${channelUsernames.join("\n")}`,
      {
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error("Error creating channel list:", error);
    await ctx.reply("❌ خطا در ایجاد لیست. لطفاً دوباره تلاش کنید.");
  }
}
async function confirmEdit(ctx: MyContext, text: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const editingState = ctx.session.editingState;
  if (!editingState) {
    await ctx.reply("❌ خطا در ویرایش. لطفاً دوباره تلاش کنید.");
    return;
  }

  try {
    // Parse the user's input
    const parts = text.trim().split(" ");
    const name = parts[parts.length - 1];
    const channels = parts
      .slice(0, -1)
      .filter((part) => part.startsWith("@"))
      .map((channel) => channel.trim());

    if (channels.length === 0) {
      await ctx.reply(
        "❌ لطفاً حداقل یک کانال با فرمت @channelname وارد کنید."
      );
      return;
    }

    // Update the list in the database
    await db
      .update(channelLists)
      .set({
        name: name,
        channels: channels,
      })
      .where(
        and(
          eq(channelLists.id, editingState.listId),
          eq(channelLists.userId, chatId.toString())
        )
      );

    // Clear the editing state
    delete ctx.session.editingState;

    await ctx.reply(
      `✅ لیست "${name}" با موفقیت به‌روزرسانی شد.\n\n` +
        `📋 کانال‌های جدید:\n${channels.join("\n")}`
    );

    // Show the user's lists
    await showUserLists(ctx);
  } catch (error) {
    console.error("Error confirming edit:", error);
    await ctx.reply("❌ خطا در ثبت تغییرات. لطفاً دوباره تلاش کنید.");
  }
}
// Add a new function for text summarization
async function summarizeText(
  text: string,
  chatId: number
): Promise<string | null> {
  try {
    const checkTokenAmountResponse = await checkTokenAmount({
      chatId,
      token: 10,
    });
    if (!checkTokenAmountResponse) {
      return null;
    }
    const response = await openai.chat.completions.create({
      model: process.env.DEFAULT_MODEL!,
      messages: [
        {
          role: "system",
          content:
            "  خلاصه‌ای مختصر و مفید از متن زیر ارائه دهید. مهم‌ترین نکات را استخراج کنید متن باید کمتر از متن اصلی باشه.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 500,
    });
    after(async () => {
      await checkAndDeductTokens(chatId, response.usage?.total_tokens || 0);
    });
    return response.choices[0]!.message.content || "خلاصه‌ای یافت نشد.";
  } catch (error) {
    console.error("Error summarizing text:", error);
    return "خطا در خلاصه‌سازی متن.";
  }
}
// پردازش دستور تمام در حالت خلاصه‌ساز جمعی
async function handleCompleteCommand(ctx: MyContext) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  if (
    !ctx.session.collectiveSummarizationMode ||
    !ctx.session.collectiveTexts ||
    ctx.session.collectiveTexts.length === 0
  ) {
    await ctx.reply(
      "ابتدا باید حالت خلاصه‌ساز جمعی را فعال کنید و حداقل یک متن ارسال کنید."
    );
    return;
  }

  // حذف دکمه تمام قبلی اگر وجود داشته باشد
  if (ctx.session.lastCompleteButtonMessageId) {
    try {
      await ctx.api.deleteMessage(
        chatId,
        ctx.session.lastCompleteButtonMessageId
      );
    } catch (error) {
      console.error("Error deleting previous complete button:", error);
    }
    ctx.session.lastCompleteButtonMessageId = undefined;
  }

  // نمایش گزینه‌های خلاصه و پرسش و پاسخ
  const keyboard = new InlineKeyboard()
    .row()
    .text("❓ پرسش و پاسخ", "collective_qa")
    .row()
    .text("📝 خلاصه‌سازی متن‌ها", "collective_summarize")
    .row()
    .text("🔙 بازگشت به منوی اصلی", "back_to_main");

  await ctx.reply(
    `شما ${ctx.session.collectiveTexts.length} متن ارسال کرده‌اید. لطفاً عملیات مورد نظر را انتخاب کنید:`,
    { reply_markup: keyboard }
  );
}
async function getChannelMessages(channelUsername: string): Promise<Message[]> {
  try {
    const updates = await bot.api.getUpdates({
      allowed_updates: ["channel_post"],
      timeout: 0,
    });

    return updates
      .filter((update) => update.channel_post?.text)
      .map((update) => ({
        text: update.channel_post!.text!,
        date: update.channel_post!.date,
      }))
      .slice(0, 10);
  } catch (error) {
    console.error("Error in getChannelMessages:", error);
    return [];
  }
}
// توابع کمکی
async function getChannelInfo(channelUsername: string): Promise<ChannelInfo> {
  try {
    const formattedUsername = channelUsername.startsWith("@")
      ? channelUsername
      : `@${channelUsername}`;

    const chat = await bot.api.getChat(formattedUsername);

    return {
      success: true,
      id: chat.id,
      title: chat.title || chat.username || "",
    };
  } catch (error) {
    console.error("Error in getChannelInfo:", error);
    return {
      success: false,
      error: "کانال یافت نشد یا بات دسترسی ندارد",
    };
  }
}
// خلاصه‌سازی پیام‌ها
async function summarizeMessages(
  messages: Message[],
  chatId: number
): Promise<string | null> {
  try {
    const messageTexts = messages
      .map((msg) => msg.text)
      .filter((text) => text.trim());

    if (!messageTexts.length) {
      return "محتوای قابل خلاصه‌سازی یافت نشد.";
    }
    const checkTokenAmountResponse = await checkTokenAmount({
      chatId,
      token: 10,
    });
    if (!checkTokenAmountResponse) {
      return null;
    }
    const response = await openai.chat.completions.create({
      model: process.env.DEFAULT_MODEL!,
      messages: [
        {
          role: "system",
          content:
            "خلاصه‌ای مختصر و مفید از پیام‌های زیر ارائه دهید. مهم‌ترین نکات را استخراج کنید.",
        },
        {
          role: "user",
          content: messageTexts.join("\n\n"),
        },
      ],
      max_tokens: 500,
    });
    after(async () => {
      await checkAndDeductTokens(chatId, response.usage?.total_tokens || 0);
    });
    return response.choices[0]!.message.content || "خلاصه‌ای یافت نشد.";
  } catch (error) {
    console.error("Error summarizing messages:", error);
    return "خطا در خلاصه‌سازی محتوا.";
  }
} // پرسش و پاسخ براساس متن‌های جمعی
async function answerQuestionBasedOnTexts(
  question: string,
  texts: string[],
  chatId: number
): Promise<string | null> {
  try {
    const allTexts = texts.join("\n\n---------\n\n");
    const checkTokenAmountResponse = await checkTokenAmount({
      chatId,
      token: 10,
    });
    if (!checkTokenAmountResponse) {
      return null;
    }
    const response = await openai.chat.completions.create({
      model: process.env.DEFAULT_MODEL!,
      messages: [
        {
          role: "system",
          content:
            "با توجه به متن‌های زیر، به سؤال کاربر پاسخ دهید. از اطلاعات مندرج در متن‌ها استفاده کنید.",
        },
        {
          role: "user",
          content: `متن‌ها:\n${allTexts}\n\nسؤال: ${question}`,
        },
      ],
      max_tokens: 1000,
    });
    after(async () => {
      await checkAndDeductTokens(chatId, response.usage?.total_tokens || 0);
    });
    return response.choices[0]!.message.content || "پاسخی یافت نشد.";
  } catch (error) {
    console.error("Error answering question based on texts:", error);
    return "خطا در پاسخگویی به سؤال.";
  }
}

// آدرس سرور API یوتیوب
const YOUTUBE_API_SERVER =
  process.env.YOUTUBE_API_SERVER || "http://localhost:8000";

// اضافه کردن هندلر برای دکمه چت با یوتیوب

// بررسی آیا متن یک لینک یوتیوب است
function isYoutubeLink(text: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(text);
}
function isValidUrl(url: string): boolean {
  const urlPattern =
    /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
  return urlPattern.test(url);
}

// پاسخ به سؤال در مورد ویدیوی یوتیوب
async function answerYoutubeQuestion(ctx: MyContext, question: string) {
  const processingMsg = await ctx.reply("🔄 در حال پردازش سؤال شما...");
  const chatId = ctx.chat.id;

  try {
    const checkTokenAmountResponse = await checkTokenAmount({
      chatId,
      token: 10,
    });

    if (!checkTokenAmountResponse) {
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply("❌ توکن شما کافی نیست.");
      return;
    }

    const videoInfo = ctx.session.youtubeVideoInfo;
    if (!videoInfo) {
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply(
        "❌ اطلاعات ویدیو در دسترس نیست. لطفاً دوباره لینک را ارسال کنید."
      );
      return;
    }

    // استفاده از OpenAI برای پاسخگویی به سؤال
    const response = await openai.chat.completions.create({
      model: process.env.DEFAULT_MODEL!,
      messages: [
        {
          role: "system",
          content:
            "شما یک دستیار هوشمند هستید که به سؤالات کاربر درباره یک ویدیوی یوتیوب با توجه به اطلاعات آن پاسخ می‌دهید.",
        },
        {
          role: "user",
          content: `اطلاعات ویدیو:
          عنوان: ${videoInfo.title}
          متن ویدیو: ${videoInfo.captions || "موجود نیست"}
          
          سؤال کاربر: ${question}`,
        },
      ],
      max_tokens: 1000,
    });

    // کم کردن توکن کاربر
    await checkAndDeductTokens(chatId, response.usage?.total_tokens || 0);

    // حذف پیام در حال پردازش
    await ctx.api.deleteMessage(chatId, processingMsg.message_id);

    // ارسال پاسخ
    await ctx.reply(
      `📝 پاسخ به سؤال شما:\n\n${
        response.choices[0]?.message.content || "متأسفانه پاسخی یافت نشد."
      }\n\n` +
        "✏️ می‌توانید سؤال دیگری بپرسید یا برای خروج از این حالت، دستور /cancel را ارسال کنید."
    );
    after(async () => {
      await checkAndDeductTokens(chatId, 10);
    });
  } catch (error) {
    console.error("Error answering YouTube question:", error);
    await ctx.api.deleteMessage(chatId, processingMsg.message_id);
    await ctx.reply("❌ خطا در پاسخگویی به سؤال. لطفاً دوباره تلاش کنید.");
  }
}

export const POST = webhookCallback(bot, "std/http");
