/**
 * Rena2 JS
 *
 * Copyright (c) 2019 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
/*
 * This test case describe by Jasmine.
 */
describe("Rena2", function () {
    function match(pattern, string, match, lastIndex) {
        var result = pattern(string, 0, false);
        expect(result.match).toBe(match);
        expect(result.lastIndex).toBe(lastIndex);
    }

    function nomatch(pattern, string) {
        expect(pattern(string, 0, false)).toBeNull();
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
            match(q1.equalsId("if"), "if ", "if", 2);
            nomatch(q1.equalsId("if"), "iff");
            nomatch(q1.equalsId("if"), "if+");
            match(q2.equalsId("if"), "if", "if", 2);
            match(q2.equalsId("if"), "if+", "if", 2);
            match(q2.equalsId("if"), "if++", "if", 2);
            match(q2.equalsId("if"), "if-", "if", 2);
            nomatch(q2.equalsId("if"), "if ");
            nomatch(q2.equalsId("if"), "iff");
            match(q3.equalsId("if"), "if", "if", 2);
            match(q3.equalsId("if"), "if ", "if", 2);
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
