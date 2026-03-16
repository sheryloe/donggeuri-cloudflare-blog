export interface WorkerBindings {
  DB: D1Database;
  ASSETS: R2Bucket;
  R2_PUBLIC_BASE_URL: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
}

export type AppEnv = {
  Bindings: WorkerBindings;
};
