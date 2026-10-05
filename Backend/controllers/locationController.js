// Google Maps lookups for the address picker.
// Needs GOOGLE_MAPS_API_KEY in .env (Places API + Geocoding API enabled).
// Uses the built-in fetch (Node 18+), so no extra package is required.

const BASE_URL = "https://maps.googleapis.com/maps/api";

const googleGet = async (path, params) => {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries({ ...params, key: process.env.GOOGLE_MAPS_API_KEY }).forEach(
    ([key, value]) => url.searchParams.set(key, value),
  );
  const response = await fetch(url);
  return response.json();
};

const readComponent = (components = [], ...types) => {
  const found = components.find((item) =>
    types.every((type) => item.types.includes(type)),
  );
  return found?.long_name || "";
};

const splitComponents = (components) => ({
  area:
    readComponent(components, "sublocality_level_1") ||
    readComponent(components, "sublocality") ||
    readComponent(components, "neighborhood"),
  city:
    readComponent(components, "locality") ||
    readComponent(components, "administrative_area_level_2"),
  district: readComponent(components, "administrative_area_level_2"),
  state: readComponent(components, "administrative_area_level_1"),
  country: readComponent(components, "country"),
  pincode: readComponent(components, "postal_code"),
});

const keyMissing = (res) => {
  if (process.env.GOOGLE_MAPS_API_KEY) return false;
  res.status(500).json({
    success: false,
    message: "Location search isn't configured on the server.",
  });
  return true;
};

export const searchPlaces = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 3) return res.json({ success: true, data: [] });
    if (keyMissing(res)) return;

    const data = await googleGet("/place/autocomplete/json", {
      input: q,
      language: "en",
    });

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return res.status(400).json({ success: false, message: data.status });
    }
    return res.json({ success: true, data: data.predictions || [] });
  } catch (error) {
    console.error("searchPlaces error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to search locations." });
  }
};

export const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    if (keyMissing(res)) return;

    const data = await googleGet("/place/details/json", {
      place_id: placeId,
      fields: "name,formatted_address,geometry,address_components",
    });

    if (data.status !== "OK") {
      return res.status(400).json({ success: false, message: data.status });
    }

    const place = data.result;
    return res.json({
      success: true,
      data: {
        placeId,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        ...splitComponents(place.address_components),
      },
    });
  } catch (error) {
    console.error("getPlaceDetails error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch place details." });
  }
};

export const reverseGeocode = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res
        .status(400)
        .json({ success: false, message: "lat and lng are required" });
    }
    if (keyMissing(res)) return;

    const data = await googleGet("/geocode/json", {
      latlng: `${lat},${lng}`,
      language: "en",
    });

    if (data.status !== "OK") {
      return res.status(400).json({ success: false, message: data.status });
    }

    const result = data.results[0];
    return res.json({
      success: true,
      data: {
        address: result.formatted_address,
        latitude: lat,
        longitude: lng,
        ...splitComponents(result.address_components),
      },
    });
  } catch (error) {
    console.error("reverseGeocode error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reverse geocode." });
  }
};