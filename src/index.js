/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*

	the channels we are listening to
	
*/
var utils = require('digger-utils');
var Emitter = require('wildemitter');
var Injector = require('./injector');

module.exports = Radio;

function Radio(basepath){
  Emitter.call(this);
  // assume container radio
  if(basepath && typeof(basepath)!=='string'){
    var container = this.container = basepath;
    basepath = (container.diggerwarehouse().replace(/^\//, '').replace(/\//g, '.') + '.' + (container.diggerpath() || []).join('.') + '.').replace(/\.+/g, '.');
  }
  this.basepath = basepath;
  this.channels = new Emitter();
}

utils.inherits(Radio, Emitter);

Radio.prototype.get_channel = function(st){
  if(!st){
    st = '*';
  }
  return (this.basepath ? this.basepath : '') + st;
}

Radio.prototype.talk = function(channel, packet){
  this.emit('talk', this.get_channel(channel), packet);
  return this;
}

Radio.prototype.listen = function(channel, fn){
  if(!fn){
    fn = channel;
    channel = '*';
  }
  channel = this.get_channel(channel);
  this.channels.on(channel, fn);
  this.emit('listen', channel, fn);
  return this;
}

Radio.prototype.cancel = function(channel, fn){
  var emitterkey = this.get_channel(channel);

  if(fn){
    this.channels.off(emitterkey, fn);
  }
  else{
    this.channels.off(emitterkey);
  }

  var listeners = this.channels.getWildcardCallbacks(emitterkey);
  if(listeners.length<=0){
    this.emit('cancel', emitterkey.replace(/\*$/, ''), fn);
  }
  return this;
}

Radio.prototype.receive = function(channel, packet){
  this.channels.emit(channel, packet, channel);
  return this;
}

Radio.prototype.bind = function(){
  if(this.container){
    this.listen('*', Injector(this, this.container));  
  }
  return this;
}

Radio.prototype.connect = function(supplychain){
  if(!supplychain){
    return this;
  }

  this.on('talk', function(channel, packet){
    supplychain.emit('radio', 'talk', channel, packet);
  })
  this.on('listen', function(channel, fn){
    supplychain.emit('radio', 'listen', channel, fn);
  })
  this.on('cancel', function(channel, fn){
    supplychain.emit('radio', 'cancel', channel, fn);
  })
  return this;
}