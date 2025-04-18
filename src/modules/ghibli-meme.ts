import { checkAndDeductTokens, checkTokenAmount } from "@/actions/token";
import { after } from "next/server";
import OpenAI from "openai";
import { MyContext } from "./setup";
import { InputFile } from "grammy";
import sharp from "sharp";
import { sendPhotoMessage } from "@/actions/message-sender";

// Initialize OpenAI client
const openai = new OpenAI();

// Add this new function
export async function sendGhibliMeme(ctx: MyContext) {
  const chatId = ctx.chat?.id;

  const messageWithPhoto = ctx.message?.reply_to_message;
  //   const photoUrl = messageWithPhoto?.photo?.[0]?.file_id;
  const photoUrl = "https://i.imgflip.com/9p1cor.jpg";

  if (!chatId || !photoUrl) {
    await ctx.reply("❌ لطفا یک تصویر را ریپلای کنید.");
    return;
  }

  try {
    // Send processing message
    const processingMsg = await ctx.reply(
      "🎨 در حال تبدیل تصویر به سبک جیبلی..."
    );

    // Check user's token balance
    const checkTokenAmountResponse = await checkTokenAmount({
      chatId,
      token: 200,
    });

    if (!checkTokenAmountResponse) {
      await ctx.api.deleteMessage(chatId, processingMsg.message_id);
      await ctx.reply("❌ توکن شما کافی نیست.");
      return;
    }

    // Use the photo URL directly - no need to get file link
    // Generate Ghibli-style image using OpenAI
    const imageResponse = await fetch(photoUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    if (imageBuffer.length > 4 * 1024 * 1024) {
      // بیشتر از 4MB
      console.error("❌ تصویر خیلی بزرگ است.");
      await ctx.reply(
        "❌ حجم تصویر بیش از حد مجاز است (حداکثر 4MB). لطفاً تصویر کوچک‌تری انتخاب کنید."
      );
      return;
    }

    // Convert image to PNG with RGBA (transparency)
    const pngBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: "inside" })
      .ensureAlpha() // Ensures the image has transparency (RGBA)
      .toFormat("png") // Ensure the output format is PNG with RGBA
      .toBuffer();

    // Create a transparent PNG file
    const imageFile = new File([pngBuffer], "image.png", {
      type: "image/png",
    });

    const response = await openai.images.edit({
      image: imageFile,
      n: 1,

      prompt:
        "A portrait of a character in the style of Studio Ghibli, highly detailed, with vibrant colors, soft lighting, and whimsical atmosphere. The character should have a warm, friendly expression, and the background should resemble a magical forest with vibrant, lush trees.",
      size: "1024x1024",
    });
    console.log("responseresponseresponse", response.data[0], response);

    const ghibliImageUrl = response.data[0]?.url;
    console.log("ghibliImageUrl", response.data[0]);

    if (!ghibliImageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    // Delete processing message
    await ctx.api.deleteMessage(chatId, processingMsg.message_id);

    // Send the Ghibli-style image
    const photo = new InputFile({ url: ghibliImageUrl }, "ghibli_image.jpg");

    await sendPhotoMessage({
      ctx,
      inputFile: photo,
      options: {
        caption: "🎨 تصویر با سبک استودیو جیبلی",
        replyToMessageId: messageWithPhoto?.message_id,
      },
    });

    // Deduct tokens after successful generation
    after(async () => {
      await checkAndDeductTokens(chatId, 20);
    });
  } catch (error) {
    console.error("Error generating Ghibli meme:", error);
    await ctx.reply("❌ خطا در تبدیل تصویر. لطفاً دوباره تلاش کنید.");
  }
}
