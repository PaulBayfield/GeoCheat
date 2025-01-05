import * as browser from 'webextension-polyfill';
import L from 'leaflet';

let lastGeoCodingCheck = null;

async function fetchAddress(coords, timeout = 5000) {
    if (lastGeoCodingCheck && new Date() - lastGeoCodingCheck < 1000) {
        console.warn("[GeoCheat] Reverse geocoding rate limited (1 seconds).");
        return;
    } else {
        lastGeoCodingCheck = new Date();
    }

    console.info("[GeoCheat] Fetching address from coordinates (reverse geocoding)...");

    const fetchWithTimeout = (url, timeout) => {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]);
    };

    try {
        const response = await fetchWithTimeout(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}`,
            timeout
        );

        if (!response.ok) {
            throw new Error("Failed to fetch address");
        }

        const data = await response.json();

        console.info(`[GeoCheat] Address: ${data.address.road || '-'}, ${data.address.city || '-'}, ${data.address.state || '-'}, ${data.address.country || '-'}`);

        const country = document.querySelector('#country');
        const state = document.querySelector('#state');
        const city = document.querySelector('#city');
        const road = document.querySelector('#road');

        country.innerHTML = data.address.country || '?';
        state.innerHTML = data.address.state || '?';
        city.innerHTML = data.address.city || '?';
        road.innerHTML = data.address.road || '?';
    } catch (error) {
        console.error("[GeoCheat] Error fetching address from coordinates (reverse geocoding).");
        console.error(error.message || error);
    }
}

async function addMarker(map, coords, first = false, zoom = true) {
    console.info("[GeoCheat] addMarker - Coordinates: " + coords);

    if (zoom) {
        map.setView(coords, 10);
    }

    let marker = null;

    if (first) {
        marker = L.marker(coords, {icon: L.divIcon(
            { 
                className: 'pin_start', 
                iconAnchor: [0, 25],
                popupAnchor: [15, -25],
                html: '<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="7" width="18" height="10" fill="black" fill-opacity="0.8"/><path d="M15 1.875C12.2659 1.8781 9.64468 2.96559 7.71139 4.89889C5.77809 6.83218 4.6906 9.45341 4.6875 12.1875C4.6875 21.0117 14.0625 27.6762 14.4621 27.9551C14.6197 28.0655 14.8075 28.1247 15 28.1247C15.1925 28.1247 15.3803 28.0655 15.5379 27.9551C15.9375 27.6762 25.3125 21.0117 25.3125 12.1875C25.3094 9.45341 24.2219 6.83218 22.2886 4.89889C20.3553 2.96559 17.7341 1.8781 15 1.875ZM15 8.4375C15.7417 8.4375 16.4667 8.65743 17.0834 9.06949C17.7001 9.48154 18.1807 10.0672 18.4645 10.7524C18.7484 11.4377 18.8226 12.1917 18.6779 12.9191C18.5333 13.6465 18.1761 14.3147 17.6516 14.8392C17.1272 15.3636 16.459 15.7208 15.7316 15.8654C15.0042 16.0101 14.2502 15.9359 13.5649 15.652C12.8797 15.3682 12.294 14.8876 11.882 14.2709C11.4699 13.6542 11.25 12.9292 11.25 12.1875C11.25 11.1929 11.6451 10.2391 12.3483 9.53585C13.0516 8.83259 14.0054 8.4375 15 8.4375Z" fill="#FF9900"/></svg>' 
            }
        )}).addTo(map);
        marker.bindPopup("First location");
    } else {
        marker = L.marker(coords, {icon: L.divIcon(
            { 
                className: 'pin_path', 
                iconAnchor: [0, 25],
                html: '<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="7" width="18" height="10" fill="black" fill-opacity="0.8"/><path d="M15 1.875C12.2659 1.8781 9.64468 2.96559 7.71139 4.89889C5.77809 6.83218 4.6906 9.45341 4.6875 12.1875C4.6875 21.0117 14.0625 27.6762 14.4621 27.9551C14.6197 28.0655 14.8075 28.1247 15 28.1247C15.1925 28.1247 15.3803 28.0655 15.5379 27.9551C15.9375 27.6762 25.3125 21.0117 25.3125 12.1875C25.3094 9.45341 24.2219 6.83218 22.2886 4.89889C20.3553 2.96559 17.7341 1.8781 15 1.875ZM15 8.4375C15.7417 8.4375 16.4667 8.65743 17.0834 9.06949C17.7001 9.48154 18.1807 10.0672 18.4645 10.7524C18.7484 11.4377 18.8226 12.1917 18.6779 12.9191C18.5333 13.6465 18.1761 14.3147 17.6516 14.8392C17.1272 15.3636 16.459 15.7208 15.7316 15.8654C15.0042 16.0101 14.2502 15.9359 13.5649 15.652C12.8797 15.3682 12.294 14.8876 11.882 14.2709C11.4699 13.6542 11.25 12.9292 11.25 12.1875C11.25 11.1929 11.6451 10.2391 12.3483 9.53585C13.0516 8.83259 14.0054 8.4375 15 8.4375Z" fill="#846A25"/></svg>' 
            }
        )}).addTo(map);
    }

    marker.on('click', async () => {
        console.info("[GeoCheat] Marker clicked.");

        map.setView(coords, 17);
    });

    if (first) {
        await fetchAddress(coords);
    }
}

window.addEventListener('load', async () => {
    const manifest = await browser.runtime.getManifest();
    const version = document.querySelector('#version');
    version.textContent = manifest.version;

    var map = L.map('map').setView([43.52880349901021, -34.22514467414856], 1);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(map);

    const firstCoords = await browser.storage.local.get('firstCoords');
    const coordsHistory = await browser.storage.local.get('coordsHistory');

    if (firstCoords.firstCoords) {
        console.info("[GeoCheat] Found first coordinates in local storage.");

        if (coordsHistory.coordsHistory) {
            console.info("[GeoCheat] Found coordinates history in local storage.");
            console.info("[GeoCheat] Coordinates history: " + coordsHistory.coordsHistory);

            for (const coords of coordsHistory.coordsHistory) {
                console.info("[GeoCheat] Coordinates: " + coords);

                await addMarker(map, coords, false, true);
            }
        }

        await addMarker(map, firstCoords.firstCoords, true, true);
    } else {
        console.warn("[GeoCheat] First coordinates not found in local storage.");
    }
});
