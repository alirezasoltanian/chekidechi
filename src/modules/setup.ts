import { Bot, Context, session, SessionFlavor } from "grammy";
import { hydrateReply, type ParseModeFlavor } from "@grammyjs/parse-mode";

// Define session data interface
export interface SessionData {
  editingState?: {
    listId: number;
    name: string;
  };
  summarizationMode?: boolean;
  collectiveSummarizationMode?: boolean;
  collectiveTexts?: string[];
  lastCompleteButtonMessageId?: number;
  waitingForQuestion?: boolean;
  youtubeMode?: boolean;
  youtubeActionMode?: boolean;
  youtubeVideoInfo?: {
    url: string;
    title?: string;
    captions?: string;
    timestamps?: Array<{
      text: string;
      start: number;
      end: number;
    }>;
  };
  waitingForYoutubeQuestion?: boolean;
  waitingForBroadcastText?: boolean;
  waitingForVideoConfirmation?: boolean;
  waitingForDownloadLink?: boolean;
  waitingForFileId?: boolean;
  broadcastText?: string;
  waitingForVideo?: boolean;
  channelListCreationMode?: boolean;
  waitingForVideoForward?: boolean;
  waitingForFileName?: boolean;
  pendingVideo?: {
    type: "forward" | "link";
    content: {
      fileId: string;
    };
  };
}

// Define context type with session
export type MyContext = ParseModeFlavor<Context> & SessionFlavor<SessionData>;
const botToken =
  process.env.IS_TELEGRAM_BOT === "true"
    ? process.env.TELEGRAM_BOT_TOKEN
    : process.env.BALE_BOT_TOKEN;

const apiRoot =
  process.env.IS_TELEGRAM_BOT === "true"
    ? process.env.TELEGRAM_API_ROOT
    : process.env.BALE_API_ROOT;

if (!botToken) {
  throw new Error("Bot token is not defined");
}

export const bot = new Bot<MyContext>(botToken, {
  client: {
    apiRoot,
  },
});

// Add session middleware
bot.use(
  session({
    initial: (): SessionData => ({
      summarizationMode: false,
      collectiveSummarizationMode: false,
      collectiveTexts: [],
      waitingForQuestion: false,
      youtubeMode: false,
      waitingForYoutubeQuestion: false,
      waitingForBroadcastText: false,
    }),
  })
);

bot.use(hydrateReply);
bot.use((ctx, next) => {
  console.log("New update received:", ctx.update);
  return next();
});
