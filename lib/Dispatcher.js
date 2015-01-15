var Dispatcher = function(debug) {
	this.debug = debug || false;
	if(this.debug === true) {
		this.debug = {
			set:		true,
			get:		false,
			dispatch:	true,
		};
	}
};
Dispatcher.prototype = {
	debug: false,
	listeners: {},
	
	set: function(listener, callback, priority) {
		if(priority === undefined) { priority = 50; }
		priority = -priority;
		if(this.debug.set === true) {
			console.log('DISPATCHER: set "'+listener+'" ('+(-priority)+')');
		}
		if(this.listeners[listener] === undefined) {
			this.listeners[listener] = {};
		}
		if(this.listeners[listener][priority] === undefined) {
			this.listeners[listener][priority] = [];
		}
		this.listeners[listener][priority].push(callback);
		return this;
	},
	
	get: function(listener) {
		if(this.debug.get === true) {
			console.log('DISPATCHER: get "'+listener+'"');
		}
		if(this.listeners[listener] === undefined) {
			return {};
		}
		return this.listeners[listener];
	},
	
	dispatch: function(listenerName, args, callbackFinal, callbackException) {
		var debug = this.debug.dispatch;
		if(debug === true) {
			console.log('DISPATCHER: dispatch "'+listenerName+'" (start)');
		}
		var listener = this.get(listenerName);
		if(args !== undefined && args instanceof Array === false) {
			var callbackException = callbackFinal;
			var callbackFinal = args;
			var args = [];
		}
		var args = args || [];
		var callbackFinal = callbackFinal || function(){};
		var callbackException = callbackException || null;
		var self = this;
		var nextList = [];
		for(var priority in listener) {
			for(var i in listener[priority]) {
				nextList.push(listener[priority][i]);
			}
		}
		var nextListLength = nextList.length;
		var nextI = -1;
		var next = function(e) {
			if(e !== undefined && e instanceof Error) {
				if(debug === true) {
					console.log('DISPATCHER: dispatch "'+listenerName+'" (error)');
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
					self.callFunctionOrMethod(nextList[nextI], argsNext);
				} else {
					if(debug === true) {
						console.log('DISPATCHER: dispatch "'+listenerName+'" (end)');
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
};


module.exports = Dispatcher;
