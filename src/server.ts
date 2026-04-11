import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

const handler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request, ...rest: Array<unknown>) {
    if (request.method !== "POST") return handler(request, ...rest);

    // Parse POST body, attach as header, pass through as-is (still a POST)
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());
    const headers = new Headers(request.headers);
    headers.set("x-form-data", JSON.stringify(body));

    return handler(new Request(request.url, { method: "POST", headers }), ...rest);
  },
};
