const DEFAULT_API_BASE_URL = import.meta.env?.VITE_API_BASE_URL;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export class IssuerApiError extends Error {
  constructor(
    message,
    {
      code = "ISSUER_API_ERROR",
      status = 0,
      details = [],
      fieldErrors = {},
    } = {},
  ) {
    super(message);
    this.name = "IssuerApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.fieldErrors = fieldErrors;
  }
}

export async function getIssuerConnectionSummary({ signal, apiBaseUrl } = {}) {
  const envelope = await issuerRequest("/issuer/dashboard/connection-summary", {
    signal,
    apiBaseUrl,
  });

  if (envelope.message !== "Issuer connection summary loaded.") {
    throw invalidResponse("Unexpected connection summary message.");
  }

  const summary = requireObject(envelope.data, "connection summary data");

  if (
    !Number.isInteger(summary.verifiedConnectionCount) ||
    summary.verifiedConnectionCount < 0 ||
    !Array.isArray(summary.recentVerifications)
  ) {
    throw invalidResponse("Connection summary data has an invalid format.");
  }

  summary.recentVerifications.forEach((item) => {
    const verification = requireObject(item, "recent verification");
    requireNonEmptyString(verification.programCode, "programCode");
    requireNonEmptyString(verification.major, "major");
    requireNonEmptyString(verification.verifiedAt, "verifiedAt");
  });

  return summary;
}

export async function getIssuerStudents({
  q = "",
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  signal,
  apiBaseUrl,
} = {}) {
  const normalizedQuery = typeof q === "string" ? q.trim() : "";

  if (normalizedQuery && normalizedQuery.length < 2) {
    throw invalidRequest(
      "Student search must contain at least two characters.",
      "q",
    );
  }

  validatePagination(page, pageSize);

  const envelope = await issuerRequest("/issuer/students", {
    signal,
    apiBaseUrl,
    query: {
      q: normalizedQuery || undefined,
      page,
      pageSize,
    },
  });

  if (!Array.isArray(envelope.data?.students)) {
    throw invalidResponse("Issuer student data has an invalid format.");
  }

  return {
    ...envelope.data,
    meta: envelope.meta,
  };
}

export async function getStudentAcademicReview(
  studentNumber,
  { signal, apiBaseUrl } = {},
) {
  const encodedStudentNumber = encodePathSegment(
    studentNumber,
    "studentNumber",
  );

  const envelope = await issuerRequest(
    `/issuer/students/${encodedStudentNumber}/academic-review`,
    { signal, apiBaseUrl },
  );

  requireObject(envelope.data, "academic review data");

  return envelope.data;
}

export async function getStudentAcademicPreview(
  studentNumber,
  { signal, apiBaseUrl } = {},
) {
  const encodedStudentNumber = encodePathSegment(
    studentNumber,
    "studentNumber",
  );

  const envelope = await issuerRequest(
    `/issuer/students/${encodedStudentNumber}/academic-preview`,
    {
      signal,
      apiBaseUrl,
    },
  );

  const preview = requireObject(envelope.data, "academic preview data");

  if (!Array.isArray(preview.terms)) {
    throw invalidResponse("Academic preview terms have an invalid format.");
  }

  if (
    preview.unassignedResults !== undefined &&
    !Array.isArray(preview.unassignedResults)
  ) {
    throw invalidResponse(
      "Academic preview unassigned results have an invalid format.",
    );
  }

  return envelope.data;
}

export async function createAcademicTranscriptVc(
  studentNumber,
  { signal, apiBaseUrl } = {},
) {
  const envelope = await issuerRequest("/vc/academic-transcripts/create", {
    method: "POST",
    signal,
    apiBaseUrl,
    body: {
      studentNumber: requireNonEmptyString(studentNumber, "studentNumber"),
    },
  });

  return requireObject(envelope.data, "academic transcript VC data");
}

export async function getGraduatingStudents({
  graduationYear,
  graduationDate,
  facultyCode,
  programCode,
  signal,
  apiBaseUrl,
} = {}) {
  let finalYear = graduationYear;

  if (typeof finalYear === "string" && finalYear.trim() !== "") {
    finalYear = parseInt(finalYear, 10);
  }

  if (finalYear !== undefined && !Number.isNaN(finalYear)) {
    if (!Number.isInteger(finalYear)) {
      throw invalidRequest(
        "graduationYear must be an integer.",
        "graduationYear",
      );
    }
  } else if (graduationDate !== undefined) {
    validateDate(graduationDate, "graduationDate");
  }

  const envelope = await issuerRequest("/issuer/graduating-students", {
    signal,
    apiBaseUrl,
    query: {
      graduationYear: finalYear,
      graduationDate,
      facultyCode: requireNonEmptyString(facultyCode, "facultyCode"),
      programCode: requireNonEmptyString(programCode, "programCode"),
    },
  });

  if (!Array.isArray(envelope.data?.students)) {
    throw invalidResponse("Graduating student data has an invalid format.");
  }

  return envelope.data;
}

export async function getIssuerPrograms({
  facultyCode,
  signal,
  apiBaseUrl,
} = {}) {
  const envelope = await issuerRequest("/issuer/programs", {
    signal,
    apiBaseUrl,
    query: {
      facultyCode: requireNonEmptyString(facultyCode, "facultyCode"),
    },
  });

  if (!Array.isArray(envelope.data?.programs)) {
    throw invalidResponse("Issuer program options have an invalid format.");
  }

  return envelope.data;
}

