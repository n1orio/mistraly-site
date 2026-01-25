// prisma.config.js
// УДАЛИТЕ require('dotenv')...
// ...
/**
 * @type {import('@prisma/cli').Config}
 */
const config = {
  schema: './prisma/schema.prisma', 
  datasources: [
    {
      name: 'db', 
      // ЖЕСТКО КОДИРУЕМ URL для SQLite (предполагаем, что dev.db находится в корне)
      url: 'file:./dev.db', 
      provider: 'sqlite', 
    },
  ],
};

module.exports = config;