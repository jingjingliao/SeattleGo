const mongoose = require("mongoose");
var Comment = require("./comment");

// Schema setup
let travelPlacesSchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  created: {
    type: Date,
    default: Date.now,
  },
  createdAt: { type: Date, default: Date.now },
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
});

let Travelplaces = mongoose.model("TravelPlaces", travelPlacesSchema);

module.exports = Travelplaces;
