import type { LoginDto, RegisterDto } from "@repo/dto";
import bcrypt from "bcrypt";
import db from "../../supports/db.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { createToken } from "../../supports/jwt.js";

// Constants
const SALT_ROUNDS = 10;

/**
 * Handles user login.
 * @param credentials - The LoginDto object containing email and password.
 * @returns User object if successful, or an error message.
 */
export async function login(credentials: LoginDto) {
  const { email, password } = credentials;

  // Fetch the user by email
  const user = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      password: usersTable.password
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (user.length === 0) {
    return false;
  }

  const isPasswordValid = await bcrypt.compare(password, user[0].password);
  if (!isPasswordValid) {
    return false;
  }

  // Return the user without the password
  return {
    token: await createToken({ user_id: user[0].id }),
    user: {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email
    }
  };
}

/**
 * Check if the user with the email already exists
 * @param email - The email to check
 */
export async function checkUserByEmail(email: string): Promise<boolean> {
  const existingUser = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  return existingUser.length > 0;
}

/**
 * Find a user by id
 * @param id user.id
 * @returns user or undefined
 */
export async function findUser(id: number) {
  const user = await db
    .select({
      email: usersTable.email,
      id: usersTable.id,
      name: usersTable.name
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  return user[0];
}

/**
 * Handles user registration.
 * @param data - The RegisterDto object containing name, email, and password.
 * @returns Newly created user object or an error message.
 */
export async function register(data: RegisterDto) {
  const { name, email, password } = data;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert the new user
  const insertedUser = await db
    .insert(usersTable)
    .values({
      name,
      email,
      password: hashedPassword,
      created_at: new Date().toISOString()
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email
    });

  return {
    token: await createToken({ user_id: insertedUser[0].id }),
    user: insertedUser[0]
  };
}
