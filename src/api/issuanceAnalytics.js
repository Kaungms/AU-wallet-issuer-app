export function getIssuanceEndYear(now = new Date()) {
  return now.getFullYear() + 1;
}

export function buildIssuedStudentSeries(credentials, students, endYear = getIssuanceEndYear()) {
  const years = Array.from({ length: endYear - 2020 + 1 }, (_, index) => ({
    key: String(2020 + index),
    label: String(2020 + index),
    count: 0,
    students: [],
  }));
  const byStudent = new Map(students.map((student) => [student.studentNumber, student]));
  const issuedStudents = new Set(credentials.map((credential) => credential.studentNumber));
  const unknownStudents = [];
  const outsideYears = new Map();

  for (const studentNumber of issuedStudents) {
    const student = {
      ...byStudent.get(studentNumber),
      studentNumber,
      credentials: credentials.filter((credential) => credential.studentNumber === studentNumber),
    };
    const value = student.graduationDate;
    const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value)
      : new Date(NaN);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      unknownStudents.push(student);
      continue;
    }
    const year = date.getUTCFullYear();
    if (year >= 2020 && year <= endYear) {
      years[year - 2020].count += 1;
      years[year - 2020].students.push(student);
    } else {
      if (!outsideYears.has(year)) outsideYears.set(year, []);
      outsideYears.get(year).push(student);
    }
  }

  for (const [year, students] of [...outsideYears].sort(([a], [b]) => a - b)) {
    years.push({ key: String(year), label: String(year), count: students.length, students, outsideRange: true });
  }
  if (unknownStudents.length) years.push({ key: "unknown", label: "Date unavailable", count: unknownStudents.length, students: unknownStudents });
  return years;
}
