require("common.js");
global.port = 8080;

var Mocha = require('mocha')
  , servers = require(__dirname + "/../test/servers.js");
var mocha = new Mocha;

var files = fs.readdirSync(__dirname + "/../test/cloud/");

if (files == undefined) {
  console.log('Sorry, error occurred in fetching directory files');
}
if (files.length == 0) {
  console.log('Sorry, there are no files to test in the directory');
}

files.forEach(function (file) {
  mocha.addFile(__dirname + '/../test/cloud/' + file);
});

global.url = 'http://localhost:8080'
// Start the http and engine server
var engines = servers();
var http = start_http(null, engines, undefined);

mocha.run(function (failures) {
  process.exit(failures);
});
