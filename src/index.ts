interface CommonAPIOptions {
    filter?: string;
    key: string;
    site: string;
}

interface PaginatedAPIOptions extends CommonAPIOptions {
    page?: number;
}

interface GetTagsOptions extends PaginatedAPIOptions { }

interface GetQuestionsOptions extends PaginatedAPIOptions { }

interface EditSubmitterOptions {
    body: string;
    comment: string;
    postGuid: string;
    postId: number | string;
    origin: string;
    tags: string[];
    title: string;
}

const API_BASE = "https://api.stackexchange.com";
const API_KEY = "vwe8m0x2S01He9D)WRCGPQ((";
const API_VER = "2.3";

/**
 * @summary waits for a specified number of milliseconds
 * @param ms milliseconds to wait
 */
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * @summary gets paginated items from the API
 * @param url API endpoint URL
 * @param page items page to get
 */
const getPaginatedItems = async <T extends object>(
    url: URL,
    page: number
): Promise<T[]> => {
    url.searchParams.set("page", page.toString());

    const res = await fetch(url);
    if (!res.ok) {
        // TODO: error handling
        return [];
    }

    const { items, has_more, backoff }: StackExchangeAPI.Wrappers.CommonWrapperObject<T> = await res.json();
    if (backoff) {
        await wait(backoff * 1e3);
        return getPaginatedItems<T>(url, page);
    }

    return has_more ? [...items, ...await getPaginatedItems<T>(url, page + 1)] : items;
};

/**
 * @summary gets {@link StackExchangeAPI.Tag}s from the API
 * @param names tag names to get
 * @param options configuration
 */
const getTags = async (
    names: string[],
    options: GetTagsOptions
): Promise<StackExchangeAPI.Tag[]> => {
    if (!names.length) return [];

    const { page = 1, filter = "default", key, site = "stackoverflow" } = options;

    const params = new URLSearchParams({ filter, key, pagesize: "100", site, });

    const url = new URL(`${API_BASE}/${API_VER}/tags/${names.join(";")}/info`);
    url.search = params.toString();

    return getPaginatedItems(url, page);
};

/**
 * @summary gets {@link StackExchangeAPI.Question}s from the API
 * @param ids question ids to fetch
 * @param options configuration
 */
const getQuestions = async (
    ids: Array<string | number>,
    options: GetQuestionsOptions,
): Promise<StackExchangeAPI.Question[]> => {
    if (!ids.length) return [];

    const { page = 1, filter = "default", key, site = "stackoverflow" } = options;

    const params = new URLSearchParams({ filter, key, pagesize: "100", site, });

    const url = new URL(`${API_BASE}/${API_VER}/questions/${ids.join(";")}`);
    url.search = params.toString();

    return getPaginatedItems(url, page);
};

/**
 * @summary gets the API site parameter from the current {@link Location}
 */
const getAPIsite = (): string => {
    const { hostname } = location;
    return hostname.substring(0, hostname.lastIndexOf("."));
};

/**
 * @summary gets post GUID required for submitting edits
 * @param scriptName userscript name
 * @param origin site {@link Location.origin}
 * @param postId id of the post
 */
const getPostGuid = async (
    scriptName: string,
    origin: string,
    postId: string | number
): Promise<string | undefined> => {
    const url = new URL(`${origin}/posts/${postId}/edit-inline`);

    const res = await fetch(url);
    if (!res.ok) {
        console.debug(`[${scriptName}] failed to get post #${postId} GUID`);
        return;
    }

    const wrapper = document.createElement("html");
    wrapper.innerHTML = await res.text();

    const editForm = wrapper.querySelector<HTMLFormElement>("form.inline-post");
    if (!editForm) {
        console.debug(`[${scriptName}] failed to parse post #${postId} GUID`);
        return;
    }

    return editForm.action.replace(`${origin}/posts/${postId}/edit-submit/`, "");
};

/**
 * @summary programmatically submit an edit to the post
 * @param scriptName name of the userscript
 * @param options request configuration
 */
const submitEdit = async (
    scriptName: string,
    options: EditSubmitterOptions
): Promise<boolean> => {
    const { origin, postId, postGuid, comment, title, body, tags } = options;

    try {
        const res = await fetch(
            `${origin}/posts/${postId}/edit-submit/${postGuid}`,
            {
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
            }
        );

        return res.status === 200;
    } catch (error) {
        console.debug(`[${scriptName}] failed to submit post #${postId} edit`);
        return false;
    }
};

/**
 * @summary checks if tags haven't been updated at all
 * @param original initial tag list from the API
 * @param updated updated set of tags
 */
const sameTags = (original: string[], updated: Set<string>) => {
    return original.length === updated.size && original.every((tag) => updated.has(tag));
};

/**
 * @summary copies text to clipboard
 * @param scriptName userscript name
 * @param text content to copy
 */
const copyToClipboard = async (
    scriptName: string,
    text: string
): Promise<boolean> => {
    try {
        const type = "text/plain";

        await navigator.clipboard.write([
            new ClipboardItem({
                [type]: new Blob([text], { type })
            })
        ]);

        return true;
    } catch (error) {
        console.debug(`[${scriptName}] failed to copy to clipboard`, error);
        return false;
    }
};

/**
 * @summary attempts to find the requested tag
 * @param title post title
 * @param body post body
 */
