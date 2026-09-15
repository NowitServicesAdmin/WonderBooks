import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, r2Config } from "../config/r2.js";

export const uploadToR2 = async ({ key, buffer, contentType }) => {
    await r2Client.send(new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType
    }));

    return {
        provider: "r2",
        key,
        url: `${r2Config.publicUrl}/${key}`
    };
};

export const getFromR2 = async (key) => {
    return r2Client.send(new GetObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key
    }));
};

export const deleteFromR2 = async (key) => {
    await r2Client.send(new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key
    }));
};