import { pgTable, unique, serial, text, integer, timestamp, foreignKey, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const channels = pgTable("channels", {
	id: serial().primaryKey().notNull(),
	channelId: text("channel_id").notNull(),
	title: text(),
	username: text(),
}, (table) => [
	unique("channels_channel_id_unique").on(table.channelId),
]);

export const summaries = pgTable("summaries", {
	id: serial().primaryKey().notNull(),
	channelId: text("channel_id").notNull(),
	summary: text().notNull(),
	messageCount: integer("message_count").notNull(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	chatId: text("chat_id").notNull(),
	username: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	token: integer().default(200),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_chat_id_unique").on(table.chatId),
]);

export const channelLists = pgTable("channel_lists", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	channels: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.chatId],
			name: "channel_lists_user_id_users_chat_id_fk"
		}),
]);
