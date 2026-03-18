/*
  Warnings:

  - You are about to drop the column `comment` on the `Review` table. All the data will be lost.
  - You are about to drop the column `description` on the `Series` table. All the data will be lost.
  - You are about to drop the column `genre` on the `Series` table. All the data will be lost.
  - You are about to drop the column `posterUrl` on the `Series` table. All the data will be lost.
  - A unique constraint covering the columns `[userId,seriesId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `Series` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `text` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- Drop foreign keys if they exist (MySQL doesn't have IF EXISTS for foreign keys, so we check first)
-- Check and drop Review_seriesId_fkey
SET @dbname = DATABASE();
SET @tablename = 'Review';
SET @constraintname = 'Review_seriesId_fkey';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @constraintname)
  ) > 0,
  CONCAT('ALTER TABLE `', @tablename, '` DROP FOREIGN KEY `', @constraintname, '`'),
  'SELECT 1'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- Check and drop Review_userId_fkey
SET @constraintname = 'Review_userId_fkey';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @constraintname)
  ) > 0,
  CONCAT('ALTER TABLE `', @tablename, '` DROP FOREIGN KEY `', @constraintname, '`'),
  'SELECT 1'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- DropIndex (handle if doesn't exist)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'User'
      AND INDEX_NAME = 'User_name_key'
  ) > 0,
  'DROP INDEX `User_name_key` ON `User`',
  'SELECT 1'
));
PREPARE dropIndexIfExists FROM @preparedStatement;
EXECUTE dropIndexIfExists;
DEALLOCATE PREPARE dropIndexIfExists;

-- AlterTable
ALTER TABLE `Review` DROP COLUMN `comment`,
    ADD COLUMN `text` TEXT NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Series` DROP COLUMN `description`,
    DROP COLUMN `genre`,
    DROP COLUMN `posterUrl`,
    ADD COLUMN `averageRating` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `backdropPath` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `externalId` VARCHAR(191) NULL,
    ADD COLUMN `genres` JSON NULL,
    ADD COLUMN `overview` TEXT NULL,
    ADD COLUMN `posterPath` VARCHAR(191) NULL,
    ADD COLUMN `reviewsCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `releaseYear` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `Favorite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `seriesId` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Favorite_userId_idx`(`userId`),
    INDEX `Favorite_seriesId_idx`(`seriesId`),
    UNIQUE INDEX `Favorite_userId_seriesId_key`(`userId`, `seriesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Season` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seriesId` INTEGER NOT NULL,
    `seasonNumber` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `overview` TEXT NULL,
    `airDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Season_seriesId_idx`(`seriesId`),
    UNIQUE INDEX `Season_seriesId_seasonNumber_key`(`seriesId`, `seasonNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Episode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seasonId` INTEGER NOT NULL,
    `episodeNumber` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `overview` TEXT NULL,
    `airDate` DATETIME(3) NULL,
    `runtime` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Episode_seasonId_idx`(`seasonId`),
    UNIQUE INDEX `Episode_seasonId_episodeNumber_key`(`seasonId`, `episodeNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex (create indexes explicitly - MySQL may already have indexes from foreign keys, but Prisma wants named indexes)
-- Note: These may already exist from foreign key constraints, but we create them explicitly for Prisma's @@index directives
CREATE INDEX `Review_seriesId_idx` ON `Review`(`seriesId`);
CREATE INDEX `Review_userId_idx` ON `Review`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `Review_userId_seriesId_key` ON `Review`(`userId`, `seriesId`);

-- CreateIndex
CREATE UNIQUE INDEX `Series_externalId_key` ON `Series`(`externalId`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `Series`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `Series`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Season` ADD CONSTRAINT `Season_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `Series`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Episode` ADD CONSTRAINT `Episode_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
