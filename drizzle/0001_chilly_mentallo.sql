CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`talentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`location` varchar(255),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`allDay` boolean NOT NULL DEFAULT false,
	`notes` text,
	`projectId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('draft','active','completed','negotiating','cancelled','postponed') NOT NULL DEFAULT 'draft',
	`talents` json DEFAULT ('[]'),
	`profitMarginPercent` decimal(5,2) NOT NULL DEFAULT '15',
	`currency` varchar(10) NOT NULL DEFAULT 'KWD',
	`pdfTemplate` enum('client','internal','invoice') DEFAULT 'client',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `talents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`gender` enum('male','female') NOT NULL,
	`profilePhoto` text,
	`photos` json DEFAULT ('[]'),
	`phoneNumbers` json DEFAULT ('[]'),
	`socialMedia` json DEFAULT ('{}'),
	`pricePerProject` decimal(12,2) NOT NULL DEFAULT '0',
	`currency` varchar(10) NOT NULL DEFAULT 'KWD',
	`notes` text,
	`customFields` json,
	`rating` int,
	`tags` json DEFAULT ('[]'),
	`isFavorite` boolean NOT NULL DEFAULT false,
	`lastPhotoUpdate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `talents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthlyReminderEnabled` boolean NOT NULL DEFAULT true,
	`reminderDayOfMonth` int NOT NULL DEFAULT 1,
	`defaultProfitMargin` decimal(5,2) NOT NULL DEFAULT '15',
	`defaultCurrency` varchar(10) NOT NULL DEFAULT 'KWD',
	`lastReminderDate` timestamp,
	`viewMode` enum('grid','list') DEFAULT 'grid',
	`sortBy` enum('name','price','date','rating') DEFAULT 'name',
	`sortOrder` enum('asc','desc') DEFAULT 'asc',
	`darkMode` boolean NOT NULL DEFAULT false,
	`whatsappMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
