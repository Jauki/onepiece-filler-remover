import { Config } from "./types/Config";
import JSON5 from "json5";

const CONFIG_FILE_LOCATION = "./config.json5";

const getConfig = async (): Promise<Config | null> => {
    try {
        const raw = await Bun.file(CONFIG_FILE_LOCATION).text();
        return JSON5.parse(raw) as Config;
    } catch (e) {
        console.error("Failed to load config:", e);
        return null;
    }
};

const result = await getConfig();
if (!result) throw new Error("Error reading config file!");

export const config: Config = result;
