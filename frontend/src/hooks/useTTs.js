// import { useCallback, useEffect, useRef, useState } from "react";
// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// export const useTTS = () => {
//     const audioRef = useRef(null);
//     const abortRef = useRef(null);
//     const reqIdRef = useRef(0);
//     const blobUrlCache = useRef(new Map()); // key -> object URL (this browser tab only)

//     const [status, setStatus] = useState("idle");
//     const [voiceId, setVoiceId] = useState(null);
//     const [error, setError] = useState("");

//     const teardown = useCallback(() => {
//         reqIdRef.current += 1;
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
//         async ({ bookId, pageId, text, voiceId: vid, language }) => {
//             teardown();
//             setError("");
//             setVoiceId(vid);
//             setStatus("loading");
//             const myReq = reqIdRef.current;

//             try {
//                 const key = `${bookId}/${pageId}/${vid}/${language || "english"}`; // include language in cache key
//                 let url = blobUrlCache.current.get(key);

//                 if (!url) {
//                     const controller = new AbortController();
//                     abortRef.current = controller;
//                     const res = await fetch(`${API_BASE}/tts`, {
//                         method: "POST",
//                         headers: {
//                             "Content-Type": "application/json",
//                             Authorization: `Bearer ${localStorage.getItem("wb_token") || ""}`,
//                         },
//                         body: JSON.stringify({ bookId, pageId, text, voiceId: vid, language }),
//                         signal: controller.signal,
//                     });
//                     if (!res.ok) {
//                         const detail = await res.json().catch(() => ({}));
//                         throw new Error(detail.error || "Couldn't generate the voice. Please try again.");
//                     }
//                     const blob = await res.blob();
//                     url = URL.createObjectURL(blob);
//                     blobUrlCache.current.set(key, url);
//                 }

//                 if (myReq !== reqIdRef.current) return;

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
//                 console.log(err, "error@jesus")
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

//     useEffect(() => teardown, [teardown]);

//     // free blob URLs when the component unmounts (e.g. leaving the book)
//     useEffect(() => {
//         return () => {
//             blobUrlCache.current.forEach((url) => URL.revokeObjectURL(url));
//             blobUrlCache.current.clear();
//         };
//     }, []);

//     return { speak, pause, resume, stop, status, voiceId, error };
// };


import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CHUNK_SIZE = 300;
const PREFETCH_COUNT = 2;

