/* jshint esversion: 6 */
/* jshint noyield: true */

"use strict";

//TODO:
//- LabeledStatement -> including use in break/continue
//- nicer error handling?
//-> TESTS
//-> BENCHMARKS

var parse = require('acorn').parse;
var util = require("util");
var EventEmitter = require("events").EventEmitter;

function noop() {}

function Arguments() {
  //TODO: add es3 'arguments.callee'?
}

Arguments.prototype.toString = function () {
  return '[object Arguments]';
};

function Return(val) {
  this.value = val;
}

// need something unique to compare a against.
var Break = {};
var Continue = {};

function Environment(globalObjects) {
  EventEmitter.call(this);
  if (!globalObjects) globalObjects = [];
  if (!Array.isArray(globalObjects)) {
    globalObjects = [globalObjects];
  }
  globalObjects = [{Boolean,Object,Array,String,Number,Date,
      RegExp,NaN,Infinity,Error,EvalError,RangeError,
      ReferenceError,SyntaxError,TypeError,URIError,
      JSON,Promise,ArrayBuffer,DataView,Uint8ClampedArray,
      Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,
      Uint32Array,Float32Array,Float64Array}].concat(globalObjects);

  var parent;
  globalObjects.forEach(function (vars) {
    parent = createVarStore(parent, vars);
  });
  // the topmost store is our current store
  this._curVarStore = parent;
  this._curDeclarations = {};
  this._globalObj = globalObjects[0];
  this._curThis = this._globalObj;
  this._boundGen = this._gen.bind(this);
  this.DEBUG = false;
  this.DELAY = 0;
  this.STATE = 'running';
}

util.inherits(Environment, EventEmitter);

function createVarStore(parent, vars) {
  vars = vars || {};
  return {
    parent: parent,
    vars: vars
  };
}

Environment.prototype.callExpr = function* (expr, arg) {
    var result;
    if (expr.constructor.name === 'GeneratorFunction') {
        result = yield* expr(arg);
    } else {
        result = expr(arg);
    }
    return result;
};

Environment.prototype.mapExpr = function* (items, generatorFunction) {
    var result = [];
    for(let i=0;i<items.length;i++) {
        result.push(yield* generatorFunction(items[i]));
    }
    return result;
};


Environment.prototype.gen = function (node) {
  var opts = {
    'locations': true
  };
  if (typeof node === 'string') {
    node = parse(node, opts);
  }
  var resp = this._gen(node);
  addDeclarationsToStore(this._curDeclarations, this._curVarStore);
  this._curDeclarations = {};
  return resp;
};

Environment.prototype._gen = function (node) {
  var closure = ({
    BinaryExpression: this._genBinExpr,
    LogicalExpression: this._genBinExpr,
    UnaryExpression: this._genUnaryExpr,
    UpdateExpression: this._genUpdExpr,
    ObjectExpression: this._genObjExpr,
    ArrayExpression: this._genArrExpr,
    CallExpression: this._genCallExpr,
    NewExpression: this._genNewExpr,
    MemberExpression: this._genMemExpr,
    ThisExpression: this._genThisExpr,
    SequenceExpression: this._genSeqExpr,
    Literal: this._genLit,
    Identifier: this._genIdent,
    AssignmentExpression: this._genAssignExpr,
    FunctionDeclaration: this._genFuncDecl,
    VariableDeclaration: this._genVarDecl,
    BlockStatement: this._genProgram,
    Program: this._genProgram,
    ExpressionStatement: this._genExprStmt,
    EmptyStatement: this._genEmptyStmt,
    ReturnStatement: this._genRetStmt,
    FunctionExpression: this._genFuncExpr,
    IfStatement: this._genIfStmt,
    ConditionalExpression: this._genCondStmt,
    ForStatement: this._genLoopStmt,
    WhileStatement: this._genLoopStmt,
    DoWhileStatement: this._genDoWhileStmt,
    ForInStatement: this._genForInStmt,
    WithStatement: this._genWithStmt,
    ThrowStatement: this._genThrowStmt,
    TryStatement: this._genTryStmt,
    ContinueStatement: this._genContStmt,
    BreakStatement: this._genBreakStmt,
    SwitchStatement: this._genSwitchStmt,
    ArrowFunctionExpression: this._genArrowFunStmt
  }[node.type] || function () {
    console.warn("Not implemented yet: " + node.type);
    return noop;
  }).call(this, node);

  if (this.DEBUG) {
    return function () {
      var info = 'closure for ' + node.type + ' called';
      var line = ((node.loc || {}).start || {}).line;
      if (line) {
        info += ' while processing line ' + line;
      }
      var resp = closure();
      info += '. Result:';
      console.log(info, resp);
      return resp;
    };
  }
  return closure;
};

