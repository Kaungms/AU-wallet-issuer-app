import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  createAcademicTranscriptVc,
  getGraduatingStudents,
  getIssuerConnectionSummary,
  getIssuerPrograms,
  getIssuerStudents,
  getStudentAcademicPreview,
  getStudentAcademicReview,
  resolveWalletEligibility,
} from "./issuerApi.js";

const API_BASE_URL = "http://backend.test:3000";
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("loads the accepted dashboard contract without an Authorization header", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };

    return jsonResponse({
      data: {
        verifiedConnectionCount: 0,
        recentVerifications: [],
      },
      message: "Issuer connection summary loaded.",
      meta: {},
    });
  };

  const result = await getIssuerConnectionSummary({
    apiBaseUrl: API_BASE_URL,
  });

  assert.deepEqual(result, {
    verifiedConnectionCount: 0,
    recentVerifications: [],
  });
  assert.equal(
    request.url,
    "http://backend.test:3000/issuer/dashboard/connection-summary",
  );
  assert.equal("Authorization" in request.options.headers, false);
  assert.equal(request.options.headers.Accept, "application/json");
});

test("uses programCode for graduating-student batch search", async () => {
  let requestUrl;
  globalThis.fetch = async (url) => {
    requestUrl = new URL(url);

    return jsonResponse({
      data: { students: [] },
      message: "Graduating students loaded.",
      meta: {},
    });
  };

  const result = await getGraduatingStudents({
    graduationDate: "2026-05-24",
    facultyCode: "VMES",
    programCode: "SYN-VMES-CS",
    apiBaseUrl: API_BASE_URL,
  });

  assert.deepEqual(result, { students: [] });
  assert.equal(requestUrl.searchParams.get("facultyCode"), "VMES");
  assert.equal(requestUrl.searchParams.get("programCode"), "SYN-VMES-CS");
  assert.equal(requestUrl.searchParams.has("majorCode"), false);
});

test("loads program options for the selected faculty", async () => {
  let requestUrl;
  globalThis.fetch = async (url, options) => {
    requestUrl = new URL(url);

    assert.equal("Authorization" in options.headers, false);

    return jsonResponse({
      data: {
        programs: [
          {
            facultyCode: "VMES",
            facultyName:
              "Vincent Mary School of Engineering, Science and Technology",
            programCode: "SYN-VMES-AIT",
            degreeName: "Bachelor of Science",
            major: "Applied Informatics",
            majorConcentration: "Information Technology",
          },
        ],
      },
      message: "Issuer program options loaded.",
      meta: {},
    });
  };

  const result = await getIssuerPrograms({
    facultyCode: "VMES",
    apiBaseUrl: API_BASE_URL,
  });

  assert.equal(requestUrl.pathname, "/issuer/programs");
  assert.equal(requestUrl.searchParams.get("facultyCode"), "VMES");
  assert.equal(result.programs.length, 1);
  assert.equal(result.programs[0].programCode, "SYN-VMES-AIT");
});

test("builds the student list, review, and preview routes without extra calls", async () => {
  const requestUrls = [];
  globalThis.fetch = async (url) => {
    requestUrls.push(url);

    let data = { studentNumber: "6512345" };

    if (url.includes("/issuer/students?")) {
      data = { students: [] };
    } else if (url.endsWith("/academic-preview")) {
      data = { studentNumber: "6512345", terms: [] };
    }

    return jsonResponse({
      data,
      message: "Loaded.",
      meta: {},
    });
  };

  await getIssuerStudents({
    q: "6512345",
    apiBaseUrl: API_BASE_URL,
  });
  await getStudentAcademicReview("6512345", {
    apiBaseUrl: API_BASE_URL,
  });
  await getStudentAcademicPreview("6512345", {
    apiBaseUrl: API_BASE_URL,
  });

  assert.equal(
    requestUrls[0],
    "http://backend.test:3000/issuer/students?q=6512345&page=1&pageSize=25",
  );
  assert.equal(
    requestUrls[1],
    "http://backend.test:3000/issuer/students/6512345/academic-review",
  );
  assert.equal(
    requestUrls[2],
    "http://backend.test:3000/issuer/students/6512345/academic-preview",
  );
  assert.equal(requestUrls.length, 3);
});

test("creates an academic transcript VC for the selected student", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };

    return jsonResponse({
      data: {
        credentialId: "vc_123",
        studentNumber: "6499002",
      },
      message: "Academic transcript VC created.",
      meta: {},
    });
  };

  const result = await createAcademicTranscriptVc("6499002", {
    apiBaseUrl: API_BASE_URL,
  });

  assert.deepEqual(result, {
    credentialId: "vc_123",
    studentNumber: "6499002",
  });
  assert.equal(
    request.url,
    "http://backend.test:3000/vc/academic-transcripts/create",
  );
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers["Content-Type"], "application/json");
  assert.equal("Authorization" in request.options.headers, false);
  assert.deepEqual(JSON.parse(request.options.body), {
    studentNumber: "6499002",
  });
});

test("sends unique student numbers to wallet eligibility resolution", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };

    return jsonResponse({
      data: {
        results: [
          { studentNumber: "6512345", status: "not_verified" },
          { studentNumber: "6512346", status: "verified" },
        ],
      },
      message: "Wallet eligibility resolved.",
      meta: {},
    });
  };

  const result = await resolveWalletEligibility(["6512345", "6512346"], {
    apiBaseUrl: API_BASE_URL,
  });

  assert.deepEqual(result, {
    results: [
      { studentNumber: "6512345", status: "not_verified" },
      { studentNumber: "6512346", status: "verified" },
    ],
  });
  assert.equal(
    request.url,
    "http://backend.test:3000/issuer/students/wallet-eligibility:resolve",
  );
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers["Content-Type"], "application/json");
  assert.equal("Authorization" in request.options.headers, false);
  assert.deepEqual(JSON.parse(request.options.body), {
    studentNumbers: ["6512345", "6512346"],
  });
});

test("preserves pagination metadata from the student-list response", async () => {
  globalThis.fetch = async () =>
    jsonResponse({
      data: { students: [] },
      message: "Issuer students loaded.",
      meta: {
        page: 2,
        pageSize: 25,
        total: 40,
        totalPages: 2,
      },
    });

  const result = await getIssuerStudents({
    page: 2,
    apiBaseUrl: API_BASE_URL,
  });

  assert.deepEqual(result, {
    students: [],
    meta: {
      page: 2,
      pageSize: 25,
      total: 40,
      totalPages: 2,
    },
  });
});

test("maps the backend error envelope to IssuerApiError", async () => {
  globalThis.fetch = async () =>
    jsonResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request is invalid.",
          details: [{ field: "page", message: "Must be positive." }],
        },
      },
      400,
    );

  await assert.rejects(
    getIssuerStudents({ apiBaseUrl: API_BASE_URL }),
    (error) => {
      assert.equal(error.name, "IssuerApiError");
      assert.equal(error.status, 400);
      assert.equal(error.code, "VALIDATION_ERROR");
      assert.equal(error.message, "The request is invalid.");
      assert.deepEqual(error.details, [
        { field: "page", message: "Must be positive." },
      ]);
      return true;
    },
  );
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
