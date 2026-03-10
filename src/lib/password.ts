import bcrypt from "bcryptjs";

export async function hashPassword(plainPassword: string) {
  const saltRounds = 12;
  return await bcrypt.hash(plainPassword, saltRounds);
}

export async function verifyPassword(plainPassword: string, passwordHash: string) {
  return await bcrypt.compare(plainPassword, passwordHash);
}

