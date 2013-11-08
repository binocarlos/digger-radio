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
var Emitter = require('wildemitter');

module.exports = function(basepath){

	function get_channel(st){
		if(!st){
			st = '*';
		}
		return (basepath ? basepath : '') + st;
	}

	// radio is the api
	var radio = new Emitter({
  })

	// channels registers our functions
  var channels = new Emitter({
  })

  radio.talk = function(channel, body){
  	channels.emit(get_channel(channel), body);
  }

  radio.listen = function(channel, fn){
  	if(!fn){
			fn = channel;
			channel = '*';
		}
		channel = get_channel(channel);
		channels.on(channel, fn);
  	radio.emit('listen', channel);
  }

  radio.cancel = function(channel, fn){
  	var emitterkey = get_channel(channel);

		if(fn){
			channels.off(emitterkey, fn);
		}
		else{
			channels.off(emitterkey);
		}

		var listeners = channels.getWildcardCallbacks(emitterkey);
		if(listeners.length<=0){
			radio.emit('cancel', channel.replace(/\*$/, ''));
		}
  }

  radio.receive = function(channel, body){
		channels.emit(channel, body, channel);
  }

  return radio;

}

module.exports.container_wrapper = function(radio, container){

	function get_channel(channel){

		if(!channel){
			channel = '*';
		}
		var base = container.diggerwarehouse().replace(/^\//, '').replace(/\//g, '.') + '.' + (container.diggerpath() || []).join('.');

		var st = base;

		if(channel.match(/[\w\*]/)){
			st = base + channel;
		}

		return st;
	}

	var wrapper = new Emitter({
  })

	wrapper.talk = function(channel, packet){
		if(arguments.length<2){
			packet = channel;
			channel = '';
		}
		
		channel = get_channel(channel);
    channel += '.' + packet.action;
		return radio.talk(channel, packet);
	}

	wrapper.listen = function(channel, fn){
		channel = get_channel(channel);
    
		return radio.listen(channel, fn);
	}

  // return a radio listener that will inject the 
  // data into the current container
  wrapper.bind = function(){

    wrapper.listen('*', function(channel, packet){
      if(!packet.headers){
        packet.headers = {};
      }
      var user = packet.headers['x-json-user'];

      if(packet.action=='append'){

        if(!packet.context){
          return;
        }

        var target = packet.context ? container.find('=' + packet.context._digger.diggerid) : container;

        if(target.isEmpty()){
          return;
        }

        var to_append = $digger.create(packet.body);
        var appended_count = 0;

        to_append.each(function(append){
          var check = target.find('=' + append.diggerid());
          if(check.count()<=0){
            target.append(append);
            appended_count++;
          }
        })

        if(appended_count>0){
        	wrapper.emit('radio:event', {
	          action:'append',
	          user:user,
	          target:target,
	          data:to_append
	        })	
        }
        
      }
      else if(packet.action=='save'){
        var target_id = packet.body._digger.diggerid;
        var target = container.find('=' + target_id);

        if(target.isEmpty()){
          return;
        }

        target.inject_data(packet.body);
        wrapper.emit('radio:event', {
          action:'save',
          user:user,
          target:target
        })
      }
      else if(packet.action=='remove'){
        var parent_id = packet.body._digger.diggerparentid;
        var target_id = packet.body._digger.diggerid;

        var parent = parent_id ? container.find('=' + parent_id) : container;
        var target = container.find('=' + target_id);

        if(parent.isEmpty() || target.isEmpty()){
          return;
        }

        parent.get(0)._children = parent.get(0)._children.filter(function(model){
          return model._digger.diggerid!=target.diggerid()
        })

        wrapper.emit('radio:event', {
          action:'remove',
          user:user,
          target:target
        })
      }
    })
  }

	wrapper.cancel = function(channel, fn){
		channel = get_channel(channel);
		return radio.cancel(channel, fn);
	}

	return wrapper;
}