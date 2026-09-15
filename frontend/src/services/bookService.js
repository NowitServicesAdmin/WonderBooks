import api from "../api/axios";

export const createBook = async (message) => {
    try {
        // console.log("Triggering in create book")
        const response = await api.post("/book/create-book", {
            message,
        });
        return response.data;

    } catch (error) {
        console.error(
            "Create book API error:",
            error.response?.data || error.message
        );
        throw error;
    }
};


export const TestImage = async () => {
    try {
        const response = await api.get("/book/image", {
            responseType: "blob"
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