Environment.prototype._genBinExpr = function (node) {
  var self = this;

  var a = this._gen(node.left);
  var b = this._gen(node.right);

  return {
    '==': function* () {
      return (yield* self.callExpr(a)) == (yield* self.callExpr(b));
    },
    '!=': function* () {
      return (yield* self.callExpr(a)) != (yield* self.callExpr(b));
    },
    '===': function* () {
      return (yield* self.callExpr(a)) === (yield* self.callExpr(b));
    },
    '!==': function* () {
      return (yield* self.callExpr(a)) !== (yield* self.callExpr(b));
    },
    '<': function* () {
      return (yield* self.callExpr(a)) < (yield* self.callExpr(b));
    },
    '<=': function* () {
      return (yield* self.callExpr(a)) <= (yield* self.callExpr(b));
    },
    '>': function* () {
      return (yield* self.callExpr(a)) > (yield* self.callExpr(b));
    },
    '>=': function* () {
      return (yield* self.callExpr(a)) >= (yield* self.callExpr(b));
    },
    '<<': function* () {
      return (yield* self.callExpr(a)) << (yield* self.callExpr(b));
    },
    '>>': function* () {
      return (yield* self.callExpr(a)) >> (yield* self.callExpr(b));
    },
    '>>>': function* () {
      return (yield* self.callExpr(a)) >>> (yield* self.callExpr(b));
    },
    '+': function* () {
      return (yield* self.callExpr(a)) + (yield* self.callExpr(b));
    },
    '-': function* () {
      return (yield* self.callExpr(a)) - (yield* self.callExpr(b));
    },
    '*': function* () {
      return (yield* self.callExpr(a)) * (yield* self.callExpr(b));
    },
    '/': function* () {
      return (yield* self.callExpr(a)) / (yield* self.callExpr(b));
    },
    '%': function* () {
      return (yield* self.callExpr(a)) % (yield* self.callExpr(b));
    },
    '|': function* () {
      return (yield* self.callExpr(a)) | (yield* self.callExpr(b));
    },
    '^': function* () {
      return (yield* self.callExpr(a)) ^ (yield* self.callExpr(b));
    },
    '&': function* () {
      return (yield* self.callExpr(a)) & (yield* self.callExpr(b));
    },
    'in': function* () {
      return (yield* self.callExpr(a)) in (yield* self.callExpr(b));
    },
    'instanceof': function* () {
      return (yield* self.callExpr(a)) instanceof (yield* self.callExpr(b));
    },
    // logic expressions
    '||': function* () {
      return (yield* self.callExpr(a)) || (yield* self.callExpr(b));
    },
    '&&': function* () {
      return (yield* self.callExpr(a)) && (yield* self.callExpr(b));
    }
  }[node.operator];
};

Environment.prototype._genUnaryExpr = function (node) {
  var self = this;

  if (node.operator === 'delete') {
    return this._genDelete(node);
  }

  var a = this._gen(node.argument);
  return {
    '-': function* () {
      return -(yield* self.callExpr(a));
    },
    '+': function* () {
        return +(yield* self.callExpr(a));
    },
    '!': function* () {
      return !(yield* self.callExpr(a));
    },
    '~': function* () {
      return ~(yield* self.callExpr(a));
    },
    'typeof': function* () {
      return typeof (yield* self.callExpr(a));
    },
    'void': function* () {
      return void (yield* self.callExpr(a));
    }
  }[node.operator];
};

Environment.prototype._genDelete = function (node) {
  var self = this;
  var obj = this._genObj(node.argument);
  var attr = this._genName(node.argument);

  return function* () {
    return delete (yield* self.callExpr(obj))[(yield* self.callExpr(attr))];
  };
};

