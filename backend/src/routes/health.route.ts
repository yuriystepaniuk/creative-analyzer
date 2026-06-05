import { Hono } from "hono";
import type { Env } from "../index";

const health = new Hono<{ Bindings: Env }>();

health.get("/", (c) => c.json({ status: "ok" }));

export default health;