export async function resolveWalletEligibility(
  studentNumbers,
  { signal, apiBaseUrl } = {},
) {
  if (!Array.isArray(studentNumbers) || studentNumbers.length < 1) {
    throw invalidRequest(
      "Provide at least one student number.",
      "studentNumbers",
    );
  }

  if (studentNumbers.length > 100) {
    throw invalidRequest(
      "Provide no more than 100 student numbers.",
      "studentNumbers",
    );
  }

  const normalizedStudentNumbers = studentNumbers.map((studentNumber) =>
    requireNonEmptyString(studentNumber, "studentNumbers"),
  );

  if (
    new Set(normalizedStudentNumbers).size !== normalizedStudentNumbers.length
  ) {
    throw invalidRequest("Student numbers must be unique.", "studentNumbers");
  }

  const envelope = await issuerRequest(
    "/issuer/students/wallet-eligibility:resolve",
    {
      method: "POST",
      signal,
      apiBaseUrl,
      body: { studentNumbers: normalizedStudentNumbers },
    },
  );

  if (!Array.isArray(envelope.data?.results)) {
    throw invalidResponse("Wallet eligibility data has an invalid format.");
  }

  envelope.data.results.forEach((result) => {
    if (
      !isPlainObject(result) ||
      !["verified", "not_verified"].includes(result.status)
    ) {
      throw invalidResponse("Wallet eligibility status has an invalid format.");
    }
  });

  return envelope.data;
}

async function issuerRequest(
  path,
  {
    method = "GET",
    query,
    body,
    signal,
    apiBaseUrl = DEFAULT_API_BASE_URL,
  } = {},
) {
  const url = buildApiUrl(apiBaseUrl, path, query);
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new IssuerApiError("The issuer API could not be reached.", {
      code: "NETWORK_ERROR",
    });
  }

  const responseBody = await parseJsonResponse(response);

  if (!response.ok) {
    const meta = isPlainObject(responseBody?.meta) ? responseBody.meta : {};
    const errorData = isPlainObject(responseBody?.error)
      ? responseBody.error
      : {};
    const details = Array.isArray(errorData.details) ? errorData.details : [];

    throw new IssuerApiError(
      typeof errorData.message === "string"
        ? errorData.message
        : typeof responseBody?.message === "string"
          ? responseBody.message
          : `Issuer API request failed with status ${response.status}.`,
      {
        code:
          typeof errorData.code === "string" && errorData.code
            ? errorData.code
            : typeof meta.code === "string" && meta.code
              ? meta.code
              : "ISSUER_API_REQUEST_FAILED",
        status: response.status,
        details,
        fieldErrors: isPlainObject(meta.fieldErrors) ? meta.fieldErrors : {},
      },
    );
  }

  if (
    !isPlainObject(responseBody) ||
    !("data" in responseBody) ||
    typeof responseBody.message !== "string" ||
    !isPlainObject(responseBody.meta)
  ) {
    throw invalidResponse(
      "Issuer API response envelope has an invalid format.",
    );
  }

  return responseBody;
}

async function parseJsonResponse(response) {
  const responseText = await response.text();

  if (!responseText) {
    if (response.ok) {
      throw invalidResponse("Issuer API returned an empty response.");
    }

    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw invalidResponse("Issuer API returned invalid JSON.");
  }
}

function buildApiUrl(apiBaseUrl, path, query = {}) {
  const baseUrl = requireNonEmptyString(apiBaseUrl, "VITE_API_BASE_URL", {
    code: "API_BASE_URL_REQUIRED",
    message: "VITE_API_BASE_URL is not configured.",
  }).replace(/\/+$/, "");

  let url;

  try {
    url = new URL(`${baseUrl}/${path.replace(/^\/+/, "")}`);
  } catch {
    throw invalidRequest(
      "VITE_API_BASE_URL must be a valid absolute URL.",
      "apiBaseUrl",
    );
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function encodePathSegment(value, fieldName) {
  return encodeURIComponent(requireNonEmptyString(value, fieldName));
}

function requireNonEmptyString(value, fieldName, override = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw new IssuerApiError(override.message ?? `${fieldName} is required.`, {
      code: override.code ?? "INVALID_REQUEST",
      fieldErrors: { [fieldName]: "Required" },
    });
  }

  return value.trim();
}

function validatePagination(page, pageSize) {
  if (!Number.isInteger(page) || page < 1) {
    throw invalidRequest("page must be a positive integer.", "page");
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw invalidRequest(
      `pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}.`,
      "pageSize",
    );
  }
}

function validateDate(value, fieldName) {
  const normalizedValue = requireNonEmptyString(value, fieldName);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw invalidRequest(`${fieldName} must use YYYY-MM-DD format.`, fieldName);
  }
}

function requireObject(value, label) {
  if (!isPlainObject(value)) {
    throw invalidResponse(`Issuer API ${label} has an invalid format.`);
  }

  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidRequest(message, fieldName) {
  return new IssuerApiError(message, {
    code: "INVALID_REQUEST",
    fieldErrors: fieldName ? { [fieldName]: message } : {},
  });
}

function invalidResponse(message) {
  return new IssuerApiError(message, { code: "INVALID_API_RESPONSE" });
}
