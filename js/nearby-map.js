/* Fixora — Live nearby repair centers on the technicians map.
 *
 * When the user pans or zooms the map, this fetches ALL public repair
 * centers in the visible area — not only centers registered on Fixora —
 * and shows them as markers. Repair centers only, nothing else.
 *
 * How it works (no Google Maps JS API key needed):
 * - The site's interactive map is Leaflet + OpenStreetMap tiles, NOT the
 *   Google Maps JS API (there is no maps.googleapis script or key in the
 *   project). Google Maps appears only as outbound navigation links.
 * - Data comes from the existing backend endpoint
 *   GET /api/marketplace/nearby-shops, which queries the OpenStreetMap
 *   Overpass API for electronics/mobile/computer repair shops only
 *   (craft=electronics_repair|appliance_repair, shop=mobile_phone|
 *   computer|electronics|appliance, plus repair names). No key, no new
 *   backend, no new auth system.
 * - This file only ADDS markers for areas the app itself has not rendered
 *   yet. The app (js/app.js) already renders the public shops of the
 *   initial area, so while the view stays inside that initial area this
 *   script stays quiet — that is what prevents duplicate markers.
 * - It never touches login: it only runs when the map (rendered by the
 *   app inside the logged-in flow) exists, and it only calls the public
 *   nearby-shops endpoint. No secrets are read or written here.
 */
(function () {
  'use strict';

  var POLL_MS = 1500;
  var DEBOUNCE_MS = 600;
  var MIN_MOVE_KM = 1;      // center must move at least this far to refetch
  var MIN_RADIUS_KM = 1;
  var MAX_RADIUS_KM = 30;   // backend /api/marketplace/nearby-shops limit
  var BASE_RADIUS_FACTOR = 1.2;

  var attachedMap = null;
  var liveLayer = null;
  var baseCenter = null;    // L.LatLng of the area the app already rendered
  var baseRadiusKm = 6;
  var lastSearch = null;    // { lat, lng, radiusKm }
  var debounceTimer = null;
  var requestToken = 0;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isAr() {
    return (document.documentElement.lang || 'ar').toLowerCase().indexOf('ar') === 0;
  }

  function radiusFromBounds(map) {
    try {
      var center = map.getCenter();
      var ne = map.getBounds().getNorthEast();
      var km = map.distance(center, ne) / 1000;
      if (!isFinite(km) || km <= 0) return 6;
      return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(km * 10) / 10));
    } catch (e) {
      return 6;
    }
  }

  function sameArea(a, b, radiusKm) {
    if (!a || !b) return false;
    try {
      var movedKm = attachedMap.distance(a, b) / 1000;
      return movedKm < 0.5 && Math.abs(radiusKm - (lastSearch ? lastSearch.radiusKm : radiusKm)) < 1;
    } catch (e) {
      return false;
    }
  }

  function shopPopup(shop) {
    var ar = isAr();
    var lines = [];
    lines.push('<div style="font-family: inherit; font-size: 13px; min-width: 180px;">');
    lines.push('<b style="color: #0F172A; font-size: 14px;">' + esc(shop.name) + '</b>');
    var meta = [];
    if (shop.category_ar) meta.push(esc(shop.category_ar));
    if (shop.distance_km != null) meta.push(esc(shop.distance_km) + (ar ? ' كم' : ' km'));
    if (meta.length) lines.push('<div style="color: #64748B; margin-top: 2px;">' + meta.join(' · ') + '</div>');
    if (shop.address) lines.push('<div style="color: #334155; margin-top: 4px;">' + esc(shop.address) + '</div>');
    if (shop.phone) lines.push('<div style="color: #334155;" dir="ltr" style="text-align: right;">' + esc(shop.phone) + '</div>');
    var url = String(shop.google_maps_url || '');
    if (url.indexOf('https://www.google.com/maps/') === 0) {
      lines.push('<div style="margin-top: 6px;"><a href="' + esc(url) + '" target="_blank" rel="noopener">' +
        (ar ? 'فتح في Google Maps' : 'Open in Google Maps') + '</a></div>');
    }
    lines.push('<div style="color: #94A3B8; font-size: 11px; margin-top: 4px;">' +
      (ar ? 'مركز صيانة عام (ليس بالضرورة مسجلاً في Fixora)' : 'Public repair center (not necessarily registered on Fixora)') + '</div>');
    lines.push('</div>');
    return lines.join('');
  }

  function renderShops(shops) {
    if (!liveLayer) return;
    liveLayer.clearLayers();
    var seen = {};
    (shops || []).forEach(function (shop) {
      if (shop == null || shop.lat == null || shop.lng == null) return;
      var key = shop.id || (shop.name + '|' + Number(shop.lat).toFixed(4) + ',' + Number(shop.lng).toFixed(4));
      if (seen[key]) return;
      seen[key] = true;
      var icon = L.divIcon({
        className: 'fixora-public-shop-marker',
        html: '<div style="width: 28px; height: 28px; border-radius: 50%; background: #EA580C; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 2px solid #fff; box-shadow: 0 1px 6px rgba(0,0,0,.35);">&#128296;</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });
      var marker = L.marker([Number(shop.lat), Number(shop.lng)], { icon: icon, title: shop.name || '' });
      marker.bindPopup(shopPopup(shop));
      marker.addTo(liveLayer);
    });
  }

  function searchArea() {
    if (!attachedMap || !window.api || typeof window.api.getNearbyRepairShops !== 'function') return;
    var center = attachedMap.getCenter();
    var radiusKm = radiusFromBounds(attachedMap);

    // Still inside the area the app already rendered: clear live markers
    // and skip, so the same shops are never shown twice.
    if (baseCenter) {
      var movedFromBaseKm = attachedMap.distance(center, baseCenter) / 1000;
      if (movedFromBaseKm < MIN_MOVE_KM && radiusKm <= baseRadiusKm * BASE_RADIUS_FACTOR) {
        if (liveLayer) liveLayer.clearLayers();
        lastSearch = null;
        return;
      }
    }
    if (sameArea(center, lastSearch, radiusKm)) return;

    var token = ++requestToken;
    window.api.getNearbyRepairShops(center.lat, center.lng, radiusKm).then(function (res) {
      if (token !== requestToken || !liveLayer) return; // stale response
      var shops = Array.isArray(res && res.shops) ? res.shops : [];
      renderShops(shops);
      lastSearch = { lat: center.lat, lng: center.lng, radiusKm: radiusKm };
    }).catch(function () {
      // Keep the previous markers on failure; never break the map.
    });
  }

  function onMoveEnd() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(searchArea, DEBOUNCE_MS);
  }

  function attach(map) {
    attachedMap = map;
    liveLayer = L.layerGroup().addTo(map);
    baseCenter = map.getCenter();
    baseRadiusKm = radiusFromBounds(map);
    lastSearch = null;
    map.on('moveend', onMoveEnd); // fires after panning AND after zooming
  }

  function tick() {
    try {
      if (typeof L === 'undefined' || !window.api || typeof window.api.getNearbyRepairShops !== 'function') return;
      var map = window.app && window.app._techLeafMap;
      if (map && map !== attachedMap) attach(map);
    } catch (e) {
      /* never break the page */
    }
  }

  setInterval(tick, POLL_MS);
  tick();
})();
