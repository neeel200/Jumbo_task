import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
  {
    username: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
  },
  { timestamps: true }
);

const User = model("users", UserSchema);

export default User;



