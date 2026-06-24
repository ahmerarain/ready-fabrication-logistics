import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app, initializeApp } from "../server";

let ready = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ready) {
    await initializeApp();
    ready = true;
  }
  return app(req, res);
}
