import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: Number, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  imageURL: { type: String },
  createdRooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoomModel",
    },
  ],
  joinedRooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoomModel",
    },
  ],
});

export default mongoose.model("Users", userSchema);
