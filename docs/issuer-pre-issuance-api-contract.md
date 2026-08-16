# Issuer pre-issuance API contract

This document records the live NestJS routes used by the issuer frontend for
student and academic review before credential issuance.

`SYN-VMES-CS` is a synthetic integration code, not a confirmed official AU
registrar code. The frontend keeps it internally as the `programCode` API
filter, but registrar-facing screens display the human-readable degree, major,
and optional concentration instead (for example, `Bachelor of Science —
Computer Science`). There is no separate `programName` field.

During the controlled development test, requests do not send an
`Authorization` header. Production authentication behavior is outside this
frontend integration. The frontend never receives direct Supabase access or
database credentials.

Successful responses use:

```json
{
  "data": {},
  "message": "Human-readable result.",
  "meta": {}
}
```

## Dashboard

### `GET /issuer/dashboard/connection-summary`

```json
{
  "data": {
    "verifiedConnectionCount": 0,
    "recentVerifications": []
  },
  "message": "Issuer connection summary loaded.",
  "meta": {}
}
```

## Student list and search

### `GET /issuer/students?q=&page=1&pageSize=25`

`q` is optional. A non-empty search contains at least two characters.
Search is case-insensitive and currently checks only student number, first name,
and last name. The API uses the student's latest enrollment by `admissionDate`.
The maximum `pageSize` is 100.

```json
{
  "data": {
    "students": [
      {
        "studentNumber": "6499002",
        "fullName": "Mr Kawin Rattanakul",
        "facultyCode": "VMES",
        "facultyName": "Vincent Mary School of Engineering, Science and Technology",
        "programCode": "SYN-VMES-CS",
        "degreeName": "Bachelor of Science",
        "major": "Computer Science",
        "majorConcentration": null,
        "academicStatus": "graduated",
        "graduationDate": "2026-01-17",
        "walletEligibility": "not_verified"
      }
    ]
  },
  "message": "Issuer students loaded.",
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 1,
    "totalPages": 1
  }
}
```

## Academic review

### `GET /issuer/students/{studentNumber}/academic-review`

```json
{
  "data": {
    "studentNumber": "6499002",
    "fullName": "Mr Kawin Rattanakul",
    "facultyCode": "VMES",
    "facultyName": "Vincent Mary School of Engineering, Science and Technology",
    "programCode": "SYN-VMES-CS",
    "degreeName": "Bachelor of Science",
    "major": "Computer Science",
    "majorConcentration": null,
    "admissionDate": "2022-06-01",
    "academicStatus": "graduated",
    "graduationDate": "2026-01-17",
    "walletEligibility": "not_verified",
    "requiredCredits": 132,
    "creditSummary": {
      "completed": 132,
      "transferred": 0,
      "earned": 132
    },
    "cumulativeGpa": 3.59,
    "graduationStatus": "completed",
    "requirementsFulfilled": true,
    "award": "Academic Distinction"
  },
  "message": "Student academic review loaded.",
  "meta": {}
}
```

Academic review is available for `studying`, `graduated`, `alumni`,
`withdrawn`, and `suspended` students. The UI displays the returned status and
does not infer issuance eligibility. `requirementsFulfilled` and CGPA are stored
values rather than frontend calculations. Graduation fields may be null when no
graduation record exists.

## Academic preview

### `GET /issuer/students/{studentNumber}/academic-preview`

```json
{
  "data": {
    "studentNumber": "6499002",
    "cumulativeGpa": 3.59,
    "totalEarnedCredits": 132,
    "transferCredits": 0,
    "terms": [
      {
        "termCode": "2024/02",
        "termLabel": "Academic Year 2024 Semester 2",
        "academicYear": 2024,
        "semesterNo": 2,
        "gpa": 3.55,
        "earnedCredits": 15,
        "courses": [
          {
            "courseCode": "ITX4509",
            "courseTitle": "Cybersecurity",
            "credits": 3,
            "grade": "A-",
            "resultType": "normal"
          }
        ]
      }
    ],
    "unassignedResults": []
  },
  "message": "Student academic preview loaded.",
  "meta": {}
}
```

Terms are returned newest first by `termCode`, with courses ordered by course
code. Results without a term appear in `unassignedResults`. Supported result
types are `normal`, `transfer`, `seminar`, and `pass_fail`. This route is an
academic course preview, not an issued or certified transcript. The current
backend includes all returned attempts; repeat and in-progress calculation
policy remains future backend work.

## Graduating-student batch search

### `GET /issuer/programs?facultyCode=VMES`

The batch Program dropdown loads its options from this route rather than
deriving them from students. `programCode` is retained as the option value but
is not included in the registrar-facing label.