Environment.prototype._genObjExpr = function (node) {
  var self = this;
  var items = node.properties.map(property=>({
      key: self._objKey(property.key),
      getVal: self._gen(property.value)
  }));

  return function*() {
    return (yield* self.mapExpr(items, function*(item) {
      return [ (yield* self.callExpr(item.key)), (yield* self.callExpr(item.getVal))];
    })).reduce((acc,v) => {acc[v[0]] = v[1]; return acc;}, {});
  };
};

Environment.prototype._genArrExpr = function (node) {
  var self = this;
  var items = node.elements.map(this._boundGen);

  return function* () {
    return yield* self.mapExpr(items, self.callExpr);
  };
};

Environment.prototype._objKey = function (node) {
  var self = this;
  var key;
  if (node.type === 'Identifier') {
    key = () => node.name;
  } else {
    key = this._gen(node);
  }

  return function* () {
    return yield * self.callExpr(key);
  };
};

Environment.prototype._genCallExpr = function (node) {
  var self = this;
  var callee;
  if (node.callee.type === 'MemberExpression') {
    var obj = self._genObj(node.callee);
    var name = self._genName(node.callee);
    callee = function*() {
      var theObj = yield* self.callExpr(obj);
      return theObj[(yield* self.callExpr(name))].bind(theObj);
    };
  } else {
    callee = self._gen(node.callee);
  }
  var args = node.arguments.map(self._gen.bind(self));

  return function* () {
    self.emit('line', node.loc.start.line);
    var c = yield* self.callExpr(callee);

    if (c === undefined) {
      return c;
    }

    var result;
    var res;

    result = c.apply(self._globalObj, yield* self.mapExpr(args, self.callExpr));

    if (result !== undefined) {
      if (result.next) {
        res = yield* result; //Really ?
        return res;
      }
    }
    return result;
  };
};

Environment.prototype._genNewExpr = function (node) {
  //if (node.callee.type === 'Identifier')
  var callee = this._gen(node.callee);
  var args = node.arguments.map(this._boundGen);
  var self = this;

  return function* () {
    self.emit('line', node.loc.start.line);
    var cl = yield* self.callExpr(callee);
    var ar = yield * self.mapExpr(args, self.callExpr);
    return new cl(...ar);
  };
};

Environment.prototype._genMemExpr = function (node) {
  var self = this;
  var obj = this._gen(node.object);
  var property = this._memExprProperty(node);
  return function*() {
    self.emit('line', node.loc.start.line);
    const base = yield * self.callExpr(obj);
    const propertyValue = (yield * self.callExpr(property));
    return base[propertyValue];
  };
};

Environment.prototype._memExprProperty = function (node) {
  return node.computed ? this._gen(node.property) : this._objKey(node.property);
};

Environment.prototype._genThisExpr = function () {
  var self = this;
  return function () {
    return self._curThis;
  };
};

Environment.prototype._genSeqExpr = function (node) {
  var exprs = node.expressions.map(this._boundGen);
  return function () {
    var result;
    exprs.forEach(function (expr) {
      result = expr();
    });
    return result;
  };
};

Environment.prototype._genUpdExpr = function (node) {
  var self = this;
  var update = {
    '--true': function (obj, name) {
      return --obj[name];
    },
    '--false': function (obj, name) {
      return obj[name]--;
    },
    '++true': function (obj, name) {
      return ++obj[name];
    },
    '++false': function (obj, name) {
      return obj[name]++;
    }
  }[node.operator + node.prefix];
  var obj = this._genObj(node.argument);
  var name = this._genName(node.argument);
  return function* () {
    self.emit('line', node.loc.start.line);
    yield;
    return update(obj(), name());
  };
};

Environment.prototype._genObj = function (node) {
  if (node.type === 'Identifier') {
    return this._getVarStore.bind(this, node.name);
  } else if (node.type === 'MemberExpression') {
    return this._gen(node.object);
  } else {
    console.warn("Unknown _genObj() type: " + node.type);
    return noop;
  }
};

