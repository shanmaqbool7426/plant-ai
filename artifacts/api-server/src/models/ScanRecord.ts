import mongoose, { Schema, Document } from "mongoose";

export interface IScanRecord extends Document {
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number;
  aliases: string[];
  careSummary: string;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  sunlight?: string;
  humidity?: string;
  temperature?: string;
  soilType?: string;
  toxicityToHumans: string;
  toxicityToPets: string;
  weedPotential: string;
  scannedAt: Date;
}

const ScanRecordSchema = new Schema<IScanRecord>(
  {
    commonName: { type: String, required: true },
    scientificName: { type: String, required: true },
    family: { type: String, required: true },
    confidence: { type: Number, required: true },
    aliases: { type: [String], default: [] },
    careSummary: { type: String, default: "" },
    wateringIntervalDays: { type: Number, default: 7 },
    fertilizingIntervalDays: { type: Number, default: 30 },
    sunlight: { type: String },
    humidity: { type: String },
    temperature: { type: String },
    soilType: { type: String },
    toxicityToHumans: { type: String, default: "Unknown" },
    toxicityToPets: { type: String, default: "Unknown" },
    weedPotential: { type: String, default: "Unknown" },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const ScanRecord = mongoose.model<IScanRecord>("ScanRecord", ScanRecordSchema);
