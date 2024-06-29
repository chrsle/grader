# Real-time Math Assignment Checker

This project is a web application for processing and verifying student math assignments. Users can upload images of their assignments, and the application will extract text, verify the answers using OpenAI's API, and display the results. This version uses image uploads instead of a live webcam component.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- Upload images of math assignments.
- Extract text from uploaded images using OCR.
- Verify extracted answers using OpenAI's API.
- Display the verification results.

## Installation

1. **Clone the repository:**

   \`\`\`sh
   git clone https://github.com/yourusername/math-assignment-checker.git
   cd math-assignment-checker
   \`\`\`

2. **Install dependencies:**

   \`\`\`sh
   npm install
   \`\`\`

3. **Set up environment variables:**

   Create a \`.env.local\` file in the root directory and add your OpenAI and Supabase keys:

   \`\`\`env
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_KEY=your_supabase_key
   \`\`\`

4. **Start the development server:**

   \`\`\`sh
   npm run dev
   \`\`\`

   The application will be available at \`http://localhost:3000\`.

## Usage

1. **Open the application:**

   Navigate to \`http://localhost:3000\` in your web browser.

2. **Enter details:**

   Fill in the test version, test name, and student name.

3. **Upload image:**

   Click on the "Upload Image" button and select an image of the student's math assignment.

4. **Process image:**

   Click on the "Process Image" button to start the text extraction and verification process.

5. **View results:**

   The extracted text and verification results will be displayed on the page.

## Configuration

### Environment Variables

- \`OPENAI_API_KEY\`: Your OpenAI API key.
- \`NEXT_PUBLIC_SUPABASE_URL\`: Your Supabase project URL.
- \`NEXT_PUBLIC_SUPABASE_KEY\`: Your Supabase project key.

## Project Structure

my-next-app/
├── .env.local
├── README.md
├── next.config.js
├── package.json
├── public/
│   ├── favicon.ico
│   └── vercel.svg
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── page.module.css
│   ├── components/
│   │   └── WebcamCapture.js (currently not used)
│   ├── utils/
│       ├── ocr.js
│       ├── openai.js
│       └── supabase.js
└── yarn.lock

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes or improvements.

## License

This project is licensed under the MIT License.