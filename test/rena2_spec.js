/**
 * Rena2 JS
 *
 * Copyright (c) 2019 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
/*
 * This test case is described for Jasmine.
 */
describe("Rena2", function () {
    function match(pattern, string, match, lastIndex) {
        var result = pattern(string, 0, false);
        expect(result.match).toBe(match);
        expect(result.lastIndex).toBe(lastIndex);
    }

    function matchAttr(pattern, string, match, lastIndex, attr) {
        var result = pattern(string, 0, false);
        expect(result.match).toBe(match);
        expect(result.lastIndex).toBe(lastIndex);
        expect(result.attr).toBe(attr);
    }

    function nomatch(pattern, string) {
        expect(pattern(string, 0, false)).toBeNull();
    }

    function throwError(patternThunk) {
        try {
            patternThunk();
            fail();
        } catch(e) {
            // ok
        }
    }

    function fntest(str, index, attr) {
        if(str.charAt(index) === "a") {
            return {
                match: "a",
                lastIndex: index + 1,
                attr: attr
            };
        } else {
            return null;
        }
    }

    beforeEach(function () {
    });

    describe("testing match", function () {
        it("simple string match", function () {
            var r = R();
            match(r.then("string"), "string", "string", 6);
            match(r.then("string"), "strings", "string", 6);
            nomatch(r.then("string"), "strin");
            match(r.then(""), "string", "", 0);
        });

        it("simple regex match", function () {
            var r = R();
            match(R().then(/[0-9]+/), "765", "765", 3);
            match(R().then(/[0-9]+/), "765AS", "765", 3);
            nomatch(R().then(/[0-9]+/), "strin");
        });

        it("simple function match", function () {
            var r = R();
            match(r.then(fntest), "a", "a", 1);
            nomatch(r.then(fntest), "s");
        });

        it("chaining then", function () {
            var r = R();
            var ptn = r.then("string", "match");
            match(ptn, "stringmatch", "stringmatch", 11);
            match(ptn, "stringmatches", "stringmatch", 11);
            nomatch(ptn, "stringmatc");
            nomatch(ptn, "strinmatch");
        });

        it("thenAction", function () {
            var r = R();
            matchAttr(r.then(r.attr(1), r.thenAction(r.real(), "+", r.real(), function(a, _2, b, inh) {
                return a + b - inh;
            })), "765+346", "765+346", 7, 1110);
            nomatch(r.thenAction(r.real(), "+", r.real(), function() {}), "765-961");
            throwError(function() { r.thenAction(); });
        });

        it("br", function () {
            var r = R();
            match(r.br(), "\n", "\n", 1);
            match(r.br(), "\r", "\r", 1);
            match(r.br(), "\r\n", "\r\n", 2);
            nomatch(r.br(), "a");
        });

        it("end", function () {
            match(R().then("765", R().end()), "765", "765", 3);
            nomatch(R().then("765", R().end()), "765961");
            match(R().end(), "", "", 0);
        });

        it("equalsId", function () {
            var q1 = R({ ignore: /\s+/ }),
                q2 = R({ keys: ["+", "++", "-"] }),
                q3 = R({ ignore: /\s+/, keys: ["+", "++", "-"] });
            match(R().equalsId("if"), "if", "if", 2);
            match(R().equalsId("if"), "if ", "if", 2);
            match(R().equalsId("if"), "iff", "if", 2);
            match(q1.equalsId("if"), "if", "if", 2);
            match(q1.equalsId("if"), "if ", "if ", 3);
            nomatch(q1.equalsId("if"), "iff");
            nomatch(q1.equalsId("if"), "if+");
            match(q2.equalsId("if"), "if", "if", 2);
            match(q2.equalsId("if"), "if+", "if", 2);
            match(q2.equalsId("if"), "if++", "if", 2);
            match(q2.equalsId("if"), "if-", "if", 2);
            nomatch(q2.equalsId("if"), "if ");
            nomatch(q2.equalsId("if"), "iff");
            match(q3.equalsId("if"), "if", "if", 2);
            match(q3.equalsId("if"), "if ", "if ", 3);
            match(q3.equalsId("if"), "if+", "if", 2);
            match(q3.equalsId("if"), "if++", "if", 2);
            match(q3.equalsId("if"), "if-", "if", 2);
            nomatch(q3.equalsId("if"), "iff");
        });

        it("real", function () {
            var r = R();
            function assertReal(str) {
                var matcher = r.real();
                return matcher(str, 0, false);
            }
            expect(assertReal("765").attr).toBe(765);
            expect(assertReal("76.5").attr).toBe(76.5);
            expect(assertReal("0.765").attr).toBe(0.765);
            expect(assertReal(".765").attr).toBe(0.765);
            expect(assertReal("765e2").attr).toBe(76500);
            expect(assertReal("765E2").attr).toBe(76500);
            expect(assertReal("765e+2").attr).toBe(76500);
            expect(assertReal("765e-2").attr).toBe(7.65);
            expect(assertReal("765e+346").attr).toBe(Infinity);
            expect(assertReal("765e-346").attr).toBe(0);
            expect(assertReal("a961")).toBeNull();
            expect(assertReal("+765").attr).toBe(765);
            expect(assertReal("+76.5").attr).toBe(76.5);
            expect(assertReal("+0.765").attr).toBe(0.765);
            expect(assertReal("+.765").attr).toBe(0.765);
            expect(assertReal("+765e2").attr).toBe(76500);
            expect(assertReal("+765E2").attr).toBe(76500);
            expect(assertReal("+765e+2").attr).toBe(76500);
            expect(assertReal("+765e-2").attr).toBe(7.65);
            expect(assertReal("+765e+346").attr).toBe(Infinity);
            expect(assertReal("+765e-346").attr).toBe(0);
            expect(assertReal("+a961")).toBeNull();
            expect(assertReal("-765").attr).toBe(-765);
            expect(assertReal("-76.5").attr).toBe(-76.5);
            expect(assertReal("-0.765").attr).toBe(-0.765);
            expect(assertReal("-.765").attr).toBe(-0.765);
            expect(assertReal("-765e2").attr).toBe(-76500);
            expect(assertReal("-765E2").attr).toBe(-76500);
            expect(assertReal("-765e+2").attr).toBe(-76500);
            expect(assertReal("-765e-2").attr).toBe(-7.65);
            expect(assertReal("-765e+346").attr).toBe(-Infinity);
            expect(assertReal("-765e-346").attr).toBe(0);
            expect(assertReal("-a961")).toBeNull();
        });

        it("or", function () {
            var ptn = R().or("string", /[0-9]+/, fntest);
            match(ptn, "string", "string", 6);
            match(ptn, "765", "765", 3);
            match(ptn, "a", "a", 1);
            nomatch(ptn, "-");
        });

        it("matching times", function () {
            match(R().times(2, 4, "str"), "strstr", "strstr", 6);
            match(R().times(2, 4, "str"), "strstrstr", "strstrstr", 9);
            match(R().times(2, 4, "str"), "strstrstrstr", "strstrstrstr", 12);
            match(R().times(2, 4, "str"), "strstrstrstrstr", "strstrstrstr", 12);
            nomatch(R().times(2, 4, "str"), "str");
            match(R().times(2, 2, "str"), "strstr", "strstr", 6);
            match(R().times(2, 2, "str"), "strstrstr", "strstr", 6);
            nomatch(R().times(2, 2, "str"), "str");
            match(R().times(0, 1, "str"), "str", "str", 3);
            match(R().times(0, 1, "str"), "", "", 0);
            match(R().times(0, 1, "str"), "strstr", "str", 3);
            match(R().times(2, false, "str"), "strstr", "strstr", 6);
            match(R().times(2, false, "str"), "strstrstrstrstr", "strstrstrstrstr", 15);
            nomatch(R().times(2, false, "str"), "str");
            match(R().times(0, 0, "str"), "strstr", "", 0);
            expect(function() { R().times(-1, 1, "str").parse("a"); }).toThrow();
            expect(function() { R().times(1, 0, "str").parse("a"); }).toThrow();
        });

        it("atLeast", function () {
            match(R().atLeast(2, "str"), "strstr", "strstr", 6);
            match(R().atLeast(2, "str"), "strstrstrstrstr", "strstrstrstrstr", 15);
            nomatch(R().atLeast(2, "str"), "str");
        });

        it("atMost", function () {
            match(R().atMost(4, "str"), "", "", 0);
            match(R().atMost(4, "str"), "str", "str", 3);
            match(R().atMost(4, "str"), "strstr", "strstr", 6);
            match(R().atMost(4, "str"), "strstrstr", "strstrstr", 9);
            match(R().atMost(4, "str"), "strstrstrstr", "strstrstrstr", 12);
            match(R().atMost(4, "str"), "strstrstrstrstr", "strstrstrstr", 12);
        });

        it("maybe", function () {
            match(R().maybe("string"), "string", "string", 6);
            match(R().maybe("string"), "strings", "string", 6);
            match(R().maybe("string"), "strin", "", 0);
            match(R().maybe("string"), "stringstring", "string", 6);
        });

        it("oneOrMore", function () {
            match(R().oneOrMore("str"), "str", "str", 3);
            match(R().oneOrMore("str"), "strstrstrstrstr", "strstrstrstrstr", 15);
            nomatch(R().oneOrMore("str"), "");
        });

        it("zeroOrMore", function () {
            match(R().zeroOrMore("str"), "", "", 0);
            match(R().zeroOrMore("str"), "str", "str", 3);
            match(R().zeroOrMore("str"), "strstrstrstrstr", "strstrstrstrstr", 15);
        });

        it("delimit", function () {
            match(R().delimit(/[0-9]+/, "+"), "7", "7", 1);
            match(R().delimit(/[0-9]+/, "+"), "7+65", "7+65", 4);
            match(R().delimit(/[0-9]+/, "+"), "7+", "7", 1);
            nomatch(R().delimit(/[0-9]+/, "+"), "");
            nomatch(R().delimit(/[0-9]+/, "+"), "a+7");
            nomatch(R().delimit(/[0-9]+/, "+"), "+961");
        });

        it("triesTimes", function () {
            match(R().triesTimes(2, 5, "ab", "abab"), "abababab", "abababab", 8);
            match(R().triesTimes(2, 5, "ab", "abab"), "ababababababab", "ababababababab", 14);
            match(R().triesTimes(2, 5, "ab", "abab"), "abababababababab", "ababababababab", 14);
            nomatch(R().triesTimes(2, 5, "ab", "abab"), "ababab");
            nomatch(R().triesTimes(2, 5, "ab", "abab"), "abababc");
            match(R().triesTimes(2, 2, "ab", "abab"), "abababab", "abababab", 8);
            match(R().triesTimes(2, 2, "ab", "abab"), "ababababab", "abababab", 8);
            nomatch(R().triesTimes(2, 2, "ab", "abab"), "ababab");
            match(R().triesTimes(0, 2, "ab", "abab"), "abababab", "abababab", 8);
            match(R().triesTimes(0, 2, "ab", "abab"), "abab", "abab", 4);
            match(R().triesTimes(0, 2, "ab", "abab"), "ababababab", "abababab", 8);
            match(R().triesTimes(2, false, "ab", "abab"), "abababab", "abababab", 8);
            match(R().triesTimes(2, false, "ab", "abab"), "abababababababab", "abababababababab", 16);
            nomatch(R().triesTimes(2, false, "ab", "abab"), "ababab");
            nomatch(R().triesTimes(2, false, "ab", "abab"), "abababc");
            expect(R().triesTimes(0, false, "ab", "abab", function(match, syn, inh) { return inh + 2; })("abababab", 0, 0).attr).toBe(4);
        });

        it("triesAtLeast", function () {
            match(R().triesAtLeast(2, "ab", "abab"), "abababab", "abababab", 8);
            match(R().triesAtLeast(2, "ab", "abab"), "abababababababab", "abababababababab", 16);
            nomatch(R().triesAtLeast(2, "ab", "abab"), "ababab");
            nomatch(R().triesAtLeast(2, "ab", "abab"), "abababc");
        });

        it("triesAtMost", function () {
            match(R().triesAtMost(2, "ab", "abab"), "abababab", "abababab", 8);
            match(R().triesAtMost(2, "ab", "abab"), "abab", "abab", 4);
            match(R().triesAtMost(2, "ab", "abab"), "ababababab", "abababab", 8);
        });

        it("triesZeroOrMore", function () {
            match(R().triesZeroOrMore("ab", "abab"), "abab", "abab", 4);
            match(R().triesZeroOrMore("ab", "abab"), "abababababababab", "abababababababab", 16);
            nomatch(R().triesZeroOrMore("ab", "abab"), "ab");
            nomatch(R().triesZeroOrMore("ab", "abab"), "abc");
        });

        it("triesOneOrMore", function () {
            match(R().triesOneOrMore("ab", "abab"), "ababab", "ababab", 6);
            match(R().triesOneOrMore("ab", "abab"), "abababababababab", "abababababababab", 16);
            nomatch(R().triesOneOrMore("ab", "abab"), "abab");
            nomatch(R().triesOneOrMore("ab", "abab"), "ababc");
        });

        it("triesMaybe", function () {
            match(R().triesMaybe("string", "!"), "string!", "string!", 7);
            match(R().triesMaybe("string", "!"), "!", "!", 1);
            nomatch(R().triesMaybe("string", "!"), "strin");
        });

        it("triesTimesNonGreedy", function () {
            match(R().triesTimesNonGreedy(2, 8, /./, ","), "a,a,a,aa", "a,a,", 4);
            nomatch(R().triesTimesNonGreedy(2, 8, /./, ","), "a,");
            match(R().triesTimesNonGreedy(2, 8, /./, ","), "aaaaaaaa,", "aaaaaaaa,", 9);
            nomatch(R().triesTimesNonGreedy(2, 8, /./, ","), "aaaaaaaaa,");
            nomatch(R().triesTimesNonGreedy(2, 8, /./, ","), "aaaaaaa");
            match(R().triesTimesNonGreedy(2, false, /./, ","), "a,aaa,aaa", "a,aaa,", 6);
            nomatch(R().triesTimesNonGreedy(2, false, /./, ","), "a,");
            nomatch(R().triesTimesNonGreedy(2, false, /./, ","), "aaaaaa");
            match(R().triesTimesNonGreedy(0, 8, /./, ","), "aa,aa,aa", "aa,", 3);
            match(R().triesTimesNonGreedy(0, 8, /./, ","), "aaaaaaaa,", "aaaaaaaa,", 9);
            nomatch(R().triesTimesNonGreedy(0, 8, /./, ","), "aaaaaaaaa,");
            nomatch(R().triesTimesNonGreedy(0, 8, /./, ","), "aaaaaaa");
            expect(R().triesTimesNonGreedy(2, false, /./, ",", function(match, syn, inh) { return inh + 1; })("aaa,a,a", 0, 0).attr).toBe(3);
        });

        it("triesAtLeastNonGreedy", function () {
            match(R().triesAtLeastNonGreedy(2, /./, ","), "a,aaa,aaa", "a,aaa,", 6);
            nomatch(R().triesAtLeastNonGreedy(2, /./, ","), "a,");
            nomatch(R().triesAtLeastNonGreedy(2, /./, ","), "aaaaaa");
        });

        it("triesAtMostNonGreedy", function () {
            match(R().triesAtMostNonGreedy(8, /./, ","), "aa,aa,aa", "aa,", 3);
            match(R().triesAtMostNonGreedy(8, /./, ","), "aaaaaaaa,", "aaaaaaaa,", 9);
            nomatch(R().triesAtMostNonGreedy(8, /./, ","), "aaaaaaaaa,");
            nomatch(R().triesAtMostNonGreedy(8, /./, ","), "aaaaaaa");
        });

        it("triesZeroOrMoreNonGreedy", function () {
            match(R().triesZeroOrMoreNonGreedy(/./, ","), "a,aaa,aaa", "a,", 2);
            nomatch(R().triesZeroOrMoreNonGreedy(/./, ","), "aaaaaa");
        });

        it("triesOneOrMoreNonGreedy", function () {
            match(R().triesOneOrMoreNonGreedy(/./, ","), ",a,aaa,aaa", ",a,", 3);
            nomatch(R().triesOneOrMoreNonGreedy(/./, ","), ",aaaaaa");
        });

        it("triesMaybeNonGreedy", function () {
            match(R().triesMaybeNonGreedy("string", "!"), "string!", "string!", 7);
            match(R().triesMaybeNonGreedy("string", "!"), "!", "!", 1);
            nomatch(R().triesMaybeNonGreedy("string", "!"), "strin");
        });

        it("lookahead", function () {
            match(R().then(R().lookahead(/[0-9]+pro/), /[0-9]+/), "765pro", "765", 3);
            match(R().then(/[0-9]+/, R().lookahead("pro")), "765pro", "765", 3);
            nomatch(R().then(R().lookahead(/[0-9]+pro/), /[0-9]+/), "765studio");
            nomatch(R().then(/[0-9]+/, R().lookahead("pro")), "765studio");
            nomatch(R().then(/[0-9]+/, R().lookahead("pro")), "765");
            match(R().then(R().lookahead(/[0-9]+pro/), /[0-9]+/), "765pro", "765", 3);
            match(R().then(/[0-9]+/, R().lookahead("pro")), "765pro", "765", 3);
            nomatch(R().then(/[0-9]+/, R().lookahead("pro")), "765studio");
        });

        it("lookaheadNot", function () {
            match(R().then(R().lookaheadNot(/[0-9]+pro/), /[0-9]+/), "765studio", "765", 3);
            match(R().then(/[0-9]+/, R().lookaheadNot("pro")), "765studio", "765", 3);
            match(R().then(/[0-9]+/, R().lookaheadNot("pro")), "765", "765", 3);
            nomatch(R().then(R().lookaheadNot(/[0-9]+pro/), /[0-9]+/), "765pro");
            nomatch(R().then(/[0-9]+/, R().lookaheadNot("pro")), "765pro");
            match(R().then(R().lookaheadNot(/[0-9]+pro/), /[0-9]+/), "765studio", "765", 3);
        });

        it("key", function () {
            var q = R({ keys: ["*", "+", "++"] });
            match(q.key("+"), "+", "+", 1);
            match(q.key("++"), "++", "++", 2);
            match(q.key("*"), "*", "*", 1);
        });

        it("notKey", function () {
            var q = R({ keys: ["*", "+", "++"] });
            match(q.notKey(), "/", "", 0);
            nomatch(q.notKey(), "+");
            nomatch(q.notKey(), "++");
            nomatch(q.notKey(), "*");
        });

        it("skip space", function () {
            var r = R({ ignore: /\s+/ });
            match(r.then("765", "pro"), "765pro", "765pro", 6);
            match(r.then("765", "pro"), "765  pro", "765  pro", 8);
            nomatch(r.then("765", "pro"), "76 5pro");
        });

        it("letrec", function () {
            var r = R(),
                ptn1;
            function assertParse(str) {
                return ptn1(str, 0, 0);
            }

            ptn1 = r.letrec(function(t, f, e) {
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
            expect(assertParse("1+2*3").attr).toBe(7);
            expect(assertParse("(1+2)*3").attr).toBe(9);
            expect(assertParse("4-6/2").attr).toBe(1);
            expect(assertParse("1+2+3*3").attr).toBe(12);
        });

        it("CSV", function () {
            var r = R(), csvparser;
            function parse(str) {
                return csvparser(str, 0, false).attr;
            }
            csvparser = r.then(r.attr([]), r.maybe(r.delimit(r.action(r.then(r.attr([]), r.delimit(r.or(
                r.then('"', r.action(/(""|[^"])+/, function(m, s, i) { return i.concat([m.replace('""', '"')]); }), '"'),
                r.action(/[^",\n\r]+/, function(m, s, i) { return i.concat([m]); })
            ), ",")), function(m, s, i) { console.log(s);return i.concat([s]); }), r.br())), r.maybe(r.br()), r.end());
            expect(parse('a,b,c\nd,"e\n""f",g\nh\n')).toEqual([["a","b","c"],["d","e\n\"f","g"],["h"]]);
            expect(parse('a,b,c\nd,"e\n""f",g\nh')).toEqual([["a","b","c"],["d","e\n\"f","g"],["h"]]);
            expect(parse('d,"e\n""f",g')).toEqual([["d","e\n\"f","g"]]);
            expect(parse('d')).toEqual([["d"]]);
            expect(parse('')).toEqual([]);
        });
    });
});
