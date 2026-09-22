import multer from "multer";

const storage = multer.memoryStorage();

export const uploadCharacterPhotos = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
}).any();

export const uploadAvatarPhoto = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
}).single("avatar");