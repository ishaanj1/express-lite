"use strict";

var hexpress = require('./hexpress');
var app = hexpress();

// GET / should respond with "Fourth time is the charm"
app.get('/', function(req, res, next) {
  next();
});

app.get('/', function(req, res, next) {
  next();
});

app.get('/', function(req, res, next) {
  next();
});

app.get('/', function(req, res) {
  //res.send sets the browser output and prevents the output from being modified
  //So you can't even tell whether or not your code continued to execute request callbacks

  //res.send('Fourth time is the charm');
  console.log('Fourth time is the charm');
});

app.get('/', function(req, res) {
  res.send("The previous '/' route did not call next(), so this should be unreachable.");
});

// GET /skippable should respond with "First skippable route"
// GET /skippable?skip=true should respond with "Second skippable route"
app.get('/skippable', function(req, res, next) {
  if (req.query.skip) {
    next();
  } else {
    res.send('First skippable route');
  }
});

app.get('/skippable', function(req, res) {
  res.send('Second skippable route');
});

// GET /notfound should respond with a 404 Not Found
app.get('/notfound', function(req, res, next) {
  next();
});

app.listen(3000);
