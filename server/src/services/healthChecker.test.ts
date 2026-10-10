import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkSiteHealth, deepScanForCompromise, hasBrowserVerificationChallenge } from "./healthChecker.js";

let server: Server;
let port: number;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === "/down") {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("Unavailable");
      return;
    }
    if (req.url === "/redirect") {
      res.writeHead(302, { Location: `http://127.0.0.2:${port}/ok` });
      res.end();
      return;
    }
    if (req.url === "/challenge") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body>Checking your browser before accessing</body></html>");
      return;
    }
    if (req.url === "/keywords") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body>casino gambling poker</body></html>");
      return;
    }
    if (req.url === "/script") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end('<html><script src="https://payload.example.xyz/loader.js"></script></html>');
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><body>Healthy</body></html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "0.0.0.0", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
  port = address.port;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("health checker", () => {
  it("marks a successful response UP and records timing", async () => {
    const result = await checkSiteHealth(`http://127.0.0.1:${port}/ok`);
    expect(result.status).toBe("UP");
    expect(result.httpStatusCode).toBe(200);
    expect(result.responseTimeMs).toBeTypeOf("number");
  });

  it("marks a non-2xx response DOWN", async () => {
    const result = await checkSiteHealth(`http://127.0.0.1:${port}/down`);
    expect(result).toMatchObject({ status: "DOWN", httpStatusCode: 503 });
  });

  it("detects redirect hijacking after removing only www", async () => {
    const result = await checkSiteHealth(`http://127.0.0.1:${port}/redirect`);
    expect(result.status).toBe("COMPROMISED");
    expect(result.errorDetail).toContain("127.0.0.2");
  });

  it("detects browser verification challenges", async () => {
    expect(hasBrowserVerificationChallenge("Please VERIFY YOU ARE HUMAN now")).toBe(true);
    await expect(deepScanForCompromise(`http://127.0.0.1:${port}/challenge`)).resolves.toMatchObject({ status: "DEGRADED" });
  });

  it("requires three distinct suspicious keywords", async () => {
    await expect(deepScanForCompromise(`http://127.0.0.1:${port}/keywords`)).resolves.toMatchObject({ status: "COMPROMISED" });
  });

  it("detects scripts hosted on suspicious TLDs", async () => {
    await expect(deepScanForCompromise(`http://127.0.0.1:${port}/script`)).resolves.toMatchObject({ status: "COMPROMISED" });
  });
});
