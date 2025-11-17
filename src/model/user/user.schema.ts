import * as mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  username: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  salt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export type User = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);