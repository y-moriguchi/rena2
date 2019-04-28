# Rena2
Rena2 is a library of parsing texts. Rena2 makes parsing text easily.  
Rena2 can treat recursion of pattern, hence Rena2 can parse languages which described top down parsing
like arithmetic expressions and so on.  
Rena2 can parse class of Parsing Expression Grammar (PEG) language.  
Rena2 can also treat synthesized and inherited attributes.  
'Rena' is an acronym of REpetation (or REcursion) Notation API.  

## How to use

### Browser
```html
<script src="rena2.js"></script>
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

