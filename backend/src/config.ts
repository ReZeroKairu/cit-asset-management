import dotenv from "dotenv";
dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
};

export const config = {
  port: parseInt(getEnv("PORT", "3001"), 10),
  dbUrl: getEnv("DATABASE_URL"),
  jwtSecret: getEnv("JWT_SECRET"), // Will crash if missing
  frontendUrl: getEnv("FRONTEND_URL", "http://localhost:3000"),
};
