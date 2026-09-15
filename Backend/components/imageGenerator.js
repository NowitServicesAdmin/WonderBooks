import { cloudflareConfig } from "../config/cloudflare.js";

export const generateImage = async (prompt) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${cloudflareConfig.apiToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare image generation failed: ${errorText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    console.log("Generated image size:", imageBuffer.length);

    return imageBuffer;
};