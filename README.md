# Rena2
Rena2 is a library of parsing texts. Rena2 makes parsing text easily.  
Rena2 can treat recursion of pattern, hence Rena2 can parse languages which described top down parsing
like arithmetic expressions and so on.  
Rena2 can parse class of Parsing Expression Grammar (PEG) language.  
Rena2 can also treat synthesized and inherited attributes.  
'Rena' is an acronym of REpetation (or REcursion) Notation API.  

## How to use

### node.js
Install Rena2:
```
npm install rena2
```

Use module:
```js
var R = require('rena2');
```

### Browser
```html
<script src="rena2.js"></script>
```

## Expression

### Construct Expression Generation Object
```js
var r = Rena2(option);
```

Options shown as follow are available.
```
{
  ignore: expression to ignore,
  keys: [key, ...]
}
```

An example which generates object show as follows.
```js
var r = Rena2({
  ignore: /\s+/,
  keys: ["+", "-", "++"]
});
```

### Elements of Expression

#### Literals
String literal and regular expression literal of JavaScript are elements of expression.  
To use only one literal as expression, use then synthesized expression.

#### Attrinbute Setting Expression
Attribute setting expression is an element of expression.
```js
r.attr(attribute to set);
```

#### Key Matching Expression
Key matching expression is an element of expression.  
If keys "+", "++", "-" are specified by option, below expression matches "+" but does not match "+" after "+".
```
r.key("+");
```

#### Not Key Matching Expression
Not key matching expression is an element of expression.
If keys "+", "++", "-" are specified by option, "+", "++", "-" will not match.
```
r.notKey();
```

#### Keyword Matching Expression
Keyword matching expression is an element of expression.
```
r.equalsId(keyword);
```

The table shows how to match expression r.equalsId("keyword") by option.

|option|keyword|keyword1|keyword-1|keyword+|
|:-----|:------|:-------|:--------|:-------|
|no options|match|match|match|match|
|ignore: /-/|match|no match|match|no match|
|keys: ["+"]|match|no match|no match|match|
|ignore: /-/ and keys: ["+"]|match|no match|match|match|

#### Real Number
Real number expression is an element of expression and matches any real number.
```
r.real();
```

#### Newline
Newline expression is an element of expression and matches CR/LF/CRLF newline.
```
r.br();
```

#### End of string
End of string is an element of expression and matches the end of string.
```
r.end();
```

#### Function
Function which fulfilled condition shown as follow is an element of expression.  
* the function has 3 arguments
* first argument is a string to match
* second argument is last index of last match
* third argument is an attribute
* return value of the function is an object which has 3 properties
  * "match": matched string
  * "lastIndex": last index of matched string
  * "attr": result attribute

Every instance of expression is a function fulfilled above condition.

### Synthesized Expression

#### Sequence
Sequence expression matches if all specified expression are matched sequentially.  
Below expression matches "abc".
```
r.then("a", "b", "c");
```

#### Choice
Choice expression matches if one of specified expression are matched.  
Specified expression will be tried sequentially.  
Below expression matches "a", "b" or "c".
```
r.or("a", "b", "c");
```

#### Repetation
Repetation expression matches repetation of specified expression.  
The family of repetation expression are shown as follows.  
```
r.times(minimum count, maximum count, expression, [action]);
r.atLeast(minimum count, expression, [action]);
r.atMost(maximum count, expression, [action]);
r.oneOrMore(expression, [action]);
r.zeroOrMore(expression, [action]);
r.maybe(expression);
```

r.atLeast(min, expression, action) is equivalent to r.times(min, false, expression, action).  
r.atMost(max, expression, action) is equivalent to r.times(0, max, expression, action).  
r.oneOrMore(expression, action) is equivalent to r.times(1, false, expression, action).  
r.zeroOrMore(expression, action) is equivalent to r.times(0, false, expression, action).  
r.maybe(expression) is equivalent to r.times(0, 1, expression).  

