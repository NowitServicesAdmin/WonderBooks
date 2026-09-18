
const GB = 1024 * 1024 * 1024;

export const getR2StorageUsage = async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId) {
        throw new Error("CLOUDFLARE_ACCOUNT_ID is missing");
    }

    if (!apiToken) {
        throw new Error("CLOUDFLARE_API_TOKEN is missing");
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/metrics`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json"
        }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(`Failed to get R2 usage: ${JSON.stringify(data)}`);
    }

    const standard = data.result?.standard;
    const payloadSize = standard?.published?.payloadSize ?? standard?.uploaded?.payloadSize ?? 0;
    const metadataSize = standard?.published?.metadataSize ?? standard?.uploaded?.metadataSize ?? 0;
    const totalBytes = Number(payloadSize) + Number(metadataSize);

    return {
        bytes: totalBytes,
        gb: totalBytes / GB
    };
};