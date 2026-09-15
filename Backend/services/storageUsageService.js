const GB = 1024 * 1024 * 1024;

export const getR2StorageUsage = async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/metrics`,
        {
            headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get R2 usage: ${errorText}`);
    }

    const data = await response.json();

    const standard = data.result?.standard;

    const payloadSize =
        standard?.published?.payloadSize ??
        standard?.uploaded?.payloadSize ??
        0;

    return {
        bytes: payloadSize,
        gb: payloadSize / GB
    };
};