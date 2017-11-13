"use strict";

var http = require('http');
const querystring = require('querystring');
const Handlebars = require('handlebars');
const fs = require('fs');

module.exports = function () {
  var definedRoutes = [];

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

    // Defining helper function for parsing request queries later on
    function isJsonString(str) {
      try { JSON.parse(str); }
      catch (e) { return false; }
      return true;
    }
    // Parsing request path from req.url and setting it to be requestPath
    // Parsing request queries from req.url and setting it to be req.query
    var requestPath;
    req.query = {};
    if (req.url.includes('?')) {
      var queriesArray = req.url.slice(req.url.indexOf('?')+1).split('&');
      queriesArray.forEach(query => {
        var field = query.slice(0, query.indexOf('='));
        var value = query.slice(query.indexOf('=')+1);
        req.query[field] = isJsonString(value) ? JSON.parse(value) : value;
      });
      requestPath = req.url.slice(0, req.url.indexOf('?'));
    } else {
      requestPath = req.url;
    }
    requestPath = requestPath.replace(/^\/+|\/+$/g, '');

    // Defining a helper function for parsing path parameters later on
    const findPathParams = (requestPath, definedPath, isMiddleware) => {
      let requestPathNames = (requestPath === '') ? [] : requestPath.split('/');
      let definedPathNames = (definedPath === '') ? [] : definedPath.split('/');
      let pathParams = {};
      if (requestPathNames.length < definedPathNames.length) {
        return false;
      }
      if (!isMiddleware && requestPathNames.length > definedPathNames.length) {
        return false;
      }
      for (let i = 0; i < definedPathNames.length; i++) {
        if (definedPathNames[i].startsWith(':')) {
          let pathParamKey = definedPathNames[i].slice(1);
          pathParams[pathParamKey] = requestPathNames[i];
        } else if (requestPathNames[i] !== definedPathNames[i]) {
          return false;
        }
      }
      return pathParams;
    }

    // Parsing request body from req and defining req.body
    var body = '';
    req.on('readable', function() {
      var chunk = req.read();
      if (chunk) body += chunk;
    });
    req.on('end', function() {
      // queryString is the querystring node built-in
      req.body = querystring.parse(body);
      console.log('boo');

      for (let definedRoute of definedRoutes) {
        let callbackDidMatch = false;
        if (definedRoute.method === req.method) {
          let possiblePathParams = findPathParams(requestPath, definedRoute.path, false);
          if (possiblePathParams) {
            callbackDidMatch = true;
            req.params = possiblePathParams;
          }
        } else if (definedRoute.method === 'USE') {
          let possiblePathParams = findPathParams(requestPath, definedRoute.path, true);
          if (possiblePathParams) {
            callbackDidMatch = true;
            req.params = possiblePathParams;
          }
          //callbackDidMatch = (requestPath === definedRoute.path || requestPath.startsWith(definedRoute.path+'/'));
        }

        if (callbackDidMatch) {
          let doBreak = true;
          const next = () => (doBreak = false);
          definedRoute.callback(req, res, next);
          if (doBreak) { break; }
        }
      }

      // Harcoded browser output if no paths match the URL that the user visits
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end("Some people don't think the universe be like it is. But it do.");
    });
  });

  function addToDefinedRoutes(path, callback, method) {
    console.log(`THE DEVELOPER CREATED ${method} ${path}`);
    definedRoutes.push({
      path: path.replace(/^\/+|\/+$/g, ''),
      callback: callback,
      method: method
    });
  }

  return {
    get: function(path, callback) {
      addToDefinedRoutes(path, callback, 'GET');
    },
    post: function(path, callback) {
      addToDefinedRoutes(path, callback, 'POST');
    },
    use: function(path, callback) {
      if (typeof path === 'function') {
        callback = path;
        path = '';
      }
      addToDefinedRoutes(path, callback, 'USE');
    },
    listen: function(port) {
      console.log('YOU ARE LISTENING TO PORT', port);
      server.listen(port);
    }
  };
};
