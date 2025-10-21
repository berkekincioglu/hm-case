-- CreateTable
CREATE TABLE "coins" (
    "id" VARCHAR(50) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "prices_daily" (
    "id" SERIAL NOT NULL,
    "coin_id" VARCHAR(50) NOT NULL,
    "currency_code" VARCHAR(10) NOT NULL,
    "date" DATE NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prices_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices_hourly" (
    "id" SERIAL NOT NULL,
    "coin_id" VARCHAR(50) NOT NULL,
    "currency_code" VARCHAR(10) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prices_hourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_metadata" (
    "coin_id" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "homepage_url" VARCHAR(500),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_metadata_pkey" PRIMARY KEY ("coin_id")
);

-- CreateIndex
CREATE INDEX "idx_prices_daily_lookup" ON "prices_daily"("coin_id", "currency_code", "date");

-- CreateIndex
CREATE INDEX "idx_prices_daily_date" ON "prices_daily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "prices_daily_coin_id_currency_code_date_key" ON "prices_daily"("coin_id", "currency_code", "date");

-- CreateIndex
CREATE INDEX "idx_prices_hourly_lookup" ON "prices_hourly"("coin_id", "currency_code", "timestamp");

-- CreateIndex
CREATE INDEX "idx_prices_hourly_timestamp" ON "prices_hourly"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "prices_hourly_coin_id_currency_code_timestamp_key" ON "prices_hourly"("coin_id", "currency_code", "timestamp");

-- AddForeignKey
ALTER TABLE "prices_daily" ADD CONSTRAINT "prices_daily_coin_id_fkey" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices_daily" ADD CONSTRAINT "prices_daily_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices_hourly" ADD CONSTRAINT "prices_hourly_coin_id_fkey" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices_hourly" ADD CONSTRAINT "prices_hourly_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_metadata" ADD CONSTRAINT "coin_metadata_coin_id_fkey" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
