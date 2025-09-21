export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    // Only run on client-side (edge runtime)
    const posthog = await import("posthog-js");

    posthog.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST
    });
  }
}
