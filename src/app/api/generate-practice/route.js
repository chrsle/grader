import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { topic, difficulty, count, missedQuestions } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Generate ${count || 5} practice math problems for the topic "${topic}" at ${difficulty || 'medium'} difficulty level.

${missedQuestions && missedQuestions.length > 0 ? `
Here are some examples of questions students struggled with - generate similar problems:
${missedQuestions.map(q => `- ${q.text} (Correct answer: ${q.correctAnswer})`).join('\n')}
` : ''}

Return ONLY a JSON array with this exact structure:
[
  {
    "number": 1,
    "question": "the math problem text",
    "answer": "the correct answer",
    "hint": "optional hint for students",
    "explanation": "brief explanation of how to solve"
  }
]

Guidelines:
- For ${difficulty} difficulty: ${
  difficulty === 'easy' ? 'use simple numbers and straightforward operations' :
  difficulty === 'hard' ? 'use larger numbers, multi-step problems, or more complex concepts' :
  'use moderate numbers and standard problem formats'
}
- Make problems similar to what students would see in school
- Ensure all answers are mathematically correct
- Return ONLY the JSON array, no other text`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content.trim();

    let problems;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        problems = JSON.parse(jsonMatch[0]);
      } else {
        problems = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(JSON.stringify({ error: 'Failed to generate problems' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ problems }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/generate-practice:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
