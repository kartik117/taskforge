import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
}

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: () => new Date() },
});

export const Project = model<IProject>('Project', projectSchema);
