var Radio = require('../src');
var Container = require('digger-bundle');
var EventEmitter = require('events').EventEmitter;

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

  it('should wrap container radio', function(done) {
  
    var container = Container([{
      _digger:{
        diggerwarehouse:'/apiv1',
        diggerpath:[20,34]
      }
    }])

    var radio = get_radio(container);

    radio.on('talk', function(channel, packet){
      channel.should.equal('apiv1.20.34.hello');
      packet.should.equal('world');
    })

    radio.listen('hello', function(packet){
      packet.should.equal('world');
    })

    radio.talk('hello', 'world')
    radio.receive('apiv1.20.34.hello', 'world');
    done();


    
  })

  it('should inject an append event into the container data', function(done){
    
    var container = Container([{
      _digger:{
        tag:'folder',
        diggerwarehouse:'/apiv1',
        diggerpath:[20,34],
        diggerid:'45'
      }
    }])

    var radio = get_radio(container);
    radio.bind();

    radio.receive('apiv1.20.34', {
      action:'append',
      context:{
        _digger:{
          diggerid:'45'
        }
      },
      body:[{
        _digger:{
          tag:'thing'
        }
      }]
    });

    var results = container.find('thing');
    results.count().should.equal(1);

    done();
  })

  it('should inject a save event into the container data', function(done){
    
    var container = Container([{
      _digger:{
        tag:'folder',
        diggerwarehouse:'/apiv1',
        diggerpath:[20,34],
        diggerid:'45'
      }
    }])

    var radio = get_radio(container);
    radio.bind();

    radio.receive('apiv1.20.34', {
      action:'save',
      body:{
        _digger:{
          diggerid:'45'
        },
        color:'red'
      }
    });

    var results = container.find('folder');

    results.attr('color').should.equal('red');
    

    done();
  })

  it('should inject a remove event into the container data', function(done){
    
    var container = Container([{
      _digger:{
        tag:'folder',
        diggerwarehouse:'/apiv1',
        diggerpath:[20,34],
        diggerid:'45'
      },
      _children:[{
        _digger:{
          tag:'thing',
          diggerparentid:'45',
          diggerid:'67'
        }
      }]
    }])

    var radio = get_radio(container);
    radio.bind();

    radio.receive('apiv1.20.34', {
      action:'remove',
      body:{
        _digger:{
          diggerparentid:'45',
          diggerid:'67'
        }
      }
    });

    container.find('*').count().should.equal(1);
    
    done();
  })

  it('should emit supplychain events for container radio', function(done){

    var supplychain = new EventEmitter();
    
    var container = Container([{
      _digger:{
        tag:'folder',
        diggerwarehouse:'/apiv1',
        diggerpath:[20,34],
        diggerid:'45'
      },
      _children:[{
        _digger:{
          tag:'thing',
          diggerparentid:'45',
          diggerid:'67'
        }
      }]
    }])

    container.supplychain = supplychain;

    var radio = container.radio();

    supplychain.on('radio', function(action, channel, packet){
      if(action=='talk'){
        channel.should.equal('apiv1.20.34.hello');
        packet.should.equal(10);
        step2();  
      }
      else if(action=='listen'){
        channel.should.equal('apiv1.20.34.hello');
        packet.should.be.type('function');
        step3(); 
      }
      else if(action=='cancel'){
        channel.should.equal('apiv1.20.34.hello');        
        packet.should.be.type('function');
        done(); 
      }
      
    })
    
    function step1(){
      radio.talk('hello', 10);  
    }

    function step2(){
      radio.listen('hello', function(){});
    }

    function step3(){
      radio.cancel('hello', function(){});
    }
    
    step1();
  }) 

})
