import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getAllIssuerStudents } from "./studentDirectory.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("loads all pages in order and preserves search and status values", async () => {
  const requests = [];
  globalThis.fetch = async (url) => {
    const params = new URL(url).searchParams;
    requests.push(params);
    const page = Number(params.get("page"));
    return new Response(JSON.stringify({
      data: { students: [{
        studentNumber: String(page),
        ...(page === 6 ? { credentialStatus: "issued", walletEligibility: "verified" }
          : page === 5 ? { walletEligibility: "verified" } : {}),
      }] },
      message: "Loaded.",
      meta: { totalPages: 6 },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const students = await getAllIssuerStudents({ q: "Kawin", apiBaseUrl: "http://backend.test" });
  assert.deepEqual(students.map((student) => student.studentNumber), ["1", "2", "3", "4", "5", "6"]);
  assert.deepEqual(students.map((student) => student.credentialStatus),
    ["not_verified", "not_verified", "not_verified", "not_verified", "verified", "issued"]);
  assert.ok(requests.every((params) => params.get("q") === "Kawin" && params.get("pageSize") === "100"));
});

test("rejects incomplete results when a later page fails", async () => {
  globalThis.fetch = async (url) => {
    if (new URL(url).searchParams.get("page") === "2") throw new Error("Page failed");
    return new Response(JSON.stringify({ message: "Loaded.", data: { students: [] }, meta: { totalPages: 2 } }),
      { status: 200, headers: { "Content-Type": "application/json" } });
  };
  await assert.rejects(getAllIssuerStudents({ apiBaseUrl: "http://backend.test" }));
});
