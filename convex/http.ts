import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { callback as googleOauthCallback } from "./connectors/googleOauth";
import { callback as githubOauthCallback } from "./connectors/githubOauth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/connectors/google/callback",
  method: "GET",
  handler: googleOauthCallback,
});

http.route({
  path: "/connectors/github/callback",
  method: "GET",
  handler: githubOauthCallback,
});

export default http;
