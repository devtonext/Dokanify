-- AlterTable
ALTER TABLE "ThemeInstall" ADD COLUMN     "publishedVersionId" TEXT;

-- AddForeignKey
ALTER TABLE "ThemeInstall" ADD CONSTRAINT "ThemeInstall_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "ThemeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
