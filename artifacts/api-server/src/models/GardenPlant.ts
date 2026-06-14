import mongoose, { Schema, Document } from "mongoose";

export interface IGardenPlant extends Document {
  commonName: string;
  scientificName: string;
  family: string;
  aliases: string[];
  careSummary?: string;
  wateringIntervalDays?: number;
  fertilizingIntervalDays?: number;
  sunlight?: string;
  humidity?: string;
  temperature?: string;
  soilType?: string;
  toxicityToHumans?: string;
  toxicityToPets?: string;
  notes?: string;
  savedAt: Date;
}

const GardenPlantSchema = new Schema<IGardenPlant>(
  {
    commonName: { type: String, required: true },
    scientificName: { type: String, required: true },
    family: { type: String, required: true },
    aliases: { type: [String], default: [] },
    careSummary: { type: String },
    wateringIntervalDays: { type: Number },
    fertilizingIntervalDays: { type: Number },
    sunlight: { type: String },
    humidity: { type: String },
    temperature: { type: String },
    soilType: { type: String },
    toxicityToHumans: { type: String },
    toxicityToPets: { type: String },
    notes: { type: String },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const GardenPlant = mongoose.model<IGardenPlant>("GardenPlant", GardenPlantSchema);
