import webExtension from "vite-plugin-web-extension"

export default {
    plugins: [
        webExtension({
            manifest: "manifest.json",
            disableAutoLaunch: true
        })
    ]
}