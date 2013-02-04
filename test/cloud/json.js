describe('JSON', function(){
  
  describe('#stringify', function(){
    it('should stringify an array', function(){
      expect(JSON.stringify([1, 2, 3])).to.be('[1,2,3]');
    });
    
    it('should stringify an object', function(){
      expect(JSON.stringify({a:'b'})).to.be('{"a":"b"}');
    });
  });
  
});
