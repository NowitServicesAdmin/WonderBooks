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

// const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// const API_BASE ="http://localhost:5000";

export const useTTS = () => {
    const audioRef = useRef(null);
    const abortRef = useRef(null);
    const reqIdRef = useRef(0);

    // Cache completed audio as Blob URLs
    const blobUrlCache = useRef(new Map());

    // Streaming references
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const streamReaderRef = useRef(null);
    const pendingChunksRef = useRef([]);
    const streamFinishedRef = useRef(false);

    const [status, setStatus] = useState("idle");
    const [voiceId, setVoiceId] = useState(null);
    const [error, setError] = useState("");

    // -------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------

    const teardown = useCallback(() => {
        reqIdRef.current += 1;

        // Abort fetch
        abortRef.current?.abort();
        abortRef.current = null;

        // Cancel stream reader
        if (streamReaderRef.current) {
            try {
                streamReaderRef.current.cancel();
            } catch {
                // ignore
            }

            streamReaderRef.current = null;
        }

        // Stop audio
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
            } catch {
                // ignore
            }

            audioRef.current = null;
        }

        // Reset MediaSource
        mediaSourceRef.current = null;
        sourceBufferRef.current = null;
        pendingChunksRef.current = [];
        streamFinishedRef.current = false;
    }, []);

    // -------------------------------------------------------
    // Stop
    // -------------------------------------------------------

    const stop = useCallback(() => {
        teardown();
        setStatus("idle");
    }, [teardown]);

    // -------------------------------------------------------
    // Add chunk to SourceBuffer
    // -------------------------------------------------------

    
    // -------------------------------------------------------
    // Process pending chunks
    // -------------------------------------------------------

    const processPendingChunks = useCallback(() => {
        const sourceBuffer = sourceBufferRef.current;

        if (!sourceBuffer || sourceBuffer.updating) {
            return;
        }

        const next = pendingChunksRef.current.shift();

        if (!next) {
            if (
                streamFinishedRef.current &&
                mediaSourceRef.current?.readyState === "open"
            ) {
                try {
                    mediaSourceRef.current.endOfStream();
                } catch {
                    // ignore
                }
            }

            return;
        }

        try {
            sourceBuffer.appendBuffer(next.chunk);

            const cleanup = () => {
                sourceBuffer.removeEventListener(
                    "updateend",
                    cleanup
                );

                next.resolve();

                processPendingChunks();
            };

            sourceBuffer.addEventListener("updateend", cleanup, {
                once: true,
            });
        } catch (err) {
            next.reject(err);
        }
    }, []);

    const appendChunk = useCallback((chunk) => {
        return new Promise((resolve, reject) => {
            const sourceBuffer = sourceBufferRef.current;

            if (!sourceBuffer) {
                reject(new Error("Audio source buffer is not available."));
                return;
            }

            const append = () => {
                try {
                    sourceBuffer.appendBuffer(chunk);
                } catch (err) {
                    reject(err);
                    return;
                }

                const cleanup = () => {
                    sourceBuffer.removeEventListener("updateend", cleanup);
                    sourceBuffer.removeEventListener("error", onError);
                    resolve();
                };

                const onError = (event) => {
                    sourceBuffer.removeEventListener(
                        "updateend",
                        cleanup
                    );
                    sourceBuffer.removeEventListener("error", onError);
                    reject(event);
                };

                sourceBuffer.addEventListener("updateend", cleanup, {
                    once: true,
                });

                sourceBuffer.addEventListener("error", onError, {
                    once: true,
                });
            };

            if (sourceBuffer.updating) {
                pendingChunksRef.current.push({
                    chunk,
                    resolve,
                    reject,
                });
            } else {
                append();
            }
        });
    }, []);


    // -------------------------------------------------------
    // Speak
    // -------------------------------------------------------

    // const speak = useCallback(
    //     async ({
    //         bookId,
    //         pageId,
    //         text,
    //         voiceId: vid,
    //         language,
    //     }) => {
    //         teardown();

    //         setError("");
    //         setVoiceId(vid);
    //         setStatus("loading");

    //         const myReq = reqIdRef.current;

    //         try {
    //             const key = `${bookId}/${pageId}/${vid}/${language || "english"}`;

    //             // =================================================
    //             // CACHE HIT
    //             // =================================================

    //             const cachedUrl = blobUrlCache.current.get(key);

    //             if (cachedUrl) {
    //                 if (myReq !== reqIdRef.current) {
    //                     return;
    //                 }

    //                 const audio = new Audio(cachedUrl);

    //                 audioRef.current = audio;

    //                 audio.onended = () => {
    //                     if (myReq === reqIdRef.current) {
    //                         setStatus("idle");
    //                     }
    //                 };

    //                 audio.onerror = () => {
    //                     if (myReq === reqIdRef.current) {
    //                         setError("Couldn't play the audio.");
    //                         setStatus("idle");
    //                     }
    //                 };

    //                 await audio.play();

    //                 if (myReq === reqIdRef.current) {
    //                     setStatus("playing");
    //                 }

    //                 return;
    //             }

    //             // =================================================
    //             // BROWSER SUPPORT
    //             // =================================================

    //             if (!window.MediaSource) {
    //                 throw new Error(
    //                     "Streaming audio is not supported in this browser."
    //                 );
    //             }

    //             /*
    //              * Your backend must return an MP3 stream.
    //              *
    //              * Browser support for MediaSource + MP3 varies.
    //              */
    //             const mimeType = "audio/mpeg";

    //             if (!MediaSource.isTypeSupported(mimeType)) {
    //                 throw new Error(
    //                     "This browser does not support streaming MP3 audio."
    //                 );
    //             }

    //             // =================================================
    //             // CREATE MEDIA SOURCE
    //             // =================================================

    //             const mediaSource = new MediaSource();

    //             mediaSourceRef.current = mediaSource;

    //             const audio = new Audio();

    //             audioRef.current = audio;

    //             audio.preload = "auto";

    //             const mediaUrl = URL.createObjectURL(mediaSource);

    //             audio.src = mediaUrl;

    //             // -------------------------------------------------
    //             // Audio events
    //             // -------------------------------------------------

    //             audio.onended = () => {
    //                 if (myReq === reqIdRef.current) {
    //                     setStatus("idle");
    //                 }
    //             };

    //             audio.onerror = () => {
    //                 if (myReq === reqIdRef.current) {
    //                     setError("Couldn't play the audio.");
    //                     setStatus("idle");
    //                 }
    //             };

    //             // =================================================
    //             // MEDIA SOURCE OPEN
    //             // =================================================

    //             await new Promise((resolve, reject) => {
    //                 const handleOpen = () => {
    //                     mediaSource.removeEventListener(
    //                         "sourceopen",
    //                         handleOpen
    //                     );

    //                     resolve();
    //                 };

    //                 const handleError = (event) => {
    //                     mediaSource.removeEventListener(
    //                         "sourceopen",
    //                         handleOpen
    //                     );

    //                     reject(event);
    //                 };

    //                 mediaSource.addEventListener(
    //                     "sourceopen",
    //                     handleOpen
    //                 );

    //                 mediaSource.addEventListener(
    //                     "error",
    //                     handleError,
    //                     { once: true }
    //                 );
    //             });

    //             if (myReq !== reqIdRef.current) {
    //                 URL.revokeObjectURL(mediaUrl);
    //                 return;
    //             }

    //             // =================================================
    //             // SOURCE BUFFER
    //             // =================================================

    //             const sourceBuffer =
    //                 mediaSource.addSourceBuffer(mimeType);

    //             sourceBufferRef.current = sourceBuffer;

    //             // =================================================
    //             // FETCH STREAM
    //             // =================================================

    //             const controller = new AbortController();

    //             abortRef.current = controller;

    //             const res = await fetch(`${API_BASE}/api/tts`, {
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                     Authorization: `Bearer ${
    //                         localStorage.getItem("wb_token") || ""
    //                     }`,
    //                 },
    //                 body: JSON.stringify({
    //                     bookId,
    //                     pageId,
    //                     text,
    //                     voiceId: vid,
    //                     language,
    //                 }),
    //                 signal: controller.signal,
    //             });

    //             if (!res.ok) {
    //                 const detail = await res
    //                     .json()
    //                     .catch(() => ({}));

    //                 throw new Error(
    //                     detail.error ||
    //                         "Couldn't generate the voice. Please try again."
    //                 );
    //             }

    //             if (!res.body) {
    //                 throw new Error(
    //                     "The TTS server did not return an audio stream."
    //                 );
    //             }

    //             const reader = res.body.getReader();

    //             streamReaderRef.current = reader;

    //             // =================================================
    //             // READ STREAM
    //             // =================================================

    //             let hasStartedPlaying = false;

    //             while (true) {
    //                 if (myReq !== reqIdRef.current) {
    //                     try {
    //                         await reader.cancel();
    //                     } catch {
    //                         // ignore
    //                     }

    //                     return;
    //                 }

    //                 const { done, value } =
    //                     await reader.read();

    //                 if (done) {
    //                     break;
    //                 }

    //                 if (!value || value.length === 0) {
    //                     continue;
    //                 }

    //                 /*
    //                  * Copy Uint8Array because the browser may reuse
    //                  * the underlying stream buffer.
    //                  */
    //                 const chunk = value.slice();

    //                 // Wait until SourceBuffer is available
    //                 if (sourceBuffer.updating) {
    //                     await new Promise((resolve) => {
    //                         const handleUpdate = () => {
    //                             sourceBuffer.removeEventListener(
    //                                 "updateend",
    //                                 handleUpdate
    //                             );

    //                             resolve();
    //                         };

    //                         sourceBuffer.addEventListener(
    //                             "updateend",
    //                             handleUpdate,
    //                             { once: true }
    //                         );
    //                     });
    //                 }

    //                 if (myReq !== reqIdRef.current) {
    //                     return;
    //                 }

    //                 sourceBuffer.appendBuffer(chunk);

    //                 /*
    //                  * Start playback as soon as the first chunk
    //                  * has been appended.
    //                  */
    //                 if (!hasStartedPlaying) {
    //                     await new Promise((resolve) => {
    //                         const handleUpdate = () => {
    //                             sourceBuffer.removeEventListener(
    //                                 "updateend",
    //                                 handleUpdate
    //                             );

    //                             resolve();
    //                         };

    //                         sourceBuffer.addEventListener(
    //                             "updateend",
    //                             handleUpdate,
    //                             { once: true }
    //                         );
    //                     });

    //                     if (myReq !== reqIdRef.current) {
    //                         return;
    //                     }

    //                     try {
    //                         await audio.play();

    //                         hasStartedPlaying = true;

    //                         if (myReq === reqIdRef.current) {
    //                             setStatus("playing");
    //                         }
    //                     } catch (playError) {
    //                         console.error(
    //                             "Audio play error:",
    //                             playError
    //                         );

    //                         throw new Error(
    //                             "Browser blocked audio playback. Please click the play button again."
    //                         );
    //                     }
    //                 }
    //             }

    //             streamFinishedRef.current = true;

    //             // End MediaSource after final chunk
    //             if (
    //                 mediaSource.readyState === "open" &&
    //                 !sourceBuffer.updating
    //             ) {
    //                 try {
    //                     mediaSource.endOfStream();
    //                 } catch {
    //                     // ignore
    //                 }
    //             }

    //             streamReaderRef.current = null;

    //             /*
    //              * IMPORTANT:
    //              *
    //              * We intentionally don't store this streamed response
    //              * in blobUrlCache because it wasn't collected into a
    //              * complete Blob.
    //              *
    //              * Your backend handles server-side caching.
    //              */
    //         } catch (err) {
    //             console.error("TTS error:", err);

    //             if (
    //                 err?.name === "AbortError" ||
    //                 myReq !== reqIdRef.current
    //             ) {
    //                 return;
    //             }

    //             setError(
    //                 err?.message ||
    //                     "Something went wrong with the voice."
    //             );

    //             setStatus("idle");
    //         }
    //     },
    //     [teardown]
    // );

    const speak = useCallback(
        async ({
            bookId,
            pageId,
            text,
            voiceId: vid,
            language,
        }) => {
            teardown();

            setError("");
            setVoiceId(vid);
            setStatus("loading");

            const myReq = reqIdRef.current;

            try {
                const key = `${bookId}/${pageId}/${vid}/${language || "english"}`;

                // =================================================
                // CACHE HIT
                // =================================================

                const cachedUrl = blobUrlCache.current.get(key);

                if (cachedUrl) {
                    if (myReq !== reqIdRef.current) {
                        return;
                    }

                    console.log("TTS CACHE HIT", {
                        bookId,
                        pageId,
                        voiceId: vid,
                        language,
                    });

                    const audio = new Audio(cachedUrl);

                    audioRef.current = audio;

                    audio.onended = () => {
                        if (myReq === reqIdRef.current) {
                            setStatus("idle");
                        }
                    };

                    audio.onerror = () => {
                        if (myReq === reqIdRef.current) {
                            setError("Couldn't play the audio.");
                            setStatus("idle");
                        }
                    };

                    await audio.play();

                    if (myReq === reqIdRef.current) {
                        setStatus("playing");
                    }

                    return;
                }

                // =================================================
                // BROWSER SUPPORT
                // =================================================

                if (!window.MediaSource) {
                    throw new Error(
                        "Streaming audio is not supported in this browser."
                    );
                }

                const mimeType = "audio/mpeg";

                if (!MediaSource.isTypeSupported(mimeType)) {
                    throw new Error(
                        "This browser does not support streaming MP3 audio."
                    );
                }

                // =================================================
                // CREATE MEDIA SOURCE
                // =================================================

                const mediaSource = new MediaSource();

                mediaSourceRef.current = mediaSource;

                const audio = new Audio();

                audioRef.current = audio;
                audio.preload = "auto";

                const mediaUrl = URL.createObjectURL(mediaSource);

                audio.src = mediaUrl;

                // -------------------------------------------------
                // Audio events
                // -------------------------------------------------

                audio.onended = () => {
                    if (myReq === reqIdRef.current) {
                        console.log("TTS AUDIO ENDED");
                        setStatus("idle");
                    }

                    URL.revokeObjectURL(mediaUrl);
                };

                audio.onerror = () => {
                    if (myReq === reqIdRef.current) {
                        console.error("TTS AUDIO PLAYBACK ERROR");

                        setError("Couldn't play the audio.");
                        setStatus("idle");
                    }

                    URL.revokeObjectURL(mediaUrl);
                };

                // =================================================
                // MEDIA SOURCE OPEN
                // =================================================

                await new Promise((resolve, reject) => {
                    const handleOpen = () => {
                        mediaSource.removeEventListener(
                            "sourceopen",
                            handleOpen
                        );

                        resolve();
                    };

                    const handleError = (event) => {
                        mediaSource.removeEventListener(
                            "sourceopen",
                            handleOpen
                        );

                        reject(event);
                    };

                    mediaSource.addEventListener(
                        "sourceopen",
                        handleOpen
                    );

                    mediaSource.addEventListener(
                        "error",
                        handleError,
                        { once: true }
                    );
                });

                if (myReq !== reqIdRef.current) {
                    URL.revokeObjectURL(mediaUrl);
                    return;
                }

                // =================================================
                // SOURCE BUFFER
                // =================================================

                const sourceBuffer =
                    mediaSource.addSourceBuffer(mimeType);

                sourceBufferRef.current = sourceBuffer;

                // =================================================
                // FETCH STREAM
                // =================================================

                const controller = new AbortController();

                abortRef.current = controller;

                console.log("TTS REQUEST STARTED", {
                    bookId,
                    pageId,
                    voiceId: vid,
                    language,
                    textLength: text?.length || 0,
                });

                const requestStart = performance.now();

                const res = await fetch(`${API_BASE}/api/tts`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("wb_token") || ""
                            }`,
                    },
                    body: JSON.stringify({
                        bookId,
                        pageId,
                        text,
                        voiceId: vid,
                        language,
                    }),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const detail = await res
                        .json()
                        .catch(() => ({}));

                    throw new Error(
                        detail.error ||
                        "Couldn't generate the voice. Please try again."
                    );
                }

                if (!res.body) {
                    throw new Error(
                        "The TTS server did not return an audio stream."
                    );
                }

                console.log("TTS RESPONSE RECEIVED", {
                    status: res.status,
                    contentType: res.headers.get("content-type"),
                    contentLength: res.headers.get("content-length"),
                    transferEncoding: res.headers.get(
                        "transfer-encoding"
                    ),
                    timeToResponse: `${(
                        performance.now() - requestStart
                    ).toFixed(0)} ms`,
                });

                const reader = res.body.getReader();

                streamReaderRef.current = reader;

                // =================================================
                // READ STREAM
                // =================================================

                let hasStartedPlaying = false;

                let chunkCount = 0;
                let totalBytes = 0;

                const streamStartTime = performance.now();

                while (true) {
                    if (myReq !== reqIdRef.current) {
                        try {
                            await reader.cancel();
                        } catch {
                            // ignore
                        }

                        return;
                    }

                    const { done, value } = await reader.read();

                    // -------------------------------------------------
                    // STREAM COMPLETE
                    // -------------------------------------------------

                    if (done) {
                        const totalTime =
                            performance.now() - streamStartTime;

                        console.log("=================================");
                        console.log("TTS STREAM COMPLETE");
                        console.log("Chunks:", chunkCount);
                        console.log(
                            "Total bytes:",
                            totalBytes
                        );
                        console.log(
                            "Total time:",
                            `${totalTime.toFixed(0)} ms`
                        );
                        console.log("=================================");

                        break;
                    }

                    if (!value || value.byteLength === 0) {
                        continue;
                    }

                    // -------------------------------------------------
                    // CHUNK RECEIVED
                    // -------------------------------------------------

                    chunkCount++;

                    const chunkSize = value.byteLength;

                    totalBytes += chunkSize;

                    const elapsed =
                        performance.now() - streamStartTime;

                    console.log("TTS CHUNK RECEIVED", {
                        chunk: chunkCount,
                        bytes: chunkSize,
                        totalBytes,
                        elapsed: `${elapsed.toFixed(0)} ms`,
                    });

                    /*
                     * Copy Uint8Array because the stream may reuse
                     * its underlying buffer.
                     */
                    const chunk = value.slice();

                    // -------------------------------------------------
                    // WAIT FOR SOURCE BUFFER
                    // -------------------------------------------------

                    if (sourceBuffer.updating) {
                        await new Promise((resolve) => {
                            const handleUpdate = () => {
                                sourceBuffer.removeEventListener(
                                    "updateend",
                                    handleUpdate
                                );

                                resolve();
                            };

                            sourceBuffer.addEventListener(
                                "updateend",
                                handleUpdate,
                                { once: true }
                            );
                        });
                    }

                    if (myReq !== reqIdRef.current) {
                        return;
                    }

                    // -------------------------------------------------
                    // APPEND CHUNK
                    // -------------------------------------------------

                    try {
                        sourceBuffer.appendBuffer(chunk);
                    } catch (appendError) {
                        console.error(
                            "TTS SourceBuffer append error:",
                            appendError
                        );

                        throw appendError;
                    }

                    // -------------------------------------------------
                    // START PLAYBACK AFTER FIRST CHUNK
                    // -------------------------------------------------

                    if (!hasStartedPlaying) {
                        await new Promise((resolve, reject) => {
                            const handleUpdate = () => {
                                sourceBuffer.removeEventListener(
                                    "updateend",
                                    handleUpdate
                                );

                                sourceBuffer.removeEventListener(
                                    "error",
                                    handleError
                                );

                                resolve();
                            };

                            const handleError = (event) => {
                                sourceBuffer.removeEventListener(
                                    "updateend",
                                    handleUpdate
                                );

                                sourceBuffer.removeEventListener(
                                    "error",
                                    handleError
                                );

                                reject(event);
                            };

                            sourceBuffer.addEventListener(
                                "updateend",
                                handleUpdate,
                                { once: true }
                            );

                            sourceBuffer.addEventListener(
                                "error",
                                handleError,
                                { once: true }
                            );
                        });

                        if (myReq !== reqIdRef.current) {
                            return;
                        }

                        try {
                            await audio.play();

                            hasStartedPlaying = true;

                            console.log(
                                "TTS PLAYBACK STARTED",
                                {
                                    firstChunk: chunkCount,
                                    firstChunkBytes: totalBytes,
                                    timeToPlayback: `${(
                                        performance.now() -
                                        streamStartTime
                                    ).toFixed(0)} ms`,
                                }
                            );

                            if (myReq === reqIdRef.current) {
                                setStatus("playing");
                            }
                        } catch (playError) {
                            console.error(
                                "Audio play error:",
                                playError
                            );

                            throw new Error(
                                "Browser blocked audio playback. Please click the play button again."
                            );
                        }
                    }
                }

                // =================================================
                // STREAM FINISHED
                // =================================================

                streamFinishedRef.current = true;

                if (
                    mediaSource.readyState === "open" &&
                    !sourceBuffer.updating
                ) {
                    try {
                        mediaSource.endOfStream();
                    } catch {
                        // ignore
                    }
                }

                streamReaderRef.current = null;

                console.log("TTS FINISHED", {
                    chunks: chunkCount,
                    totalBytes,
                });

            } catch (err) {
                console.error("TTS error:", err);

                if (
                    err?.name === "AbortError" ||
                    myReq !== reqIdRef.current
                ) {
                    return;
                }

                setError(
                    err?.message ||
                    "Something went wrong with the voice."
                );

                setStatus("idle");
            }
        },
        [teardown]
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
            } catch (err) {
                console.error(
                    "Resume audio error:",
                    err
                );

                setError(
                    "Couldn't resume the audio."
                );
            }
        }
    }, [status]);

    // -------------------------------------------------------
    // Component unmount
    // -------------------------------------------------------

    useEffect(() => {
        return () => {
            teardown();
        };
    }, [teardown]);

    // -------------------------------------------------------
    // Free cached Blob URLs
    // -------------------------------------------------------

    useEffect(() => {
        return () => {
            blobUrlCache.current.forEach((url) => {
                URL.revokeObjectURL(url);
            });

            blobUrlCache.current.clear();
        };
    }, []);

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