const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const jwt = require("jsonwebtoken");
const Cookies = require("js-cookie");
const multer = require("multer");

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const app = express();

const allowOrigins = [
  "http://localhost:3000",
  "http://localhost:3000/login",
  "http://localhost:3000/signup",
  "http://localhost:3000/dashboard",
  "https://savepdfhoney.netlify.app/",
  "https://savepdfhoney.netlify.app/login",
  "https://savepdfhoney.netlify.app/signup",
  "https://savepdfhoney.netlify.app/dashboard",
];

app.use(express.json());
app.use(cors({ credentials: true, origin: allowOrigins }));
app.use(cookieParser());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const createJwt = (username) => {
  return jwt.sign({ username }, "LOL", { expiresIn: "1hr" });
};

app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;
  const alreadyUser = await User.findOne({ username });
  if (alreadyUser) {
    return res.status(400).send({ msg: "User Already Exist" });
  }
  const newUser = new User({
    username: username,
    password: password,
  });
  await newUser.save();
  res.status(201).json({ msg: "User created successfully" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    const token = createJwt(username);
    res.status(200).send({ msg: "User Logged In", token });
  } else {
    return res.status(400).send({ msg: "User Failed To Login" });
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { originalname, buffer, mimetype } = req.file;
    const username = req.cookies.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.files.push({
      filename: originalname,
      data: buffer,
      contentType: mimetype,
    });

    await user.save();

    res.status(200).json({ message: "File uploaded successfully" });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/user/files", async (req, res) => {
  try {
    const username = req.cookies.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send({ msg: "User Not Found" });
    }
    res.status(200).send(user.files);
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/file/download/:filename", async (req, res) => {
  try {
    const username = req.cookies.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send({ msg: "User Not Found" });
    }
    const filename = req.params.filename;
    const file = user.files.find((file) => file.filename === filename);

    if (!file) {
      return res.status(404).send({ msg: "File Not Found" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    res.setHeader("Content-Type", file.contentType);
    res.send(file.data);
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: "Server Error" });
  }
});

app.post("/api/file/delete/:filename", async (req, res) => {
  try {
    const username = req.cookies.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send({ msg: "User Not Found" });
    }
    const filename = req.params.filename;
    const file = user.files.find((file) => file.filename === filename);

    if (!file) {
      return res.status(404).send({ msg: "File Not Found" });
    }

    const fileIndex = user.files.findIndex(
      (file) => file.filename === filename
    );

    if (fileIndex === -1) {
      return res.status(404).send({ msg: "File Not Found" });
    }
    user.files.splice(fileIndex, 1);

    await user.save();

    return res.status(200).send({ msg: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
});

mongoose
  .connect(MONGO_URL)
  .then(
    app.listen(3001, () => {
      console.log(`Server is running on port 3001`);
    })
  )
  .catch((err) => {
    console.log(err);
  });
