import browser from "webextension-polyfill";
import { parse } from "node-html-parser";
import { config } from "../shared";
import { EpisodeMap } from "../shared/types/EpisodeMap";
import { EpisodeType } from "../shared/types/EpisodeType";

const STORAGE_KEY_EPISODE_MAP = "episodeMap";
const STORAGE_KEY_FETCHED_AT = "episodeMapFetchedAt";

// Maps the CSS class of each condensed <div> to our internal EpisodeType.
const DIV_CLASS_TO_EPISODE_TYPE: Record<string, EpisodeType> = {
    manga_canon: "CANON",
    anime_canon: "CANON",
    filler: "FILLER",
    "mixed_canon/filler": "MIXED",
};

export const getEpisodeMap = async (): Promise<EpisodeMap> => {
    const stored = await browser.storage.local.get([STORAGE_KEY_EPISODE_MAP, STORAGE_KEY_FETCHED_AT]);
    const cachedMap = stored[STORAGE_KEY_EPISODE_MAP] as EpisodeMap | undefined;
    const fetchedAt = stored[STORAGE_KEY_FETCHED_AT] as number | undefined;

    const isCacheValid = cachedMap && fetchedAt && (Date.now() - fetchedAt) < config.cacheTTL;
    if (isCacheValid) {
        return cachedMap;
    }

    return refreshEpisodeMap();
};

/**
 * Force-fetches a fresh episode map, stores it in chrome.storage.local,
 * and returns it. Use getEpisodeMap() for normal access with caching.
 */
export const refreshEpisodeMap = async (): Promise<EpisodeMap> => {
    const episodeMap = await fetchEpisodeMap();

    await browser.storage.local.set({
        [STORAGE_KEY_EPISODE_MAP]: episodeMap,
        [STORAGE_KEY_FETCHED_AT]: Date.now(),
    });

    return episodeMap;
};

/**
 * Fetches the episode list from the configured knowledge source and parses
 * it into an EpisodeMap (episode number → EpisodeType).
 */
const fetchEpisodeMap = async (): Promise<EpisodeMap> => {
    const response = await fetch(config.knowledgeSrc);

    if (!response.ok) {
        throw new Error(`Failed to fetch episode list: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return parseEpisodeMap(html);
};

/**
 * Parses the raw HTML from animefillerlist.com into an EpisodeMap.
 *
 * The page's #Condensed block contains one <div> per episode type
 * (e.g. class="filler"). Inside each div, a <span class="Episodes">
 * holds <a> tags whose text is either a single number ("100") or
 * an inclusive range ("1-44"). Every episode number in those ranges
 * is written into the map with the corresponding type.
 */
const parseEpisodeMap = (html: string): EpisodeMap => {
    const root = parse(html);
    const episodeMap: EpisodeMap = {};

    for (const [divClass, episodeType] of Object.entries(DIV_CLASS_TO_EPISODE_TYPE)) {
        const escapedClass = divClass.replace(/\//g, '\\/');
        const div = root.querySelector(`#Condensed .${escapedClass}`);
        if (!div) continue;

        for (const anchor of div.querySelectorAll(".Episodes a")) {
            for (const episode of expandRange(anchor.text.trim())) {
                episodeMap[episode] = episodeType;
            }
        }
    }

    return episodeMap;
};

const expandRange = (range: string): number[] => {
    const [startStr, endStr] = range.split("-");
    const start = parseInt(startStr, 10);
    const end = endStr !== undefined ? parseInt(endStr, 10) : start;

    const episodes: number[] = [];
    for (let ep = start; ep <= end; ep++) {
        episodes.push(ep);
    }
    return episodes;
};
