console.info("[GeoCheat] Background script loaded");

let firstCoords = null;
let lastCoordsCheck = new Date();

async function getCoordsFromURL(url) {
    if (new Date() - lastCoordsCheck < 1000) {
        console.warn("[GeoCheat] Coords check locally rate limited (1 second).");
        return null;
    } else {
        lastCoordsCheck = new Date();
    }

    try {
        console.debug("[GeoCheat] Fetching URL: " + url);

        const response = await fetch(url);
        const text = await response.text();
        const res = text.slice(200, 420).replace(/null/g, '');
        const pattern = /-*\d+\.\d+,-*\d+\.\d+/g;
        const matches = res.match(pattern);
        
        let coords = null;

        if (matches === null) {
            console.warn("[GeoCheat] Coordinates not found in URL.");
            return null;
        } else {
            console.info("[GeoCheat] Coordinates found in URL.");

            coords = matches[0].split(',');
        }

        if (firstCoords === null) {
            firstCoords = coords;
        }

        return coords;
    } catch (error) {
        console.error('Error fetching the URL:', error);
        return null;
    }
}

chrome.webRequest.onBeforeRequest.addListener(
    async function(details) {
        if (details.url.includes("https://maps.googleapis.com/maps/api/js/GeoPhotoService.GetMetadata")) {
            console.info("[GeoCheat] Found a GeoPhotoService.GetMetadata");
            console.info("[GeoCheat] URL: " + details.url);

            console.info("[GeoCheat] Getting coordinates from URL...");
            const coords = await getCoordsFromURL(details.url);

            if (coords !== null) {
                console.info("[GeoCheat] Coordinates: " + coords);

                if (coords === firstCoords) {
                    chrome.storage.local.set({firstCoords: coords}, function() {
                        console.info("[GeoCheat] First coordinates saved to local storage.");
                    });
                    
                    chrome.storage.local.set({coordsHistory: []}, function() {
                        console.info("[GeoCheat] Coordinates saved to local storage.");
                    });
                } else {
                    chrome.storage.local.get('coordsHistory', function(data) {
                        let coordsHistory = data.coordsHistory || [];

                        if (coordsHistory.length > 0) {
                            if (coordsHistory[coordsHistory.length - 1] !== coords) {
                                coordsHistory.push(coords);
                            }
                        } else {
                            if (!coordsHistory.includes(coords)) {
                                coordsHistory.push(coords);
                            }
                        }

                        chrome.storage.local.set({coordsHistory: coordsHistory}, function() {
                            console.info("[GeoCheat] Coordinates saved to local storage.");
                        });
                    });
                }
            }

            return {cancel: false};
        } else if (details.url.includes("https://fonts.googleapis.com/css2") || details.url.includes("https://geotastic.net/") || details.url.includes("https://www.wetter.de/") || details.url.includes("wetter.de/api/") || (details.url.includes("https://www.geoguessr.com/_next/static/media") && details.url.includes(".woff2"))) {
            firstCoords = null;
            chrome.storage.local.clear();
        }

        return {cancel: false};
    },
    {urls: ["<all_urls>"]},
);
