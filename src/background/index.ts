import browser from "webextension-polyfill";
import { getEpisodeMap } from "./fetcher";
import { EpisodeMap } from "../shared/types/EpisodeMap";

// Respond to content script requests for the episode map.
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const msg = message as Record<string, unknown>;

    if (msg?.type === "getEpisodeMap") {
        getEpisodeMap()
            .then((episodeMap: EpisodeMap) => sendResponse({ episodeMap }))
            .catch((err: unknown) => sendResponse({ error: String(err) }));
    }

    // Return true to keep the message channel open for async sendResponse.
    return true;
});
