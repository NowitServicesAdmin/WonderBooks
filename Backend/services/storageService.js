// import { uploadToR2 } from "./r2Service.js";
// import { uploadToS3 } from "./s3Service.js";
// import { getR2StorageUsage } from "./storageUsageService.js";

// export const getStorageProvider = async () => {
//     const threshold =
//         Number(process.env.R2_STORAGE_THRESHOLD_GB) || 9;

//     const usage = await getR2StorageUsage();

//     console.log(
//         `R2 usage: ${usage.gb.toFixed(3)} GB / ${threshold} GB`
//     );

//     if (usage.gb < threshold) {
//         return {
//             provider: "r2",
//             usage
//         };
//     }

//     return {
//         provider: "s3",
//         usage
//     };
// };

// export const uploadImage = async ({
//     key,
//     buffer,
//     contentType
// }) => {
//     const storage = await getStorageProvider();

//     if (storage.provider === "r2") {
//         return uploadToR2({
//             key,
//             buffer,
//             contentType
//         });
//     }

//     return uploadToS3({
//         key,
//         buffer,
//         contentType
//     });
// };

import { uploadToR2 ,getFromR2} from "./r2Service.js";

export const getStorageProvider = async () => {
    return {
        provider: "r2"
    };
};

export const uploadImage = async ({ key, buffer, contentType }) => {
    return uploadToR2({
        key,
        buffer,
        contentType
    });
};

export const getStorageImage = async (key) => {
    return getFromR2(key);
};
