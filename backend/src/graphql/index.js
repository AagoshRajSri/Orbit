import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { typeDefs } from "./typeDefs.js";
import { resolvers } from "./resolvers.js";
import { createLoaders } from "./loaders.js";

/**
 * Extracts and verifies the authenticated user from the incoming HTTP request.
 * Shares the exact zero-trust session validation model used by Orbit REST endpoints.
 *
 * @param {import("express").Request} req
 * @returns {Promise<Object|null>} Authenticated user document or null
 */
export async function authenticateGraphQLRequest(req) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.sessionId || !decoded.userId) return null;

    // Validate active session in database (zero-trust session revocation)
    const activeSession = await Session.findOne({
      _id: decoded.sessionId,
      isValid: true,
    }).lean();

    if (!activeSession) return null;

    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user || user.isLocked) return null;

    return user;
  } catch {
    // Return null on expired or malformed JWT (allows public queries to continue)
    return null;
  }
}

/**
 * Initializes and mounts Apollo Server onto the Express application.
 *
 * @param {import("express").Application} app
 * @returns {Promise<ApolloServer>}
 */
export async function setupGraphQL(app) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        // Authenticate request using Orbit session logic
        const user = await authenticateGraphQLRequest(req);

        // Instantiate isolated DataLoader cache per request
        const loaders = createLoaders();

        return {
          user,
          loaders,
          req,
          res,
        };
      },
    })
  );

  console.log("[GraphQL] Apollo Server v4 mounted at /graphql");
  return server;
}
