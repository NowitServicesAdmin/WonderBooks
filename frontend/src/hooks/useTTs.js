// import { useCallback, useEffect, useRef, useState } from "react";

// // useTTs.js
// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";// set to your backend URL if it differs

// export const useTTS = () => {
//     const audioRef = useRef(null);
//     const abortRef = useRef(null);
//     const reqIdRef = useRef(0);
//     const urlCache = useRef(new Map());

//     const [status, setStatus] = useState("idle"); // idle | loading | playing | paused
//     const [voiceId, setVoiceId] = useState(null);
//     const [error, setError] = useState("");

//     const teardown = useCallback(() => {
//         reqIdRef.current += 1; // invalidates any in-flight request
//         abortRef.current?.abort();
//         if (audioRef.current) {
//             audioRef.current.pause();
//             audioRef.current.src = "";
//             audioRef.current = null;
//         }
//     }, []);

//     const stop = useCallback(() => {
//         teardown();
//         setStatus("idle");
//     }, [teardown]);

//     const speak = useCallback(
//         async ({ bookId, pageId, text, voiceId: vid }) => {
//             teardown();
//             setError("");
//             setVoiceId(vid);
//             setStatus("loading");
//             const myReq = reqIdRef.current;

//             try {
//                 const key = `${bookId}/${pageId}/${vid}`;
//                 let url = urlCache.current.get(key);

//                 if (!url) {
//                     const controller = new AbortController();
//                     abortRef.current = controller;
//                     const res = await fetch(`${API_BASE}/api/tts`, {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({ bookId, pageId, text, voiceId: vid }),
//                         signal: controller.signal,
//                     });
//                     if (!res.ok) throw new Error("Couldn't generate the voice. Please try again.");
//                     url = (await res.json()).audioUrl;
//                     if (!url) throw new Error("No audio was returned.");
//                     urlCache.current.set(key, url);
//                 }

//                 if (myReq !== reqIdRef.current) return; // user changed voice/page meanwhile

//                 const audio = new Audio(url);
//                 audioRef.current = audio;
//                 audio.onended = () => setStatus("idle");
//                 audio.onerror = () => {
//                     setError("Couldn't play the audio.");
//                     setStatus("idle");
//                 };
//                 await audio.play();
//                 if (myReq === reqIdRef.current) setStatus("playing");
//             } catch (err) {
//                 if (err.name === "AbortError" || myReq !== reqIdRef.current) return;
//                 setError(err.message || "Something went wrong with the voice.");
//                 setStatus("idle");
//             }
//         },
//         [teardown]
//     );

//     const pause = useCallback(() => {
//         if (audioRef.current && status === "playing") {
//             audioRef.current.pause();
//             setStatus("paused");
//         }
//     }, [status]);

//     const resume = useCallback(async () => {
//         if (audioRef.current && status === "paused") {
//             await audioRef.current.play();
//             setStatus("playing");
//         }
//     }, [status]);

//     useEffect(() => teardown, [teardown]); // stop on unmount

//     return { speak, pause, resume, stop, status, voiceId, error };
// };

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL|| "http://localhost:5000";

export const useTTS = () => {
    const audioRef = useRef(null);
    const abortRef = useRef(null);
    const reqIdRef = useRef(0);
    const blobUrlCache = useRef(new Map()); // key -> object URL (this browser tab only)

    const [status, setStatus] = useState("idle");
    const [voiceId, setVoiceId] = useState(null);
    const [error, setError] = useState("");

    const teardown = useCallback(() => {
        reqIdRef.current += 1;
        abortRef.current?.abort();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        teardown();
        setStatus("idle");
    }, [teardown]);

    const speak = useCallback(
        async ({ bookId, pageId, text, voiceId: vid }) => {
            teardown();
            setError("");
            setVoiceId(vid);
            setStatus("loading");
            const myReq = reqIdRef.current;

            try {
                const key = `${bookId}/${pageId}/${vid}`;
                let url = blobUrlCache.current.get(key);

                if (!url) {
                    const controller = new AbortController();
                    abortRef.current = controller;
                    const res = await fetch(`${API_BASE}/tts`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bookId, pageId, text, voiceId: vid }),
                        signal: controller.signal,
                    });
                    if (!res.ok) {
                        const detail = await res.json().catch(() => ({}));
                        throw new Error(detail.error || "Couldn't generate the voice. Please try again.");
                    }
                    const blob = await res.blob(); // audio/mpeg bytes
                    url = URL.createObjectURL(blob);
                    blobUrlCache.current.set(key, url);
                }

                if (myReq !== reqIdRef.current) return;

                const audio = new Audio(url);
                audioRef.current = audio;
                audio.onended = () => setStatus("idle");
                audio.onerror = () => {
                    setError("Couldn't play the audio.");
                    setStatus("idle");
                };
                await audio.play();
                if (myReq === reqIdRef.current) setStatus("playing");
            } catch (err) {
                console.log(err,"error@jesus")
                if (err.name === "AbortError" || myReq !== reqIdRef.current) return;
                setError(err.message || "Something went wrong with the voice.");
                setStatus("idle");
            }
        },
        [teardown]
    );

    const pause = useCallback(() => {
        if (audioRef.current && status === "playing") {
            audioRef.current.pause();
            setStatus("paused");
        }
    }, [status]);

    const resume = useCallback(async () => {
        if (audioRef.current && status === "paused") {
            await audioRef.current.play();
            setStatus("playing");
        }
    }, [status]);

    useEffect(() => teardown, [teardown]);

    // free blob URLs when the component unmounts (e.g. leaving the book)
    useEffect(() => {
        return () => {
            blobUrlCache.current.forEach((url) => URL.revokeObjectURL(url));
            blobUrlCache.current.clear();
        };
    }, []);

    return { speak, pause, resume, stop, status, voiceId, error };
};