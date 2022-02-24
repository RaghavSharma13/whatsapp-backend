import mongoose from "mongoose";

const connectionUrl = process.env.MONGO_CONNECTION_STRING;

mongoose.connect(
  connectionUrl,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log("Connection to DB failed");
    } else {
      console.log("DB connected");
    }
  }
);

export const something = async () => {
  const db = await mongoose.connection.asPromise();
  return db.collection("chatroommodels");
};
