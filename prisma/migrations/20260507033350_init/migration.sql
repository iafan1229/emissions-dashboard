-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityData" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,

    CONSTRAINT "ActivityData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_companyId_productId_idx" ON "ImportBatch"("companyId", "productId");

-- CreateIndex
CREATE INDEX "ImportBatch_uploadedAt_idx" ON "ImportBatch"("uploadedAt");

-- CreateIndex
CREATE INDEX "ActivityData_productId_idx" ON "ActivityData"("productId");

-- CreateIndex
CREATE INDEX "ActivityData_companyId_idx" ON "ActivityData"("companyId");

-- CreateIndex
CREATE INDEX "ActivityData_date_idx" ON "ActivityData"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityData_companyId_productId_date_activityType_descript_key" ON "ActivityData"("companyId", "productId", "date", "activityType", "description", "amount");

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
