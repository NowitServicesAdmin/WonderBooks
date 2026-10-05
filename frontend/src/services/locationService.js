import api from "../api/axios";

// Search places (Google autocomplete via our backend)
export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 3) return [];
  try {
    const { data } = await api.get("/location/search", { params: { q: query } });
    return data.data || [];
  } catch (error) {
    console.error("Search places error:", error);
    return [];
  }
};

// Full details (city, state, pincode, lat/lng...) for one search result
export const getPlaceDetails = async (placeId) => {
  try {
    const { data } = await api.get(`/location/details/${placeId}`);
    return data.data;
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
};

// Browser GPS position
export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

// Coordinates -> address
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const { data } = await api.get("/location/reverse", {
      params: { lat: latitude, lng: longitude },
    });
    return data.data;
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return null;
  }
};