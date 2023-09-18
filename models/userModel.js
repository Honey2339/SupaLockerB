const mongoose = require("mongoose")

const fileSchema = mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
})

const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  files: [{ filename: String, data: Buffer, contentType: String }],
})
const supalocker = mongoose.connection.useDb("supalocker-db")
const userModel = supalocker.model("supalocker-users", userSchema)

module.exports = userModel
