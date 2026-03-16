-- CreateTable
CREATE TABLE "body_metrics" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bodyFatPct" DOUBLE PRECISION,
    "muscleMass" DOUBLE PRECISION,
    "bodyShape" INTEGER,
    "boneMass" DOUBLE PRECISION,
    "visceralFat" DOUBLE PRECISION,
    "bmr" DOUBLE PRECISION,
    "metabolicAge" INTEGER,
    "waterPct" DOUBLE PRECISION,
    "waistCirc" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "heartRate" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
