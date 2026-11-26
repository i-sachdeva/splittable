import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const bills=sqliteTable('bills',{
 id:text('id').primaryKey(),
 data:text('data').notNull(),
 revision:integer('revision').notNull().default(0),
 createdAt:text('created_at').notNull()
});