Environment.prototype._genName = function (node) {
  if (node.type === 'Identifier') {
    return function () {
      return node.name;
    };
  } else if (node.type === 'MemberExpression') {
    return this._memExprProperty(node);
  } else {
    console.warn("Unknown _genName() type: " + node.type);
    return noop;
  }
};

Environment.prototype._genLit = function (node) {
  return function () {
    return node.value;
  };
};

Environment.prototype._genIdent = function (node) {
  var self = this;
  return function () {
    const store = self._getVarStore(node.name);
    return store && store[node.name];
  };
};

Environment.prototype._getVarStore = function (name) {
  var store = this._curVarStore;
  do {
    if (store.vars.hasOwnProperty(name)) {
      return store.vars;
    }
  } while ((store = store.parent));

  // global object as fallback
  return this._globalObj;
};

Environment.prototype._genAssignExpr = function (node) {
  var self = this;
  var setter = {
    '=': function (obj, name, val) {
      return (obj[name] = val);
    },
    '+=': function (obj, name, val) {
      return obj[name] += val;
    },
    '-=': function (obj, name, val) {
      return obj[name] -= val;
    },
    '*=': function (obj, name, val) {
      return obj[name] *= val;
    },
    '/=': function (obj, name, val) {
      return obj[name] /= val;
    },
    '%=': function (obj, name, val) {
      return obj[name] %= val;
    },
    '<<=': function (obj, name, val) {
      return obj[name] <<= val;
    },
    '>>=': function (obj, name, val) {
      return obj[name] >>= val;
    },
    '>>>=': function (obj, name, val) {
      return obj[name] >>>= val;
    },
    '|=': function (obj, name, val) {
      return obj[name] |= val;
    },
    '^=': function (obj, name, val) {
      return obj[name] ^= val;
    },
    '&=': function (obj, name, val) {
      return obj[name] &= val;
    }
  }[node.operator];
  var obj = this._genObj(node.left);
  var name = this._genName(node.left);
  var val = this._gen(node.right);
  return function* () {
    self.emit('line', node.left.loc.start.line);
    return setter(yield* self.callExpr(obj), yield* self.callExpr(name), yield* self.callExpr(val));
  };
};

Environment.prototype._genFuncDecl = function (node) {
  this._curDeclarations[node.id.name] = this._genFuncExpr(node);
  return function () {
    return noop;
  };
};

Environment.prototype._genVarDecl = function (node) {
  var assignments = [];
  for (var i = 0; i < node.declarations.length; i++) {
    var decl = node.declarations[i];
    this._curDeclarations[decl.id.name] = noop;
    if (decl.init) {
      assignments.push({
        type: 'AssignmentExpression',
        operator: '=',
        left: decl.id,
        right: decl.init
      });
    }
  }
  return this._gen({
    type: 'BlockStatement',
    body: assignments
  });
};

Environment.prototype.getState = function () {
  return this.STATE;
};

Environment.prototype.setState = function (state) {
  this.STATE = state;
};

Environment.prototype._genArrowFunStmt = function (node) {
    var self = this;

    var oldDeclarations = self._curDeclarations;
    self._curDeclarations = {};
    var body = self._gen(node.body);
    const simpleBody = (node.body.type !== 'BlockStatement');
    var declarations = self._curDeclarations;
    self._curDeclarations = oldDeclarations;

    // reset var store
    return function () {
        var parent = self._curVarStore;
        return function () {
            // build arguments object
            var args = new Arguments();
            args.length = arguments.length;
            for (var i = 0; i < arguments.length; i++) {
                args[i] = arguments[i];
            }

            // switch interpreter 'stack'
            var oldStore = self._curVarStore;
            var oldThis = self._curThis;
            self._curVarStore = createVarStore(parent);
            self._curThis = this;

            addDeclarationsToStore(declarations, self._curVarStore);
            self._curVarStore.vars.arguments = args;

            // add function args to var store
            node.params.forEach(function (param, i) {
                self._curVarStore.vars[param.name] = args[i];
            });

            // run function body
            // TODO: be cleverer than me and find a way to yield * this
            //var result = yield* self.callExpr(body);
            var iterator = self.callExpr(body);
            let marker = iterator.next();
            while (!marker.done) {
                marker = iterator.next();
            }
            const result = marker.value;

            // switch 'stack' back
            self._curThis = oldThis;
            self._curVarStore = oldStore;

            if (result instanceof Return) {
              return result.value;
            } else if (simpleBody) {
              return result;
            }
        };
    };
};

