import nock from "nock";
import myProbotApp from "../index.js";
import { Probot, ProbotOctokit } from "probot";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import payload from "./fixtures/issues.opened.json" with { type: "json" };

import { describe, beforeEach, afterEach, test } from "node:test";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

describe("Bug auto-labeler", () => {
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

  test("adds a bug label when the issue title contains bug", async () => {
    const mock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })
      .post("/repos/hiimbex/testing-things/issues/1/labels", (body) => {
        assert.deepEqual(body, { labels: ["bug"] });
        return true;
      })
      .reply(200);

    await probot.receive({ name: "issues", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("does nothing when the issue title does not contain bug", async () => {
    const nonBugPayload = {
      ...payload,
      issue: {
        ...payload.issue,
        title: "Feature: add dark mode",
      },
    };

    // No GitHub API calls expected — any request would fail nock's disableNetConnect
    await probot.receive({ name: "issues", payload: nonBugPayload });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
