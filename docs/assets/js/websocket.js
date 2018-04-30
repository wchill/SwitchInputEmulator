(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebSocketClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//      Copyright (c) 2012 Mathieu Turcotte
//      Licensed under the MIT license.

        var Backoff = require('./lib/backoff');
        var ExponentialBackoffStrategy = require('./lib/strategy/exponential');
        var FibonacciBackoffStrategy = require('./lib/strategy/fibonacci');
        var FunctionCall = require('./lib/function_call.js');

        module.exports.Backoff = Backoff;
        module.exports.FunctionCall = FunctionCall;
        module.exports.FibonacciStrategy = FibonacciBackoffStrategy;
        module.exports.ExponentialStrategy = ExponentialBackoffStrategy;

// Constructs a Fibonacci backoff.
        module.exports.fibonacci = function(options) {
            return new Backoff(new FibonacciBackoffStrategy(options));
        };

// Constructs an exponential backoff.
        module.exports.exponential = function(options) {
            return new Backoff(new ExponentialBackoffStrategy(options));
        };

// Constructs a FunctionCall for the given function and arguments.
        module.exports.call = function(fn, vargs, callback) {
            var args = Array.prototype.slice.call(arguments);
            fn = args[0];
            vargs = args.slice(1, args.length - 1);
            callback = args[args.length - 1];
            return new FunctionCall(fn, vargs, callback);
        };

    },{"./lib/backoff":2,"./lib/function_call.js":3,"./lib/strategy/exponential":4,"./lib/strategy/fibonacci":5}],2:[function(require,module,exports){
//      Copyright (c) 2012 Mathieu Turcotte
//      Licensed under the MIT license.

        var events = require('events');
        var precond = require('precond');
        var util = require('util');

// A class to hold the state of a backoff operation. Accepts a backoff strategy
// to generate the backoff delays.
        function Backoff(backoffStrategy) {
            events.EventEmitter.call(this);

            this.backoffStrategy_ = backoffStrategy;
            this.maxNumberOfRetry_ = -1;
            this.backoffNumber_ = 0;
            this.backoffDelay_ = 0;
            this.timeoutID_ = -1;

            this.handlers = {
                backoff: this.onBackoff_.bind(this)
            };
        }
        util.inherits(Backoff, events.EventEmitter);

// Sets a limit, greater than 0, on the maximum number of backoffs. A 'fail'
// event will be emitted when the limit is reached.
        Backoff.prototype.failAfter = function(maxNumberOfRetry) {
            precond.checkArgument(maxNumberOfRetry > 0,
                'Expected a maximum number of retry greater than 0 but got %s.',
                maxNumberOfRetry);

            this.maxNumberOfRetry_ = maxNumberOfRetry;
        };

// Starts a backoff operation. Accepts an optional parameter to let the
// listeners know why the backoff operation was started.
        Backoff.prototype.backoff = function(err) {
            precond.checkState(this.timeoutID_ === -1, 'Backoff in progress.');

            if (this.backoffNumber_ === this.maxNumberOfRetry_) {
                this.emit('fail', err);
                this.reset();
            } else {
                this.backoffDelay_ = this.backoffStrategy_.next();
                this.timeoutID_ = setTimeout(this.handlers.backoff, this.backoffDelay_);
                this.emit('backoff', this.backoffNumber_, this.backoffDelay_, err);
            }
        };

// Handles the backoff timeout completion.
        Backoff.prototype.onBackoff_ = function() {
            this.timeoutID_ = -1;
            this.emit('ready', this.backoffNumber_, this.backoffDelay_);
            this.backoffNumber_++;
        };

// Stops any backoff operation and resets the backoff delay to its inital value.
        Backoff.prototype.reset = function() {
            this.backoffNumber_ = 0;
            this.backoffStrategy_.reset();
            clearTimeout(this.timeoutID_);
            this.timeoutID_ = -1;
        };

        module.exports = Backoff;

    },{"events":7,"precond":9,"util":14}],3:[function(require,module,exports){
//      Copyright (c) 2012 Mathieu Turcotte
//      Licensed under the MIT license.

        var events = require('events');
        var precond = require('precond');
        var util = require('util');

        var Backoff = require('./backoff');
        var FibonacciBackoffStrategy = require('./strategy/fibonacci');

// Wraps a function to be called in a backoff loop.
        function FunctionCall(fn, args, callback) {
            events.EventEmitter.call(this);

            precond.checkIsFunction(fn, 'Expected fn to be a function.');
            precond.checkIsArray(args, 'Expected args to be an array.');
            precond.checkIsFunction(callback, 'Expected callback to be a function.');

            this.function_ = fn;
            this.arguments_ = args;
            this.callback_ = callback;
            this.lastResult_ = [];
            this.numRetries_ = 0;

            this.backoff_ = null;
            this.strategy_ = null;
            this.failAfter_ = -1;

            this.state_ = FunctionCall.State_.PENDING;
        }
        util.inherits(FunctionCall, events.EventEmitter);

// States in which the call can be.
        FunctionCall.State_ = {
            // Call isn't started yet.
            PENDING: 0,
            // Call is in progress.
            RUNNING: 1,
            // Call completed successfully which means that either the wrapped function
            // returned successfully or the maximal number of backoffs was reached.
            COMPLETED: 2,
            // The call was aborted.
            ABORTED: 3
        };

// Checks whether the call is pending.
        FunctionCall.prototype.isPending = function() {
            return this.state_ == FunctionCall.State_.PENDING;
        };

// Checks whether the call is in progress.
        FunctionCall.prototype.isRunning = function() {
            return this.state_ == FunctionCall.State_.RUNNING;
        };

// Checks whether the call is completed.
        FunctionCall.prototype.isCompleted = function() {
            return this.state_ == FunctionCall.State_.COMPLETED;
        };

// Checks whether the call is aborted.
        FunctionCall.prototype.isAborted = function() {
            return this.state_ == FunctionCall.State_.ABORTED;
        };

// Sets the backoff strategy to use. Can only be called before the call is
// started otherwise an exception will be thrown.
        FunctionCall.prototype.setStrategy = function(strategy) {
            precond.checkState(this.isPending(), 'FunctionCall in progress.');
            this.strategy_ = strategy;
            return this; // Return this for chaining.
        };

// Returns all intermediary results returned by the wrapped function since
// the initial call.
        FunctionCall.prototype.getLastResult = function() {
            return this.lastResult_.concat();
        };

// Returns the number of times the wrapped function call was retried.
        FunctionCall.prototype.getNumRetries = function() {
            return this.numRetries_;
        };

// Sets the backoff limit.
        FunctionCall.prototype.failAfter = function(maxNumberOfRetry) {
            precond.checkState(this.isPending(), 'FunctionCall in progress.');
            this.failAfter_ = maxNumberOfRetry;
            return this; // Return this for chaining.
        };

// Aborts the call.
        FunctionCall.prototype.abort = function() {
            precond.checkState(!this.isCompleted(), 'FunctionCall already completed.');

            if (this.isRunning()) {
                this.backoff_.reset();
            }

            this.state_ = FunctionCall.State_.ABORTED;
        };

// Initiates the call to the wrapped function. Accepts an optional factory
// function used to create the backoff instance; used when testing.
        FunctionCall.prototype.start = function(backoffFactory) {
            precond.checkState(!this.isAborted(), 'FunctionCall aborted.');
            precond.checkState(this.isPending(), 'FunctionCall already started.');

            var strategy = this.strategy_ || new FibonacciBackoffStrategy();

            this.backoff_ = backoffFactory ?
                backoffFactory(strategy) :
                new Backoff(strategy);

            this.backoff_.on('ready', this.doCall_.bind(this, true /* isRetry */));
            this.backoff_.on('fail', this.doCallback_.bind(this));
            this.backoff_.on('backoff', this.handleBackoff_.bind(this));

            if (this.failAfter_ > 0) {
                this.backoff_.failAfter(this.failAfter_);
            }

            this.state_ = FunctionCall.State_.RUNNING;
            this.doCall_(false /* isRetry */);
        };

// Calls the wrapped function.
        FunctionCall.prototype.doCall_ = function(isRetry) {
            if (isRetry) {
                this.numRetries_++;
            }
            var eventArgs = ['call'].concat(this.arguments_);
            events.EventEmitter.prototype.emit.apply(this, eventArgs);
            var callback = this.handleFunctionCallback_.bind(this);
            this.function_.apply(null, this.arguments_.concat(callback));
        };

// Calls the wrapped function's callback with the last result returned by the
// wrapped function.
        FunctionCall.prototype.doCallback_ = function() {
            this.callback_.apply(null, this.lastResult_);
        };

// Handles wrapped function's completion. This method acts as a replacement
// for the original callback function.
        FunctionCall.prototype.handleFunctionCallback_ = function() {
            if (this.isAborted()) {
                return;
            }

            var args = Array.prototype.slice.call(arguments);
            this.lastResult_ = args; // Save last callback arguments.
            events.EventEmitter.prototype.emit.apply(this, ['callback'].concat(args));

            if (args[0]) {
                this.backoff_.backoff(args[0]);
            } else {
                this.state_ = FunctionCall.State_.COMPLETED;
                this.doCallback_();
            }
        };

// Handles the backoff event by reemitting it.
        FunctionCall.prototype.handleBackoff_ = function(number, delay, err) {
            this.emit('backoff', number, delay, err);
        };

        module.exports = FunctionCall;

    },{"./backoff":2,"./strategy/fibonacci":5,"events":7,"precond":9,"util":14}],4:[function(require,module,exports){
//      Copyright (c) 2012 Mathieu Turcotte
//      Licensed under the MIT license.

        var util = require('util');
        var precond = require('precond');

        var BackoffStrategy = require('./strategy');

// Exponential backoff strategy.
        function ExponentialBackoffStrategy(options) {
            BackoffStrategy.call(this, options);
            this.backoffDelay_ = 0;
            this.nextBackoffDelay_ = this.getInitialDelay();
            this.factor_ = ExponentialBackoffStrategy.DEFAULT_FACTOR;

            if (options && options.factor !== undefined) {
                precond.checkArgument(options.factor > 1,
                    'Exponential factor should be greater than 1 but got %s.',
                    options.factor);
                this.factor_ = options.factor;
            }
        }
        util.inherits(ExponentialBackoffStrategy, BackoffStrategy);

// Default multiplication factor used to compute the next backoff delay from
// the current one. The value can be overridden by passing a custom factor as
// part of the options.
        ExponentialBackoffStrategy.DEFAULT_FACTOR = 2;

        ExponentialBackoffStrategy.prototype.next_ = function() {
            this.backoffDelay_ = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
            this.nextBackoffDelay_ = this.backoffDelay_ * this.factor_;
            return this.backoffDelay_;
        };

        ExponentialBackoffStrategy.prototype.reset_ = function() {
            this.backoffDelay_ = 0;
            this.nextBackoffDelay_ = this.getInitialDelay();
        };

        module.exports = ExponentialBackoffStrategy;

    },{"./strategy":6,"precond":9,"util":14}],5:[function(require,module,exports){
//      Copyright (c) 2012 Mathieu Turcotte
//      Licensed under the MIT license.

        var util = require('util');

        var BackoffStrategy = require('./strategy');

// Fibonacci backoff strategy.
        function FibonacciBackoffStrategy(options) {
            BackoffStrategy.call(this, options);
            this.backoffDelay_ = 0;
            this.nextBackoffDelay_ = this.getInitialDelay();
        }
        util.inherits(FibonacciBackoffStrategy, BackoffStrategy);

        FibonacciBackoffStrategy.prototype.next_ = function() {
            var backoffDelay = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
            this.nextBackoffDelay_ += this.backoffDelay_;
            this.backoffDelay_ = backoffDelay;
            return backoffDelay;
        };

        FibonacciBackoffStrategy.prototype.reset_ = function() {
            this.nextBackoffDelay_ = this.getInitialDelay();
            this.backoffDelay_ = 0;
        };

        module.exports = FibonacciBackoffStrategy;

    },{"./strategy":6,"util":14}],6:[function(require,module,exports){
//      Copyright (c) 2012 Mathieu Turcotte
//      Licensed under the MIT license.

        var events = require('events');
        var util = require('util');

        function isDef(value) {
            return value !== undefined && value !== null;
        }

// Abstract class defining the skeleton for the backoff strategies. Accepts an
// object holding the options for the backoff strategy:
//
//  * `randomisationFactor`: The randomisation factor which must be between 0
//     and 1 where 1 equates to a randomization factor of 100% and 0 to no
//     randomization.
//  * `initialDelay`: The backoff initial delay in milliseconds.
//  * `maxDelay`: The backoff maximal delay in milliseconds.
        function BackoffStrategy(options) {
            options = options || {};

            if (isDef(options.initialDelay) && options.initialDelay < 1) {
                throw new Error('The initial timeout must be greater than 0.');
            } else if (isDef(options.maxDelay) && options.maxDelay < 1) {
                throw new Error('The maximal timeout must be greater than 0.');
            }

            this.initialDelay_ = options.initialDelay || 100;
            this.maxDelay_ = options.maxDelay || 10000;

            if (this.maxDelay_ <= this.initialDelay_) {
                throw new Error('The maximal backoff delay must be ' +
                    'greater than the initial backoff delay.');
            }

            if (isDef(options.randomisationFactor) &&
                (options.randomisationFactor < 0 || options.randomisationFactor > 1)) {
                throw new Error('The randomisation factor must be between 0 and 1.');
            }

            this.randomisationFactor_ = options.randomisationFactor || 0;
        }

// Gets the maximal backoff delay.
        BackoffStrategy.prototype.getMaxDelay = function() {
            return this.maxDelay_;
        };

// Gets the initial backoff delay.
        BackoffStrategy.prototype.getInitialDelay = function() {
            return this.initialDelay_;
        };

// Template method that computes and returns the next backoff delay in
// milliseconds.
        BackoffStrategy.prototype.next = function() {
            var backoffDelay = this.next_();
            var randomisationMultiple = 1 + Math.random() * this.randomisationFactor_;
            var randomizedDelay = Math.round(backoffDelay * randomisationMultiple);
            return randomizedDelay;
        };

// Computes and returns the next backoff delay. Intended to be overridden by
// subclasses.
        BackoffStrategy.prototype.next_ = function() {
            throw new Error('BackoffStrategy.next_() unimplemented.');
        };

// Template method that resets the backoff delay to its initial value.
        BackoffStrategy.prototype.reset = function() {
            this.reset_();
        };

// Resets the backoff delay to its initial value. Intended to be overridden by
// subclasses.
        BackoffStrategy.prototype.reset_ = function() {
            throw new Error('BackoffStrategy.reset_() unimplemented.');
        };

        module.exports = BackoffStrategy;

    },{"events":7,"util":14}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

        function EventEmitter() {
            this._events = this._events || {};
            this._maxListeners = this._maxListeners || undefined;
        }
        module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
        EventEmitter.EventEmitter = EventEmitter;

        EventEmitter.prototype._events = undefined;
        EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
        EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
        EventEmitter.prototype.setMaxListeners = function(n) {
            if (!isNumber(n) || n < 0 || isNaN(n))
                throw TypeError('n must be a positive number');
            this._maxListeners = n;
            return this;
        };

        EventEmitter.prototype.emit = function(type) {
            var er, handler, len, args, i, listeners;

            if (!this._events)
                this._events = {};

            // If there is no 'error' event listener then throw.
            if (type === 'error') {
                if (!this._events.error ||
                    (isObject(this._events.error) && !this._events.error.length)) {
                    er = arguments[1];
                    if (er instanceof Error) {
                        throw er; // Unhandled 'error' event
                    }
                    throw TypeError('Uncaught, unspecified "error" event.');
                }
            }

            handler = this._events[type];

            if (isUndefined(handler))
                return false;

            if (isFunction(handler)) {
                switch (arguments.length) {
                    // fast cases
                    case 1:
                        handler.call(this);
                        break;
                    case 2:
                        handler.call(this, arguments[1]);
                        break;
                    case 3:
                        handler.call(this, arguments[1], arguments[2]);
                        break;
                    // slower
                    default:
                        args = Array.prototype.slice.call(arguments, 1);
                        handler.apply(this, args);
                }
            } else if (isObject(handler)) {
                args = Array.prototype.slice.call(arguments, 1);
                listeners = handler.slice();
                len = listeners.length;
                for (i = 0; i < len; i++)
                    listeners[i].apply(this, args);
            }

            return true;
        };

        EventEmitter.prototype.addListener = function(type, listener) {
            var m;

            if (!isFunction(listener))
                throw TypeError('listener must be a function');

            if (!this._events)
                this._events = {};

            // To avoid recursion in the case that type === "newListener"! Before
            // adding it to the listeners, first emit "newListener".
            if (this._events.newListener)
                this.emit('newListener', type,
                    isFunction(listener.listener) ?
                        listener.listener : listener);

            if (!this._events[type])
            // Optimize the case of one listener. Don't need the extra array object.
                this._events[type] = listener;
            else if (isObject(this._events[type]))
            // If we've already got an array, just append.
                this._events[type].push(listener);
            else
            // Adding the second element, need to change to array.
                this._events[type] = [this._events[type], listener];

            // Check for listener leak
            if (isObject(this._events[type]) && !this._events[type].warned) {
                if (!isUndefined(this._maxListeners)) {
                    m = this._maxListeners;
                } else {
                    m = EventEmitter.defaultMaxListeners;
                }

                if (m && m > 0 && this._events[type].length > m) {
                    this._events[type].warned = true;
                    console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
                    if (typeof console.trace === 'function') {
                        // not supported in IE 10
                        console.trace();
                    }
                }
            }

            return this;
        };

        EventEmitter.prototype.on = EventEmitter.prototype.addListener;

        EventEmitter.prototype.once = function(type, listener) {
            if (!isFunction(listener))
                throw TypeError('listener must be a function');

            var fired = false;

            function g() {
                this.removeListener(type, g);

                if (!fired) {
                    fired = true;
                    listener.apply(this, arguments);
                }
            }

            g.listener = listener;
            this.on(type, g);

            return this;
        };

// emits a 'removeListener' event iff the listener was removed
        EventEmitter.prototype.removeListener = function(type, listener) {
            var list, position, length, i;

            if (!isFunction(listener))
                throw TypeError('listener must be a function');

            if (!this._events || !this._events[type])
                return this;

            list = this._events[type];
            length = list.length;
            position = -1;

            if (list === listener ||
                (isFunction(list.listener) && list.listener === listener)) {
                delete this._events[type];
                if (this._events.removeListener)
                    this.emit('removeListener', type, listener);

            } else if (isObject(list)) {
                for (i = length; i-- > 0;) {
                    if (list[i] === listener ||
                        (list[i].listener && list[i].listener === listener)) {
                        position = i;
                        break;
                    }
                }

                if (position < 0)
                    return this;

                if (list.length === 1) {
                    list.length = 0;
                    delete this._events[type];
                } else {
                    list.splice(position, 1);
                }

                if (this._events.removeListener)
                    this.emit('removeListener', type, listener);
            }

            return this;
        };

        EventEmitter.prototype.removeAllListeners = function(type) {
            var key, listeners;

            if (!this._events)
                return this;

            // not listening for removeListener, no need to emit
            if (!this._events.removeListener) {
                if (arguments.length === 0)
                    this._events = {};
                else if (this._events[type])
                    delete this._events[type];
                return this;
            }

            // emit removeListener for all listeners on all events
            if (arguments.length === 0) {
                for (key in this._events) {
                    if (key === 'removeListener') continue;
                    this.removeAllListeners(key);
                }
                this.removeAllListeners('removeListener');
                this._events = {};
                return this;
            }

            listeners = this._events[type];

            if (isFunction(listeners)) {
                this.removeListener(type, listeners);
            } else if (listeners) {
                // LIFO order
                while (listeners.length)
                    this.removeListener(type, listeners[listeners.length - 1]);
            }
            delete this._events[type];

            return this;
        };

        EventEmitter.prototype.listeners = function(type) {
            var ret;
            if (!this._events || !this._events[type])
                ret = [];
            else if (isFunction(this._events[type]))
                ret = [this._events[type]];
            else
                ret = this._events[type].slice();
            return ret;
        };

        EventEmitter.prototype.listenerCount = function(type) {
            if (this._events) {
                var evlistener = this._events[type];

                if (isFunction(evlistener))
                    return 1;
                else if (evlistener)
                    return evlistener.length;
            }
            return 0;
        };

        EventEmitter.listenerCount = function(emitter, type) {
            return emitter.listenerCount(type);
        };

        function isFunction(arg) {
            return typeof arg === 'function';
        }

        function isNumber(arg) {
            return typeof arg === 'number';
        }

        function isObject(arg) {
            return typeof arg === 'object' && arg !== null;
        }

        function isUndefined(arg) {
            return arg === void 0;
        }

    },{}],8:[function(require,module,exports){
        if (typeof Object.create === 'function') {
            // implementation from standard node.js 'util' module
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor
                ctor.prototype = Object.create(superCtor.prototype, {
                    constructor: {
                        value: ctor,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    }
                });
            };
        } else {
            // old school shim for old browsers
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor
                var TempCtor = function () {}
                TempCtor.prototype = superCtor.prototype
                ctor.prototype = new TempCtor()
                ctor.prototype.constructor = ctor
            }
        }

    },{}],9:[function(require,module,exports){
        /*
         * Copyright (c) 2012 Mathieu Turcotte
         * Licensed under the MIT license.
         */

        module.exports = require('./lib/checks');
    },{"./lib/checks":10}],10:[function(require,module,exports){
        /*
         * Copyright (c) 2012 Mathieu Turcotte
         * Licensed under the MIT license.
         */

        var util = require('util');

        var errors = module.exports = require('./errors');

        function failCheck(ExceptionConstructor, callee, messageFormat, formatArgs) {
            messageFormat = messageFormat || '';
            var message = util.format.apply(this, [messageFormat].concat(formatArgs));
            var error = new ExceptionConstructor(message);
            Error.captureStackTrace(error, callee);
            throw error;
        }

        function failArgumentCheck(callee, message, formatArgs) {
            failCheck(errors.IllegalArgumentError, callee, message, formatArgs);
        }

        function failStateCheck(callee, message, formatArgs) {
            failCheck(errors.IllegalStateError, callee, message, formatArgs);
        }

        module.exports.checkArgument = function(value, message) {
            if (!value) {
                failArgumentCheck(arguments.callee, message,
                    Array.prototype.slice.call(arguments, 2));
            }
        };

        module.exports.checkState = function(value, message) {
            if (!value) {
                failStateCheck(arguments.callee, message,
                    Array.prototype.slice.call(arguments, 2));
            }
        };

        module.exports.checkIsDef = function(value, message) {
            if (value !== undefined) {
                return value;
            }

            failArgumentCheck(arguments.callee, message ||
                'Expected value to be defined but was undefined.',
                Array.prototype.slice.call(arguments, 2));
        };

        module.exports.checkIsDefAndNotNull = function(value, message) {
            // Note that undefined == null.
            if (value != null) {
                return value;
            }

            failArgumentCheck(arguments.callee, message ||
                'Expected value to be defined and not null but got "' +
                typeOf(value) + '".', Array.prototype.slice.call(arguments, 2));
        };

// Fixed version of the typeOf operator which returns 'null' for null values
// and 'array' for arrays.
        function typeOf(value) {
            var s = typeof value;
            if (s == 'object') {
                if (!value) {
                    return 'null';
                } else if (value instanceof Array) {
                    return 'array';
                }
            }
            return s;
        }

        function typeCheck(expect) {
            return function(value, message) {
                var type = typeOf(value);

                if (type == expect) {
                    return value;
                }

                failArgumentCheck(arguments.callee, message ||
                    'Expected "' + expect + '" but got "' + type + '".',
                    Array.prototype.slice.call(arguments, 2));
            };
        }

        module.exports.checkIsString = typeCheck('string');
        module.exports.checkIsArray = typeCheck('array');
        module.exports.checkIsNumber = typeCheck('number');
        module.exports.checkIsBoolean = typeCheck('boolean');
        module.exports.checkIsFunction = typeCheck('function');
        module.exports.checkIsObject = typeCheck('object');

    },{"./errors":11,"util":14}],11:[function(require,module,exports){
        /*
         * Copyright (c) 2012 Mathieu Turcotte
         * Licensed under the MIT license.
         */

        var util = require('util');

        function IllegalArgumentError(message) {
            Error.call(this, message);
            this.message = message;
        }
        util.inherits(IllegalArgumentError, Error);

        IllegalArgumentError.prototype.name = 'IllegalArgumentError';

        function IllegalStateError(message) {
            Error.call(this, message);
            this.message = message;
        }
        util.inherits(IllegalStateError, Error);

        IllegalStateError.prototype.name = 'IllegalStateError';

        module.exports.IllegalStateError = IllegalStateError;
        module.exports.IllegalArgumentError = IllegalArgumentError;
    },{"util":14}],12:[function(require,module,exports){
// shim for using process in browser

        var process = module.exports = {};
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;

        function cleanUpNextTick() {
            draining = false;
            if (currentQueue.length) {
                queue = currentQueue.concat(queue);
            } else {
                queueIndex = -1;
            }
            if (queue.length) {
                drainQueue();
            }
        }

        function drainQueue() {
            if (draining) {
                return;
            }
            var timeout = setTimeout(cleanUpNextTick);
            draining = true;

            var len = queue.length;
            while(len) {
                currentQueue = queue;
                queue = [];
                while (++queueIndex < len) {
                    if (currentQueue) {
                        currentQueue[queueIndex].run();
                    }
                }
                queueIndex = -1;
                len = queue.length;
            }
            currentQueue = null;
            draining = false;
            clearTimeout(timeout);
        }

        process.nextTick = function (fun) {
            var args = new Array(arguments.length - 1);
            if (arguments.length > 1) {
                for (var i = 1; i < arguments.length; i++) {
                    args[i - 1] = arguments[i];
                }
            }
            queue.push(new Item(fun, args));
            if (queue.length === 1 && !draining) {
                setTimeout(drainQueue, 0);
            }
        };

// v8 likes predictible objects
        function Item(fun, array) {
            this.fun = fun;
            this.array = array;
        }
        Item.prototype.run = function () {
            this.fun.apply(null, this.array);
        };
        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = ''; // empty string to avoid regexp issues
        process.versions = {};

        function noop() {}

        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;

        process.binding = function (name) {
            throw new Error('process.binding is not supported');
        };

        process.cwd = function () { return '/' };
        process.chdir = function (dir) {
            throw new Error('process.chdir is not supported');
        };
        process.umask = function() { return 0; };

    },{}],13:[function(require,module,exports){
        module.exports = function isBuffer(arg) {
            return arg && typeof arg === 'object'
                && typeof arg.copy === 'function'
                && typeof arg.fill === 'function'
                && typeof arg.readUInt8 === 'function';
        }
    },{}],14:[function(require,module,exports){
        (function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

            var formatRegExp = /%[sdj%]/g;
            exports.format = function(f) {
                if (!isString(f)) {
                    var objects = [];
                    for (var i = 0; i < arguments.length; i++) {
                        objects.push(inspect(arguments[i]));
                    }
                    return objects.join(' ');
                }

                var i = 1;
                var args = arguments;
                var len = args.length;
                var str = String(f).replace(formatRegExp, function(x) {
                    if (x === '%%') return '%';
                    if (i >= len) return x;
                    switch (x) {
                        case '%s': return String(args[i++]);
                        case '%d': return Number(args[i++]);
                        case '%j':
                            try {
                                return JSON.stringify(args[i++]);
                            } catch (_) {
                                return '[Circular]';
                            }
                        default:
                            return x;
                    }
                });
                for (var x = args[i]; i < len; x = args[++i]) {
                    if (isNull(x) || !isObject(x)) {
                        str += ' ' + x;
                    } else {
                        str += ' ' + inspect(x);
                    }
                }
                return str;
            };


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
            exports.deprecate = function(fn, msg) {
                // Allow for deprecating things in the process of starting up.
                if (isUndefined(global.process)) {
                    return function() {
                        return exports.deprecate(fn, msg).apply(this, arguments);
                    };
                }

                if (process.noDeprecation === true) {
                    return fn;
                }

                var warned = false;
                function deprecated() {
                    if (!warned) {
                        if (process.throwDeprecation) {
                            throw new Error(msg);
                        } else if (process.traceDeprecation) {
                            console.trace(msg);
                        } else {
                            console.error(msg);
                        }
                        warned = true;
                    }
                    return fn.apply(this, arguments);
                }

                return deprecated;
            };


            var debugs = {};
            var debugEnviron;
            exports.debuglog = function(set) {
                if (isUndefined(debugEnviron))
                    debugEnviron = process.env.NODE_DEBUG || '';
                set = set.toUpperCase();
                if (!debugs[set]) {
                    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
                        var pid = process.pid;
                        debugs[set] = function() {
                            var msg = exports.format.apply(exports, arguments);
                            console.error('%s %d: %s', set, pid, msg);
                        };
                    } else {
                        debugs[set] = function() {};
                    }
                }
                return debugs[set];
            };


            /**
             * Echos the value of a value. Trys to print the value out
             * in the best way possible given the different types.
             *
             * @param {Object} obj The object to print out.
             * @param {Object} opts Optional options object that alters the output.
             */
            /* legacy: obj, showHidden, depth, colors*/
            function inspect(obj, opts) {
                // default options
                var ctx = {
                    seen: [],
                    stylize: stylizeNoColor
                };
                // legacy...
                if (arguments.length >= 3) ctx.depth = arguments[2];
                if (arguments.length >= 4) ctx.colors = arguments[3];
                if (isBoolean(opts)) {
                    // legacy...
                    ctx.showHidden = opts;
                } else if (opts) {
                    // got an "options" object
                    exports._extend(ctx, opts);
                }
                // set default options
                if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
                if (isUndefined(ctx.depth)) ctx.depth = 2;
                if (isUndefined(ctx.colors)) ctx.colors = false;
                if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
                if (ctx.colors) ctx.stylize = stylizeWithColor;
                return formatValue(ctx, obj, ctx.depth);
            }
            exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
            inspect.colors = {
                'bold' : [1, 22],
                'italic' : [3, 23],
                'underline' : [4, 24],
                'inverse' : [7, 27],
                'white' : [37, 39],
                'grey' : [90, 39],
                'black' : [30, 39],
                'blue' : [34, 39],
                'cyan' : [36, 39],
                'green' : [32, 39],
                'magenta' : [35, 39],
                'red' : [31, 39],
                'yellow' : [33, 39]
            };

// Don't use 'blue' not visible on cmd.exe
            inspect.styles = {
                'special': 'cyan',
                'number': 'yellow',
                'boolean': 'yellow',
                'undefined': 'grey',
                'null': 'bold',
                'string': 'green',
                'date': 'magenta',
                // "name": intentionally not styling
                'regexp': 'red'
            };


            function stylizeWithColor(str, styleType) {
                var style = inspect.styles[styleType];

                if (style) {
                    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
                        '\u001b[' + inspect.colors[style][1] + 'm';
                } else {
                    return str;
                }
            }


            function stylizeNoColor(str, styleType) {
                return str;
            }


            function arrayToHash(array) {
                var hash = {};

                array.forEach(function(val, idx) {
                    hash[val] = true;
                });

                return hash;
            }


            function formatValue(ctx, value, recurseTimes) {
                // Provide a hook for user-specified inspect functions.
                // Check that value is an object with an inspect function on it
                if (ctx.customInspect &&
                    value &&
                    isFunction(value.inspect) &&
                    // Filter out the util module, it's inspect function is special
                    value.inspect !== exports.inspect &&
                    // Also filter out any prototype objects using the circular check.
                    !(value.constructor && value.constructor.prototype === value)) {
                    var ret = value.inspect(recurseTimes, ctx);
                    if (!isString(ret)) {
                        ret = formatValue(ctx, ret, recurseTimes);
                    }
                    return ret;
                }

                // Primitive types cannot have properties
                var primitive = formatPrimitive(ctx, value);
                if (primitive) {
                    return primitive;
                }

                // Look up the keys of the object.
                var keys = Object.keys(value);
                var visibleKeys = arrayToHash(keys);

                if (ctx.showHidden) {
                    keys = Object.getOwnPropertyNames(value);
                }

                // IE doesn't make error fields non-enumerable
                // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
                if (isError(value)
                    && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
                    return formatError(value);
                }

                // Some type of object without properties can be shortcutted.
                if (keys.length === 0) {
                    if (isFunction(value)) {
                        var name = value.name ? ': ' + value.name : '';
                        return ctx.stylize('[Function' + name + ']', 'special');
                    }
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                    }
                    if (isDate(value)) {
                        return ctx.stylize(Date.prototype.toString.call(value), 'date');
                    }
                    if (isError(value)) {
                        return formatError(value);
                    }
                }

                var base = '', array = false, braces = ['{', '}'];

                // Make Array say that they are Array
                if (isArray(value)) {
                    array = true;
                    braces = ['[', ']'];
                }

                // Make functions say that they are functions
                if (isFunction(value)) {
                    var n = value.name ? ': ' + value.name : '';
                    base = ' [Function' + n + ']';
                }

                // Make RegExps say that they are RegExps
                if (isRegExp(value)) {
                    base = ' ' + RegExp.prototype.toString.call(value);
                }

                // Make dates with properties first say the date
                if (isDate(value)) {
                    base = ' ' + Date.prototype.toUTCString.call(value);
                }

                // Make error with message first say the error
                if (isError(value)) {
                    base = ' ' + formatError(value);
                }

                if (keys.length === 0 && (!array || value.length == 0)) {
                    return braces[0] + base + braces[1];
                }

                if (recurseTimes < 0) {
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                    } else {
                        return ctx.stylize('[Object]', 'special');
                    }
                }

                ctx.seen.push(value);

                var output;
                if (array) {
                    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
                } else {
                    output = keys.map(function(key) {
                        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                    });
                }

                ctx.seen.pop();

                return reduceToSingleString(output, base, braces);
            }


            function formatPrimitive(ctx, value) {
                if (isUndefined(value))
                    return ctx.stylize('undefined', 'undefined');
                if (isString(value)) {
                    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                        .replace(/'/g, "\\'")
                        .replace(/\\"/g, '"') + '\'';
                    return ctx.stylize(simple, 'string');
                }
                if (isNumber(value))
                    return ctx.stylize('' + value, 'number');
                if (isBoolean(value))
                    return ctx.stylize('' + value, 'boolean');
                // For some reason typeof null is "object", so special case here.
                if (isNull(value))
                    return ctx.stylize('null', 'null');
            }


            function formatError(value) {
                return '[' + Error.prototype.toString.call(value) + ']';
            }


            function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
                var output = [];
                for (var i = 0, l = value.length; i < l; ++i) {
                    if (hasOwnProperty(value, String(i))) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                            String(i), true));
                    } else {
                        output.push('');
                    }
                }
                keys.forEach(function(key) {
                    if (!key.match(/^\d+$/)) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                            key, true));
                    }
                });
                return output;
            }


            function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
                var name, str, desc;
                desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
                if (desc.get) {
                    if (desc.set) {
                        str = ctx.stylize('[Getter/Setter]', 'special');
                    } else {
                        str = ctx.stylize('[Getter]', 'special');
                    }
                } else {
                    if (desc.set) {
                        str = ctx.stylize('[Setter]', 'special');
                    }
                }
                if (!hasOwnProperty(visibleKeys, key)) {
                    name = '[' + key + ']';
                }
                if (!str) {
                    if (ctx.seen.indexOf(desc.value) < 0) {
                        if (isNull(recurseTimes)) {
                            str = formatValue(ctx, desc.value, null);
                        } else {
                            str = formatValue(ctx, desc.value, recurseTimes - 1);
                        }
                        if (str.indexOf('\n') > -1) {
                            if (array) {
                                str = str.split('\n').map(function(line) {
                                    return '  ' + line;
                                }).join('\n').substr(2);
                            } else {
                                str = '\n' + str.split('\n').map(function(line) {
                                    return '   ' + line;
                                }).join('\n');
                            }
                        }
                    } else {
                        str = ctx.stylize('[Circular]', 'special');
                    }
                }
                if (isUndefined(name)) {
                    if (array && key.match(/^\d+$/)) {
                        return str;
                    }
                    name = JSON.stringify('' + key);
                    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                        name = name.substr(1, name.length - 2);
                        name = ctx.stylize(name, 'name');
                    } else {
                        name = name.replace(/'/g, "\\'")
                            .replace(/\\"/g, '"')
                            .replace(/(^"|"$)/g, "'");
                        name = ctx.stylize(name, 'string');
                    }
                }

                return name + ': ' + str;
            }


            function reduceToSingleString(output, base, braces) {
                var numLinesEst = 0;
                var length = output.reduce(function(prev, cur) {
                    numLinesEst++;
                    if (cur.indexOf('\n') >= 0) numLinesEst++;
                    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
                }, 0);

                if (length > 60) {
                    return braces[0] +
                        (base === '' ? '' : base + '\n ') +
                        ' ' +
                        output.join(',\n  ') +
                        ' ' +
                        braces[1];
                }

                return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
            }


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
            function isArray(ar) {
                return Array.isArray(ar);
            }
            exports.isArray = isArray;

            function isBoolean(arg) {
                return typeof arg === 'boolean';
            }
            exports.isBoolean = isBoolean;

            function isNull(arg) {
                return arg === null;
            }
            exports.isNull = isNull;

            function isNullOrUndefined(arg) {
                return arg == null;
            }
            exports.isNullOrUndefined = isNullOrUndefined;

            function isNumber(arg) {
                return typeof arg === 'number';
            }
            exports.isNumber = isNumber;

            function isString(arg) {
                return typeof arg === 'string';
            }
            exports.isString = isString;

            function isSymbol(arg) {
                return typeof arg === 'symbol';
            }
            exports.isSymbol = isSymbol;

            function isUndefined(arg) {
                return arg === void 0;
            }
            exports.isUndefined = isUndefined;

            function isRegExp(re) {
                return isObject(re) && objectToString(re) === '[object RegExp]';
            }
            exports.isRegExp = isRegExp;

            function isObject(arg) {
                return typeof arg === 'object' && arg !== null;
            }
            exports.isObject = isObject;

            function isDate(d) {
                return isObject(d) && objectToString(d) === '[object Date]';
            }
            exports.isDate = isDate;

            function isError(e) {
                return isObject(e) &&
                    (objectToString(e) === '[object Error]' || e instanceof Error);
            }
            exports.isError = isError;

            function isFunction(arg) {
                return typeof arg === 'function';
            }
            exports.isFunction = isFunction;

            function isPrimitive(arg) {
                return arg === null ||
                    typeof arg === 'boolean' ||
                    typeof arg === 'number' ||
                    typeof arg === 'string' ||
                    typeof arg === 'symbol' ||  // ES6 symbol
                    typeof arg === 'undefined';
            }
            exports.isPrimitive = isPrimitive;

            exports.isBuffer = require('./support/isBuffer');

            function objectToString(o) {
                return Object.prototype.toString.call(o);
            }


            function pad(n) {
                return n < 10 ? '0' + n.toString(10) : n.toString(10);
            }


            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
            function timestamp() {
                var d = new Date();
                var time = [pad(d.getHours()),
                    pad(d.getMinutes()),
                    pad(d.getSeconds())].join(':');
                return [d.getDate(), months[d.getMonth()], time].join(' ');
            }