```json
{
  "data": {
    "programs": [
      {
        "facultyCode": "VMES",
        "facultyName": "Vincent Mary School of Engineering, Science and Technology",
        "programCode": "SYN-VMES-AIT",
        "degreeName": "Bachelor of Science",
        "major": "Applied Informatics",
        "majorConcentration": "Information Technology"
      }
    ]
  },
  "message": "Issuer program options loaded.",
  "meta": {}
}
```

Display labels use `degreeName — major` or `degreeName — major —
majorConcentration`.

### `GET /issuer/graduating-students`

Required query parameters:

- `graduationDate`, using `YYYY-MM-DD`.
- `facultyCode`.
- `programCode`, not `majorCode`.

The response uses the same student fields as the student-list route:

```json
{
  "data": {
    "students": []
  },
  "message": "Graduating students loaded.",
  "meta": {
    "total": 0
  }
}
```

Matching is exact and limited to 100 results; pagination is not yet provided.
A faculty/program mismatch returns HTTP 200 with an empty list. The route does
not currently enforce academic status, requirements, or graduation status. The
future backend-controlled issuance-candidate rule is:

- `academicStatus` is `graduated` or `alumni`.
- `requirementsFulfilled` is `true`.
- `graduationStatus` is `completed`.

Until that rule is enforced, the frontend treats results as selectable review
records and displays their returned status rather than declaring all results
eligible for issuance.

## Wallet eligibility

### `POST /issuer/students/wallet-eligibility:resolve`

Request body, containing 1 to 100 unique student numbers:

```json
{
  "studentNumbers": ["6499002", "0000000"]
}
```

```json
{
  "data": {
    "results": [
      {
        "studentNumber": "6499002",
        "status": "not_verified"
      }
    ]
  },
  "message": "Wallet eligibility resolved.",
  "meta": {}
}
```

The only allowed status values are `verified` and `not_verified`. The frontend
does not receive holder, provider, connection, enrollment, DID, or wallet-account
identifiers.

`verified` requires an `assumption-university` provider connection in verified
state, with a non-null verified enrollment that matches the selected enrollment.
Unknown student numbers intentionally return `not_verified`. Wallet status is a
warning during pre-issuance review and does not block search, academic review,
preview, or student selection. A future issuance integration owns final
wallet-delivery enforcement.

## Database relationships

```text
academic.student.student_id
  -> academic.student_program_enrollment.student_id
academic.student_program_enrollment.program_id
  -> academic.program.program_id
academic.graduation_record.enrollment_id
  -> academic.student_program_enrollment.enrollment_id
academic.course_result.enrollment_id
  -> academic.student_program_enrollment.enrollment_id
academic.course_result.academic_term_id
  -> academic.academic_term.academic_term_id
academic.course_result.course_id
  -> academic.course.course_id
wallet.holder_issuer_connection.verified_enrollment_id
  -> academic.student_program_enrollment.enrollment_id
wallet.holder_issuer_connection.issuer_provider_id
  -> wallet.issuer_provider.issuer_provider_id
```

`graduation_record.enrollment_id` is unique, so an enrollment has at most one
graduation record. The schema permits multiple enrollments per student; the
current controlled dataset has one.

## Database field mapping

- `studentNumber` from `admission_no`.
- `facultyCode` from `program.faculty_code`.
- `facultyName` from `program.faculty_name`.
- `programCode` from `program.program_code`.
- `major` from `program.major`.
- `academicStatus` from `student_program_enrollment.academic_status`.
- `graduationDate` from `graduation_record.graduation_date`.

Academic review fields map as follows:

- `admissionDate` from the selected enrollment admission date.
- `degreeName`, `major`, `majorConcentration`, and `requiredCredits` from the
  selected program.
- completed and transferred credits, stored CGPA, award,
  `requirementsFulfilled`, graduation status, and graduation date from the
  graduation record.
- earned credits are total credits toward the degree, including transfers.

## Status values

- Academic: `studying`, `graduated`, `alumni`, `withdrawn`, `suspended`.
- Graduation: `pending`, `completed`, `rescinded`.
- Wallet connection (backend-only): `pending_verification`, `verified`,
  `rejected`, `disconnected`.
- Wallet eligibility (frontend): `verified`, `not_verified`.

## Errors

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message.",
    "details": []
  }
}
```

Important responses are 400 `VALIDATION_ERROR`, 404
`ISSUER_STUDENT_NOT_FOUND`, and 503 `ISSUER_ACADEMIC_DATA_UNAVAILABLE`. Empty
searches return HTTP 200 with an empty list, and incomplete academic records
return HTTP 200 with nullable fields. HTTP 422 is not currently used.

## Credential issuance boundary

The frontend stops at local single or batch selection. It does not generate,
sign, or issue credentials; perform DID operations; or deliver anything to a
wallet. Final action buttons remain disabled until an issuance integration is
available.
