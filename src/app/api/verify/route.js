import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { extractedText } = await req.json();
    
    console.log('Received extractedText:', extractedText);

    if (!extractedText) {
      throw new Error('No extracted text provided');
    }

    const prompt = `The following is a student's math assignment. Please determine if the answers are correct and provide explanations.

    Assignment:
    ${extractedText}

    Response:
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    return new Response(JSON.stringify({ result: response.choices[0].message.content.trim() }), {
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