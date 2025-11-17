import * as mongoose from "mongoose";

const passkeyCridentialSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String, required: true, index: true },
  credentialId: { type: String, required: true, unique: true },
  credential: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export type PasskeyCridential = mongoose.InferSchemaType<typeof passkeyCridentialSchema>;
export const PasskeyCridential = mongoose.model('PasskeyCridential', passkeyCridentialSchema);
