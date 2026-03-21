import browser from "webextension-polyfill";
import { getEpisodeMap } from "./fetcher";
import { EpisodeMap } from "../shared/types/EpisodeMap";

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const msg = message as Record<string, unknown>;

    if (msg?.type === "getEpisodeMap") {
        getEpisodeMap()
            .then((episodeMap: EpisodeMap) => sendResponse({ episodeMap }))
            .catch((err: unknown) => sendResponse({ error: String(err) }));
    }

    return true;
});
