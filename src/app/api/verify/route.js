import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { extractedText, keyText } = await req.json();

    console.log('Received extractedText:', extractedText);
    console.log('Received keyText:', keyText);

    if (!extractedText) {
      throw new Error('No extracted text provided');
    }

    if (!keyText) {
      throw new Error('No answer key provided');
    }

    // Parse the key text to get the expected answers
    let parsedKey;
    try {
      parsedKey = JSON.parse(keyText);
    } catch (e) {
      throw new Error('Invalid answer key format');
    }

    const prompt = `You are a math assignment grader. Compare the student's answers with the answer key and determine if each answer is correct.

ANSWER KEY:
${parsedKey.map(q => `Question ${q.number}: ${q.text}\nCorrect Answer: ${q.answer}`).join('\n\n')}

STUDENT'S SUBMISSION:
${extractedText}

Analyze each question and return a JSON array with the following structure for each question:
[
  {
    "questionNumber": "1",
    "text": "the question text",
    "studentAnswer": "what the student answered",
    "correctAnswer": "the correct answer from the key",
    "correct": true or false,
    "explanation": "brief explanation of why correct or incorrect"
  }
]

Important:
- Match student answers to questions by question number
- If a student didn't answer a question, mark studentAnswer as "No answer provided"
- Be lenient with formatting differences (e.g., "2" and "2.0" are the same)
- For math expressions, check mathematical equivalence not just string matching
- Return ONLY the JSON array, no other text`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content.trim();

    // Parse the response to ensure it's valid JSON
    let result;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      // Fallback: create a basic comparison result
      result = parsedKey.map(keyQuestion => ({
        questionNumber: keyQuestion.number,
        text: keyQuestion.text,
        studentAnswer: "Could not parse student answer",
        correctAnswer: keyQuestion.answer,
        correct: false,
        explanation: "Unable to automatically grade - manual review required"
      }));
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in /api/verify:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
