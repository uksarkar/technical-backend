import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { filesTable, tagFilesTable, tagsTable } from "../../db/schema.js";
import db from "../../supports/db.js";
import { nanoid } from "nanoid";

export async function getFileByUuid(uuid: string) {
  const file = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.uuid, uuid))
    .limit(1);

  return file[0];
}

export async function createFile(data: {
  path: string;
  type: string;
  user_id: number;
}) {
  const insertedFile = await db
    .insert(filesTable)
    .values({
      path: data.path,
      type: data.type,
      user_id: data.user_id,
      uuid: nanoid(16)
    })
    .returning({
      id: filesTable.id,
      path: filesTable.path,
      type: filesTable.type,
      user_id: filesTable.user_id,
      uuid: filesTable.uuid
    });

  return insertedFile[0];
}

export async function updateFile(id: number, position: number) {
  const updated = await db
    .update(filesTable)
    .set({
      position
    })
    .where(eq(filesTable.id, id))
    .returning({
      id: filesTable.id,
      path: filesTable.path,
      type: filesTable.type,
      user_id: filesTable.user_id,
      uuid: filesTable.uuid
    });

  return updated[0];
}

export async function increaseView(uuid: string) {
  await db
    .update(filesTable)
    .set({
      view_count: sql`view_count + 1`
    })
    .where(eq(filesTable.uuid, uuid))
    .execute();
}

export async function findByUserId(user_id: number, file_id: number) {
  // Query to check if the file exists and belongs to the user
  const result = await db
    .select()
    .from(filesTable)
    .where(and(eq(filesTable.user_id, user_id), eq(filesTable.id, file_id)))
    .get();

  return result;
}

export async function deleteFile(id: number) {
  return db.delete(filesTable).where(eq(filesTable.id, id)).execute();
}

export async function getFiles(user_id: number) {
  return db
    .select()
    .from(filesTable)
    .where(eq(filesTable.user_id, user_id))
    .orderBy(desc(filesTable.created_at))
    .all();
}

export async function attachTagToFile(file_id: number, tags: string[]) {
  if (!tags.length) {
    return;
  }
  // Fetch existing tags from the database
  const dbTags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name
    })
    .from(tagsTable)
    .where(inArray(tagsTable.name, tags));

  // Extract the names of existing tags
  const existingTagNames = dbTags.map(tag => tag.name);

  // Identify tags that need to be created
  const creatableTags = tags.filter(tag => !existingTagNames.includes(tag));

  // Create new tags if any
  let createdTags = [] as { id: number; name: string }[];
  if (creatableTags.length > 0) {
    createdTags = await db
      .insert(tagsTable)
      .values(creatableTags.map(tag => ({ name: tag })))
      .returning({
        id: tagsTable.id,
        name: tagsTable.name
      });
  }

  // Combine the IDs of existing and newly created tags
  const allTags = [...dbTags, ...createdTags];

  // Map tags to the file in the tagFilesTable
  const tagFileEntries = allTags.map(tag => ({
    file_id,
    tag_id: tag.id
  }));

  // Insert tag-file relationships
  await db.insert(tagFilesTable).values(tagFileEntries);

  return {
    file_id,
    attachedTags: allTags.map(tag => tag.name)
  };
}

export async function getFileTags(file_id: number) {
  // Query to get all tags associated with the given file ID
  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name
    })
    .from(tagFilesTable)
    .innerJoin(tagsTable, eq(tagFilesTable.tag_id, tagsTable.id))
    .where(eq(tagFilesTable.file_id, file_id));

  return tags;
}
