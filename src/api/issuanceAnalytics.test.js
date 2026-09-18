import test from "node:test";
import assert from "node:assert/strict";
import { buildIssuedStudentSeries, getIssuanceEndYear } from "./issuanceAnalytics.js";

test("joins issued students to academic graduation dates and fills 2020–2025 in ascending order", () => {
  const series = buildIssuedStudentSeries(
    [{ studentNumber: "a" }, { studentNumber: "b" }, { studentNumber: "a" }],
    [{ studentNumber: "a", graduationDate: "2025-05-12" },
      { studentNumber: "b", graduationDate: "2020-01-01" },
      { studentNumber: "not-issued", graduationDate: "2022-01-01" }],
    2025,
  );
  assert.deepEqual(series.map(({ key, count }) => [key, count]), [
    ["2020", 1], ["2021", 0], ["2022", 0], ["2023", 0], ["2024", 0], ["2025", 1],
  ]);
});

test("accounts for outside-range students and missing dates without losing the total", () => {
  const series = buildIssuedStudentSeries(
    ["a", "b", "c", "d"].map((studentNumber) => ({ studentNumber })),
    [{ studentNumber: "a", graduationDate: "2026-01-01" },
      { studentNumber: "b", graduationDate: "2019-12-31" },
      { studentNumber: "c", graduationDate: "2024-02-30" }],
    2025,
  );
  assert.equal(series.slice(0, 6).reduce((sum, group) => sum + group.count, 0), 0);
  assert.equal(series.at(-1).count, 2);
  assert.deepEqual(series.filter((group) => group.outsideRange).map(({ key, count }) => [key, count]), [["2019", 1], ["2026", 1]]);
  assert.equal(series.reduce((sum, group) => sum + group.count, 0), 4);
  assert.equal(buildIssuedStudentSeries([], [], 2025).length, 6);
});

 test("retains both issued students when only one graduation falls in 2020–2025", () => {
  const series = buildIssuedStudentSeries(
    [{ studentNumber: "student-a" }, { studentNumber: "student-b" }],
    [{ studentNumber: "student-a", graduationDate: "2025-05-01" },
      { studentNumber: "student-b", graduationDate: "2026-05-01" }],
    2025,
  );
  assert.equal(series.reduce((sum, group) => sum + group.count, 0), 2);
  assert.equal(series.filter((group) => !group.outsideRange).reduce((sum, group) => sum + group.count, 0), 1);
});

test("chart details retain exact students and all their matching credentials", () => {
  const credentials = [
    { studentNumber: "a", credentialId: "a-1", status: "issued" },
    { studentNumber: "b", credentialId: "b-1", status: "issued" },
    { studentNumber: "a", credentialId: "a-2", status: "issued" },
    { studentNumber: "c", credentialId: "c-1" },
  ];
  const series = buildIssuedStudentSeries(credentials, [
    { studentNumber: "a", fullName: "Student A", graduationDate: "2025-05-01" },
    { studentNumber: "b", fullName: "Student B", graduationDate: "2026-05-01" },
  ]);
  const student = series.find((group) => group.key === "2025").students[0];
  assert.equal(student.fullName, "Student A");
  assert.deepEqual(student.credentials.map((item) => item.credentialId), ["a-1", "a-2"]);
  assert.equal(series.find((group) => group.key === "2026").students[0].studentNumber, "b");
  assert.equal(series.find((group) => group.key === "unknown").students[0].credentials[0].credentialId, "c-1");
  assert.ok(series.every((group) => group.count === group.students.length));
});


test("range advances with the calendar and includes both 2025 and 2026 graduates", () => {
  assert.equal(getIssuanceEndYear(new Date(2026, 11, 31, 23, 59, 59)), 2027);
  assert.equal(getIssuanceEndYear(new Date(2027, 0, 1)), 2028);
  const credentials = [{ studentNumber: "a" }, { studentNumber: "b" }];
  const students = [{ studentNumber: "a", graduationDate: "2025-05-01" },
    { studentNumber: "b", graduationDate: "2026-05-01" }];
  const series = buildIssuedStudentSeries(credentials, students, getIssuanceEndYear(new Date(2026, 8, 18)));
  assert.deepEqual(series.map((group) => group.key), ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027"]);
  assert.equal(series.reduce((sum, group) => sum + group.count, 0), 2);
  assert.equal(series.find((group) => group.key === "2025").count, 1);
  assert.equal(series.find((group) => group.key === "2026").count, 1);
  assert.equal(series.at(-1).count, 0);
  assert.equal(buildIssuedStudentSeries([], []).at(-1).key, String(new Date().getFullYear() + 1));
});
