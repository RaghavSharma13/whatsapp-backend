import { Router } from "express";
import Pusher from "pusher";
import chatRoomModel from "../db/models/chatRoomModel.js";
import Users from "../db/models/userModel.js";
import { something } from "../db/mongoose.js";

const collection = await something();

const router = new Router();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const createPipeline = (roomId) => {
  if (!roomId) return [];
  return [
    {
      $match: {
        operationType: "update",
        "fullDocument._id": roomId,
      },
    },
  ];
};

const changeStream = collection.watch(createPipeline(), {
  fullDocument: "updateLookup",
});

router.post("/user/addChat", async (req, res) => {
  try {
    const newRoom = await new chatRoomModel({
      roomName: req.body.roomName,
      createdBy: req.body.createdBy,
      code: req.body.roomCode,
    });

    newRoom.save();

    const status = await Users.updateOne(
      { _id: req.body._id },
      {
        $push: {
          createdRooms: newRoom._id, //changed here
        },
      }
    );

    res.status(201).send({
      _id: newRoom._id,
      roomName: newRoom.roomName,
    });
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/room", async (req, res) => {
  const room = await chatRoomModel.findById(req.query._id);
  changeStream.pipeline = createPipeline();
  if (room) {
    const callback = async (change) => {
      if (change.operationType === "update") {
        const messageDetails = await change.fullDocument.messages.slice(-1)[0];

        pusher.trigger("messages", "updated", {
          _id: messageDetails._id,
          user_id: messageDetails.sentBy.user_id,
          name: messageDetails.sentBy.user_name,
          text: messageDetails.text,
          timestamp: messageDetails.sentAt,
        });
      }
    };

    if (changeStream.listenerCount("change") === 0) {
      changeStream.on("change", callback);
    }

    res.status(200).send({
      _id: room._id,
      roomName: room.roomName,
      roomCode: room.code,
    });
  } else res.status(500).send();
});

router.get("/room/getMsgs", async (req, res) => {
  try {
    const chat = await chatRoomModel.findById(req.query._id);
    // console.log("From getMsgs--------------\n", chat);
    if (chat) {
      const messages = chat.messages.map((message) => {
        return {
          _id: message._id,
          user_id: message.sentBy.user_id,
          name: message.sentBy.user_name,
          text: message.text,
          timestamp: message.sentAt,
        };
      });
      res.status(200).send(messages);
    }
  } catch (error) {
    res.status(500).send();
  }
});

// gets message object and room id to which it belongs
router.post("/room/sendMsg", async (req, res) => {
  try {
    const status = await chatRoomModel.updateOne(
      { _id: req.body._id },
      {
        $push: {
          messages: {
            sentBy: {
              user_id: req.body.user_id,
              user_name: req.body.user_name,
            },
            sentAt: req.body.sentAt,
            text: req.body.text,
          },
        },
      }
    );
    res.status(201).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/room/join", async (req, res) => {
  try {
    const targetUser = await Users.findOne({
      email: req.body.data.owner,
    }).populate("createdRooms");

    if (!targetUser) throw new Error("User not found.");

    const room = targetUser.createdRooms.find(
      (r) => r.code === req.body.data.roomCode
    );

    if (!room) throw new Error("Room not found");

    await Users.findByIdAndUpdate(req.body.userId, {
      $push: {
        joinedRooms: room._id, //changed here
      },
    });

    res.status(200).send({
      roomName: room.roomName,
      _id: room._id,
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

// router.get("/room/stopMonitoring", (_req, res) => {
//   try {
//     monitorRoom(false);
//     res.status(200).send();
//   } catch (e) {
//     res.status(500).send();
//   }
// });

export default router;
