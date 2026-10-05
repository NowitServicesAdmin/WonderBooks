import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import {
    getCurrentLocation,
    getPlaceDetails,
    reverseGeocode,
    searchPlaces,
} from "../services/locationService";

// Search-as-you-type location field with a "use my current location" button.
// onChange receives { placeId, address, latitude, longitude, area, city, district,
// state, country, pincode } or null when cleared.
export const LocationPicker = ({
    value,
    onChange,
    label = "Location",
    placeholder = "Search your area, street or landmark...",
    required = false,
}) => {
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);
    const searchIdRef = useRef(0);

    const [query, setQuery] = useState(value?.address || "");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const [open, setOpen] = useState(false);
    const [notice, setNotice] = useState("");

    // keep the box in step when the parent sets / clears the value (e.g. editing an address)
    const [prevValue, setPrevValue] = useState(value);
    if (value !== prevValue) {
        setPrevValue(value);
        setQuery(value?.address || "");
    }

    useEffect(() => {
        const onPointerDown = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, []);

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const handleSearch = (text) => {
        setQuery(text);
        setNotice("");
        clearTimeout(debounceRef.current);

        if (text.trim().length < 3) {
            setResults([]);
            setOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            const searchId = ++searchIdRef.current;
            setSearching(true);
            const places = await searchPlaces(text);
            if (searchId !== searchIdRef.current) return; // a newer search is running
            setResults(places);
            setOpen(true);
            setSearching(false);
        }, 400);
    };

    const handleSelect = async (placeId) => {
        setSearching(true);
        const place = await getPlaceDetails(placeId);
        setSearching(false);
        if (!place) {
            setNotice("Couldn't load that place. Please try another one.");
            return;
        }
        setQuery(place.address);
        setResults([]);
        setOpen(false);
        onChange(place);
    };

    const handleCurrentLocation = async () => {
        setLocating(true);
        setNotice("");
        try {
            const coords = await getCurrentLocation();
            const place = await reverseGeocode(coords.latitude, coords.longitude);
            if (!place) throw new Error("No address found");
            const selected = { placeId: "", name: "Current Location", ...place };
            setQuery(selected.address);
            setResults([]);
            setOpen(false);
            onChange(selected);
        } catch {
            setNotice("Couldn't get your current location. Allow location access or search instead.");
        } finally {
            setLocating(false);
        }
    };

    const clear = () => {
        setQuery("");
        setResults([]);
        setOpen(false);
        setNotice("");
        onChange(null);
    };

    const busy = searching || locating;

    return (
        <div ref={wrapperRef} className="relative">
            <label className="mb-1 block text-xs font-bold text-(--text-muted)">
                {label}
                {required && <span className="text-[#c0392b]"> *</span>}
            </label>

            <div className="relative">
                <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)"
                />
                <input
                    value={query}
                    onChange={(event) => handleSearch(event.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) pl-10 pr-20 text-sm text-(--text-heading) outline-none transition placeholder:text-(--text-muted) focus:border-(--accent) focus:ring-2 focus:ring-(--tint)"
                />

                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {busy && <Loader2 size={16} className="animate-spin text-(--accent)" />}
                    {query && !busy && (
                        <button
                            type="button"
                            onClick={clear}
                            aria-label="Clear location"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-(--text-muted) transition hover:bg-(--tint)"
                        >
                            <X size={15} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleCurrentLocation}
                        title="Use my current location"
                        aria-label="Use my current location"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-(--accent) transition hover:bg-(--tint)"
                    >
                        <Crosshair size={16} />
                    </button>
                </div>
            </div>

            {notice && <p className="mt-1.5 text-xs font-semibold text-[#c0392b]">{notice}</p>}

            {open && (
                <div className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-(--border) bg-(--surface) p-1.5 shadow-[0_18px_40px_rgba(40,30,80,0.18)]">
                    <button
                        type="button"
                        onClick={handleCurrentLocation}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-(--tint)"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--tint) text-(--accent)">
                            <Crosshair size={16} />
                        </span>
                        <span>
                            <span className="block text-sm font-bold text-(--text-heading)">Use current location</span>
                            <span className="block text-xs text-(--text-muted)">Detect automatically</span>
                        </span>
                    </button>

                    {results.map((item) => (
                        <button
                            key={item.place_id}
                            type="button"
                            onClick={() => handleSelect(item.place_id)}
                            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-(--tint)"
                        >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--tint) text-(--accent)">
                                <MapPin size={16} />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-(--text-heading)">
                                    {item.structured_formatting?.main_text || item.description}
                                </span>
                                <span className="block truncate text-xs text-(--text-muted)">{item.description}</span>
                            </span>
                        </button>
                    ))}

                    {!searching && results.length === 0 && (
                        <p className="px-3 py-5 text-center text-sm text-(--text-muted)">
                            No locations found. Try another search.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;