const findRequestedTag = (
    title: string,
    body?: string
): string | undefined => {
    // https://regex101.com/r/UnZkb4/4
    const [, tagInTitle, ...unformattedTagsInTitle] = /[\[`“]([\w.-]+)[\]`”]|tags?\s+for\s+["“]([\w.\s-]+)["`”]|(?:create|add|new)(?:\s+(?:a|the))?\s+tags?.+?[\[`"“]([\w.\s-]+)[\]`"”]/i.exec(title) || [];

    const unformattedTagInTitle = unformattedTagsInTitle.find(Boolean);

    const [, tagInBody] = /[\[`“](\w.-]+)[\]`”]/g.exec(body || "") || [];

    return (tagInTitle || tagInBody || unformattedTagInTitle?.replace(/\s+/g, "-"))?.toLowerCase();
};

/**
 * @summary fixes tag name in the request post title
 * @param title post title
 * @param tagname name of the requested tag
 */
const fixRequestTitle = (
    title: string,
    tagname?: string
): string => {
    return tagname ?
        title.replace(/[\[`][\w.-]+[\]`]/i, `[${tagname}]`) :
        title;
};

/**
 * @summary sentence-cases a given word
 * @param word word to sentence-case
 */
const scase = (word: string) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();

/**
 * @summary handles failure to get a post from the API
 * @param scriptName name of the userscript
 * @param questionId id of the post to flag
 */
const handleFailureToGetPostFromAPI = (
    scriptName: string,
    questionId: string | number
) => {
    console.debug(`[${scriptName}] failed to get post #${questionId} from the API`);
    return StackExchange.helpers.showToast(
        "Failed to get post info from the API",
        { type: "danger" },
    );
};

/**
 * @summary normalizes property name for setting on a {@link DOMStringMap}
 * @param name property name
 */
const normalizeDatasetPropName = (name: string) => {
    return name.split("-").map(([first, ...rest], i) => {
        return `${i ? first.toUpperCase() : first.toLowerCase()}${rest.join("").toLowerCase()}`;
    }).join("");
};

/**
 * @summary creates a post quickflag button
 * @param scriptName name of the userscript
 * @param type tag request status type
 * @param questionId id of the post to flag
 */
const makeRequestStatusButton = (
    scriptName: string,
    type: "complete" | "decline",
    questionId: number | string,
): [wrapper: HTMLDivElement, button: HTMLButtonElement] => {
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
            return StackExchange.helpers.showToast(
                "Failed to get question body or title from the API",
                { type: "danger" },
            );
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

        const maxTagsOnPost: number = 5;

        if (tagSet.size > maxTagsOnPost) {
            console.debug(`[${scriptName}] updated post has too many tags`);
            return StackExchange.helpers.showToast(
                `Posts can't have more than ${maxTagsOnPost} tag${maxTagsOnPost === 1 ? "" : "s"}`,
                { type: "warning" },
            );
        }

        const comments: string[] = [];

        if (!sameTags(tags, tagSet)) {
            comments.push("retagged correctly");
        }

        const { origin } = location;

        const postGuid = await getPostGuid(scriptName, origin, questionId);
        if (!postGuid) {
            console.debug(`[${scriptName}] failed to get post #${questionId} GUID`);
            return StackExchange.helpers.showToast(
                "Failed to get the post GUID",
                { type: "danger" }
            );
        }

        const tagname = findRequestedTag(title, body_markdown);

        const fixedTitle = fixRequestTitle(title, tagname);
        if (fixedTitle !== title) {
            comments.push("highlighted the tag in the title");
        }

        const chatLink = `[tag:${tagname || ""}] ${type} ([${fixedTitle.replace(/(\[|\])/g, "\\$1")}](${link}))`;

        await copyToClipboard(scriptName, chatLink);

        StackExchange.helpers.showToast(
            "Copied chat link to clipboard",
            { type: "info" }
        );

        if (!comments.length) {
            console.debug(`[${scriptName}] nothing to update in the post #${questionId}`);
            return StackExchange.helpers.showToast(
                "Nothing would be updated in the post, aborting edit",
                { type: "info" }
            );
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

        StackExchange.helpers.showToast(
            status ? `${scase(type)}d the request` : `Failed to ${type} the request`,
            { type: status ? "success" : "danger" }
        );

        if (status) {
            await wait(1e3);
            location.reload();
        }
    });

    itemWrapper.append(button);
    return [itemWrapper, button];
};

/**
 * @summary adds userscript-specific styles
 * @param scriptName userscript name
 */
const addScriptStyles = (scriptName: string) => {
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
    const scriptName = "tag-creation-request-completer";
    const questionMenuQuery = ".js-question .js-post-menu > div:first-child";

    addScriptStyles(scriptName);

    for (const element of document.querySelectorAll(questionMenuQuery)) {
        const { postId } = element.closest<HTMLElement>(".js-post-menu")?.dataset || {};
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

        // no need to return — at the time of clicking on the button, the API might not error
        if (!question) handleFailureToGetPostFromAPI(scriptName, postId);

        const [completeWrapper, completeBtn] = makeRequestStatusButton(scriptName, "complete", postId);
        const [declineWrapper, declineBtn] = makeRequestStatusButton(scriptName, "decline", postId);

        if (question) {
            const { body_markdown, title } = question;
            const tagname = findRequestedTag(title, body_markdown);

            console.debug(`[${scriptName}] request tag name: ${tagname || "not found"}`);

            if (tagname) {
                const { length: numTags } = await getTags([tagname], {
                    key: API_KEY,
                    // tags should be checked on the main site
                    site: site.replace("meta.", ""),
                });

                const btnToDisable = numTags ? declineBtn : completeBtn;

                btnToDisable.disabled = true;
                btnToDisable.title += ` (requested tag ${numTags ? "" : "not "}found)`;
            }
        }

        element.append(completeWrapper, declineWrapper);
    };
}, { once: true });