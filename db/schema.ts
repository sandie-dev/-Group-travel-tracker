import { pgTable, serial, text, integer, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
});
export const visitedCountries = pgTable('visited_countries', {
  id: serial('id').primaryKey(),
  countryCode: text('country_code').notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => [unique('visited_country_per_user').on(table.userId, table.countryCode)]);
