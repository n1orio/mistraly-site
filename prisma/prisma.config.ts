// prisma/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  migrate: {
    // путь к sqlite файлу
    datasourceUrl: "file:./prisma/dev.db",
  },
});
