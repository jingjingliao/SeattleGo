var express = require("express");
var Travelplaces = require("./models/travelPlaces");
app = express();
bodyParser = require("body-parser");
mongoose = require("mongoose");
flash = require("connect-flash");
Travelplaces = require("./models/travelPlaces");
seedDB = require("./seeds");
Comment = require("./models/comment");

User = require("./models/user");
app.locals.moment = require("moment");
passport = require("passport");
(LocalStrategy = require("passport-local")),
  (passportLocalMongoose = require("passport-local-mongoose"));
methodOverride = require("method-override");

// const port = process.env.PORT || "mongodb://localhost:27017/seattle_go";
const uri = process.env.DATABASEURL || "mongodb://localhost:27017/seattle_go";
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to DB!"))
  .catch((error) => console.log(error.message));

app.use(flash());

app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  require("express-session")({
    secret: "Jingjing is Great",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// seedDB();

app.get("/", function (req, res) {
  res.render("landing");
});

// INDEX ROUTES -  SHOW ALL PLACES
app.get("/travelplaces", function (req, res) {
  // get all travel places from DB
  console.log(req.user);
  Travelplaces.find({}, function (err, allTravelPlaces) {
    if (err) {
      console.log(err);
    } else {
      res.render("travelPlaces/index", {
        travelplaces: allTravelPlaces,
        currentUser: req.user,
      });
    }
  });
});

// CREATE ROUTES - ADD NEW PLACES TO DB
app.post("/travelplaces", isLoggedIn, function (req, res) {
  // get data from the form and add to travelplaces array
  // redirect back to travelplaces page
  let name = req.body.name;
  let image = req.body.image;
  let description = req.body.description;
  let getImage = req.user.imageUrl;
  if (getImage === "") {
    getImage = "https://image.ibb.co/jw55Ex/def_face.jpg";
  } else {
    getImage = req.user.imageUrl;
  }

  let newTravelPlaces = {
    name: name,
    image: image,
    description: description,
    author: {
      id: req.user._id,
      username: req.user.username,
      imageUrl: getImage,
    },
  };
  // create a new campground and save it into the database
  Travelplaces.create(newTravelPlaces, function (err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/travelplaces");
    }
  });
});

// NEW ROUTES - SHOW FORM TO CREATE NEW PLACES
app.get("/travelplaces/new", isLoggedIn, function (req, res) {
  res.render("travelPlaces/new");
});

// SHOW ROUTE - SHOW SPECIFIC INFO FOR ONE PLACE
app.get("/travelplaces/:id", function (req, res) {
  Travelplaces.findById(req.params.id)
    .populate("comments")
    .exec(function (err, foundPlaces) {
      res.render("travelPlaces/show", { travelplaces: foundPlaces });
    });
});

// Add Comments
app.get("/travelplaces/:id/comments/new", isLoggedIn, function (req, res) {
  Travelplaces.findById(req.params.id, function (err, foundPlace) {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { foundPlace: foundPlace });
    }
  });
});

app.post("/travelplaces/:id/comments", isLoggedIn, function (req, res) {
  // look up campground using ID
  Travelplaces.findById(req.params.id, function (err, foundPlace) {
    if (err) {
      req.flash("error", "Something went wrong!");
      console.log(err);
      res.redirect("/travelplaces");
    } else {
      // console.log(req.body.comment);
      Comment.create(req.body.comment, function (err, comment) {
        if (err) {
          console.log(err);
        } else {
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          if (req.user.imageUrl === "") {
            comment.author.imageUrl =
              "https://image.ibb.co/jw55Ex/def_face.jpg";
          } else {
            comment.author.imageUrl = req.user.imageUrl;
          }

          comment.save();
          // add username and ID to comments and save it

          req.user;
          foundPlace.comments.push(comment);
          foundPlace.save();
          req.flash("success", "Successfully added comment!");
          res.redirect("/travelplaces/" + foundPlace._id);
        }
      });
    }
  });
});

// Authentication
app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    new User({ username: req.body.username, imageUrl: req.body.imageUrl }),
    req.body.password,
    function (err, user) {
      if (err) {
        req.flash("error", err.message);
        return res.render("register");
      }
      passport.authenticate("local")(req, res, function () {
        req.flash(
          "success",
          "Welcome to SeattleGo Website " + user.username + "!"
        );
        res.redirect("/travelplaces");
      });
    }
  );
});

app.get("/login", function (req, res) {
  res.render("login", { message: req.flash("error") });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/travelplaces",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

app.get("/logout", function (req, res) {
  req.logOut();
  req.flash("success", "Logged you out!");
  res.redirect("/travelplaces");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in!");
  res.redirect("/login");
}

app.get("/travelplaces/:id/edit", checkPlaceOwnership, function (req, res) {
  Travelplaces.findById(req.params.id, function (err, foundPlace) {
    res.render("travelPlaces/edit", { foundPlace: foundPlace });
  });
});

app.put("/travelplaces/:id", checkPlaceOwnership, function (req, res) {
  Travelplaces.findByIdAndUpdate(req.params.id, req.body.travelPlace, function (
    err,
    foundPlace
  ) {
    if (err) {
      res.redirect("/travelplaces");
    } else {
      res.redirect("/travelplaces/" + req.params.id);
    }
  });
});

// Destroy places
app.delete("/travelplaces/:id", checkPlaceOwnership, (req, res) => {
  Travelplaces.findByIdAndRemove(req.params.id, (err, placeRemoved) => {
    if (err) {
      console.log(err);
    }
    Comment.deleteMany({ _id: { $in: placeRemoved.comments } }, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/travelplaces");
    });
  });
});

function checkPlaceOwnership(req, res, next) {
  if (req.isAuthenticated()) {
    Travelplaces.findById(req.params.id, function (err, foundPlace) {
      if (err) {
        req.flash("error", "Places not found!");
        res.redirect("back");
      } else {
        if (foundPlace.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "You don't have permission!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You need to be logged in!");
    res.redirect("back");
  }
}

// comment
app.get(
  "/travelplaces/:id/comments/:comment_id/edit",
  checkCommentOwnership,
  function (req, res) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
      if (err) {
        res.redirect("back");
      } else {
        res.render("comments/edit", {
          foundPlace_id: req.params.id,
          comment: foundComment,
        });
      }
    });
  }
);

// Comment update
app.put(
  "/travelplaces/:id/comments/:comment_id",
  checkCommentOwnership,
  function (req, res) {
    Comment.findByIdAndUpdate(
      req.params.comment_id,
      req.body.comment,
      function (err, updatedComment) {
        if (err) {
          res.redirect("back");
        } else {
          res.redirect("/travelplaces/" + req.params.id);
        }
      }
    );
  }
);

// comment delete
app.delete(
  "/travelplaces/:id/comments/:comment_id",
  checkCommentOwnership,
  function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
      if (err) {
        res.redirect("back");
      } else {
        req.flash("success", "Comment successfully deleted");
        res.redirect("/travelplaces/" + req.params.id);
      }
    });
  }
);

function checkCommentOwnership(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
      if (err) {
        res.redirect("back");
      } else {
        if (foundComment.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "You don't have permission!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You need to be logged in!");
    res.redirect("back");
  }
}

app.listen(process.env.PORT || 3000, function () {
  console.log("SeattleGo server has already started!");
});
