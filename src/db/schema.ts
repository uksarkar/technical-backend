import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable(
  "users",
  {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    email: text().notNull().unique(),
    password: text().notNull(),
    created_at: text()
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
  },
  t => [index("users_email_idx").on(t.email)]
);

export const filesTable = sqliteTable(
  "files",
  {
    id: int().primaryKey({ autoIncrement: true }),
    path: text().notNull(),
    user_id: int().references(() => usersTable.id, { onDelete: "cascade" }),
    position: int().default(0),
    uuid: text().notNull(),
    view_count: int().notNull().default(0),
    type: text().notNull(),
    created_at: text()
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: text()
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
  },
  t => [
    index("files_uuid_idx").on(t.uuid),
    index("files_user_id_idx").on(t.user_id),
    index("files_created_at_idx").on(t.created_at),
    index("files_position_idx").on(t.position)
  ]
);

export const tagsTable = sqliteTable(
  "tags",
  {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull().unique(),
    created_at: text()
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
  },
  t => [index("tag_name_idx").on(t.name)]
);

export const tagFilesTable = sqliteTable(
  "tag_files",
  {
    tag_id: int().references(() => tagsTable.id, { onDelete: "cascade" }),
    file_id: int().references(() => filesTable.id, { onDelete: "cascade" })
  },
  t => [index("tag_files_tag_and_file_id_idx").on(t.file_id, t.tag_id)]
);
