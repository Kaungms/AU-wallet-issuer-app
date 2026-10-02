import { getIssuerStudents } from "./issuerApi.js";

// Load every search result before applying local status filters and pagination.
export async function getAllIssuerStudents({ q = "", signal, apiBaseUrl } = {}) {
  const fetchPage = (page) => getIssuerStudents({
    q, page, pageSize: 100, signal, apiBaseUrl,
  });
  const first = await fetchPage(1);
  const students = [...first.students];
  const totalPages = first.meta?.totalPages ?? Math.ceil(
    (first.meta?.total ?? students.length) / (first.meta?.pageSize || 100),
  );

  // Bound concurrency to avoid overwhelming the API for large directories.
  for (let page = 2; page <= totalPages; page += 4) {
    signal?.throwIfAborted();
    const pages = await Promise.all(
      Array.from({ length: Math.min(4, totalPages - page + 1) },
        (_, index) => fetchPage(page + index)),
    );
    for (const result of pages) students.push(...result.students);
  }
  signal?.throwIfAborted();
  return students.map((student) => ({
    ...student,
    credentialStatus:
      student.credentialStatus ?? student.walletEligibility ?? "not_verified",
  }));
}
