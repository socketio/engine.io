require('common.js');

module.exports = function () {
  var engines = []
    , ports = []
    , idx = 0;

  /**
   * Servers
   */
  var engine = new eio.Server();
  engine.on('connection', function (conn) {
    conn.send('apples');
    conn.close();
  });
  engines.push(engine);

  engine = new eio.Server();
  engine.on('connection', function (conn) {
    conn.close();
  });
  engines.push(engine);

  return engines;
};
