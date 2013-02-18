
/**
 * Module requirements.
 */

var Transport = require('../transport')
  , parser = require('engine.io-parser')
  , debug = require('debug')('engine:polling');

/**
 * Exports the constructor.
 */

module.exports = Polling;

/**
 * HTTP polling constructor.
 *
 * @api public.
 */

function Polling (req) {
  Transport.call(this, req);
};

/**
 * Inherits from Transport.
 *
 * @api public.
 */

Polling.prototype.__proto__ = Transport.prototype;

/**
 * Transport name
 *
 * @api public
 */

Polling.prototype.name = 'polling';

/**
 * Overrides onRequest.
 *
 * @param {http.ServerRequest}
 * @api private
 */

Polling.prototype.onRequest = function (req) {
  var res = req.res;

  if ('closed' === this.readyState) {
    /* this should be handled in the upper tier */
    debug('incoming request after transport closed');
    res.writeHead(500);
    res.end();
    return;
  }

  if ('opening' === this.readyState) {
    this.readyState = 'open';
  }

  if ('GET' == req.method) {
    this.onPollRequest(req, res);
  } else if ('POST' == req.method) {
    this.onDataRequest(req, res);
  } else {
    res.writeHead(500);
    res.end();
  }
};

/**
 * The client sends a request awaiting for us to send data.
 *
 * @api private
 */

Polling.prototype.onPollRequest = function (req, res) {
  if (this.req) {
    debug('request overlap');
    // assert: this.res, '.req and .res should be (un)set together'
    this.onError('overlap from client');
    res.writeHead(500);
    res.end();
  } else {
    debug('setting request');
    if (undefined === this.req) {
      debug('setting handshake request');
      this.request = req;
    }

    this.req = req;
    this.res = res;

    var self = this;

    function onClose () {
      cleanup();
      self.onError('poll connection closed prematurely');
    }

    function cleanup () {
      req.removeListener('close', onClose);
      self.req = self.res = null;
      self.writable = false;
    }

    req.cleanup = cleanup;
    req.on('close', onClose);

    this.writable = true;
    this.emit('drain');

    // if we're still writable but had a pending close, trigger an empty send
    if (this.writable && this.shouldClose) {
      debug('triggering empty send to append close packet');
      this.send([{ type: 'noop' }]);
    }
  }
};

/**
 * The client sends a request with data.
 *
 * @api private
 */

Polling.prototype.onDataRequest = function (req, res) {
  if (this.dataReq) {
    // assert: this.dataRes, '.dataReq and .dataRes should be (un)set together'
    this.onError('data request overlap from client');
    res.writeHead(500);
    res.end();
  } else {
    this.dataReq = req;
    this.dataRes = res;

    var chunks = ''
      , self = this

    function cleanup () {
      chunks = '';
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('close', onClose);
      self.dataReq = self.dataRes = null;
    };

    function onClose () {
      cleanup();
      self.onError('data request connection closed prematurely');
    };

    function onData (data) {
      chunks += data;
    };

    function onEnd () {
      self.onData(chunks);
      res.writeHead(200, self.headers(req, {
          'Content-Length': 2
          // text/html is required instead of text/plain to avoid an
          // unwanted download dialog on certain user-agents (GH-43)
        , 'Content-Type': 'text/html'
      }));
      res.end('ok');
      cleanup();
    };

    req.abort = cleanup;
    req.on('close', onClose);
    req.on('data', onData);
    req.on('end', onEnd);
    req.setEncoding('utf8');
  }
};

/**
 * Processes the incoming data payload.
 *
 * @param {String} encoded payload
 * @api private
 */

Polling.prototype.onData = function (data) {
  debug('received "%s"', data);
  var packets = parser.decodePayload(data);
  for (var i = 0, l = packets.length; i < l; i++) {
    if ('close' == packets[i].type) {
      debug('got xhr close packet');
      this.req && this.req.cleanup();
      this.res && this.res.end();
      this.request = null;
      return this.onClose();
    }

    this.onPacket(packets[i]);
  }
};

/**
 * Writes a packet payload.
 *
 * @param {Object} packet
 * @api private
 */

Polling.prototype.send = function (packets) {
  if (!this.writable || 'closed' === this.readyState) {
    /* it's more like a bug to reach here */
    debug('send while closed or not writable');
    return;
  }

  if (this.shouldClose) {
    debug('appending close packet to payload');
    packets.push({ type: 'close' });
  }

  this.write(parser.encodePayload(packets));

  if (this.shouldClose) {
    while (this.shouldClose.length > 0) {
      var fn = this.shouldClose.shift();
      'function' == typeof fn && fn();
    }
    this.shouldClose = null;
    this.request = null;
    this.onClose();
  }
};

/**
 * Writes data as response to poll request.
 *
 * @param {String} data
 * @api private
 */

Polling.prototype.write = function (data) {
  debug('writing "%s"', data);
  this.doWrite(data);
  this.req.cleanup();
};

/**
 * Closes the transport.
 *
 * @api private
 */

Polling.prototype.doClose = function (fn) {
  debug('closing');

  if (this.dataReq) {
    // FIXME: should we do this?
    debug('aborting ongoing data request');
    this.dataReq.abort();
  }

  if (!this.shouldClose) {
    this.shouldClose = [];
  }
  this.shouldClose.push(fn);

  if (this.writable) {
    debug('transport writable - closing right away');
    this.send([{ type: 'close' }]);
  } else {
    debug('transport not writable - buffering orderly close');
  }
};
