import { config } from "./config";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("Config", () => {
  const originalEnv = process.env;
  let tempDirectory: string;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      NODE_ENV: "test",
    };
    delete require.cache[require.resolve("./config")];
  });

  afterEach(() => {
    process.env = originalEnv;
    if (tempDirectory) {
      rmSync(tempDirectory, { recursive: true, force: true });
      tempDirectory = "";
    }
    jest.clearAllMocks();
  });

  it("should require CLOUDFLARE_TOKEN", () => {
    delete process.env.CLOUDFLARE_TOKEN;
    expect(() => {
      delete require.cache[require.resolve("./config")];
      require("./config");
    }).toThrow();
  });

  it("should use default values", () => {
    process.env.CLOUDFLARE_TOKEN = "test-token";
    delete require.cache[require.resolve("./config")];
    const { config } = require("./config");

    expect(config.app.retryAttempts).toBe(3);
    expect(config.app.retryDelay).toBe(300000);
    expect(config.app.ipCheckInterval).toBe(3600000);
  });

  it("should use environment variables when provided", () => {
    process.env.CLOUDFLARE_TOKEN = "test-token";
    process.env.RETRY_ATTEMPTS = "5";
    process.env.RETRY_DELAY = "60000";
    delete require.cache[require.resolve("./config")];
    const { config } = require("./config");

    expect(config.app.retryAttempts).toBe(5);
    expect(config.app.retryDelay).toBe(60000);
  });

  it("should read the Cloudflare token from the configured file", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "cloudflare-config-"));
    const tokenFile = join(tempDirectory, "cloudflare-token");
    writeFileSync(tokenFile, "file-token\n");
    process.env.CLOUDFLARE_TOKEN_FILE = tokenFile;
    delete process.env.CLOUDFLARE_TOKEN;
    delete require.cache[require.resolve("./config")];

    const { config } = require("./config");

    expect(config.cloudflare.token).toBe("file-token");
  });
});
