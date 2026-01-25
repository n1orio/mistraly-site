import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Указываем путь к файлу базы данных здесь
    url: 'file:./prisma/dev.db',
  },
});