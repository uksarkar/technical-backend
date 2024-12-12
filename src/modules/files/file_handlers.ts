import { Hono } from "hono";
import type AppCtx from "../../interfaces/AppCtx.js";
import {
  getFiles,
  findByUserId,
  deleteFile,
  createFile,
  attachTagToFile,
  getFileByUuid,
  getFileTags,
  increaseView
} from "./file_repo.js";
import NotFoundException from "../../exceptions/NotFoundException.js";
import { isExist, unlink, writeFile } from "better-fs";
import { ensureDir } from "fs-extra";
import BadRequestException from "../../exceptions/BadRequestException.js";
import { nanoid } from "nanoid";
import InternalErrorException from "../../exceptions/InternalErrorException.js";
import { join } from "path";
import { allTags, getAllFileTagRelations } from "../tags/tag_repo.js";

const file_handler = new Hono<AppCtx>();

// list all files paginated
file_handler.get("/", async c => {
  const user = c.var.getUser();

  const files = await getFiles(user.id);
  const tags = await allTags();
  const fileTags = await getAllFileTagRelations();

  const responseFiles = files.map(file => {
    const relatedTags = new Set(
      fileTags.filter(t => t.file_id === file.id).map(t => t.tag_id)
    );
    return {
      ...file,
      tags: tags.filter(t => relatedTags.has(t.id)).map(t => t.name)
    };
  });

  return c.json(responseFiles);
});

file_handler.delete("/:id", async c => {
  const { id } = c.req.param();
  const user = c.var.getUser();
  const file_id = Number(id);

  if (Number.isNaN(file_id)) {
    throw new NotFoundException("File doesn't exists");
  }

  const file = await findByUserId(user.id, file_id);

  if (!file) {
    throw new NotFoundException("File not found");
  }

  if (await isExist(file.path)) {
    await unlink(file.path);
  }

  await deleteFile(file.id);

  return c.json({ message: "File deleted" });
});

file_handler.post("/", async c => {
  const body = await c.req.formData();
  const user = c.var.getUser();
  const file = body.get("file") as File;
  const tags = body.getAll("tag");

  if (!file) {
    throw new BadRequestException("Please attach the file");
  }

  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/mpeg",
    "application/pdf"
  ];
  if (!validTypes.includes(file.type)) {
    throw new BadRequestException(
      "Invalid file type. Only images and videos are allowed."
    );
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(
      "File size exceeds the maximum limit of 10 MB."
    );
  }

  // store the file using better-fs
  const filePath = `statics/${nanoid(16)}_${file.name}`;
  try {
    await ensureDir(join(process.cwd(), "/statics"));
    const arr = await file.arrayBuffer();
    const buffer = Buffer.from(arr);

    // Store the file using better-fs
    await writeFile(join(process.cwd(), filePath), buffer);

    // Store file metadata in the database
    const created = await createFile({
      path: filePath,
      type: file.type,
      user_id: user.id
    });

    // attach tags
    const validTags = tags.map(t => t.toString().trim()).filter(t => !!t);
    const createdTags = await attachTagToFile(created.id, validTags);

    // Return the created file metadata
    return c.json({ ...created, tags: createdTags?.attachedTags });
  } catch (error) {
    console.error("Error handling file upload:", error);
    throw new InternalErrorException();
  }
});

const public_file_handler = new Hono();

public_file_handler.get("/:id", async c => {
  const { id } = c.req.param();

  const file = await getFileByUuid(id);
  if (!file) {
    throw new NotFoundException();
  }

  const tags = await getFileTags(file.id);

  await increaseView(file.uuid);

  return c.json({ file, tags });
});

public_file_handler.patch("/:id", async c => {
  const { id } = c.req.param();
  await increaseView(id);

  return c.json({});
});

export { file_handler, public_file_handler };
