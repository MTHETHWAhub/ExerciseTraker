const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//Requirements
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// definitions/schema
const userSchema = new mongoose.Schema({
  username: String,
});
const exerciseSchema = new mongoose.Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: { type: Date, default: new Date()},
  
});
//Create connection and name db
mongoose.connect(process.env.MONGODB_URI)/*, { useNewUrlParser: true, useUnifiedTopology: true })*/;
let user = mongoose.model('exerciseTracker', userSchema); //userModel
let exerciseTrack = mongoose.model('exercise', exerciseSchema); //exerciseModel
//

app.use(cors())
app.use(express.static('public'))
//Middleware
app.use("/", bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({extended: true}))
app.use(express.json());
//

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Posters
app.post("/api/users", async (req, res) => {
  let username = req.body.username;
  let newUser = new user({ username: username });
  try {
    await newUser.save();
    res.json(newUser);
  }
  catch(err) {
    console.log(err);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let id = req.params._id;
  let { description, duration, date } = req.body;
  try{
    const olduser = await user.findById(id); 
    if(!olduser) {
      res.json({error: "User not found"});
    }
    else{
      const newExercise = new exerciseTrack({
        user_id: olduser._id,
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date()
      });
      const exerciseSave = await newExercise.save();
      res.json({
        _id: olduser._id,
        username: olduser.username,
        description: newExercise.description,
        duration: newExercise.duration,
        date: new Date(newExercise.date).toDateString()
      });
    }
  }
  catch(err) {
    console.log(err);
  }
});


//Getters
app.get("/api/users", async (req, res) => {
  const allUsers = await user.find({})
  if(!user){
    res.json({error: "No users found"});
  }
  else{
    res.json(allUsers);
  }
});

/*app.get("/api/users/:_id/logs", async (req, res) => {
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  let id = req.params._id;
  const con_user = await user.findById(id);
  if (!con_user) {
    res.json({ error: "User not found" });
  } 
  
  let dateObj = {};
  if (from && !to) {
    to = new Date();
    dateObj["$gte"] = new Date(from);
    dateObj["$lte"] = new Date(to);
    console.log("Passed first if statement")
  }
  else if (to && !from) {
    from = new Date(0);
    dateObj["$lte"] = new Date(to);
    dateObj["$gte"] = new Date(from);
    console.log("Passed second if statement")
  }
  else if (from && to) {
    dateObj["$gte"] = new Date(from);
    dateObj["$lte"] = new Date(to);
    console.log("Passed third if statement")
  }
  else{
    to = new Date();
    from = new Date(0);
    dateObj["$gte"] = new Date(from);
    dateObj["$lte"] = new Date(to);
    console.log("Passed fourth if statement")
  }
  let filterObj = {user_id: id};
    
  if (from || to) {
    filterObj.date = dateObj;
  }

  let limitChecker = (limit) =>{
    let maxLimit = 100;
    if (!limit){
      return maxLimit;
    }
    else{
      return +limit;
    }
  };
  limit = limitChecker(limit);
  try{
  const exercises = await exerciseTrack.find(filterObj).limit(limit).then((logs) => {
    try{
      user.findById(id).then((user) => {
      let log = logs.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString(),
        }));
      console.log(log);
      console.log(from, to, limit);
      res.json({
        _id: id,
        username: user.username,
        from: from ? new Date(from).toDateString() : undefined,
        to: to ? new Date(to).toDateString() : undefined,
        count: log.length,
        log: log,
        });
      //console.log(from,to, limit);
      });
    } catch (err){
      console.log(err);
    }
  });
  } catch(err){
    console.log(err);
  }
});*/

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const id = req.params._id;
    const con_user = await user.findById(id);

    if (!con_user) {
      return res.json({ error: "User not found" });
    }

    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit;

    let dateObj = {};

    if (from && !to) {
      to = new Date();
    } else if (to && !from) {
      from = new Date(0);
    }

    dateObj["$gte"] = new Date(from);
    dateObj["$lte"] = new Date(to);

    let filterObj = { user_id: id };

    if (from || to) {
      filterObj.date = dateObj;
    }

    let limitChecker = (limit) =>{
    let maxLimit = 100;
      if (!limit){
        return maxLimit;
      }
      else{
        return +limit;
      }
    }
    
    limit = limitChecker(limit);

    const logs = await exerciseTrack.find(filterObj).limit(limit);
    const log = logs.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: new Date(log.date).toDateString(),
    }));

    res.json({
      _id: id,
      username: con_user.username,
      from: from ? new Date(from).toDateString() : undefined,
      to: to ? new Date(to).toDateString() : undefined,
      count: log.length,
      log: log,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