Environment.prototype._genFuncExpr = function (node) {
  var self = this;

  var oldDeclarations = self._curDeclarations;
  self._curDeclarations = {};
  var body = self._gen(node.body);
  var declarations = self._curDeclarations;
  self._curDeclarations = oldDeclarations;

  // reset var store
  return function () {
    var parent = self._curVarStore;
    return function () {
      // build arguments object
      var args = new Arguments();
      args.length = arguments.length;
      for (var i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }

      // switch interpreter 'stack'
      var oldStore = self._curVarStore;
      var oldThis = self._curThis;
      self._curVarStore = createVarStore(parent);
      self._curThis = this;

      addDeclarationsToStore(declarations, self._curVarStore);
      self._curVarStore.vars.arguments = args;

      // add function args to var store
      node.params.forEach(function (param, i) {
        self._curVarStore.vars[param.name] = args[i];
      });

      // run function body
      // TODO: be cleverer than me and find a way to yield * this
      //var result = yield* self.callExpr(body);
      var iterator = self.callExpr(body);
      let marker = iterator.next();
      while (!marker.done) {
          marker = iterator.next();
      }
      const result = marker.value;

      // switch 'stack' back
      self._curThis = oldThis;
      self._curVarStore = oldStore;

      if (result instanceof Return) {
        return result.value;
      }
    };
  };
};

function addDeclarationsToStore(declarations, varStore) {
  for (var key in declarations) {
    if (declarations.hasOwnProperty(key) && !varStore.vars.hasOwnProperty(key)) {
      varStore.vars[key] = declarations[key]();
    }
  }
}

Environment.prototype._genProgram = function (node) {
  var self = this;
  var stmtClosures = node.body.map(function (stmt) {
    return self._gen(stmt);
  });

  return function* () {
    var result;
    for (var i = 0; i < stmtClosures.length; i++) {
      if (stmtClosures[i].constructor.name === 'GeneratorFunction') {
        result = yield* stmtClosures[i]();
        yield;
      } else {
        result = stmtClosures[i]();
        yield;
      }
      if (result === Break || result === Continue || result instanceof Return) {
        break;
      }
    }
    //return last
    return result;
  };
};

Environment.prototype._genExprStmt = function (node) {
  return this._gen(node.expression);
};

Environment.prototype._genEmptyStmt = function () {
  return noop;
};

Environment.prototype._genRetStmt = function (node) {
  var self = this;
  var arg = node.argument ? this._gen(node.argument) : noop;
  return function* () {
    self.emit('line', node.loc.start.line);
    return new Return(yield* self.callExpr(arg));
  };
};

Environment.prototype._genIfStmt = function (node) {
  var self = this;
  var test = function () {
    self.emit('line', node.loc.start.line);
    return self._gen(node.test)();
  };
  var consequent = this._gen(node.consequent);
  var alternate = node.alternate ? this._gen(node.alternate) : function* () {
    return noop;
  };

  return function* () {
    var result = test() ? yield* consequent() : yield* alternate();
    return result;
  };
};

Environment.prototype._genCondStmt = function (node) {
  var self = this;
  var test = this._gen(node.test);
  var consequent = this._gen(node.consequent);
  var alternate = node.alternate ? this._gen(node.alternate) : noop;

  return function* () {
    const testValue = (yield* self.callExpr(test));
    return  testValue ? (yield* self.callExpr(consequent)) : (yield* self.callExpr(alternate));
  };
};

Environment.prototype._genLoopStmt = function (node, body) {
  var self = this;
  var init = node.init ? this._gen(node.init) : function* () { return noop; };
  var test = node.test ? self._gen(node.test) : function* () { return true; };
  var update = node.update ? this._gen(node.update) : function* () { return noop; };
  body = body || this._gen(node.body);

  return function* () {
    self.emit('line', node.loc.start.line);
    var resp;
    for (yield* self.callExpr(init); yield* self.callExpr(test); yield* self.callExpr(update)) {
      var newResp = yield* self.callExpr(body);

      if (newResp === Break) {
        break;
      }
      if (newResp === Continue) {
        continue;
      }
      resp = newResp;
      if (newResp instanceof Return) {
        break;
      }
    }
    return resp;
  };
};

