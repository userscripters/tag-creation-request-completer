// ==UserScript==
// @name           Tag Creation Request Completer
// @author         Oleg Valter <oleg.a.valter@gmail.com>
// @description    Updates tag creation request posts to indicate their completion/decline status and properly tags/edits them
// @grant          none
// @homepage       https://github.com/userscripters/tag-creation-request-completer#readme
// @match          https://stackoverflow.com/questions/*
// @match          https://serverfault.com/questions/*
// @match          https://superuser.com/questions/*
// @match          https://*.stackexchange.com/questions/*
// @match          https://askubuntu.com/questions/*
// @match          https://stackapps.com/questions/*
// @match          https://mathoverflow.net/questions/*
// @match          https://pt.stackoverflow.com/questions/*
// @match          https://ja.stackoverflow.com/questions/*
// @match          https://ru.stackoverflow.com/questions/*
// @match          https://es.stackoverflow.com/questions/*
// @match          https://meta.stackoverflow.com/questions/*
// @match          https://meta.serverfault.com/questions/*
// @match          https://meta.superuser.com/questions/*
// @match          https://meta.askubuntu.com/questions/*
// @match          https://meta.mathoverflow.net/questions/*
// @match          https://pt.meta.stackoverflow.com/questions/*
// @match          https://ja.meta.stackoverflow.com/questions/*
// @match          https://ru.meta.stackoverflow.com/questions/*
// @match          https://es.meta.stackoverflow.com/questions/*
// @namespace      userscripters
// @run-at         document-start
// @source         git+https://github.com/userscripters/tag-creation-request-completer.git
// @supportURL     https://github.com/userscripters/tag-creation-request-completer/issues
// @version        0.1.0
// ==/UserScript==

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var API_BASE = "https://api.stackexchange.com";
var API_KEY = "vwe8m0x2S01He9D)WRCGPQ((";
var API_VER = "2.3";
var wait = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
var getPaginatedItems = function (url, page) { return __awaiter(void 0, void 0, void 0, function () {
    var res, _a, items, has_more, backoff, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                url.searchParams.set("page", page.toString());
                return [4, fetch(url)];
            case 1:
                res = _d.sent();
                if (!res.ok) {
                    return [2, []];
                }
                return [4, res.json()];
            case 2:
                _a = _d.sent(), items = _a.items, has_more = _a.has_more, backoff = _a.backoff;
                if (!backoff) return [3, 4];
                return [4, wait(backoff * 1e3)];
            case 3:
                _d.sent();
                return [2, getPaginatedItems(url, page)];
            case 4:
                if (!has_more) return [3, 6];
                _c = [__spreadArray([], __read(items), false)];
                return [4, getPaginatedItems(url, page + 1)];
            case 5:
                _b = __spreadArray.apply(void 0, _c.concat([__read.apply(void 0, [_d.sent()]), false]));
                return [3, 7];
            case 6:
                _b = items;
                _d.label = 7;
            case 7: return [2, _b];
        }
    });
}); };
var getTags = function (names, options) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, _b, filter, key, _c, site, params, url;
    return __generator(this, function (_d) {
        if (!names.length)
            return [2, []];
        _a = options.page, page = _a === void 0 ? 1 : _a, _b = options.filter, filter = _b === void 0 ? "default" : _b, key = options.key, _c = options.site, site = _c === void 0 ? "stackoverflow" : _c;
        params = new URLSearchParams({ filter: filter, key: key, pagesize: "100", site: site, });
        url = new URL("".concat(API_BASE, "/").concat(API_VER, "/tags/").concat(names.join(";"), "/info"));
        url.search = params.toString();
        return [2, getPaginatedItems(url, page)];
    });
}); };
var getQuestions = function (ids, options) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, _b, filter, key, _c, site, params, url;
    return __generator(this, function (_d) {
        if (!ids.length)
            return [2, []];
        _a = options.page, page = _a === void 0 ? 1 : _a, _b = options.filter, filter = _b === void 0 ? "default" : _b, key = options.key, _c = options.site, site = _c === void 0 ? "stackoverflow" : _c;
        params = new URLSearchParams({ filter: filter, key: key, pagesize: "100", site: site, });
        url = new URL("".concat(API_BASE, "/").concat(API_VER, "/questions/").concat(ids.join(";")));
        url.search = params.toString();
        return [2, getPaginatedItems(url, page)];
    });
}); };
var getAPIsite = function () {
    var hostname = location.hostname;
    return hostname.substring(0, hostname.lastIndexOf("."));
};
var getPostGuid = function (scriptName, origin, postId) { return __awaiter(void 0, void 0, void 0, function () {
    var url, res, wrapper, _a, editForm;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                url = new URL("".concat(origin, "/posts/").concat(postId, "/edit-inline"));
                return [4, fetch(url)];
            case 1:
                res = _b.sent();
                if (!res.ok) {
                    console.debug("[".concat(scriptName, "] failed to get post #").concat(postId, " GUID"));
                    return [2];
                }
                wrapper = document.createElement("html");
                _a = wrapper;
                return [4, res.text()];
            case 2:
                _a.innerHTML = _b.sent();
                editForm = wrapper.querySelector("form.inline-post");
                if (!editForm) {
                    console.debug("[".concat(scriptName, "] failed to parse post #").concat(postId, " GUID"));
                    return [2];
                }
                return [2, editForm.action.replace("".concat(origin, "/posts/").concat(postId, "/edit-submit/"), "")];
        }
    });
}); };
var submitEdit = function (scriptName, options) { return __awaiter(void 0, void 0, void 0, function () {
    var origin, postId, postGuid, comment, title, body, tags, res, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                origin = options.origin, postId = options.postId, postGuid = options.postGuid, comment = options.comment, title = options.title, body = options.body, tags = options.tags;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4, fetch("".concat(origin, "/posts/").concat(postId, "/edit-submit/").concat(postGuid), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: new URLSearchParams({
                            "edit-comment": comment,
                            "fkey": StackExchange.options.user.fkey,
                            "is-current": "true",
                            "post-text": body,
                            "tagnames": tags.join(" "),
                            title: title,
                        }),
                    })];
            case 2:
                res = _a.sent();
                return [2, res.status === 200];
            case 3:
                error_1 = _a.sent();
                console.debug("[".concat(scriptName, "] failed to submit post #").concat(postId, " edit"));
                return [2, false];
            case 4: return [2];
        }
    });
}); };
var sameTags = function (original, updated) {
    return original.length === updated.size && original.every(function (tag) { return updated.has(tag); });
};
var copyToClipboard = function (scriptName, text) { return __awaiter(void 0, void 0, void 0, function () {
    var type, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                type = "text/plain";
                return [4, navigator.clipboard.write([
                        new ClipboardItem((_a = {},
                            _a[type] = new Blob([text], { type: type }),
                            _a))
                    ])];
            case 1:
                _b.sent();
                return [2, true];
            case 2:
                error_2 = _b.sent();
                console.debug("[".concat(scriptName, "] failed to copy to clipboard"), error_2);
                return [2, false];
            case 3: return [2];
        }
    });
}); };
var findRequestedTag = function (title, body) {
    var _a;
    var _b = __read(/[\[`“]([\w.-]+)[\]`”]|tags?\s+for\s+["“]([\w.\s-]+)["`”]|(?:create|add|new)(?:\s+(?:a|the))?\s+tags?.+?[\[`"“]([\w.\s-]+)[\]`"”]/i.exec(title) || []), tagInTitle = _b[1], unformattedTagsInTitle = _b.slice(2);
    var unformattedTagInTitle = unformattedTagsInTitle.find(Boolean);
    var _c = __read(/[\[`“](\w.-]+)[\]`”]/g.exec(body || "") || [], 2), tagInBody = _c[1];
    return (_a = (tagInTitle || tagInBody || (unformattedTagInTitle === null || unformattedTagInTitle === void 0 ? void 0 : unformattedTagInTitle.replace(/\s+/g, "-")))) === null || _a === void 0 ? void 0 : _a.toLowerCase();
};
var fixRequestTitle = function (title, tagname) {
    return tagname ?
        title.replace(/[\[`][\w.-]+[\]`]/i, "[".concat(tagname, "]")) :
        title;
};
var scase = function (word) { return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase(); };
var handleFailureToGetPostFromAPI = function (scriptName, questionId) {
    console.debug("[".concat(scriptName, "] failed to get post #").concat(questionId, " from the API"));
    return StackExchange.helpers.showToast("Failed to get post info from the API", { type: "danger" });
};
var normalizeDatasetPropName = function (name) {
    return name.split("-").map(function (_a, i) {
        var _b = __read(_a), first = _b[0], rest = _b.slice(1);
        return "".concat(i ? first.toUpperCase() : first.toLowerCase()).concat(rest.join("").toLowerCase());
    }).join("");
};
var makeRequestStatusButton = function (scriptName, type, questionId) {
    var itemWrapper = document.createElement("div");
    itemWrapper.classList.add("flex--item");
    var button = document.createElement("button");
    button.classList.add("s-btn", "s-btn__link");
    button.dataset[normalizeDatasetPropName("".concat(scriptName, "-btn"))] = type;
    button.textContent = scase(type);
    button.title = "".concat(scase(type), " the tag creation request");
    button.type = "button";
    button.addEventListener("click", function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, question, body_markdown, link, _b, tags, title, tagSet, maxTagsOnPost, comments, origin, postGuid, tagname, fixedTitle, chatLink, status;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4, getQuestions([questionId], {
                        filter: "7W_5I-T9o",
                        key: API_KEY,
                        site: getAPIsite(),
                    })];
                case 1:
                    _a = __read.apply(void 0, [_c.sent(), 1]), question = _a[0];
                    if (!question) {
                        return [2, handleFailureToGetPostFromAPI(scriptName, questionId)];
                    }
                    body_markdown = question.body_markdown, link = question.link, _b = question.tags, tags = _b === void 0 ? [] : _b, title = question.title;
                    if (!body_markdown || !title) {
                        console.debug("[".concat(scriptName, "] missing post #").concat(questionId, " body/title"));
                        return [2, StackExchange.helpers.showToast("Failed to get question body or title from the API", { type: "danger" })];
                    }
                    tagSet = new Set(tags);
                    if (StackExchange.options.user.isModerator) {
                        tagSet.add("status-".concat(type, "d"));
                    }
                    if (!tagSet.has("support") && !tagSet.has("discussion")) {
                        tagSet.add("discussion");
                    }
                    tagSet.delete("tag-creation-process");
                    tagSet.delete("feature-request");
                    tagSet.add("tags");
                    tagSet.add("tag-creation-request");
                    maxTagsOnPost = 5;
                    if (tagSet.size > maxTagsOnPost) {
                        console.debug("[".concat(scriptName, "] updated post has too many tags"));
                        return [2, StackExchange.helpers.showToast("Posts can't have more than ".concat(maxTagsOnPost, " tag").concat(maxTagsOnPost === 1 ? "" : "s"), { type: "warning" })];
                    }
                    comments = [];
                    if (!sameTags(tags, tagSet)) {
                        comments.push("retagged correctly");
                    }
                    origin = location.origin;
                    return [4, getPostGuid(scriptName, origin, questionId)];
                case 2:
                    postGuid = _c.sent();
                    if (!postGuid) {
                        console.debug("[".concat(scriptName, "] failed to get post #").concat(questionId, " GUID"));
                        return [2, StackExchange.helpers.showToast("Failed to get the post GUID", { type: "danger" })];
                    }
                    tagname = findRequestedTag(title, body_markdown);
                    fixedTitle = fixRequestTitle(title, tagname);
                    if (fixedTitle !== title) {
                        comments.push("highlighted the tag in the title");
                    }
                    chatLink = "[tag:".concat(tagname || "", "] ").concat(type, " ([").concat(fixedTitle.replace(/(\[|\])/g, "\\$1"), "](").concat(link, "))");
                    return [4, copyToClipboard(scriptName, chatLink)];
                case 3:
                    _c.sent();
                    StackExchange.helpers.showToast("Copied chat link to clipboard", { type: "info" });
                    if (!comments.length) {
                        console.debug("[".concat(scriptName, "] nothing to update in the post #").concat(questionId));
                        return [2, StackExchange.helpers.showToast("Nothing would be updated in the post, aborting edit", { type: "info" })];
                    }
                    return [4, submitEdit(scriptName, {
                            body: body_markdown,
                            comment: comments.join("; "),
                            origin: origin,
                            postGuid: postGuid,
                            postId: questionId,
                            tags: __spreadArray([], __read(tagSet), false),
                            title: fixedTitle,
                        })];
                case 4:
                    status = _c.sent();
                    StackExchange.helpers.showToast(status ? "".concat(scase(type), "d the request") : "Failed to ".concat(type, " the request"), { type: status ? "success" : "danger" });
                    if (!status) return [3, 6];
                    return [4, wait(1e3)];
                case 5:
                    _c.sent();
                    location.reload();
                    _c.label = 6;
                case 6: return [2];
            }
        });
    }); });
    itemWrapper.append(button);
    return [itemWrapper, button];
};
var addScriptStyles = function (scriptName) {
    var style = document.createElement("style");
    document.head.append(style);
    var sheet = style.sheet;
    if (!sheet) {
        console.debug("[".concat(scriptName, "] failed to add userscript styles"));
        return;
    }
    [
        ".s-btn[disabled][data-".concat(scriptName, "-btn] {\n            pointer-events: unset;\n        }")
    ].forEach(function (rule) { return sheet.insertRule(rule); });
};
window.addEventListener("load", function () { return __awaiter(void 0, void 0, void 0, function () {
    var scriptName, questionMenuQuery, _a, _b, element, postId, site, _c, question, _d, completeWrapper, completeBtn, _e, declineWrapper, declineBtn, body_markdown, title, tagname, numTags, btnToDisable, e_1_1;
    var e_1, _f;
    var _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                scriptName = "tag-creation-request-completer";
                questionMenuQuery = ".js-question .js-post-menu > div:first-child";
                addScriptStyles(scriptName);
                _h.label = 1;
            case 1:
                _h.trys.push([1, 8, 9, 10]);
                _a = __values(document.querySelectorAll(questionMenuQuery)), _b = _a.next();
                _h.label = 2;
            case 2:
                if (!!_b.done) return [3, 7];
                element = _b.value;
                postId = (((_g = element.closest(".js-post-menu")) === null || _g === void 0 ? void 0 : _g.dataset) || {}).postId;
                if (!postId) {
                    console.debug("[".concat(scriptName, "] missing question id"), element);
                    return [2];
                }
                site = getAPIsite();
                return [4, getQuestions([postId], {
                        filter: "7W_5I-T9o",
                        key: API_KEY,
                        site: site,
                    })];
            case 3:
                _c = __read.apply(void 0, [_h.sent(), 1]), question = _c[0];
                if (!question)
                    handleFailureToGetPostFromAPI(scriptName, postId);
                _d = __read(makeRequestStatusButton(scriptName, "complete", postId), 2), completeWrapper = _d[0], completeBtn = _d[1];
                _e = __read(makeRequestStatusButton(scriptName, "decline", postId), 2), declineWrapper = _e[0], declineBtn = _e[1];
                if (!question) return [3, 5];
                body_markdown = question.body_markdown, title = question.title;
                tagname = findRequestedTag(title, body_markdown);
                console.debug("[".concat(scriptName, "] request tag name: ").concat(tagname || "not found"));
                if (!tagname) return [3, 5];
                return [4, getTags([tagname], {
                        key: API_KEY,
                        site: site.replace("meta.", ""),
                    })];
            case 4:
                numTags = (_h.sent()).length;
                btnToDisable = numTags ? declineBtn : completeBtn;
                btnToDisable.disabled = true;
                btnToDisable.title += " (requested tag ".concat(numTags ? "" : "not ", "found)");
                _h.label = 5;
            case 5:
                element.append(completeWrapper, declineWrapper);
                _h.label = 6;
            case 6:
                _b = _a.next();
                return [3, 2];
            case 7: return [3, 10];
            case 8:
                e_1_1 = _h.sent();
                e_1 = { error: e_1_1 };
                return [3, 10];
            case 9:
                try {
                    if (_b && !_b.done && (_f = _a.return)) _f.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
                return [7];
            case 10:
                ;
                return [2];
        }
    });
}); }, { once: true });
