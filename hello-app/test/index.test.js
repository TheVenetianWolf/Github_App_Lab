import nock from "nock";
import myProbotApp from "../index.js";
import { Probot, ProbotOctokit } from "probot";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import payload from "./fixtures/pull_request.opened.json" with { type: "json" };

import { describe, beforeEach, afterEach, test } from "node:test";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

describe("PR Review Assistant", () => {
  let probot;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults((instanceOptions) => ({
        ...instanceOptions,
        retry: { enabled: false },
        throttle: { enabled: false },
      })),
    });
    probot.load(myProbotApp);
  });

  test("posts a congratulatory review for bite-sized PRs", async () => {
    const mock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          pull_requests: "write",
        },
      })
      .post("/repos/hiimbex/testing-things/pulls/1/reviews", (body) => {
        assert.equal(body.event, "COMMENT");
        assert.match(body.body, /3 files/);
        assert.match(body.body, /42 lines/);
        assert.match(body.body, /Great job/);
        assert.doesNotMatch(body.body, /Warning/);
        return true;
      })
      .reply(200);

    await probot.receive({ name: "pull_request", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("posts a warning review for massive PRs", async () => {
    const largePayload = {
      ...payload,
      pull_request: {
        ...payload.pull_request,
        changed_files: 40,
        additions: 501,
      },
    };

    const mock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          pull_requests: "write",
        },
      })
      .post("/repos/hiimbex/testing-things/pulls/1/reviews", (body) => {
        assert.equal(body.event, "COMMENT");
        assert.match(body.body, /40 files/);
        assert.match(body.body, /501 lines/);
        assert.match(body.body, /Warning/);
        assert.doesNotMatch(body.body, /Great job/);
        return true;
      })
      .reply(200);

    await probot.receive({ name: "pull_request", payload: largePayload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
