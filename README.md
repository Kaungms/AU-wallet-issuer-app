# 🎓 AU Wallet — Issuer Portal

> **Digital Academic Transcript Issuance System for Assumption University**

The **AU Wallet Issuer Portal** is a web-based platform designed for the Assumption University Registrar to manage and issue official digital academic transcripts to students through the **AU Wallet**.

The portal provides a simple workspace for verifying students, reviewing academic records, preparing transcript issuance, and monitoring issued credentials.

---

## ✨ Features

### 📊 Dashboard
Provides the Registrar with an overview of important issuer activities.

- View verified wallet connections
- Monitor recent student verification activity
- Access transcript issuance functions
- View issued transcript records

### 👨‍🎓 Student Data
Search and review student information before preparing a transcript.

- Search student records
- View academic information
- Check wallet connection status
- Continue directly to transcript preparation

### 📄 Individual Transcript Issuance
Prepare an official digital transcript for an individual student.

- Select a student
- Review academic records
- Review transcript semester-by-semester
- Prepare the transcript for issuance

### 👥 Batch Transcript Issuance
Prepare transcripts for multiple graduating students at once.

Students can be filtered by:

- Graduation date
- Faculty
- Major
- Wallet connection status

Only students with a connected AU Wallet can be selected for digital transcript issuance.

### 🗂️ Issued Credentials
Review records of digital transcripts that have already been issued.

Information includes:

- Credential ID
- Student ID
- Major
- Credential type
- Issuance date and time
- Issuance status

### 🔔 Notifications
Provides notifications about important issuer activities, including:

- Student verification
- Transcript issuance failures
- Completed batch issuance
- System activity

### ⚙️ Settings
Manage portal preferences and administrator options.

- Notification preferences
- Portal settings
- Administrator logout

### 🔐 Administrator Authentication
Restricts access to authorized Registrar personnel.

- Administrator login
- Protected portal pages
- Logout functionality

> Authentication is currently configured for frontend development and will be connected to the university authentication service.

---

## 🔄 How It Works

```text
AU Student Database
        │
        ▼
 Find & Verify Student
        │
        ▼
Read Official Academic Record
        │
        ▼
Generate Digital Transcript
        │
        ▼
Sign Digital Transcript
        │
        ▼
Send to Student's AU Wallet
```

The **Registrar acts as the issuer**, while students receive and keep their digital transcripts in their own AU Wallet.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development and build tool |
| JavaScript | Application logic |
| CSS | Interface styling |
| Lucide React | Icons |
| Git & GitHub | Version control and collaboration |

---

## 📁 Project Structure

```text
AU-wallet-issuer-app/
│
├── src/
│   ├── api/
│   │
│   ├── components/
│   │   └── layout/
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── issued-credentials/
│   │   ├── issue-transcript/
│   │   ├── login/
│   │   ├── notifications/
│   │   ├── settings/
│   │   └── student-data/
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── public/
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
```

### 2. Open the project

```bash
cd AU-wallet-issuer-app
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Vite will display the local development address in the terminal.

---

## 🌿 Development Workflow

Development work should be created from the `develop` branch.

```bash
git switch develop
git pull origin develop
git switch -c feature/feature-name
```

After completing a feature:

```bash
git add .
git commit -m "feat: describe the feature"
git push -u origin feature/feature-name
```

Then create a Pull Request:

```text
feature/feature-name
        ↓
     develop
```

---

## 🔒 Security

The Issuer Portal is intended for **authorized Assumption University personnel only**.

The portal should never store a student's wallet private key. Authentication and credential issuance must be validated by the appropriate backend services before production deployment.

---

## 🎯 Project Objective

The AU Wallet Issuer Portal aims to make academic transcript issuance more:

**Efficient · Secure · Verifiable · Accessible · Digital**

while maintaining the Registrar's authority over official university academic records.

---

## 🏫 Assumption University

**AU Wallet — Issuer Portal**

Developed as part of the AU digital credential ecosystem for managing official academic transcript issuance.

---

<p align="center">
  <strong>AU Wallet Issuer Portal</strong><br>
  <sub>Digital Academic Credentials for Assumption University</sub>
</p>