The argument action must specify a function with 3 arguments and return result attribute.  
First argument of the function will pass a matched string,
second argument will pass an attribute of repetation expression ("synthesized attribtue"),
and third argument will pass an inherited attribute.  

For example, consider action of the expression.
```js
var match = r.oneOrMore(/[0-9]/, (match, synthesized, inherited) => inherited + ":" + synthesized);
match("27", 0, "");
```

In first match of string "27", the arguments of function are ("2", "2", "") and results ":2".  
In second match, the arguments are ("27", "7", ":2") and results ":2:7".

Repetation expression is already greedy and does not backtrack.

#### Repetation with Delimiter
Repetation with delimiter matches repetation one or more times and delimited by delimiter expression.  
Below expression matches "1,2,3".
```
r.delimiter(/[0-9]+/, ",");
```

The r.delimiter can pass an action as third arguments same as simple repetation.

#### Repetation with Backtracking
Repetation expression matches repetation of specified expression with backtracking.
The family of repetation expression with backtracking are shown as follows.  
```
r.triesTimes(minimum count, maximum count, expression, next match, [action]);
r.triesAtLeast(minimum count, expression, next match, [action]);
r.triesAtMost(maximum count, expression, next match, [action]);
r.triesOneOrMore(expression, next match, [action]);
r.triesZeroOrMore(expression, next match, [action]);
r.triesMaybe(expression);
```

r.triesAtLeast(min, expression, next, action) is equivalent to r.triesTimes(min, false, expression, next, action).  
r.triesAtMost(max, expression, next, action) is equivalent to r.triesTimes(0, max, expression, next, action).  
r.triesOneOrMore(expression, next, action) is equivalent to r.triesTimes(1, false, expression, next, action).  
r.triesZeroOrMore(expression, next, action) is equivalent to r.triesTimes(0, false, expression, next, action).  
r.triesMaybe(expression, next) is equivalent to r.triesTimes(0, 1, expression, next).  

These expression tries backtracking greedy if the next match is not matched.  

The argument action must specify a function with 3 arguments and return result attribute.  
First argument of the function will pass a matched string,
second argument will pass an attribute of repetation expression ("synthesized attribtue"),
and third argument will pass an inherited attribute.  

For example, consider action of the expression.
```js
var match = r.triesOneOrMore("ab", "abab", (match, synthesized, inherited) => inherited + 2);
match("ababababab", 0, 0);
```

This expression is matched "ababab" in repetation and "abab" in next match.  
Attribute of the result will be 6.

#### Repetation with Backtracking Non-greedy
Repetation expression matches repetation of specified expression with backtracking.
The family of repetation expression with backtracking are shown as follows.  
```
r.triesTimesNonGreedy(minimum count, maximum count, expression, next match, [action]);
r.triesAtLeastNonGreedy(minimum count, expression, next match, [action]);
r.triesAtMostNonGreedy(maximum count, expression, next match, [action]);
r.triesOneOrMoreNonGreedy(expression, next match, [action]);
r.triesZeroOrMoreNonGreedy(expression, next match, [action]);
r.triesMaybeNonGreedy(expression);
```

r.triesAtLeastNonGreedy(min, expression, next, action) is equivalent to r.triesTimesNonGreedy(min, false, expression, next, action).  
r.triesAtMostNonGreedy(max, expression, next, action) is equivalent to r.triesTimesNonGreedy(0, max, expression, next, action).  
r.triesOneOrMoreNonGreedy(expression, next, action) is equivalent to r.triesTimesNonGreedy(1, false, expression, next, action).  
r.triesZeroOrMoreNonGreedy(expression, next, action) is equivalent to r.triesTimesNonGreedy(0, false, expression, next, action).  
r.triesMaybeNonGreedy(expression, next) is equivalent to r.triesTimesNonGreedy(0, 1, expression, next).  

These expression tries if next match expression is matched. If next match is not matched, it will try next repetation.  
So these expression backtracks non-greedy.  

