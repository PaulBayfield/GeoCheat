import * as browser from 'webextension-polyfill';

var manifestData = browser.runtime.getManifest();

console.info("[GeoCheat] Launched GeoCheat!");
console.info(`[GeoCheat] Version : ${manifestData.version}`);
