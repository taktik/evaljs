// not strict, 'cause we need to parse the with statement
/* jshint strict: false */

// statements after a return are ok for test cases
/* jshint -W027 */
// missing break statements in switch statements are ok
/* jshint -W086 */

console.log(">>> 0-2 on separate lines?");
for (var i = 0; i < 10; i++) {
    if (i === 1) {
        continue;
    }
    if (i === 3) {
        break;
    }
    console.log(i);
}

function Test(name) {
    this._name = name;
}

Test.prototype.hello = function () {
    console.log(">>> Hello Marten!? : ","Hello,", this._name + "!");
};

var a = new Test("Marten");
a.hello();

var op = {
  '+': function (a, b) {return a + b; }
}['+'];
console.log(">>> 4? : ",op(2, 2));

console.log(">>> 0-3 on separate lines?");
for (var i = 0; i < 4; i += 1) {
  console.log(i);
}

console.log(">>> 2 on separate lines?");
if (1) {
  console.log(2);
}

console.log(">>> 3 on separate line (err - in red... can come later)?");
if (0) {
  console.warn(1);
} else {
  console.error(3);
}

console.log(">>> Hello World!? : ","Hello World!");

(function (name) {
  console.log(">>> Hello Marten!? : ","Hello", name + "!");
}('Marten'));

console.log(">>> 1-2 on separate lines?");
var i = 0;
while (i < 2) {
  ++i;
  console.log(i);
}

// works if you use 'global' instead of the custom global object that
// only includes 'console'
//
// process.nextTick(function () {
//  console.log("Later...");
// });

function test(def) {
  return function () {
    return def.abc;
  };
}

console.log(">>> []? :",test({abc: []})());

var a = (1, 2);
console.log(">>> 2? :", a);

console.log(">>> 0-1 on separate lines?");
var i = 0;
do {
  console.log(i);
  i++;
} while (i < 2);

console.log(">>> 0 :",1 ? 0 : 1);
console.log(">>> 1 :",0 ? 0 : 1);

console.log(">>> Finally end Hello Throw! on err(red and later)?:");
try {
    throw new Error('Hello Throw!');
} catch (err) {
    console.error(err.message);
} finally {
    console.log("Finally");
}

console.log(">>> Finally ?:");
try {
} catch (err) {
} finally {
    console.log("Finally");
}

console.log(">>> Try and Finally?:");
try {
    console.log("Try");
} catch (err) {
    console.error(err.message);
} finally {
    console.log("Finally");
}

console.log(">>> 1,2,3,4 on separate lines?");
console.log(function () {
  var x = 4;
  console.log(1);
  if (x) {
    console.log(2);
    for (var i = 0; i < 3; i++) {
      console.log(3);
      return x;
      console.log(5);
    }
    console.log(6);
  }
  console.log(7);
}());

console.log(">>> 2,3 on separate lines?");
var x = 2;
switch (x) {
  case 1:
    console.log(1);
    //falls through
  case 2:
    console.log(2);
  case 3:
    console.log(3);
    break;
  case 4:
    console.log(4);
  default:
    console.log(5);
}

console.log(">>> 2 on separate lines?");
switch (x) {
  case 1:
    console.log(1);
  default:
    console.log(2);
}

console.log(">>> 3 on separate lines?");
switch (x) {
  case 2:
    console.log(3);
    break;
  default:
    console.log(4);
}

console.log(">>> 5,6 on separate lines?");
switch (x) {
  case 2:
    console.log(5);
  default:
    console.log(6);
}

console.log(">>> 8 on separate lines?");
switch (x) {
  default:
    console.log(7);
  case 2:
    console.log(8);
}

console.log(">>> 10 on separate lines?");
switch (x) {
  default:
    console.log(9);
    break;
  case 2:
    console.log(10);
}

console.log(">>> a,b on separate lines?");
var z;
for (z in {a: 1, b: 2}) {
  console.log(z);
}

console.log(">>> a,b on separate lines?");
for (var key in {a: 1, b: 2}) {
  console.log(key);
}

console.log(">>> should be called?");
abcdefg();

function abcdefg() {
  console.log('should be called');
}

console.log(">>> 3,undefined on separate lines?");
var obj = {};
obj.a = 3;
console.log(obj.a);
delete obj.a;
console.log(obj.a);

/*jshint ignore:start*/
with ({a: 1, b: 2}) {
  console.log(">>> 1 2?", a, b);
}
"All done!"
/*jshint ignore:end*/
