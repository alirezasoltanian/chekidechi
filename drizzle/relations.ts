import { relations } from "drizzle-orm/relations";
import { users, channelLists } from "./schema";

export const channelListsRelations = relations(channelLists, ({one}) => ({
	user: one(users, {
		fields: [channelLists.userId],
		references: [users.chatId]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	channelLists: many(channelLists),
}));