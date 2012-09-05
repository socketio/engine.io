
/**
 * Module dependencies.
 */

var http = require('http')
  , debug = require('debug')('engine:core')
  , events = require('events')

/**
 * Prefix for all URIs.
 *
 * @api public
 */

exports.URI_PREFIX = '/engine.io';

/**
 * Server handler cache.
 *
 * @api private
 */

var serverHandlers = [];

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

  function serverHandler() {
    for (var i=0; i<serverHandlers.length; i++) {
      if (serverHandlers[i][0] === server) {
        return serverHandlers[i][1];
      }
    }

    var handler = new events.EventEmitter();
    handler.setMaxListeners(100);

    // cache and clean up listeners
    var listeners = server.listeners('request')
      , oldListeners = []

    // copy the references onto a new array for node >=0.7
    for (var i = 0, l = listeners.length; i < l; i++) {
      oldListeners[i] = listeners[i];
    }

    server.removeAllListeners('request');

    server.on('close', function () {
      handler.emit('close');
    });

    // add request handler
    server.on('request', function (req, res) {
      handler.emit('request', req, res);
    });
    handler.next = function(req, res) {
      for (var i = 0, l = oldListeners.length; i < l; i++) {
        oldListeners[i].call(server, req, res);
      }
    }

    server.on('upgrade', function (req, socket, head) {
      handler.emit('upgrade', req, socket, head);
    });

    if (~engine.transports.indexOf('flashsocket')
    && false !== options.policyFile) {
      server.on('connection', function (socket) {
        // NOTE: This only needs to be attached once to any `engine` instance.
        engine.handleSocket(socket);
      });
    }

    serverHandlers.push([
      server,
      handler
    ]);

    return handler;
  }

  var handler = serverHandler();

  handler.on('close', function() {
    engine.close();
  });

  var check = makePathCheck(options.resource);

  // add request handler
  handler.on('request', function (req, res) {
    if (check(req)) {
      engine.handleRequest(req, res);
    } else {
      handler.next(req, res);
    }
  });

  if(~engine.transports.indexOf('websocket')) {
    handler.on('upgrade', function (req, socket, head) {
      if (check(req)) {
        engine.handleUpgrade(req, socket, head);
      } else if (false !== options.destroyUpgrade) {
        socket.end();
      }
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

function makePathCheck(resource) {
  if (typeof resource === 'function') {
    return resource;
  } else
  if (typeof resource === 'object' && resource.test) {
    return function (req) {
      return resource.test(req.url.substring(exports.URI_PREFIX.length));
    };
  } else {
    // normalize path
    var route = exports.URI_PREFIX + '/' + (resource || 'default').replace(/^\/|\/$/g, '') + '/';
    return function (req) {
      return route == req.url.substr(0, route.length);
    }    
  }
}
