import features from "@/constants";
import { Context } from "grammy";

export async function handleFeatureClick(ctx: Context, featureIndex: number) {
  const feature = features[featureIndex];
  if (!feature) {
    await ctx.reply("❌ ویژگی مورد نظر یافت نشد.");
    return;
  }

  try {
    await ctx.reply(`${feature.description}}`);
  } catch (error) {
    console.error("Error sending video:", error);
  }
}

export async function sendAllFeatures(ctx: Context) {
  const featureFeatures = features.filter((f) => f.type === "feature");
  for (const feature of featureFeatures) {
    await ctx.reply(`${feature.description}}`);

    // Add a small delay between messages to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export async function sendAllItems(ctx: Context) {
  for (const item of features) {
    try {
      await ctx.reply(`${item.description}`);
    } catch (error) {
      console.error("Error sending video:", error);
    }
    // Add a small delay between messages to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export function createFeaturesKeyboard() {
  const featureFeatures = features.filter((f) => f.type === "feature");

  const keyboard = {
    inline_keyboard: [
      ...featureFeatures.map((feature, index) => [
        {
          text: feature["title-fa"],
          callback_data: `feature_${index}`,
        },
      ]),
      [
        { text: "📋 تمام ویژگی‌ها", callback_data: "all_features" },
        { text: "🔄 همه موارد", callback_data: "all_items" },
      ],
    ],
  };

  return keyboard;
}
