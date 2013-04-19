
/**
 * Expose `eio` global.
 */

global.eio = require('../index');

/**
 * Expose client.
 */

global.eioc = require('engine.io-client');

/**
 * Expose `request` global.
 */

global.request = require('superagent');

/**
 * Expose `expect` global
 */

global.expect = require('expect.js');

/**
 * Expose `fs` global
 */
global.fs = require('fs');

/*
 *
 */
require('s').extend();

/**
 * Listen shortcut that fires a callback on an ephemeral port.
 */

global.listen = function (opts, fn) {
  if ('function' == typeof opts) {
    fn = opts;
    opts = {};
  }

  var e = global.eio.listen(null, opts, function () {
    fn(e.httpServer.address().port);
  });

  return e;
};

/** 
 * Prints the async errors to the error.txt
 */
global.print_errors = function(browsers, fullTitle, stack) {
  
  var log = fs.createWriteStream(__dirname + '/../test/errors.out', {flags: 'a', encoding: null});
  log.once('open', function (fd) {
    log.write("\n");
    var string = browsers
    log.write(browsers);
    log.write("\n");
    log.write(fullTitle);
    log.write("\n");
    var replaced = stack.replace(/^/gm, '       ');
    log.write(replaced);
    log.write("\n");
    log.end();
  });
};

/**
 * Starts an http server and serves the files 
 * and handle img requests
 */
global.start_http = function(grid, engines, cloud){
  var useragent = require('useragent')
    , http = require('http').createServer();
  http.listen(8080);

  fs.writeFile(__dirname + '/../test/errors.out', "");
  // http requests
  http.on('request', function (req, res) {
    // If the request is for sockets
    if (req.url.indexOf('engine.io') > -1) {
      var splits = req.url.split('/');
      var index;
      if (req.url.indexOf('localhost') > -1) {
        index = parseInt(splits[4], 10);
      } else {
        index = parseInt(splits[2], 10);
      }

      // Give it to the appropriate socket
      engines[index].handleRequest(req, res);

    } else if (req.url.indexOf('fullTitle') > -1) {

    // If the request is a test response
      var stripped = decodeURIComponent(req.url);
      var indexFullTitle = stripped.indexOf('fullTitle') + 10
        , indexStack = stripped.indexOf('stack') + 6;

      var fullTitle = stripped.substring(indexFullTitle, indexStack - 7)
        , stack = stripped.substring(indexStack, stripped.length - 1);

      var agent = useragent.parse(req.headers['user-agent']);
      print_errors(agent.toString(), fullTitle, stack);
      var family = agent.toAgent().split(' ');
      var name = family[0];
      var version = family[1].split('.')[0];

      if (grid != null) {
        grid.markErrored(name, version, agent.os.toString(), cloud);
      }

    } else {
      if (req.url.indexOf('/test/cloud') == -1) {
        fs.readFile(__dirname + req.url,
          function (err, data) {
            if (err) {
              res.writeHead(500);
              return res.end('Error loading data');
            }
            res.writeHead(200);
            res.end(data.toString());
          });

      } else {
        fs.readFile(__dirname + '/../' + req.url,
          function (err, data) {
            if (err) {
              res.writeHead(500);
              return res.end('Error loading data');
            }
            res.writeHead(200);
            res.end(data.toString());
          });
      }
    }
  });

  return http
}
