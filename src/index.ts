import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import { errorMiddleware } from "./middleware/error";
import healthRoute from "./routes/health";
import analyzeRoute from "./routes/analyze";

export interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", corsMiddleware);
app.use("*", errorMiddleware);

app.route("/health", healthRoute);
app.route("/analyze", analyzeRoute);

export default app;
