// not strict, 'cause we need to parse the with statement
/* jshint strict: false */

var op = {
	'+': function (a, b) {return a + b; }
}['+'];
console.log(op(2, 2));

function Test(name) {
	this._name = name;
}

Test.prototype.hello = function () {
	console.log("Hello,", this._name + "!");
};

var a = new Test("Marten");
a.hello();

for (var i = 0; i < 4; i += 1) {
	console.log(i);
}

if (1) {
	console.log(2);
}

if (0) {
	console.warn(1);
} else {
	console.error(3);
}

console.log("Hello World!");

(function (name) {
	console.log("Hello", name + "!");
}('Marten'));

var i = 0;
while (i < 2) {
	++i;
	console.log(i);
}

// works if you use 'global' instead of the custom global object that
// only includes 'console'
//
// process.nextTick(function () {
// 	console.log("Later...");
// });

function test(def) {
	return function () {
		return def.abc;
	};
}

console.log(test({abc: []})());

var a = (1, 2);
console.log(a);

var i = 0;
do {
	console.log(i);
	i++;
} while (i < 2);

console.log(1 ? 0 : 1);
console.log(0 ? 0 : 1);

/*jshint ignore:start*/
with ({a: 1, b: 2}) {
	console.log(a, b);
}
/*jshint ignore:end*/

/*
var x = 2;
switch (x) {
	case 1:
		console.log(1);
	case 2:
		console.log(2);
	case 3:
		console.log(3);
		break
	case 4:
		console.log(4);
}
*/

/*
for (var key in {a: 1, b: 2}) {
	console.log(key);
}
*/