"use strict";

var http = require('http');
const querystring = require('querystring');
const Handlebars = require('handlebars');
const fs = require('fs');

module.exports = function () {
  var responseCallbacks = [];

  var server = http.createServer(function(req, res) {
    console.log(`SOMEBODY MADE A ${req.method} REQUEST TO ${req.url}`);
    res.send = function(response) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(response);
    };
    res.json = function(response) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(response));
    };
    res.render = function(hbsfile, obj) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      var hbs = fs.readFileSync('./views/' + hbsfile, 'utf8');
      var template = Handlebars.compile(hbs);
      res.end(template(obj));
    };
    req.query = {};
    function IsJsonString(str) {
      try { JSON.parse(str); }
      catch (e) { return false; }
      return true;
    }
    var route = req.url;
    if (req.url.includes('?')) {
      var queriesArray = req.url.slice(req.url.indexOf('?')+1).split('&');
      queriesArray.forEach(query => {
        var field = query.slice(0, query.indexOf('='));
        var value = query.slice(query.indexOf('=')+1);
        req.query[field] = IsJsonString(value) ? JSON.parse(value) : value;
      });
      route = req.url.slice(0, req.url.indexOf('?'));
    }

    var body = '';
    req.on('readable', function() {
        var chunk = req.read();
        if (chunk) body += chunk;
    });
    req.on('end', function() {
        // queryString is the querystring node built-in
        req.body = querystring.parse(body);
        let doBreak = true;
        console.log('boo')
        const next = () => (doBreak = false);
        for (let callbackObj of responseCallbacks) {
          if (callbackObj.method === req.method && callbackObj.route === route) {
            callbackObj.callback(req, res, next);
            if (doBreak) { break; }
          } else if (callbackObj.method === 'USE' &&
                    (route === callbackObj.route || route.startsWith(callbackObj.route+'/'))
                    ) {
            callbackObj.callback(req, res, next);
            if (doBreak) { break; }
          }
          doBreak = true;
        }
        //Harcoded browser output if no routes match the URL that the user visits
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("Some people don't think the universe be like it is. But it do.");
    });
  });

  function addToResponseCallbacks(route, callback, method) {
    console.log(`YOU CREATED ${method} ${route}`);
    responseCallbacks.push({
      route: route,
      callback: callback,
      method: method
    });
  }

  return {
    get: function(route, callback) {
      addToResponseCallbacks(route, callback, 'GET');
    },
    post: function(route, callback) {
      addToResponseCallbacks(route, callback, 'POST');
    },
    use: function(route, callback) {
      if (typeof route === 'function') {
        callback = route;
        route = '';
      }
      addToResponseCallbacks(route, callback, 'USE');
    },
    listen: function(port) {
      console.log('YOU ARE LISTENING TO PORT', port);
      server.listen(port);
    }
  };
};
