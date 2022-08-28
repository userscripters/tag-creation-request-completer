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
const API_BASE = "https://api.stackexchange.com";
const API_KEY = "vwe8m0x2S01He9D)WRCGPQ((";
const API_VER = "2.3";
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const getPaginatedItems = async (url, page) => {
    url.searchParams.set("page", page.toString());
    const res = await fetch(url);
    if (!res.ok) {
        return [];
    }
    const { items, has_more, backoff } = await res.json();
    if (backoff) {
        await wait(backoff * 1e3);
        return getPaginatedItems(url, page);
    }
    return has_more ? [...items, ...await getPaginatedItems(url, page + 1)] : items;
};
const getTags = async (names, options) => {
    if (!names.length)
        return [];
    const { page = 1, filter = "default", key, site = "stackoverflow" } = options;
    const params = new URLSearchParams({ filter, key, pagesize: "100", site, });
    const url = new URL(`${API_BASE}/${API_VER}/tags/${names.join(";")}/info`);
    url.search = params.toString();
    return getPaginatedItems(url, page);
};
const getQuestions = async (ids, options) => {
    if (!ids.length)
        return [];
    const { page = 1, filter = "default", key, site = "stackoverflow" } = options;
    const params = new URLSearchParams({ filter, key, pagesize: "100", site, });
    const url = new URL(`${API_BASE}/${API_VER}/questions/${ids.join(";")}`);
    url.search = params.toString();
    return getPaginatedItems(url, page);
};
const getAPIsite = () => {
    const { hostname } = location;
    return hostname.substring(0, hostname.lastIndexOf("."));
};
const getPostGuid = async (scriptName, origin, postId) => {
    const url = new URL(`${origin}/posts/${postId}/edit-inline`);
    const res = await fetch(url);
    if (!res.ok) {
        console.debug(`[${scriptName}] failed to get post #${postId} GUID`);
        return;
    }
    const wrapper = document.createElement("html");
    wrapper.innerHTML = await res.text();
    const editForm = wrapper.querySelector("form.inline-post");
    if (!editForm) {
        console.debug(`[${scriptName}] failed to parse post #${postId} GUID`);
        return;
    }
    return editForm.action.replace(`${origin}/posts/${postId}/edit-submit/`, "");
};
const submitEdit = async (scriptName, options) => {
    const { origin, postId, postGuid, comment, title, body, tags } = options;
    try {
        const res = await fetch(`${origin}/posts/${postId}/edit-submit/${postGuid}`, {
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
                title,
            }),
        });
        return res.status === 200;
    }
    catch (error) {
        console.debug(`[${scriptName}] failed to submit post #${postId} edit`);
        return false;
    }
};
const sameTags = (original, updated) => {
    return original.length === updated.size && original.every((tag) => updated.has(tag));
};
const copyToClipboard = async (scriptName, text) => {
    try {
        const type = "text/plain";
        await navigator.clipboard.write([
            new ClipboardItem({
                [type]: new Blob([text], { type })
            })
        ]);
        return true;
    }
    catch (error) {
        console.debug(`[${scriptName}] failed to copy to clipboard`, error);
        return false;
    }
};
const findRequestedTag = (title, body) => {
    var _a;
    const [, tagInTitle, ...unformattedTagsInTitle] = /[\[`“]([\w.-]+)[\]`”]|tags?\s+for\s+["“]([\w.\s-]+)["`”]|(?:create|add|new)(?:\s+(?:a|the))?\s+tags?.+?[\[`"“]([\w.\s-]+)[\]`"”]/i.exec(title) || [];
    const unformattedTagInTitle = unformattedTagsInTitle.find(Boolean);
    const [, tagInBody] = /[\[`“](\w.-]+)[\]`”]/g.exec(body || "") || [];
    return (_a = (tagInTitle || tagInBody || (unformattedTagInTitle === null || unformattedTagInTitle === void 0 ? void 0 : unformattedTagInTitle.replace(/\s+/g, "-")))) === null || _a === void 0 ? void 0 : _a.toLowerCase();
};
const fixRequestTitle = (title, tagname) => {
    return tagname ?
        title.replace(/[\[`][\w.-]+[\]`]/i, `[${tagname}]`) :
        title;
};
const scase = (word) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
const handleFailureToGetPostFromAPI = (scriptName, questionId) => {
    console.debug(`[${scriptName}] failed to get post #${questionId} from the API`);
    return StackExchange.helpers.showToast("Failed to get post info from the API", { type: "danger" });
};
const normalizeDatasetPropName = (name) => {
    return name.split("-").map(([first, ...rest], i) => {
        return `${i ? first.toUpperCase() : first.toLowerCase()}${rest.join("").toLowerCase()}`;
    }).join("");
};
const makeRequestStatusButton = (scriptName, type, questionId) => {
    const itemWrapper = document.createElement("div");
    itemWrapper.classList.add("flex--item");
    const button = document.createElement("button");
    button.classList.add("s-btn", "s-btn__link");
    button.dataset[normalizeDatasetPropName(`${scriptName}-btn`)] = type;
    button.textContent = scase(type);
    button.title = `${scase(type)} the tag creation request`;
    button.type = "button";
    button.addEventListener("click", async () => {
        const [question] = await getQuestions([questionId], {
            filter: "7W_5I-T9o",
            key: API_KEY,
            site: getAPIsite(),
        });
        if (!question) {
            return handleFailureToGetPostFromAPI(scriptName, questionId);
        }
        const { body_markdown, link, tags = [], title } = question;
        if (!body_markdown || !title) {
            console.debug(`[${scriptName}] missing post #${questionId} body/title`);
            return StackExchange.helpers.showToast("Failed to get question body or title from the API", { type: "danger" });
        }
        const tagSet = new Set(tags);
        if (StackExchange.options.user.isModerator) {
            tagSet.add(`status-${type}d`);
        }
        if (!tagSet.has("support") && !tagSet.has("discussion")) {
            tagSet.add("discussion");
        }
        tagSet.delete("tag-creation-process");
        tagSet.delete("feature-request");
        tagSet.add("tags");
        tagSet.add("tag-creation-request");
        const maxTagsOnPost = 5;
        if (tagSet.size > maxTagsOnPost) {
            console.debug(`[${scriptName}] updated post has too many tags`);
            return StackExchange.helpers.showToast(`Posts can't have more than ${maxTagsOnPost} tag${maxTagsOnPost === 1 ? "" : "s"}`, { type: "warning" });
        }
        const comments = [];
        if (!sameTags(tags, tagSet)) {
            comments.push("retagged correctly");
        }
        const { origin } = location;
        const postGuid = await getPostGuid(scriptName, origin, questionId);
        if (!postGuid) {
            console.debug(`[${scriptName}] failed to get post #${questionId} GUID`);
            return StackExchange.helpers.showToast("Failed to get the post GUID", { type: "danger" });
        }
        const tagname = findRequestedTag(title, body_markdown);
        const fixedTitle = fixRequestTitle(title, tagname);
        if (fixedTitle !== title) {
            comments.push("highlighted the tag in the title");
        }
        const chatLink = `[tag:${tagname || ""}] ${type} ([${fixedTitle.replace(/(\[|\])/g, "\\$1")}](${link}))`;
        await copyToClipboard(scriptName, chatLink);
        StackExchange.helpers.showToast("Copied chat link to clipboard", { type: "info" });
        if (!comments.length) {
            console.debug(`[${scriptName}] nothing to update in the post #${questionId}`);
            return StackExchange.helpers.showToast("Nothing would be updated in the post, aborting edit", { type: "info" });
        }
        const status = await submitEdit(scriptName, {
            body: body_markdown,
            comment: comments.join("; "),
            origin,
            postGuid,
            postId: questionId,
            tags: [...tagSet],
            title: fixedTitle,
        });
        StackExchange.helpers.showToast(status ? `${scase(type)}d the request` : `Failed to ${type} the request`, { type: status ? "success" : "danger" });
        if (status) {
            await wait(1e3);
            location.reload();
        }
    });
    itemWrapper.append(button);
    return [itemWrapper, button];
};
const addScriptStyles = (scriptName) => {
    const style = document.createElement("style");
    document.head.append(style);
    const { sheet } = style;
    if (!sheet) {
        console.debug(`[${scriptName}] failed to add userscript styles`);
        return;
    }
    [
        `.s-btn[disabled][data-${scriptName}-btn] {
            pointer-events: unset;
        }`
    ].forEach((rule) => sheet.insertRule(rule));
};
window.addEventListener("load", async () => {
    var _a;
    const scriptName = "tag-creation-request-completer";
    const questionMenuQuery = ".js-question .js-post-menu > div:first-child";
    addScriptStyles(scriptName);
    for (const element of document.querySelectorAll(questionMenuQuery)) {
        const { postId } = ((_a = element.closest(".js-post-menu")) === null || _a === void 0 ? void 0 : _a.dataset) || {};
        if (!postId) {
            console.debug(`[${scriptName}] missing question id`, element);
            return;
        }
        const site = getAPIsite();
        const [question] = await getQuestions([postId], {
            filter: "7W_5I-T9o",
            key: API_KEY,
            site,
        });
        if (!question)
            handleFailureToGetPostFromAPI(scriptName, postId);
        const [completeWrapper, completeBtn] = makeRequestStatusButton(scriptName, "complete", postId);
        const [declineWrapper, declineBtn] = makeRequestStatusButton(scriptName, "decline", postId);
        if (question) {
            const { body_markdown, title } = question;
            const tagname = findRequestedTag(title, body_markdown);
            console.debug(`[${scriptName}] request tag name: ${tagname || "not found"}`);
            if (tagname) {
                const { length: numTags } = await getTags([tagname], {
                    key: API_KEY,
                    site: site.replace("meta.", ""),
                });
                const btnToDisable = numTags ? declineBtn : completeBtn;
                btnToDisable.disabled = true;
                btnToDisable.title += ` (requested tag ${numTags ? "" : "not "}found)`;
            }
        }
        element.append(completeWrapper, declineWrapper);
    }
    ;
}, { once: true });
