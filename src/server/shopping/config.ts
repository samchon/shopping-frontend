import "server-only";

export const shoppingConfig = {
  apiHost:
    process.env.NEXT_PUBLIC_SHOPPING_API_HOST?.trim() ||
    "http://127.0.0.1:37001",
  channelCode:
    process.env.NEXT_PUBLIC_SHOPPING_CHANNEL_CODE?.trim() || "samchon",
  simulate:
    process.env.NEXT_PUBLIC_SHOPPING_API_SIMULATE?.trim() === "true" ||
    process.env.SHOPPING_API_SIMULATE?.trim() === "true",
};
