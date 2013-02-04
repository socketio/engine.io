require("common.js");
global.port = 80;

var Canvas = require('term-canvas')
  , size = process.stdout.getWindowSize()
  , GridView = require('mocha-cloud-grid-view')
	, Cloud = require('mocha-cloud')
  , replace = require('replace')
  , servers = require(__dirname + '/../test/servers.js');

try{
  global.username = process.env.SAUCENAME;
  global.userkey = process.env.SAUCEKEY;
} catch(e) {}

/**
 * Starts the localtunnel instance
 */
var start_lt = function () {
  var lt_client = require('localtunnel').client;
  var client = lt_client.connect({
      // the localtunnel server
      host: 'http://localtunnel.me',
      // your local application port
      port: 8080
  });

  client.on('error', function (err) {
      console.log(err);
  });

  return client;
};

// create a cloud instance with browsers
var cloud = new Cloud("mocha-cloud", global.username, global.userkey);

/**
cloud.browser('opera', '11', 'Windows 2003');
cloud.browser('opera', '12', 'Windows 2008');
cloud.browser('internet explorer', '6', 'Windows 2003');
cloud.browser('internet explorer', '8', 'Windows 2008');
cloud.browser('internet explorer', '10', 'Windows 2012');
cloud.browser('firefox', '15', 'Windows 2003');
cloud.browser('firefox', '3.0', 'Windows 2008');
cloud.browser('firefox', '3.5', 'Windows 2012');
cloud.browser('firefox', '18', 'Windows 2012')
*/

cloud.browser('safari', '5', 'Windows 2008');
cloud.browser('chrome', '', 'Windows 2008');
cloud.browser('firefox', '19', 'Windows 2008')

/*
cloud.browser('ipad', '5.1', 'Mac 10.8');
cloud.browser('ipad', '6', 'Mac 10.8');

cloud.browser('iphone', '5.0', 'Mac 10.6');
cloud.browser('iphone', '5.1', 'Mac 10.8');
cloud.browser('iphone', '6', 'Mac 10.8');

cloud.browser('firefox', '17', 'Mac 10.6');
cloud.browser('safari', '5', 'Mac 10.6');
cloud.browser('chrome', '', 'Mac 10.8');

cloud.browser('opera', '12', 'Linux');
cloud.browser('chrome', '', 'Linux');
cloud.browser('firefox', '19', 'Linux');

//cloud.browser('android', '', 'Linux');
*/


var files = fs.readdirSync(__dirname + "/../test/cloud/");

if (files == undefined) {
  console.log('Sorry, error occurred in fetching directory files');
}
if (files.length == 0) {
  console.log('Sorry, there are no files to test in the directory');
}

var fileScripts = "";
files.forEach(function(file) {
  fileScripts += "<script src=\"../test/cloud/" + file + "\"></script>"
});
replace({
  regex: 'SCRIPTS_HERE',
  replacement: fileScripts,
  paths: [__dirname + '/index.html'],
  recursive: false,
  silent: true,
});

// localtunnel setup
var client = start_lt();
client.on('url', function (url) {
  var localtunnelURL = '\"' + url + '\"';
  cloud.url(url + '/index.html');
  // grid setup

  var canvas = new Canvas(size[0], size[1]);
  var ctx = canvas.getContext('2d');
  var grid = new GridView(cloud, ctx);
  grid.size(canvas.width, canvas.height);
  ctx.hideCursor();

  // trap SIGINT
  process.on('SIGINT', function () {
    ctx.reset();
    process.nextTick(function () {
      process.exit();
    });
  });

  // Start the http and engine server
  var engines = servers();
  var http = start_http(grid, engines, cloud);

  // output failure messages
  // once complete, and exit > 0
  // accordingly

  cloud.start(function () {
    //grid.showFailures();

    setTimeout(function () {

      cloud.stop_browser();

      ctx.showCursor();
      http.close();
      replace({
        regex: fileScripts,
        replacement: 'SCRIPTS_HERE',
        paths: [__dirname + '/index.html'],
        recursive: false,
        silent: true,
      });
      process.exit(0);
    }, 3000);

  });
});
