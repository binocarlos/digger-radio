var Radio = require('../src');
var Container = require('digger-container');

describe('radio', function(){

  /*
  
    return a fake radio setup that routes to itself
    
  */

  function get_radio(base){
    var radio = new Radio(base);

    radio.on('talk', function(channel, body){
      radio.receive(channel, body);
    })

    return radio;

    
  }

  it('should read on a path', function(done) {
    
    var radio = get_radio();

    radio.listen('apples', function(){
      done();
    })

    radio.talk('apples', 10);
  })


  it('should support wildcards', function(done) {
    
    var radio = get_radio();

    radio.listen('apples*', function(){
      done();
    })

    radio.talk('apples.pears', 10);
  })

  it('should support deep wildcards', function(done) {
    
    var radio = get_radio();

    radio.listen('apples.*', function(){
      done();
    })

    radio.talk('apples.pears.oranges.raspberries', 10);
  })

  it('should read on a base path', function(done) {
    var radio = get_radio('apples.');

    radio.listen('pears', function(){
      done();
    })

    radio.talk('pears', 10);
  })

  it('should cancel ok', function(done) {
    var radio = get_radio('apples.');

    var count = 0;
    var handler = function(){
      count++;
      if(count>1){
        throw new Error('should not happen twice');
      }
    }

    radio.listen('pears', handler);
    radio.talk('pears', 10);
    radio.cancel('pears', handler);
    radio.talk('pears', 10);
    done();
    
  })



})