Environment.prototype._genDoWhileStmt = function (node) {
  var self = this;
  var body = this._gen(node.body);
  var loop = this._genLoopStmt(node, body);

  return function* () {
    yield* self.callExpr(body);
    yield* self.callExpr(loop);
  };
};

Environment.prototype._genForInStmt = function (node) {
  var self = this;
  var right = self._gen(node.right);
  var body = self._gen(node.body);

  var left = node.left;
  if (left.type === 'VariableDeclaration') {
    self._curDeclarations[left.declarations[0].id.name] = noop;
    left = left.declarations[0].id;
  }
  return function* () {
    self.emit('line', node.loc.start.line);
    var resp;
    for (var x in right()) {
      self.emit('line', node.loc.start.line);
      yield* self.callExpr(self._genAssignExpr({
        operator: '=',
        left: left,
        right: {
          type: 'Literal',
          value: x
        }
      }));
      resp = yield* self.callExpr(body);
    }
    return resp;
  };
};

Environment.prototype._genWithStmt = function (node) {
  var self = this;
  var obj = self._gen(node.object);
  var body = self._gen(node.body);
  return function* () {
    self._curVarStore = createVarStore(self._curVarStore, yield* self.callExpr(obj));
    var result = yield* self.callExpr(body);
    self._curVarStore = self._curVarStore.parent;
    return result;
  };
};

Environment.prototype._genThrowStmt = function (node) {
  var self = this;
  var arg = this._gen(node.argument);
  return function* () {
    throw yield* self.callExpr(arg);
  };
};

Environment.prototype._genTryStmt = function (node) {
  var self = this;
  var block = this._gen(node.block);
  var handler = this._genCatchHandler(node.handler);
  var finalizer = node.finalizer ? this._gen(node.finalizer) : function (x) {
    return x;
  };

  return function* () {
    try {
      return yield* self.callExpr(finalizer, yield* self.callExpr(block));
    } catch (err) {
      return yield* self.callExpr(handler, err);
    }
  };
};

Environment.prototype._genCatchHandler = function (node) {
  if (!node) {
    return noop;
  }
  var self = this;
  var body = self._gen(node.body);
  return function*(err) {
    var old = self._curVarStore.vars[node.param.name];
    self._curVarStore.vars[node.param.name] = err;
    var resp = yield* self.callExpr(body);
    self._curVarStore.vars[node.param.name] = old;

    return resp;
  };
};

Environment.prototype._genContStmt = function () {
  return function () {
    return Continue;
  };
};

Environment.prototype._genBreakStmt = function () {
  return function () {
    return Break;
  };
};

Environment.prototype._genSwitchStmt = function (node) {
  var self = this;

  var discriminant = self._gen(node.discriminant);
  var cases = node.cases.map(function (curCase) {
    return {
      test: curCase.test ? self._gen(curCase.test) : null,
      code: self._genProgram({ body: curCase.consequent })
    };
  });

  return function* () {
    var foundMatch = false;
    var discriminantVal = discriminant();
    var resp, defaultCase;

    for (var i = 0; i < cases.length; i++) {
      var curCase = cases[i];
      if (!foundMatch) {
        if (!curCase.test) {
          defaultCase = curCase;
          continue;
        }
        if (discriminantVal !== curCase.test()) {
          continue;
        }
        foundMatch = true;
      }
      // foundMatch is guaranteed to be true here
      var newResp = yield* self.callExpr(curCase.code);
      if (newResp === Break) {
        return resp;
      }
      resp = newResp;
      if (resp === Continue || resp instanceof Return) {
        return resp;
      }
    }
    if (!foundMatch && defaultCase) {
      return yield* self.callExpr(defaultCase.code);
    }
  };
};

exports.Environment = Environment;
exports.evaluate = function (code) {
  var env = new Environment(global);
  var iterator = env.gen(code)();
  var result = iterator.next();
  while (!result.done) {
    result = iterator.next();
  }
  return result.value;
};

//console.log(exports.evaluate("1 + 1"));
