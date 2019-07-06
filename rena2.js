/*
 * Rena2 JS
 *
 * Copyright (c) 2019 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
(function(root) {
    function Trie(keywords) {
        var i,
            j,
            trie,
            ch;
        this._trie = {};
        for(i = 0; i < keywords.length; i++) {
            trie = this._trie;
            for(j = 0; j < keywords[i].length; j++) {
                ch = keywords[i].charAt(j);
                if(!trie[ch]) {
                    trie[ch] = {};
                }
                trie = trie[ch];
            }
        }
    }
    Trie.prototype = {
        /*
         * searches a keyword.
         * @param {String} str a string to be searched
         * @param {Number} index an index to be searched
         * @return {Object} matched string and last index
         */
        search: function(str, index) {
            var trie = this._trie,
                i,
                ch,
                res = "";
            for(i = index; i < str.length; i++) {
                ch = str.charAt(i);
                if(trie[ch]) {
                    trie = trie[ch];
                    res += ch;
                } else {
                    break;
                }
            }
            return {
                match: res,
                lastIndex: i
            };
        }
    };

    function empty(match, lastindex, attr) {
        return {
            match: "",
            lastIndex: lastindex,
            attr: attr
        };
    }

    function rena(option) {
        var me,
            opt = option ? option : {},
            ignorePattern = opt.ignore ? wrap(opt.ignore) : null,
            trie = opt.keys ? new Trie(opt.keys) : null,
            patternFloat = /[\+\-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][\+\-]?[0-9]+)?/;

        function createStringMatcher(obj) {
            return function(match, lastindex, attr) {
                if(match.substring(lastindex, lastindex + obj.length) === obj) {
                    return {
                        match: obj,
                        lastIndex: lastindex + obj.length,
                        attr: attr
                    };
                } else {
                    return null;
                }
            };
        }

        function ignore(match, index, result) {
            var resultNew;

            if(ignorePattern) {
                resultNew = ignorePattern(match, result.lastIndex, null);
                if(resultNew) {
                    return {
                        match: match.substring(index, resultNew.lastIndex),
                        lastIndex: resultNew.lastIndex,
                        attr: result.attr
                    };
                } else {
                    return result;
                }
            } else {
                return result;
            }
        }

        function lookahead(pattern, logic) {
            var wrapped = wrap(pattern);

            return function(match, lastindex, attr) {
                var result = wrapped(match, lastindex, attr);

                if((result && logic) || (!result && !logic)) {
                    return {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                } else {
                    return null;
                }
            };
        }

        function wrap(obj) {
            var regex,
                reSource,
                reFlags = "g";

            if(typeof obj === "string") {
                return createStringMatcher(obj);
            } else if(obj instanceof RegExp) {
                reSource = obj.source;
                reFlags += obj.ignoreCase ? "i" : "";
                reFlags += obj.multiline ? "m" : "";
                regex = new RegExp(reSource, reFlags);
                return function(match, lastindex, attr) {
                    var match;
                    regex.lastIndex = 0;
                    if(!!(match = regex.exec(match.substring(lastindex))) && match.index === 0) {
                        return {
                            match: match[0],
                            lastIndex: lastindex + regex.lastIndex,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            } else if(typeof obj === "function") {
                return obj;
            } else {
                throw new Error("Unsupported Type");
            }
        }

        function anchor(position) {
            return function(match, lastindex, attr) {
                if(lastindex === position(match)) {
                    return {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                } else {
                    return null;
                }
            }
        }

        me = {
            then: function() {
                var args = Array.prototype.slice.call(arguments);

                return function(match, lastindex, attr) {
                    var wrapped,
                        matched,
                        i;

                    matched = {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                    for(i = 0; i < args.length; i++) {
                        wrapped = wrap(args[i]);
                        if(!(matched = wrapped(match, matched.lastIndex, matched.attr))) {
                            return null;
                        }
                        matched = ignore(match, lastindex, matched);
                    }
                    return {
                        match: match.substring(lastindex, matched.lastIndex),
                        lastIndex: matched.lastIndex,
                        attr: matched.attr
                    };
                }
            },

            thenAction: function() {
                var args, action;

                if(arguments.length < 1) {
                    throw new Error("argument must be at least 1");
                }
                args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
                action = arguments[arguments.length - 1];

                return function(match, lastindex, attr) {
                    var wrapped,
                        matched,
                        attrs = [],
                        i;

                    matched = {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                    for(i = 0; i < args.length; i++) {
                        wrapped = wrap(args[i]);
                        if(!(matched = wrapped(match, matched.lastIndex, matched.attr))) {
                            return null;
                        }
                        attrs[i] = matched.attr;
                        matched = ignore(match, lastindex, matched);
                    }
                    attrs[i] = attr;
                    return {
                        match: match.substring(lastindex, matched.lastIndex),
                        lastIndex: matched.lastIndex,
                        attr: action.apply(null, attrs)
                    };
                }
            },

            or: function() {
                var args = Array.prototype.slice.call(arguments);

                return function(match, lastindex, attr) {
                    var wrapped,
                        matched,
                        i;

                    for(i = 0; i < args.length; i++) {
                        wrapped = wrap(args[i]);
                        if(!!(matched = wrapped(match, lastindex, attr))) {
                            return matched;
                        }
                    }
                    return null;
                }
            },

            times: function(mincount, maxcount, pattern, actionFunction) {
                var wrapped = wrap(pattern),
                    action = actionFunction ? actionFunction : function(match, syn, inh) { return syn; };

                if(mincount < 0 || (maxcount && maxcount < mincount)) {
                    throw new Error("Illegal position");
                }
                return function(match, lastindex, attr) {
                    var matched,
                        matchedNew,
                        matchedString,
                        i;

                    matched = {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                    for(i = 0; maxcount === false || i < maxcount; i++) {
                        if(!!(matchedNew = wrapped(match, matched.lastIndex, matched.attr))) {
                            matchedString = match.substring(lastindex, matchedNew.lastIndex);
                            matched = {
                                match: matchedString,
                                lastIndex: matchedNew.lastIndex,
                                attr: action(matchedString, matchedNew.attr, matched.attr)
                            };
                            matched = ignore(match, lastindex, matched);
                        } else if(i < mincount) {
                            return null;
                        } else {
                            return matched;
                        }
                    }
                    return matched;
                }
            },

            atLeast: function(mincount, pattern, actionFunction) {
                return me.times(mincount, false, pattern, actionFunction);
            },

            atMost: function(maxcount, pattern, actionFunction) {
                return me.times(0, maxcount, pattern, actionFunction);
            },

            zeroOrMore: function(pattern, actionFunction) {
                return me.times(0, false, pattern, actionFunction);
            },

            oneOrMore: function(pattern, actionFunction) {
                return me.times(1, false, pattern, actionFunction);
            },

            maybe: function(pattern) {
                return me.times(0, 1, pattern);
            },

            delimit: function(pattern, delimiter, actionFunction) {
                var wrapped = wrap(pattern),
                    wrappedDelimiter = wrap(delimiter),
                    action = actionFunction ? actionFunction : function(match, syn, inh) { return syn; };
                function matchDelimiter(match, matched) {
                    var result;
                    result = wrappedDelimiter(match, matched.lastIndex, matched.attr);
                    return result ? result.lastIndex : false;
                }

                return function(match, lastindex, attr) {
                    var matched,
                        matchedNew,
                        matchedString,
                        indexNew = lastindex,
                        indexBeforeDelimiter,
                        already = false;

                    matched = {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                    do {
                        indexBeforeDelimiter = matched.lastIndex;
                        matched.lastIndex = indexNew;
                        matched = ignore(match, lastindex, matched);
                        indexNew = matched.lastIndex;
                        if(!(matchedNew = wrapped(match, indexNew, matched.attr))) {
                            if(already) {
                                return {
                                    match: matched.match,
                                    lastIndex: indexBeforeDelimiter,
                                    attr: matched.attr
                                };
                            } else {
                                return null;
                            }
                        }
                        matchedString = match.substring(lastindex, matchedNew.lastIndex);
                        matched = {
                            match: matchedString,
                            lastIndex: matchedNew.lastIndex,
                            attr: action(matchedString, matchedNew.attr, matched.attr)
                        };
                        matched = ignore(match, lastindex, matched);
                        already = true;
                    } while(!!(indexNew = matchDelimiter(match, matched)));
                    return matched;
                };
            },

            lookahead: function(pattern) {
                return lookahead(pattern, true);
            },

            lookaheadNot: function(pattern) {
                return lookahead(pattern, false);
            },
            
            attr: function(attr) {
                return function(match, lastindex, oldattr) {
                    return {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                }
            },

            cond: function(cond) {
                return function(match, lastindex, attr) {
                    if(cond(attr)) {
                        return {
                            match: "",
                            lastIndex: lastindex,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            },

            action: function(pattern, action) {
                var wrapped = wrap(pattern);

                return function(match, lastindex, attr) {
                    var matched = wrapped(match, lastindex, attr);
                    if(matched !== null) {
                        return {
                            match: matched.match,
                            lastIndex: matched.lastIndex,
                            attr: action(matched.match, matched.attr, attr)
                        };
                    } else {
                        return null;
                    }
                };
            },

            key: function(key) {
                return function(match, lastindex, attr) {
                    var matchedKey;

                    if(trie == null) {
                        return null;
                    } else {
                        matchedKey = trie.search(match, lastindex);
                        if(matchedKey !== null && matchedKey.match === key) {
                            return {
                                match: key,
                                lastIndex: matchedKey.lastIndex,
                                attr: attr
                            };
                        } else {
                            return null;
                        }
                    }
                }
            },

            notKey: function() {
                return function(match, lastindex, attr) {
                    var matchedKey;

                    if(trie == null) {
                        return null;
                    } else {
                        matchedKey = trie.search(match, lastindex);
                        if(matchedKey.match !== "") {
                            return null;
                        } else {
                            return {
                                match: "",
                                lastIndex: lastindex,
                                attr: attr
                            };
                        }
                    }
                }
            },

            equalsId: function(id) {
                var stringMatcher = createStringMatcher(id);

                return function(match, lastindex, attr) {
                    var matchedString = stringMatcher(match, lastindex, attr);

                    if(matchedString === null) {
                        return null;
                    } else if(matchedString.lastIndex >= match.length) {
                        // matched
                    } else if(ignorePattern === null && trie === null) {
                        // matched
                    } else if(ignorePattern !== null && ignorePattern(match, matchedString.lastIndex, attr) !== null) {
                        // matched
                    } else if(trie !== null && trie.search(match, matchedString.lastIndex).match !== "") {
                        // matched
                    } else {
                        return null;
                    }
                    return ignore(match, lastindex, matchedString);
                };
            },

            real: function() {
                return me.action(patternFloat, function(match, syn, inh) {
                    return parseFloat(match);
                });
            },

            br: function() {
                return wrap(/\r\n|\r|\n/);
            },

            end: function() {
                return anchor(function(match) { return match.length; });
            },

            triesTimes: function(mincount, maxcount, pattern, succ, actionFunction) {
                var wrapped = wrap(pattern),
                    wrappedSucc = succ ? wrap(succ) : empty,
                    action = actionFunction ? actionFunction : function(match, syn, inh) { return syn; };

                if(mincount < 0 || (maxcount && maxcount < mincount)) {
                    throw new Error("Illegal position");
                }
                return function(match, lastindex, attr) {
                    var matched,
                        matchedNew,
                        matchedString,
                        matchedStack = [],
                        i;

                    function nextMatched(matchedNew, attrBefore, action) {
                        var matchedString,
                            matched;

                        matchedString = match.substring(lastindex, matchedNew.lastIndex);
                        matched = {
                            match: matchedString,
                            lastIndex: matchedNew.lastIndex,
                            attr: action(matchedString, matchedNew.attr, attrBefore)
                        };
                        return ignore(match, lastindex, matched);
                    }
                    function succMatched() {
                        var backtrack,
                            matchedBacktrack;

                        while(matchedStack.length > 0) {
                            backtrack = matchedStack.pop();
                            if(!!(matchedBacktrack = wrappedSucc(match, backtrack.lastIndex, backtrack.attr))) {
                                return nextMatched(matchedBacktrack, false, function(match, syn, inh) { return syn; });
                            }
                        }
                        return null;
                    }

                    matched = {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                    for(i = 0; maxcount === false || i < maxcount; i++) {
                        if(i >= mincount) {
                            matchedStack.push(matched);
                        }
                        if(!!(matchedNew = wrapped(match, matched.lastIndex, matched.attr))) {
                            matched = nextMatched(matchedNew, matched.attr, action);
                        } else if(i < mincount) {
                            return null;
                        } else {
                            return succMatched();
                        }
                    }
                    matchedStack.push(matched);
                    return succMatched();
                }
            },

            triesAtLeast: function(mincount, pattern, succ, actionFunction) {
                return me.triesTimes(mincount, false, pattern, succ, actionFunction);
            },

            triesAtMost: function(maxcount, pattern, succ, actionFunction) {
                return me.triesTimes(0, maxcount, pattern, succ, actionFunction);
            },

            triesZeroOrMore: function(pattern, succ, actionFunction) {
                return me.triesTimes(0, false, pattern, succ, actionFunction);
            },

            triesOneOrMore: function(pattern, succ, actionFunction) {
                return me.triesTimes(1, false, pattern, succ, actionFunction);
            },

            triesMaybe: function(pattern, succ) {
                return me.triesTimes(0, 1, pattern, succ);
            },

            triesTimesNotGreedy: function(mincount, maxcount, pattern, succ, actionFunction) {
                var wrapped = wrap(pattern),
                    wrappedSucc = succ ? wrap(succ) : empty,
                    action = actionFunction ? actionFunction : function(match, syn, inh) { return syn; };

                if(mincount < 0 || (maxcount && maxcount < mincount)) {
                    throw new Error("Illegal position");
                }
                return function(match, lastindex, attr) {
                    var matched,
                        matchedNew,
                        matchedString,
                        matchedStack = [],
                        i;

                    function nextMatched(matchedNew, attrBefore, action) {
                        var matchedString,
                            matched;

                        matchedString = match.substring(lastindex, matchedNew.lastIndex);
                        matched = {
                            match: matchedString,
                            lastIndex: matchedNew.lastIndex,
                            attr: action(matchedString, matchedNew.attr, attrBefore)
                        };
                        return ignore(match, lastindex, matched);
                    }

                    matched = {
                        match: "",
                        lastIndex: lastindex,
                        attr: attr
                    };
                    for(i = 0; maxcount === false || i < maxcount; i++) {
                        if(i < mincount) {
                            if(!!(matchedNew = wrapped(match, matched.lastIndex, matched.attr))) {
                                matched = nextMatched(matchedNew, matched.attr, action);
                            } else {
                                return null;
                            }
                        } else {
                            if(!!(matchedNew = wrappedSucc(match, matched.lastIndex, matched.attr))) {
                                return nextMatched(matchedNew, false, function(match, syn, inh) { return syn; });
                            } else if(!!(matchedNew = wrapped(match, matched.lastIndex, matched.attr))) {
                                matched = nextMatched(matchedNew, matched.attr, action);
                            } else {
                                return null;
                            }
                        }
                    }
                    if(!!(matchedNew = wrappedSucc(match, matched.lastIndex, matched.attr))) {
                        return nextMatched(matchedNew, false, function(match, syn, inh) { return syn; });
                    } else {
                        return null;
                    }
                }
            },

            triesAtLeastNonGreedy: function(mincount, pattern, succ, actionFunction) {
                return me.triesTimesNonGreedy(mincount, false, pattern, succ, actionFunction);
            },

            triesAtMostNonGreedy: function(maxcount, pattern, succ, actionFunction) {
                return me.triesTimesNonGreedy(0, maxcount, pattern, succ, actionFunction);
            },

            triesZeroOrMoreNonGreedy: function(pattern, succ, actionFunction) {
                return me.triesTimesNonGreedy(0, false, pattern, succ, actionFunction);
            },

            triesOneOrMoreNonGreedy: function(pattern, succ, actionFunction) {
                return me.triesTimesNonGreedy(1, false, pattern, succ, actionFunction);
            },

            triesMaybeNonGreedy: function(pattern, succ) {
                return me.triesTimesNonGreedy(0, 1, pattern, succ);
            },

            letrec: function() {
                var l = Array.prototype.slice.call(arguments),
                    i,
                    res;
                res = (function(g) {
                    return g(g);
                })(function(p) {
                    var i,
                        li,
                        res = [];
                    for(i = 0; i < l.length; i++) {
                        (function (li) {
                            res.push(function(str, index, captures) {
                                return (wrap(li.apply(null, p(p))))(str, index, captures);
                            });
                        })(l[i]);
                    }
                    return res;
                });
                return res[0];
            }
        };
        return me;
    }

    if(typeof module !== "undefined" && module.exports) {
        module.exports = rena;
    } else {
        root["Rena2"] = root["R"] = rena;
    }
})(this);
