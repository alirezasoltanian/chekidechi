import { sql } from "drizzle-orm";
import {
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// جدول کاربران
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  token: integer("token").default(200),
  gameStartAt: timestamp("game_start_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
export type User = {
  id: number;
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  token: number;
  createdAt: Date;
  updatedAt: Date;
};
// جدول کانال‌ها
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  title: text("title"),
  username: text("username"),
});

// جدول خلاصه‌های ذخیره شده
export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  summary: text("summary").notNull(),
  messageCount: integer("message_count").notNull(),
});

export const channelLists = pgTable("channel_lists", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.chatId),
  name: text("name").notNull(),
  channels: json("channels").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const leaderboard = pgTable("leaderboard", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text("chat_id").notNull(),
  username: text("username").notNull(),
  score: integer("score").notNull(),
  time: integer("time").notNull(),
  name: text("name").notNull(),
  tokens: integer("tokens").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
