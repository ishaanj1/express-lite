"use strict";

var hexpress = require('./hexpress');
// var hexpress = require('express');
var app = hexpress();

// Simple route '/' that should replace the :fname and :lname
// params with alternative words and place them in req.params
app.get('/:fname/and/:lname', function(req, res) {
  res.json(req.params);
});

// Use route '/' that should replace the :name and :title
// params with alternative words and place them in req.params
app.use('/:name/the/:title', function(req, res) {
  res.json(req.params);
});

// Catch-all route
app.use(function(req, res) {
  res.send('AYYY, MUST BE THE MONAYY');
});

// Verify Your Solution:
// 1. Go to http://localhost:3000/prath/and/desai
// 2. You should see {"fname":"prath","lname":"desai"}
// 3. Go to http://localhost:3000/moose/and/paksoy
// 4. You should see {"fname":"moose","lname":"paksoy"}
// 5. Go to http://localhost:3000/ishaan/the/illustrious/kappa
// 6. You should see {"name":"ishaan","title":"illustrious"}
//
// Make sure all work (to make sure original routes are being kept constant)

app.listen(3000);