export const useTTS = () => {
    const audioRef = useRef(null);

    // Current request generation.
    // Every new speak/stop invalidates older requests.
    const reqIdRef = useRef(0);

    // Abort controllers for currently generating chunks.
    const controllersRef = useRef(new Set());

    // Cache:
    // key -> object URL
    //
    // Example:
    // bookId/pageId/voice/language/chunkIndex
    const chunkCacheRef = useRef(new Map());

    // Current playback queue.
    const queueRef = useRef([]);

    // Current playback index.
    const currentIndexRef = useRef(0);

    // Current page/session information.
    const sessionRef = useRef(null);

    const [status, setStatus] = useState("idle");
    const [voiceId, setVoiceId] = useState(null);
    const [error, setError] = useState("");

    // -------------------------------------------------------
    // Split text into playable TTS chunks
    // -------------------------------------------------------

    const splitTextIntoChunks = useCallback((text) => {
        if (!text || !text.trim()) {
            return [];
        }

        const normalizedText = text
            .replace(/\s+/g, " ")
            .trim();

        if (normalizedText.length <= CHUNK_SIZE) {
            return [normalizedText];
        }

        /*
         * First split by sentence boundaries.
         *
         * Example:
         *
         * "Tom woke up early. He opened the door.
         *  The sun was shining."
         *
         * becomes:
         *
         * [
         *   "Tom woke up early.",
         *   "He opened the door.",
         *   "The sun was shining."
         * ]
         */
        const sentences =
            normalizedText.match(
                /[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g
            ) || [normalizedText];

        const chunks = [];
        let current = "";

        for (const sentence of sentences) {
            const cleanSentence = sentence.trim();

            if (!cleanSentence) {
                continue;
            }

            /*
             * If adding this sentence keeps the chunk
             * reasonably small, keep it together.
             */
            if (
                current &&
                `${current} ${cleanSentence}`.length <= CHUNK_SIZE
            ) {
                current = `${current} ${cleanSentence}`;
                continue;
            }

            /*
             * Save the existing chunk.
             */
            if (current) {
                chunks.push(current);
                current = "";
            }

            /*
             * If one sentence itself is larger than CHUNK_SIZE,
             * split it by words.
             */
            if (cleanSentence.length > CHUNK_SIZE) {
                const words = cleanSentence.split(" ");
                let wordChunk = "";

                for (const word of words) {
                    if (
                        wordChunk &&
                        `${wordChunk} ${word}`.length > CHUNK_SIZE
                    ) {
                        chunks.push(wordChunk);
                        wordChunk = word;
                    } else {
                        wordChunk = wordChunk
                            ? `${wordChunk} ${word}`
                            : word;
                    }
                }

                if (wordChunk) {
                    current = wordChunk;
                }
            } else {
                current = cleanSentence;
            }
        }

        if (current) {
            chunks.push(current);
        }

        return chunks.filter(Boolean);
    }, []);

    // -------------------------------------------------------
    // Build cache key
    // -------------------------------------------------------

    const getChunkCacheKey = useCallback(
        ({
            bookId,
            pageId,
            voiceId: vid,
            language,
            chunkIndex,
        }) => {
            return [
                bookId,
                pageId,
                vid,
                language || "english",
                chunkIndex,
            ].join("/");
        },
        []
    );

    // -------------------------------------------------------
    // Abort all active requests
    // -------------------------------------------------------

    const abortAllRequests = useCallback(() => {
        controllersRef.current.forEach((controller) => {
            try {
                controller.abort();
            } catch {
                // Ignore
            }
        });

        controllersRef.current.clear();
    }, []);

    // -------------------------------------------------------
    // Stop current audio
    // -------------------------------------------------------

    const stopCurrentAudio = useCallback(() => {
        if (!audioRef.current) {
            return;
        }

        try {
            audioRef.current.pause();
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current.removeAttribute("src");
            audioRef.current.load();
        } catch {
            // Ignore cleanup errors
        }

        audioRef.current = null;
    }, []);

    // -------------------------------------------------------
    // Cleanup current playback session
    // -------------------------------------------------------

    const teardown = useCallback(() => {
        reqIdRef.current += 1;

        abortAllRequests();

        stopCurrentAudio();

        queueRef.current = [];
        currentIndexRef.current = 0;
        sessionRef.current = null;
    }, [abortAllRequests, stopCurrentAudio]);

    // -------------------------------------------------------
    // Fetch one TTS chunk
    // -------------------------------------------------------

    const fetchChunk = useCallback(
        async ({
            bookId,
            pageId,
            text,
            voiceId: vid,
            language,
            chunkIndex,
            requestId,
        }) => {
            if (requestId !== reqIdRef.current) {
                throw new DOMException(
                    "TTS request cancelled",
                    "AbortError"
                );
            }

            const cacheKey = getChunkCacheKey({
                bookId,
                pageId,
                voiceId: vid,
                language,
                chunkIndex,
            });

            /*
             * Browser cache hit.
             */
            const cachedUrl =
                chunkCacheRef.current.get(cacheKey);

            if (cachedUrl) {
                console.log("[TTS] CHUNK CACHE HIT", {
                    chunkIndex,
                });

                return cachedUrl;
            }

            const controller = new AbortController();

            controllersRef.current.add(controller);

            const startTime = performance.now();

            try {
                console.log("[TTS] CHUNK REQUEST", {
                    chunkIndex,
                    textLength: text.length,
                });

                const response = await fetch(
                    `${API_BASE}/tts/chunk`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${
                                localStorage.getItem(
                                    "wb_token"
                                ) || ""
                            }`,
                        },
                        body: JSON.stringify({
                            bookId,
                            pageId,
                            chunkIndex,
                            text,
                            voiceId: vid,
                            language,
                        }),
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    const detail = await response
                        .json()
                        .catch(() => ({}));

                    throw new Error(
                        detail.error ||
                            `Failed to generate TTS chunk ${
                                chunkIndex + 1
                            }`
                    );
                }

                const blob = await response.blob();

                if (!blob.size) {
                    throw new Error(
                        `TTS chunk ${
                            chunkIndex + 1
                        } returned empty audio`
                    );
                }

                const url =
                    URL.createObjectURL(blob);

                chunkCacheRef.current.set(
                    cacheKey,
                    url
                );

                console.log("[TTS] CHUNK READY", {
                    chunkIndex,
                    bytes: blob.size,
                    time: `${(
                        performance.now() -
                        startTime
                    ).toFixed(0)} ms`,
                });

                return url;
            } finally {
                controllersRef.current.delete(
                    controller
                );
            }
        },
        [getChunkCacheKey]
    );

    // -------------------------------------------------------
    // Prefetch chunks
    // -------------------------------------------------------

    const prefetchChunks = useCallback(
        async ({
            chunks,
            startIndex,
            bookId,
            pageId,
            voiceId: vid,
            language,
            requestId,
        }) => {
            const indexes = [];

            for (
                let i = startIndex;
                i <
                Math.min(
                    startIndex + PREFETCH_COUNT,
                    chunks.length
                );
                i++
            ) {
                indexes.push(i);
            }

            if (!indexes.length) {
                return;
            }

            /*
             * Generate multiple chunks in parallel.
             *
             * Chunk 1 can be playing while chunks 2 and 3
             * are being generated.
             */
            await Promise.allSettled(
                indexes.map((index) =>
                    fetchChunk({
                        bookId,
                        pageId,
                        text: chunks[index],
                        voiceId: vid,
                        language,
                        chunkIndex: index,
                        requestId,
                    })
                )
            );
        },
        [fetchChunk]
    );

    // -------------------------------------------------------
    // Play one chunk
    // -------------------------------------------------------

    const playChunk = useCallback(
        async ({
            index,
            requestId,
        }) => {
            const session = sessionRef.current;

            if (
                !session ||
                requestId !== reqIdRef.current
            ) {
                return;
            }

            const {
                chunks,
                bookId,
                pageId,
                voiceId: vid,
                language,
            } = session;

            if (index >= chunks.length) {
                console.log("[TTS] ALL CHUNKS PLAYED");

                setStatus("idle");

                return;
            }

            currentIndexRef.current = index;

            /*
             * Get this chunk.
             *
             * If it was prefetched, this resolves immediately.
             * Otherwise we generate it now.
             */
            let url;

            try {
                url = await fetchChunk({
                    bookId,
                    pageId,
                    text: chunks[index],
                    voiceId: vid,
                    language,
                    chunkIndex: index,
                    requestId,
                });
            } catch (err) {
                if (
                    err?.name === "AbortError" ||
                    requestId !== reqIdRef.current
                ) {
                    return;
                }

                throw err;
            }

            if (requestId !== reqIdRef.current) {
                return;
            }

            /*
             * Create a completely independent Audio element
             * for this complete MP3 chunk.
             */
            const audio = new Audio(url);

            audio.preload = "auto";

            audioRef.current = audio;

            audio.onended = async () => {
                if (
                    requestId !== reqIdRef.current
                ) {
                    return;
                }

                console.log(
                    "[TTS] CHUNK PLAYBACK ENDED",
                    {
                        chunkIndex: index,
                    }
                );

                const nextIndex = index + 1;

                if (
                    nextIndex >=
                    chunks.length
                ) {
                    setStatus("idle");

                    audioRef.current = null;

                    return;
                }

                /*
                 * Start generating/preloading later chunks
                 * while we move to the next one.
                 */
                prefetchChunks({
                    chunks,
                    startIndex: nextIndex + 1,
                    bookId,
                    pageId,
                    voiceId: vid,
                    language,
                    requestId,
                }).catch(() => {});

                try {
                    await playChunk({
                        index: nextIndex,
                        requestId,
                    });
                } catch (err) {
                    if (
                        requestId !==
                        reqIdRef.current
                    ) {
                        return;
                    }

                    console.error(
                        "[TTS] NEXT CHUNK ERROR",
                        err
                    );

                    setError(
                        err?.message ||
                            "Couldn't continue the voice."
                    );

                    setStatus("idle");
                }
            };

            audio.onerror = () => {
                if (
                    requestId !== reqIdRef.current
                ) {
                    return;
                }

                console.error(
                    "[TTS] AUDIO PLAYBACK ERROR",
                    {
                        chunkIndex: index,
                    }
                );

                setError(
                    "Couldn't play the audio."
                );

                setStatus("idle");
            };

            console.log(
                "[TTS] STARTING PLAYBACK",
                {
                    chunkIndex: index,
                    totalChunks: chunks.length,
                }
            );

            try {
                await audio.play();

                if (
                    requestId ===
                    reqIdRef.current
                ) {
                    setStatus("playing");

                    console.log(
                        "[TTS] PLAYBACK STARTED",
                        {
                            chunkIndex: index,
                        }
                    );
                }
            } catch (err) {
                if (
                    requestId !== reqIdRef.current
                ) {
                    return;
                }

                console.error(
                    "[TTS] PLAY ERROR",
                    err
                );

                throw new Error(
                    "Browser blocked audio playback. Please click the play button again."
                );
            }
        },
        [fetchChunk, prefetchChunks]
    );

    // -------------------------------------------------------
    // Speak
    // -------------------------------------------------------

    const speak = useCallback(
        async ({
            bookId,
            pageId,
            text,
            voiceId: vid,
            language,
        }) => {
            /*
             * Stop any previous story/page playback.
             */
            teardown();

            setError("");
            setVoiceId(vid);
            setStatus("loading");

            const requestId =
                reqIdRef.current;

            try {
                const chunks =
                    splitTextIntoChunks(text);

                if (!chunks.length) {
                    throw new Error(
                        "No text available for voice generation."
                    );
                }

                console.log(
                    "================================="
                );

                console.log(
                    "[TTS] NEW PLAYBACK SESSION"
                );

                console.log({
                    bookId,
                    pageId,
                    voiceId: vid,
                    language,
                    textLength:
                        text?.length || 0,
                    chunks: chunks.length,
                    chunkSize: CHUNK_SIZE,
                });

                console.log(
                    "================================="
                );

                sessionRef.current = {
                    bookId,
                    pageId,
                    chunks,
                    voiceId: vid,
                    language,
                };

                queueRef.current =
                    chunks.map(
                        (_, index) => index
                    );

                currentIndexRef.current = 0;

                /*
                 * IMPORTANT:
                 *
                 * Generate ONLY the first chunk immediately.
                 *
                 * This is what gives us fast first-audio
                 * playback.
                 */
                console.log(
                    "[TTS] GENERATING FIRST CHUNK"
                );

                await playChunk({
                    index: 0,
                    requestId,
                });

                if (
                    requestId !==
                    reqIdRef.current
                ) {
                    return;
                }

                /*
                 * While chunk 1 is playing, generate
                 * chunks 2 and 3 in parallel.
                 */
                prefetchChunks({
                    chunks,
                    startIndex: 1,
                    bookId,
                    pageId,
                    voiceId: vid,
                    language,
                    requestId,
                }).catch((err) => {
                    if (
                        requestId ===
                        reqIdRef.current
                    ) {
                        console.warn(
                            "[TTS] PREFETCH ERROR",
                            err
                        );
                    }
                });
            } catch (err) {
                if (
                    err?.name === "AbortError" ||
                    requestId !== reqIdRef.current
                ) {
                    return;
                }

                console.error(
                    "[TTS] SPEAK ERROR",
                    err
                );

                setError(
                    err?.message ||
                        "Something went wrong with the voice."
                );

                setStatus("idle");
            }
        },
        [
            teardown,
            splitTextIntoChunks,
            playChunk,
            prefetchChunks,
        ]
    );

    // -------------------------------------------------------
    // Pause
    // -------------------------------------------------------

    const pause = useCallback(() => {
        if (
            audioRef.current &&
            status === "playing"
        ) {
            audioRef.current.pause();

            setStatus("paused");

            console.log(
                "[TTS] PAUSED",
                {
                    chunkIndex:
                        currentIndexRef.current,
                }
            );
        }
    }, [status]);

    // -------------------------------------------------------
    // Resume
    // -------------------------------------------------------

    const resume = useCallback(async () => {
        if (
            audioRef.current &&
            status === "paused"
        ) {
            try {
                await audioRef.current.play();

                setStatus("playing");

                console.log(
                    "[TTS] RESUMED",
                    {
                        chunkIndex:
                            currentIndexRef.current,
                    }
                );
            } catch (err) {
                console.error(
                    "[TTS] RESUME ERROR",
                    err
                );

                setError(
                    "Couldn't resume the audio."
                );
            }
        }
    }, [status]);

    // -------------------------------------------------------
    // Stop
    // -------------------------------------------------------

    const stop = useCallback(() => {
        console.log("[TTS] STOP");

        teardown();

        setStatus("idle");
    }, [teardown]);

    // -------------------------------------------------------
    // Component unmount
    // -------------------------------------------------------

    useEffect(() => {
        return () => {
            teardown();
        };
    }, [teardown]);

    // -------------------------------------------------------
    // Free cached object URLs
    // -------------------------------------------------------

    useEffect(() => {
        return () => {
            chunkCacheRef.current.forEach(
                (url) => {
                    try {
                        URL.revokeObjectURL(
                            url
                        );
                    } catch {
                        // Ignore
                    }
                }
            );

            chunkCacheRef.current.clear();
        };
    }, []);

    // -------------------------------------------------------
    // Return API
    // -------------------------------------------------------

    return {
        speak,
        pause,
        resume,
        stop,
        status,
        voiceId,
        error,
    };
};