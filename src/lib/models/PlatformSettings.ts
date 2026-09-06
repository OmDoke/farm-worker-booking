import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformSettings extends Document {
  key: string;
  value: string; // stored as string/JSON; parse as needed
  updated_at: Date;
  updated_by?: mongoose.Types.ObjectId;
}

const PlatformSettingsSchema: Schema<IPlatformSettings> = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    updated_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: false }
);

export const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);

// ── Default seed values ──────────────────────────────────────────────────────
// Call this once at app start or via a migration script.
export async function seedPlatformSettings(): Promise<void> {
  const defaults: Array<{ key: string; value: string }> = [
    { key: 'commission_percent', value: '10' },
    { key: 'acceptance_sla_minutes', value: '120' },
    { key: 'escalation_radius_km', value: '25' },
    { key: 'terms_version', value: '1.0' },
  ];

  for (const setting of defaults) {
    await PlatformSettings.updateOne(
      { key: setting.key },
      { $setOnInsert: { key: setting.key, value: setting.value, updated_at: new Date() } },
      { upsert: true }
    );
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const setting = await PlatformSettings.findOne({ key });
  return setting?.value ?? null;
}
