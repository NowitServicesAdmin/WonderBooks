import api from "../api/axios";

// export const createBook = async (payload) => {
//     try {
//         const response = await api.post("/book/create-book", payload);
//         return response.data;
//     } catch (error) {
//         console.error(
//             "Create book API error:",
//             error.response?.data || error.message
//         );
//         throw error;
//     }
// };

const buildBookFormData = ({
  mode = "manual",
  storySettings,
  characters,
  files = {},
  message,
}) => {
  if (mode !== "manual" && mode !== "ai") {
    throw new Error(`Invalid book mode: ${mode}`);
  }

  const fd = new FormData();
  fd.append("mode", mode);
  if (message) fd.append("message", message);
  fd.append("storySettings", JSON.stringify(storySettings));
  fd.append("characters", JSON.stringify(characters));
  Object.entries(files).forEach(([id, file]) =>
    fd.append(`characterPhoto-${id}`, file),
  );
  return fd;
};

/**
 * Accepts either:
 *  - a ready-made FormData (manual mode builds its own), or
 *  - { mode, storySettings, characters, files, message } (AI chat mode - we
 *    build the FormData; mode is "ai" or "manual", default "manual")
 */
export const createBook = async (input) => {
  const fd = input instanceof FormData ? input : buildBookFormData(input);

  try {
    const response = await api.post("/book/create-book", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Create book API error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const TestImage = async () => {
  try {
    const response = await api.get("/book/image", {
      responseType: "blob",
    });

    console.log(response, "Response@@@");

    const imageUrl = URL.createObjectURL(response.data);

    console.log(imageUrl, "@image URL");

    return imageUrl;
  } catch (error) {
    console.error("Image request error:", error);
    throw error;
  }
};

export const chatBook = async (payload) => {
  try {
    const response = await api.post("/book/chat", payload);
    return response.data;
  } catch (error) {
    console.error(
      "Chat book API error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
export const getMyBooks = async () => {
  const response = await api.get("/book");
  return response.data.books;
};

// Same request, but also returns books that failed to generate and whose
// error the user hasn't been told about yet: { books, failures }.
export const getMyBookList = async () => {
  const response = await api.get("/book");
  return {
    books: response.data.books || [],
    failures: response.data.failures || [],
  };
};

// Mark failure alerts as seen so they aren't shown again.
export const acknowledgeBookFailures = async (ids) => {
  await api.post("/book/failures/ack", { ids });
};

export const getBookById = async (bookId) => {
  const response = await api.get(`/book/${bookId}`);
  return response.data.book;
};

// One image of a book (index: "cover" or the 0-based page number), as a Blob.
export const getBookImageBlob = async (bookId, index) => {
  const response = await api.get(`/book/${bookId}/image/${index}`, {
    responseType: "blob",
  });
  return response.data;
};