// log is just a thin wrapper to console.log that prepends a timestamp
            exports.log = function() {
                console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
            };


            /**
             * Inherit the prototype methods from one constructor into another.
             *
             * The Function.prototype.inherits from lang.js rewritten as a standalone
             * function (not on Function.prototype). NOTE: If this file is to be loaded
             * during bootstrapping this function needs to be rewritten using some native
             * functions as prototype setup using normal JavaScript does not work as
             * expected during bootstrapping (see mirror.js in r114903).
             *
             * @param {function} ctor Constructor function which needs to inherit the
             *     prototype.
             * @param {function} superCtor Constructor function to inherit prototype from.
             */
            exports.inherits = require('inherits');

            exports._extend = function(origin, add) {
                // Don't do anything if add isn't an object
                if (!add || !isObject(add)) return origin;

                var keys = Object.keys(add);
                var i = keys.length;
                while (i--) {
                    origin[keys[i]] = add[keys[i]];
                }
                return origin;
            };

            function hasOwnProperty(obj, prop) {
                return Object.prototype.hasOwnProperty.call(obj, prop);
            }

        }).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{"./support/isBuffer":13,"_process":12,"inherits":8}],15:[function(require,module,exports){
        'use strict';

        Object.defineProperty(exports, "__esModule", {
            value: true
        });

        var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

        function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

        var backoff = require('backoff');

        var WebSocketClient = function () {

            /**
             * @param url DOMString The URL to which to connect; this should be the URL to which the WebSocket server will respond.
             * @param protocols DOMString|DOMString[] Either a single protocol string or an array of protocol strings. These strings are used to indicate sub-protocols, so that a single server can implement multiple WebSocket sub-protocols (for example, you might want one server to be able to handle different types of interactions depending on the specified protocol). If you don't specify a protocol string, an empty string is assumed.
             */

            function WebSocketClient(url, protocols) {
                var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

                _classCallCheck(this, WebSocketClient);

                this.url = url;
                this._protocols = protocols;

                this.reconnectEnabled = true;
                this.listeners = {};

                this.backoff = backoff[options.backoff || 'fibonacci'](options);
                this.backoff.on('backoff', this.onBackoffStart.bind(this));
                this.backoff.on('ready', this.onBackoffReady.bind(this));
                this.backoff.on('fail', this.onBackoffFail.bind(this));

                this.open();
            }

            _createClass(WebSocketClient, [{
                key: 'open',
                value: function open() {
                    var reconnect = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

                    this.isReconnect = reconnect;

                    this.ws = new WebSocket(this.url, this._protocols);
                    this.ws.onclose = this.onCloseCallback.bind(this);
                    this.ws.onerror = this.onErrorCallback.bind(this);
                    this.ws.onmessage = this.onMessageCallback.bind(this);
                    this.ws.onopen = this.onOpenCallback.bind(this);
                }

                /**
                 * @ignore
                 */

            }, {
                key: 'onBackoffStart',
                value: function onBackoffStart(number, delay) {}

                /**
                 * @ignore
                 */

            }, {
                key: 'onBackoffReady',
                value: function onBackoffReady(number, delay) {
                    // console.log("onBackoffReady", number + ' ' + delay + 'ms');
                    this.open(true);
                }

                /**
                 * @ignore
                 */

            }, {
                key: 'onBackoffFail',
                value: function onBackoffFail() {}

                /**
                 * @ignore
                 */

            }, {
                key: 'onCloseCallback',
                value: function onCloseCallback() {
                    if (!this.isReconnect && this.listeners['onclose']) this.listeners['onclose'].apply(null, arguments);
                    if (this.reconnectEnabled) {
                        this.backoff.backoff();
                    }
                }

                /**
                 * @ignore
                 */

            }, {
                key: 'onErrorCallback',
                value: function onErrorCallback() {
                    if (this.listeners['onerror']) this.listeners['onerror'].apply(null, arguments);
                }

                /**
                 * @ignore
                 */

            }, {
                key: 'onMessageCallback',
                value: function onMessageCallback() {
                    if (this.listeners['onmessage']) this.listeners['onmessage'].apply(null, arguments);
                }

                /**
                 * @ignore
                 */

            }, {
                key: 'onOpenCallback',
                value: function onOpenCallback() {
                    if (this.listeners['onopen']) this.listeners['onopen'].apply(null, arguments);
                    if (this.isReconnect && this.listeners['onreconnect']) this.listeners['onreconnect'].apply(null, arguments);
                    this.isReconnect = false;
                }

                /**
                 * The number of bytes of data that have been queued using calls to send()
                 * but not yet transmitted to the network. This value does not reset to zero
                 * when the connection is closed; if you keep calling send(), this will
                 * continue to climb.
                 *
                 * @type unsigned long
                 * @readonly
                 */

            }, {
                key: 'close',


                /**
                 * Closes the WebSocket connection or connection attempt, if any. If the
                 * connection is already CLOSED, this method does nothing.
                 *
                 * @param code A numeric value indicating the status code explaining why the connection is being closed. If this parameter is not specified, a default value of 1000 (indicating a normal "transaction complete" closure) is assumed. See the list of status codes on the CloseEvent page for permitted values.
                 * @param reason A human-readable string explaining why the connection is closing. This string must be no longer than 123 bytes of UTF-8 text (not characters).
                 *
                 * @return void
                 */
                value: function close(code, reason) {
                    if (typeof code == 'undefined') {
                        code = 1000;
                    }

                    this.reconnectEnabled = false;

                    this.ws.close(code, reason);
                }

                /**
                 * Transmits data to the server over the WebSocket connection.
                 * @param data DOMString|ArrayBuffer|Blob
                 * @return void
                 */

            }, {
                key: 'send',
                value: function send(data) {
                    this.ws.send(data);
                }

                /**
                 * An event listener to be called when the WebSocket connection's readyState changes to CLOSED. The listener receives a CloseEvent named "close".
                 * @param listener EventListener
                 */

            }, {
                key: 'bufferedAmount',
                get: function get() {
                    return this.ws.bufferedAmount;
                }

                /**
                 * The current state of the connection; this is one of the Ready state constants.
                 * @type unsigned short
                 * @readonly
                 */

            }, {
                key: 'readyState',
                get: function get() {
                    return this.ws.readyState;
                }

                /**
                 * A string indicating the type of binary data being transmitted by the
                 * connection. This should be either "blob" if DOM Blob objects are being
                 * used or "arraybuffer" if ArrayBuffer objects are being used.
                 * @type DOMString
                 */

            }, {
                key: 'binaryType',
                get: function get() {
                    return this.ws.binaryType;
                },
                set: function set(binaryType) {
                    this.ws.binaryType = binaryType;
                }

                /**
                 * The extensions selected by the server. This is currently only the empty
                 * string or a list of extensions as negotiated by the connection.
                 * @type DOMString
                 */

            }, {
                key: 'extensions',
                get: function get() {
                    return this.ws.extensions;
                },
                set: function set(extensions) {
                    this.ws.extensions = extensions;
                }

                /**
                 * A string indicating the name of the sub-protocol the server selected;
                 * this will be one of the strings specified in the protocols parameter when
                 * creating the WebSocket object.
                 * @type DOMString
                 */

            }, {
                key: 'protocol',
                get: function get() {
                    return this.ws.protocol;
                },
                set: function set(protocol) {
                    this.ws.protocol = protocol;
                }
            }, {
                key: 'onclose',
                set: function set(listener) {
                    this.listeners['onclose'] = listener;
                },
                get: function get() {
                    return this.listeners['onclose'];
                }

                /**
                 * An event listener to be called when an error occurs. This is a simple event named "error".
                 * @param listener EventListener
                 */

            }, {
                key: 'onerror',
                set: function set(listener) {
                    this.listeners['onerror'] = listener;
                },
                get: function get() {
                    return this.listeners['onerror'];
                }

                /**
                 * An event listener to be called when a message is received from the server. The listener receives a MessageEvent named "message".
                 * @param listener EventListener
                 */

            }, {
                key: 'onmessage',
                set: function set(listener) {
                    this.listeners['onmessage'] = listener;
                },
                get: function get() {
                    return this.listeners['onmessage'];
                }

                /**
                 * An event listener to be called when the WebSocket connection's readyState changes to OPEN; this indicates that the connection is ready to send and receive data. The event is a simple one with the name "open".
                 * @param listener EventListener
                 */

            }, {
                key: 'onopen',
                set: function set(listener) {
                    this.listeners['onopen'] = listener;
                },
                get: function get() {
                    return this.listeners['onopen'];
                }

                /**
                 * @param listener EventListener
                 */

            }, {
                key: 'onreconnect',
                set: function set(listener) {
                    this.listeners['onreconnect'] = listener;
                },
                get: function get() {
                    return this.listeners['onreconnect'];
                }
            }]);

            return WebSocketClient;
        }();

        /**
         * The connection is not yet open.
         */


        WebSocketClient.CONNECTING = WebSocket.CONNECTING;

        /**
         * The connection is open and ready to communicate.
         */
        WebSocketClient.OPEN = WebSocket.OPEN;

        /**
         * The connection is in the process of closing.
         */
        WebSocketClient.CLOSING = WebSocket.CLOSING;

        /**
         * The connection is closed or couldn't be opened.
         */
        WebSocketClient.CLOSED = WebSocket.CLOSED;

        exports.default = WebSocketClient;

    },{"backoff":1}]},{},[15])(15)
});