The argument action must specify a function with 3 arguments and return result attribute.  
First argument of the function will pass a matched string,
second argument will pass an attribute of repetation expression ("synthesized attribtue"),
and third argument will pass an inherited attribute.  

For example, consider action of the expression.
```js
var match = r.triesOneOrMoreNonGreedy(/./, ",");
match("aaaa,aaaa,aaa");
```

This expression is matched "aaaa" in repetation and "," in next match so backtracking is non-greedy.  

#### Lookahead (AND predicate)
Lookahead (AND predicate) matches the specify expression but does not consume input string.
Below example matches "ab" but matched string is "a", and does not match "ad".
```
r.then("a", r.lookahead("b"));
```

#### Nogative Lookahead (NOT predicate)
Negative lookahead (NOT predicate) matches if the specify expression does not match.
Below example matches "ab" but matched string is "a", and does not match "ad".
```
r.then("a", r.lookaheadNot("d"));
```

#### Condition
Condition expression matches if the predicate function returns true.  
Below example matches if the attribute is "765", but does not match if the attribute is "961".
```
r.attr(attr => attr === "765");
```

#### Action
Action expression matches the specified expression.  
```
r.action(expression, action);
```

The second argument must be a function with 3 arguments and return result attribute.  
First argument of the function will pass a matched string,
second argument will pass an attribute of repetation expression ("synthesized attribtue"),
and third argument will pass an inherited attribute.  

Below example, argument of action will be passed ("2", "2", "").
```js
r.action(/[0-9]/, (match, synthesized, inherited) => match)("2", 0, "")
```

### Matching Expression
To apply string to match to an expression, call the expression with 3 arguments shown as follows.
1. a string to match
2. an index to begin to match
3. an initial attribute

```js
var match = r.oneOrMore(/[0-9]/, (match, synthesized, inherited) => inherited + ":" + synthesized);
match("27", 0, "");
```

### Description of Recursion
The r.letrec function is available to recurse an expression.  
The argument of r.letrec function are functions, and return value is the return value of first function.

Below example matches balanced parenthesis.
```js
var paren = r.letrec(
  function(paren) {
    return r.then("(", r.maybe(paren), ")"));
  }
};
```

## Examples

### Parsing simple arithmetic expressions
```js
var r = Rena2();
var expr = r.letrec(function(t, f, e) {
    return r.then(f, r.zeroOrMore(r.or(
        r.action(r.then("+", f), function(x, a, b) { return b + a; }),
        r.action(r.then("-", f), function(x, a, b) { return b - a; }))))
}, function(t, f, e) {
    return r.then(e, r.zeroOrMore(r.or(
        r.action(r.then("*", e), function(x, a, b) { return b * a; }),
        r.action(r.then("/", e), function(x, a, b) { return b / a; }))))
}, function(t, f, e) {
    return r.or(r.real(), r.then("(", t, ")"))
});

// outputs 7
console.log(expr("1+2*3", 0, 0).attr);

// outputs 1
console.log(expr("4-6/2", 0, 0).attr);
```

### Parsing CSV texts
```js
var r = Rena2();
var csvparser = r.then(r.attr([]),
  r.maybe(r.delimit(
    r.action(r.then(
      r.attr([]),
      r.delimit(r.or(
        r.then(
          '"',
          r.action(/(""|[^"])+/, function(match, synthesize, inherit) {
            return inherit.concat([match.replace('""', '"')]);
          }),
          '"'),
        r.action(/[^",\n\r]+/, function(match, synthesize, inherit) {
          return inherit.concat([match]);
        })
      ), ",")), function(match, synthesize, inherit) {
        return inherit.concat([synthesize]);
      }), r.br())),
  r.maybe(r.br()),
  r.end());

// outputs [["a","b","c"],["d","e\n\"f","g"],["h"]]
console.log(csvparser('a,b,c\nd,"e\n""f",g\nh\n', 0, false).attr)
```

