
/**
 * Module dependencies.
 */

var WebSocket = require('./websocket');

/**
 * Exports the constructor.
 */

module.exports = FlashSocket;

/**
 * The FlashSocket transport is just a proxy for WebSocket connections.
 *
 * @param {http.ServerRequest} request
 * @api public
 */

function FlashSocket (req) {
  WebSocket.call(this, req);
}

/**
 * Inherits from WebSocket.
 */

FlashSocket.prototype.__proto__ = WebSocket.prototype;

/**
 * Transport name
 *
 * @api public
 */

FlashSocket.prototype.name = 'flashsocket';

/**
 * Advertise framing support.
 *
 * @api public
 */

FlashSocket.prototype.supportsFraming = true;