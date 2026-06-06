import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import healthRoute from "./routes/health.route";
import analyzeRoute from "./routes/analyze.route";

export interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", corsMiddleware);

app.route("/health", healthRoute);
app.route("/analyze", analyzeRoute);

app.onError(errorMiddleware);

export default app;
