
/**
 * Module dependencies.
 */

var WebSocket = require('./websocket');

/**
 * Exports the constructor.
 */

module.exports = FlashSocket;

/**
 * The FlashSocket transport is just a proxy
 * for WebSocket connections.
 *
 * @api public
 */
 
function FlashSocket (socket) {
  WebSocket.call(this, socket);
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
