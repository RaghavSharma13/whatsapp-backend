import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  messages: [
    {
      sentBy: {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Users",
        },
        user_name: {
          type: String,
          required: true,
        },
      },
      sentAt: {
        type: Date,
        default: Date.now(),
      },
      text: {
        type: String,
        required: true,
      },
    },
  ],
});

export default mongoose.model("ChatRoomModel", chatRoomSchema);
