import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, s3Config } from "../config/awss3.js";


const joinUrl = (base, key) =>
    `${String(base || "").replace(/\/+$/, "")}/${String(key || "").replace(/^\/+/, "")}`;

export const normalizeS3Url = (url) =>
    typeof url === "string" ? url.replace(/^(https?:\/\/[^/]+)\/{2,}/, "$1/") : url;

export const uploadToS3 = async ({ key, buffer, contentType }) => {
    await s3Client.send(new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType
    }));

    return {
        provider: "s3",
        key,
        url: joinUrl(s3Config.publicUrl, key)
    };
};

export const getFromS3 = async (key) => {
    return s3Client.send(new GetObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key
    }));
};

export const deleteFromS3 = async (key) => {
    await s3Client.send(new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key
    }));
};
