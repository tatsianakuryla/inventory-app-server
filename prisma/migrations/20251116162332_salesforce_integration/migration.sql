-- CreateTable
CREATE TABLE "SalesforceIntegration" (
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "SalesforceIntegration_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "SalesforceIntegration_accountId_idx" ON "SalesforceIntegration"("accountId");

-- AddForeignKey
ALTER TABLE "SalesforceIntegration" ADD CONSTRAINT "SalesforceIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
