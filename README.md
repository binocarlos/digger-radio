digger-radio
============

![Build status](https://api.travis-ci.org/binocarlos/digger-radio.png)

Pub/Sub client for digger-client

## installation

	$ npm install digger-radio --save

## usage

The radio is a pub/sub wrapper to a backend server infrastructure.

It 'subscribes' by sending the subscription key and registering a local function as a callback for that key.

```js
var Radio = require('digger-radio');
var radio = new Radio();

radio.listen('apples', function(payload){
  // we heard 10!
})

radio.talk('apples', 10);

```

### wildcard subscriptions
Wildcards are supported:

```
var radio = new Radio();

radio.listen('apples.*', function(payload){
  // we heard 10!
})

radio.talk('apples.pears', 10);
```

### base paths
If you pass a base path to the constructor - it is transparently prepended to the subscription key.

```
var radio = new Radio('my.section.with.dots.');

radio.listen('apples.*', function(payload){
  // the actual path written:
  // my.section.with.dots.apples.pears
})


radio.talk('apples.pears', 10);
```

### cancel subscriptions
To cancel a listening function:

```js
var radio = new Radio('apples.');

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

```

## Transport layer

The radio does not try to handle getting messages sent to the pub/sub server.

Instead - it emits the following events - allowing whatever transport layer (WebSockets, ZeroMQ) to handle the packet:

### listen, talk, cancel

This is used to send a subscription key to the pub/sub server.

This is effectively saying 'tell me about these messages'.

An example of the digger-sockets transport layer:

```js

var radio = new Radio();

radio.on('talk', function(channel, payload){
	socket.send(JSON.stringify({
		type:'radio:talk',
		data:{
			channel:channel,
			payload:payload
		}
	}))
})

radio.on('listen', function(channel){
	socket.send(JSON.stringify({
		type:'radio:listen',
		data:channel
	}))
})

radio.on('cancel', function(channel, payload){
	socket.send(JSON.stringify({
		type:'radio:cancel',
		data:channel
	}))
})

```

## Licence

MIT
