/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  FEISHU_APP_ID?: string;
  FEISHU_APP_SECRET?: string;
  FEISHU_APP_TOKEN?: string;
  FEISHU_GUEST_TABLE_ID?: string;
  FEISHU_STAFF_TABLE_ID?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env?: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const runtimeEnv = env ?? ({} as Env);
    const runtimeContext = ctx ?? {
      waitUntil() {},
      passThroughOnException() {},
    };

    // Sites supplies hosted runtime values as Worker bindings. Mirror only the
    // five expected server-side settings for route handlers; none are serialized
    // into browser bundles or responses.
    for (const key of [
      "FEISHU_APP_ID",
      "FEISHU_APP_SECRET",
      "FEISHU_APP_TOKEN",
      "FEISHU_GUEST_TABLE_ID",
      "FEISHU_STAFF_TABLE_ID",
    ] as const) {
      if (runtimeEnv[key]) process.env[key] = runtimeEnv[key];
    }

    if (url.pathname === "/_vinext/image" && runtimeEnv.ASSETS && runtimeEnv.IMAGES) {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => runtimeEnv.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await runtimeEnv.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, runtimeEnv, runtimeContext);
  },
};

export default worker;
