# Question Management System

A Next.js application for managing Write From Dictation (WFD) and Repeat Sentence (RS) questions with Firebase integration.

## Features

- Add and manage WFD and RS questions
- Automatic question type detection from question number format
- Filter questions by type (WFD/RS)
- Export questions to CSV format
- Responsive design with TailwindCSS

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- Firebase account

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd wfd-rs
```

2. Install dependencies:
```bash
npm install
```

3. Firebase Setup:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database in your project
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the web icon (</>)
   - Register your app with a nickname
   - Copy the Firebase configuration

4. Environment Configuration:
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Fill in the Firebase configuration values in `.env.local`

5. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### Adding Questions

#### Single Question Input
1. Enter question numbers in the input field (comma-separated)
   - Format for WFD questions: WFD001, WFD002, etc.
   - Format for RS questions: RS001, RS002, etc.
2. Enter the question content
3. Click "Add Question"

#### Bulk Import
1. Click on the "Bulk Import" tab
2. Either:
   - Upload a JSON file, or
   - Paste JSON data directly into the text area
3. Click "Import Questions"

Example JSON format:
```json
[
  {
    "questionNo": "WFD001",
    "content": "The lecture will cover the reason for climate change."
  },
  {
    "questionNo": "RS001",
    "content": "Please close the door when you leave the room."
  }
]
```

### Viewing Questions

- Use the tabs to filter between All, WFD, and RS questions
- Each question displays its number, type, and content

### Exporting Questions

1. Click the "Export CSV" button
2. The questions will be downloaded as a CSV file with the following columns:
   - QuestionNo
   - Type
   - Content

## Project Structure

```
wfd-rs/
├── src/
│   ├── components/
│   │   ├── QuestionInput.tsx
│   │   └── QuestionList.tsx
│   ├── lib/
│   │   └── firebase.ts
│   └── types/
│       └── index.ts
├── app/
│   └── page.tsx
├── .env.local
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
