/*
  Warnings:

  - A unique constraint covering the columns `[discordName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[minecraftNick]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "banner" TEXT,
ADD COLUMN     "discordName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_discordName_key" ON "public"."User"("discordName");

-- CreateIndex
CREATE UNIQUE INDEX "User_minecraftNick_key" ON "public"."User"("minecraftNick");
