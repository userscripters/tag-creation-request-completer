generate-stackapps \
    --about "Tag Creation Request Completer is a utility userscript for making the workflow for normalizing tag-related requests easier.
This is a live project — expect the functionality to expand significantly in the future.

Currently, the userscript adds \"Complete\" and \"Decline\" buttons to the question actions menu and tries to find the requested tag on the main site.
If the tag is not found, the \"Complete\" button will be disabled, and the \"Decline\" button otherwise.
If the tag name can't be extracted from either the title or the body, both buttons will be active for the user to decide which one to use.

Upon clicking the active button, the following workflow will start:
- The [feature-request] tag, if present, is removed (this tag is for asking for new features to be added by the company).
- The [tag-creation-request] tag, if missing, is added (this tag is to be used for tag creation requests).
- The [tag-creation-process] tag, if present, is removed (this tag is for asking about the process itself, not for requesting new tags).
- If neither the [discussion] nor the [support] tags are present, the [discussion] required tag is added.
- The [tags] tag, if missing, is added (this tag should be present on all tag-related questions).
- If the user is a moderator, either a [status-completed] or [status-declined] mod-only tag is added.
- If the requested tag name can be found in the title or the body of the post, the title is edited to highlight the tag name.
- For each group of edits, a relevant comment is added to the edit summary.
- A formatted link (\`[tag:<tagname>]([<post title>](<post link>))\`) for posting into a chat room is copied to clipboard.
- The updated post is programmatically submitted for editing. On success, the page is reloaded after a small delay.

Error handling:
- If the updated posts ends up having more than 5 tags (the current maximum), the script exits early with a notification.
- If the post GUID (required for submitting the edit) can't be found, the script exits early with an error notification.
- If the updated post matches the original 1-to-1, the script exits early with an info message that there is nothing to edit.
- If the question can't be fetched from the API, the script exits early with an error notification." \
    --chrome "100.0.4896.127" \
    --excerpt "Utility userscript for making the workflow for normalizing tag-related requests easier" \
    --install "https://github.com/userscripters/tag-creation-request-completer/raw/master/dist/modern/index.user.js" \
    --minified "https://github.com/userscripters/tag-creation-request-completer/raw/master/dist/modern/index.min.user.js" \
    --language "TypeScript" \
    --org-name "UserScripters" \
    --org-url "https://github.com/userscripters" \
    --room "https://chat.stackoverflow.com/rooms/214345" \
    --tag "script"
