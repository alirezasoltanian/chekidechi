// prettier-ignore
const ESCAPE_MAP = new Set([
	"_",
	"*",
	"[",
	"]",
	"(",
	")",
	"~",
	"`",
	">",
	"<",
	"#",
	"+",
	"-",
	"=",
	"|",
	"{",
	"}",
	".",
	"!",
])
export const escapeHTML = (text: string) => {
  return [...text]
    .map((char) => {
      if (ESCAPE_MAP.has(char)) return `\\${char}`;
      return char;
    })
    .join("");
};

const CODE_ESCAPE_MAP = new Map([
  ["`", "\\`"],
  ["\\", "\\\\"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ["&", "&amp;"],
]);
export const escapeCode = (text: string) => {
  return [...text]
    .map((char) => {
      if (CODE_ESCAPE_MAP.has(char)) return CODE_ESCAPE_MAP.get(char);
      return char;
    })
    .join("");
};

export const bold = (text: string) => `<b>${text}</b>`;
export const italic = (text: string) => `<i>${text}</i>`;
export const code = (text: string) => `<code>${escapeCode(text)}</code>`;
export const pre = (text: string) => `<pre>${escapeCode(text)}</pre>`;
export const underline = (text: string) => `<u>${text}</u>`;
export const strikethrough = (text: string) => `<s>${text}</s>`;
export const link = (text: string, url: string) =>
  `<a href="${url}">${text}</a>`;
export const quote = (text: string) => `<blockquote>${text}</blockquote>`;
export const mention = (text: string, user_id: number) =>
  `<a href="tg://user?id=${user_id}">${text}</a>`;

export const mdBold = (text: string) => `*${text}*`;
export const mdItalic = (text: string) => `_${text}_`;
export const mdCode = (text: string) => `\`${text}\``;
export const mdCodeBlock = (text: string, language = "") =>
  `\`\`\`${language}\n${text}\n\`\`\``;
export const mdUnderline = (text: string) => `__${text}__`;
export const mdStrikethrough = (text: string) => `~${text}~`;
export const mdLink = (text: string, url: string) => `[${text}](${url})`;
export const moreText = (label: string, more: string) =>
  `\`\`\`[${label}] ${more}\`\`\``;
export const t = {
  urlReminder: "You need to send an URL to download stuff.",
  maintenanceNotice:
    "Bot is currently under maintenance, it'll return shortly.",
  processing: "در حال پردازش...",
  deniedMessage: [
    bold("This bot is private."),
    "",
    "It costs money to run this and unfortunately it doesn't grow on trees.",
    `This bot is open source, so you can always ${link(
      "host it yourself",
      "https://github.com/vaaski/telegram-ytdl#hosting"
    )}.`,
    "",
    bold(
      `As an alternative I recommend checking out ${link(
        "yt-dlp",
        "https://github.com/yt-dlp/yt-dlp"
      )}, the command line tool that powers this bot or ${link(
        "cobalt",
        "https://cobalt.tools"
      )}, a web-based social media content downloader (not affiliated with this bot).`
    ),
    "",
    `${bold(
      "Do not"
    )} try to contact me to get whitelisted, I will not accept anyone I don't know personally.`,
  ].join("\n"),
  cutoffNotice:
    "\n\n[...]\n\nThis message was cut off due to the Telegram Message character limit. View the full output in the logs.",
};

// https://github.com/yt-dlp/yt-dlp/issues/9506#issuecomment-2053987537
export const tiktokArgs = [
  "--extractor-args",
  "tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com;app_info=7355728856979392262",
];

const features = [
  {
    "title-en": "Telegram Channel Integration",
    "title-fa": "ادغام کانال‌های تلگرام",
    description:
      "📢 کانال‌های تلگرامیتون رو به بله بیارید و با اون‌ها تعامل داشته باشید! 🤯 \n\nتا حالا شده بخواید خلاصه‌ی سریع از مطالب کانال‌های تلگرامی بگیرید؟ یا شاید سوالی در مورد یک متن بپرسید و بدون جست‌وجوی طولانی، جواب رو پیدا کنید؟ \n\nحالا با این بازو، می‌تونید لیستی از کانال‌های مورد علاقتون رو توی بله اضافه کنید و: \n✅ مطالبشون رو خلاصه کنید \n✅ از متن‌های داخل کانال سوال بپرسید \n✅ راحت‌تر و سریع‌تر به اطلاعات مهم دسترسی داشته باشید \n\n🔗 همین الان امتحان کنید و تجربه‌ی جدیدی از تعامل با کانال‌های تلگرامی داشته باشید! 🚀",
    type: "feature",
    video: "/videos/list.mp4",
    rate: 1,
  },
  {
    "title-en": "YouTube Assistant",
    "title-fa": "دستیار یوتیوب",
    description:
      "🚀 تبدیل یوتیوب به دستیار هوشمند! \n\n🎥 فقط لینک ویدیوی یوتیوب رو به سولوپ بده و ...🤯 \n\n✅ محتوای ویدیو رو خلاصه کنه 📜 \n✅ به سوالاتت درباره ویدیو جواب بده ❓ \n✅ کمکت کنه از ویدیو محتوا تولید کنی ✍️ \n✅ زیرنویس ویدیو رو دانلود کنه 📥 \n\nدیگه لازم نیست کل ویدیو رو ببینی! ⏳ سریع و راحت اطلاعات بگیر و بهترین استفاده رو از ویدیوها ببر. 💡✨ \n\n🎯 امتحانش کن و لذت ببر! 🚀 درضمن 100 توکن 🪙 بت اضافه شد تا بتونی از این قابلیت بهره ببری.",
    type: "feature",
    video: "/videos/chat-youtube.mp4",
    rate: 2,
  },
  {
    "title-en": "Text Summarizer",
    "title-fa": "خلاصه ساز جمعبندی",
    description:
      "تا حالا شده یه عالمه پیام داشته باشی و ندونی چجوری ازشون خلاصه بگیری؟ یا مثلاً بخوای بدونی یه سری پیامای فوروارد شده چی میگن، بدون اینکه همه رو بخونی؟ 🤯\n\nحالا با خلاصه‌ساز جمعی📚 این مشکل حل شده! 🚀\n\n✅ چجوری کار می‌کنه؟\n1️⃣ پیام‌ها رو ارسال کن یا از کانال‌های دیگه فوروارد کن.\n2️⃣ وقتی کارت تموم شد، روی /end بزن.\n3️⃣ حالا دو تا گزینه داری:\n🔹 خلاصه‌کردن → متن رو در یک نگاه خلاصه کن!\n🔹 پرسش و پاسخ → هر سوالی که داری بپرس، هوش مصنوعی جواب میده!\n\nیعنی دیگه نیازی نیست تو انبوه پیام‌ها غرق بشی! 🤩",
    type: "feature",
    video: "/videos/collective.mp4",
    rate: 3,
  },

  {
    "title-en": "Play Games & Earn Tokens",
    "title-fa": "بازی کن و توکن بگیر",
    description:
      "🎮معرفی قابلیت: بازی کن و توکن بگیر! 🎉 \n\nمی‌تونی با انجام بازی‌های جذاب، توکن رایگان به دست بیاری! 🚀✨ \n\n🃏 بازی حافظه – مهارت تمرکز و حافظه‌ات رو به چالش بکش! \n🎰 گردونه شانس – شانس خودتو امتحان کن و جایزه ببر! \n🏀 بسکتبال – توپ بنداز تو تور و امتیاز بگیر! \n\n💰 هرچی بهتر بازی کنی، توکن بیشتری می‌گیری! \n🔥 همین الان امتحان کن و جایزه بگیر!",
    type: "feature",
    video: "/videos/game.mp4",
    rate: 4,
  },
  {
    "title-en": "Create and Share Memes",
    "title-fa": "ساخت و اشتراک میم",
    description: "میم مدنظرتو به راحتی بساز و به اشتراک بزار 🚀😉",
    type: "update",
    video: "/videos/meme.mp4",
    rate: 0,
  },
  {
    "title-en": "Ghibli theme",
    "title-fa": "قالب جیبلی",
    description: "اضافه شدن Ghibli theme برای مینی آپ",
    type: "update",
    video: "/videos/ghibli-theme.mp4",
    rate: 0,
  },
  {
    "title-en": "Info",
    "title-fa": "اطلاعات",
    description: "به راحتی با تمام بخش ها آشنا شو",
    type: "update",
    video: "/videos/ghibli-theme.mp4",
    rate: 0,
  },
];

export default features;
