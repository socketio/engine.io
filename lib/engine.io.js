
/**
 * Module dependencies.
 */

var http = require('http')
  , debug = require('debug')('engine:core')

/**
 * Server listeners.
 *
 * @api private
 */

var serverListeners = [];

/**
 * Protocol revision number.
 *
 * @api public
 */

exports.protocol = 1;

/**
 * Expose Server constructor.
 *
 * @api public
 */

exports.Server = require('./server');

/**
 * Expose Server constructor.
 *
 * @api public
 */

exports.Socket = require('./socket');

/**
 * Expose Transport constructor.
 *
 * @api public
 */

exports.Transport = require('./transport');

/**
 * Expose mutable list of available trnasports.
 *
 * @api public
 */

exports.transports = require('./transports');

/**
 * Exports parser.
 *
 * @api public
 */

exports.parser = require('./parser');

/**
 * Crates an http.Server exclusively used for WS upgrades.
 *
 * @param {Number} port
 * @param {Function} callback
 * @param {Object} options
 * @return {Server} websocket.io server
 * @api public
 */

exports.listen = function (port, options, fn) {
  if ('function' == typeof options) {
    fn = options;
    options = {};
  }

  var server = http.createServer(function (req, res) {
    res.writeHead(501);
    res.end('Not Implemented');
  });

  server.listen(port, fn);

  // create engine server
  var engine = exports.attach(server, options);
  engine.httpServer = server;

  return engine;
};

/**
 * Captures upgrade requests for a http.Server.
 *
 * @param {http.Server} server
 * @param {Object} options
 * @return {Server} engine server
 * @api public
 */

exports.attach = function (server, options) {
  var engine = new exports.Server(options)
    , options = options || {}

  function serverListener() {
    for (var i=0; i<serverListeners.length; i++) {
      if (serverListeners[i][0] === server) {
        return serverListeners[i][1];
      }
    }

    var instanceListeners = {
      close: [],
      request: [],
      upgrade: []
    };

    // cache and clean up listeners
    var listeners = server.listeners('request')
      , oldListeners = []

    // copy the references onto a new array for node >=0.7
    for (var i = 0, l = listeners.length; i < l; i++) {
      oldListeners[i] = listeners[i];
    }

    server.removeAllListeners('request');

    server.on('close', function () {
      for (var i = 0, l = instanceListeners.close.length; i < l; i++) {
        instanceListeners.close[i]();
      }
    });

    // add request handler
    server.on('request', function (req, res) {
      var fired = false;
      for (var i = 0, l = instanceListeners.request.length; i < l; i++) {
        if (instanceListeners.request[i](req, res)) {
          fired = true;
          break;
        }
      }
      if (fired) return;
      for (var i = 0, l = oldListeners.length; i < l; i++) {
        oldListeners[i].call(server, req, res);
      }
    });

    server.on('upgrade', function (req, socket, head) {
      var fired = false;
      for (var i = 0, l = instanceListeners.upgrade.length; i < l; i++) {
        if (instanceListeners.upgrade[i](req, socket, head)) {
          fired = true;
          break;
        }
      }
      if (fired) return;
      // NOTE: `options.destroyUpgrade` must be equivalent for ALL `engine` instances using the same `server` instance!
      if (false !== options.destroyUpgrade) {
        socket.end();
      }      
    });

    if (~engine.transports.indexOf('flashsocket')
    && false !== options.policyFile) {
      server.on('connection', function (socket) {
        // NOTE: This only needs to be attached once to any `engine` instance as it does nothing
        //       specific to the instance.
        engine.handleSocket(socket);
      });
    }

    serverListeners.push([
      server,
      instanceListeners
    ]);

    return instanceListeners;
  }

  var listener = serverListener();

  listener.close.push(function() {
    engine.close();
  });

  var path = '/engine.io';
  if (typeof options.path === 'string') {
    path = options.path;
  }
  var check = makePathCheck(path, options.resource);

  // add request handler
  listener.request.push(function (req, res) {
    if (check(req)) {
      engine.handleRequest(req, res);
      return true;
    }
    return false;
  });

  if(~engine.transports.indexOf('websocket')) {
    listener.upgrade.push(function (req, socket, head) {
      if (check(req)) {
        engine.handleUpgrade(req, socket, head);
        return true;
      }
      return false;
    });
  }  

  return engine;
};

/**
 * Make function to check path/route.
 *
 * @param {Mixed} path
 * @param {String} resource
 * @return {Function} check function
 * @api private
 */

function makePathCheck(path, resource) {
  if (typeof resource === 'function') {
    return resource;
  } else
  if (typeof resource === 'object' && resource.test) {
    return function (req) {
      return resource.test(req.url.substring(path.length));
    };
  } else {
    // normalize path
    var route = path + '/' + (resource || 'default').replace(/^\/|\/$/g, '') + '/';
    return function (req) {
      return route == req.url.substr(0, route.length);
    }    
  }
}
