import express from "express";
import Users from "../db/models/userModel.js";
import jwt from "jsonwebtoken";

const router = new express.Router();

const jwtSecret = process.env.JWT_SECRET;
// console.log(jwtSecret);

router.get("/user/checkExistingUser", async (req, res) => {
  if (!req.cookies.token) {
    res.status(400).send();
    return;
  }
  try {
    const verifiedPayload = jwt.verify(req.cookies.token, jwtSecret);

    const user = await Users.findOne({
      googleId: parseInt(verifiedPayload.gid),
    });

    res.status(200).send(user);
  } catch (e) {}
});

router.post("/signUser", async (req, res) => {
  const user = await Users.findOne({
    googleId: parseInt(req.body.googleId),
  });

  const generateCookiePayload = (googleId) => {
    const cookiePayload = jwt.sign({ gid: googleId }, jwtSecret, {
      expiresIn: "24h",
    });
    return cookiePayload;
  };

  const cookieOptions = {
    expire: new Date().setHours(new Date().getHours() + 24),
    sameSite: "Lax",
    httpOnly: true,
  };

  if (user) {
    res
      .status(200)
      .cookie("token", generateCookiePayload(user.googleId), cookieOptions)
      .send(user);

    return;
  }
  const newUser = new Users({
    googleId: parseInt(req.body.googleId),
    email: req.body.email,
    name: req.body.name,
    imageURL: req.body.imageUrl,
  });
  await newUser.save();

  res
    .status(201)
    .cookie("token", generateCookiePayload(newUser.googleId), cookieOptions)
    .send(newUser);
});

router.get("/user/getchats", async (req, res) => {
  try {
    const user = await Users.findById(req.query._id)
      .populate("createdRooms", ["roomName", "_id", "code"])
      .populate("joinedRooms", ["roomName", "_id"]);

    res.status(200).send({
      createdChats: user.createdRooms, //changed here
      joinedChats: user.joinedRooms,
    });
  } catch (error) {
    res.status(500).send();
  }
});

export default router;
