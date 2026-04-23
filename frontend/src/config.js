// Use localhost in development, production URL in production
export const API_URL =
  import.meta.env.MODE === "development"
    ? (import.meta.env.VITE_DEV_API_URL || "http://localhost:5001")
    : import.meta.env.VITE_API_URL;
