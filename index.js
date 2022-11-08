const express = require('express');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require('dotenv').config();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}))

mongoose.connect(process.env.MDB_URL);

const exerciseSchema = {
  userId: {type: String, required: true},
  description: String,
  duration: Number,
  date: {type: Date, default: Date.now} 
}

const userSchema = {
  username: String
}

const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res)=>{
  const newUser = new User({
    username: req.body.username
  });
  newUser.save((err, data)=>{
    if (err){
      res.send("There was an error saving user information")
    } else {
      res.json(data);
    }
  })
})

app.post("/api/users/:id/exercises", (req, res)=>{
  const userId = req.params.id;
  const description = req.body.description;
  const duration = Number(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();
  if (isNaN(duration)) {
		return res.json({ error: 'duration is not a number' });
	}
	if (date == 'Invalid Date') {
		return res.json({ error: 'date is invalid' });
	}
  User.findById(userId, (err, userData)=>{
    if(err || !userData) {
      res.send("Could not find user")
    } else {
      const newExercise = new Exercise({
        userId,
        description,
        duration,
        date
      });
      newExercise.save((saveErr, exerciseData)=>{
        if (saveErr || !exerciseData) {
          res.send("There was an error saving this exercise")
        } else {
          res.json({_id: userData._id,
						username: userData.username,
						description: exerciseData.description,
						duration: exerciseData.duration,
						date: new Date(exerciseData.date).toDateString()});
        }
      })
    }
  })
})

app.get("/api/users/:id/logs", (req, res) => {
  const {from, to, limit} = req.query;
  const userId = req.params.id;
  User.findById(userId, (err, userData) => {
    if (err || !userData) {
      res.send("There was an error");
    } else {
      let filter = {
        userId: userId
      }
      let dateObj = {};
      if (from) {
        dateObj["$gte"] = new Date(from);
      }
      if (to) {
        dateObj["$lte"] = new Date(to);
      }
      if (from || to) {
        filter.date = dateObj;
      }
      let nonNullLimit;
      if (limit) {
        nonNullLimit = Number(limit);
      } else {
        nonNullLimit = 500;
      }

      User.findById(userId, (userErr, userData)=>{
        if (userErr || !userData){
          res.send("Error: User not found.")
        } else {
           Exercise.find(filter).limit(nonNullLimit).exec((exerciseErr, exerciseData)=>{
        if (exerciseErr || !exerciseData) {
          res.send([]);
        } else {
          const count = exerciseData.length;
          const {username, _id} = userData;
          const log = exerciseData.map(l => ({
            description: l.description,
            duration: l.duration,
            date: new Date(l.date).toDateString()}));
          res.json({username, _id, log, count});
        }
      })
        }
      })

     
    }
  })
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (!data){
      res.send("No users")
    } else {
      res.json(data);
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
