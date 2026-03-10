import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL이 필요합니다."),
  JWT_SECRET: z.string().min(16, "JWT_SECRET은 최소 16자 이상이어야 합니다."),
  APP_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function getEnv(): AppEnv {
  const parsed = EnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    APP_URL: process.env.APP_URL,
  });

  if (!parsed.success) {
    // Next 서버 시작 시 바로 원인을 보여주기 위해 throw
    throw new Error(
      `환경변수 설정이 올바르지 않습니다:\n${parsed.error.issues
        .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`
    );
  }

  return parsed.data;
}

