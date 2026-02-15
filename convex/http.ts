import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { callback as googleOauthCallback } from "./connectors/googleOauth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/connectors/google/callback",
  method: "GET",
  handler: googleOauthCallback,
});

export default http;
