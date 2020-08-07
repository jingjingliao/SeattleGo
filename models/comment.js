var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
  text: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
    imageUrl: {
      type: String,
      default: "https://image.ibb.co/jw55Ex/def_face.jpg",
    },
  },
  created: {
    type: Date,
    default: Date.now,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Comment", commentSchema);
