/*global eio,eioc,listen,request,expect*/

/**
 * Tests.
 */

describe('server', function () {
  this.timeout(90000);
  describe('verification', function () {
    it('check that receive message', function (done) {
      var socket = new eioc.Socket({path: '/engine.io/0', port: global.port});

      socket.on('open', function () {
        socket.on('message', function (msg) {
          expect(msg == 'apples'); 
          done();
        });
      });
    });

    it('check that server close is handled', function(done){
      var socket = new eioc.Socket({path: '/engine.io/1', port: global.port});

      socket.on('open', function(){
        socket.on('close', function(reason){
          expect(reason).to.be('transport close');
          done();
        })
      })

    })
  });

});
