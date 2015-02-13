var color = require('cli-color');


var Dispatcher = function(options) {
	var options = options || {};
	this.debug = options.debug || false;
	if(this.debug === true) {
		this.debug = {
			set:		true,
			get:		false,
			dispatch:	true,
			color:		true,
		};
	}
	this.log = options.log || function(m) {
		console.log('Dispatcher: '+m);
	};
	this.listeners = {};
	this.colors = [
		'redBright',
		'greenBright',
		'yellowBright',
		'magentaBright',
		'cyanBright',
		'red',
		'green',
		'yellow',
		'magenta',
		'cyan',
	];
	this.listenersColors = {
		'null': 'blackBright',
	};
};
Dispatcher.prototype = {
	debug: false,
	log: false,
	listeners: null,
	colors: null,
	colorsNow: -1,
	listenersColors: null,
	
	set: function(listener, callback, priority, serviceName) {
		serviceName = serviceName || null;
		if(priority === undefined) {
			priority = 50;
		} else if(priority > 2e9 || priority < -2e9) {
			throw new Error('Dispatcher: The priority of the listener "'+listener+'" cannot be greater than 2e9 and less than -2e9 (Current priority: '+priority+')');
		}
		priority = priority+2e9;
		if(this.debug.set === true) {
			this.log('set "'+this.getListernerColor(listener)+'" ('+(priority-2e9)+(serviceName!==null?' | '+serviceName:'')+')');
		}
		if(this.listeners[listener] === undefined) {
			this.listeners[listener] = {};
		}
		if(this.listeners[listener][priority] === undefined) {
			this.listeners[listener][priority] = [];
		}
		this.listeners[listener][priority].push({
			callback: callback,
			serviceName: serviceName,
			priority: priority,
		});
		return this;
	},
	
	get: function(listener) {
		if(this.debug.get === true) {
			this.log('get "'+this.getListernerColor(listener)+'"');
		}
		if(this.listeners[listener] === undefined) {
			return {};
		}
		return this.listeners[listener];
	},
	
	dispatch: function(listenerName, args, callbackFinal, callbackException) {
		var debug = this.debug.dispatch;
		if(debug === true) {
			var startDispatch = (new Date).getTime();
		}
		var listener = this.get(listenerName);
		if(args !== undefined && args instanceof Array === false) {
			callbackException = callbackFinal;
			callbackFinal = args;
			args = [];
		}
		args = args || [];
		callbackFinal = callbackFinal || function(){};
		callbackException = callbackException || null;
		var self = this;
		var nextList = [];
		for(var priority in listener) {
			for(var i in listener[priority]) {
				nextList.push(listener[priority][i]);
			}
		}
		var nextListLength = nextList.length;
		if(debug === true) {
			this.log('dispatch "'+this.getListernerColor(listenerName)+'" (start | 0/'+nextListLength+')');
		}
		var nextI = -1;
		var next = function(e) {
			if(e !== undefined && e instanceof Error) {
				if(debug === true) {
					var m = 'dispatch "'+self.getListernerColor(listenerName)+'" (end->error';
					if(nextList[nextI] !== undefined) {
						m += ' | '+(nextList[nextI].priority-2e9);
						if(nextList[nextI].serviceName !== null) {
							m += ' | '+nextList[nextI].serviceName;
						}
					}
					m += ' | '+(((new Date).getTime()-startDispatch))+'ms)';
					self.log(m);
				}
				if(callbackException !== null) {
					self.callFunctionOrMethod(callbackException, [e].concat(args));
				} else {
					throw e;
				}
				return;
			}
			nextI++;
			try {
				if(nextI < nextListLength) {
					if(debug === true) {
						self.log('dispatch "'+self.getListernerColor(listenerName)+'" (progress | '+(nextI+1)+'/'+nextListLength+' | '+(nextList[nextI].priority-2e9)+(nextList[nextI].serviceName!==null?' | '+nextList[nextI].serviceName:'')+')');
					}
					self.callFunctionOrMethod(nextList[nextI].callback, argsNext);
				} else {
					if(debug === true) {
						self.log('dispatch "'+self.getListernerColor(listenerName)+'" (end | '+(nextI)+'/'+nextListLength+' | '+(((new Date).getTime()-startDispatch))+'ms)');
					}
					self.callFunctionOrMethod(callbackFinal, args);
				}
			} catch(e) {
				next(e);
				return;
			}
		};
		var argsNext = [next].concat(args);
		next();
	},
	
	callFunctionOrMethod: function(callback, args) {
		var args = args || [];
		if(callback instanceof Array) {
			return callback[0][callback[1]].apply(callback[0], args);
		} else {
			return callback.apply(null, args);
		}
	},
	
	getListernerColor: function(name) {
		if(this.debug.color !== true) {
			return name;
		}
		if(this.listenersColors[name] === undefined) {
			this.colorsNow++;
			if(this.colorsNow >= this.colors.length) {
				this.colorsNow = 0;
			}
			this.listenersColors[name] = this.colors[this.colorsNow];
		}
		return color[this.listenersColors[name]](name);
	},
};


module.exports = Dispatcher;
