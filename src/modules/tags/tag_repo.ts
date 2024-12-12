import { and, inArray, like, not } from "drizzle-orm";
import { tagFilesTable, tagsTable } from "../../db/schema.js";
import db from "../../supports/db.js";

export async function searchTag(name: string, except: string[]) {
  if (!name.trim()) {
    return [];
  }

  // Perform a partial, case-insensitive search for the tag
  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name
    })
    .from(tagsTable)
    .where(and(like(tagsTable.name, `%${name.trim()}%`), not(inArray(tagsTable.name, except))));

  return tags;
}

export async function allTags() {
  // Perform a partial, case-insensitive search for the tag
  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name
    })
    .from(tagsTable)
    .all();

  return tags;
}

export async function getAllFileTagRelations() {
  return db.select().from(tagFilesTable).all();
}