import { defineConfig } from '@prisma/config';

export default defineConfig({
  // Указываем путь к схеме
  schema: './prisma/schema.prisma',
  datasource: {
    // Переносим URL сюда
    url: 'file:./dev.db',
  },
});