import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(req) {
  try {
    const { extractedText } = await req.json();

    if (!extractedText) {
      throw new Error('No extracted text provided');
    }

    const prompt = `The following is a student's math assignment. Please determine if the answers are correct and provide explanations.

    Assignment:
    ${extractedText}

    Response:
    `;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 500,
    });

    return new Response(JSON.stringify({ result: response.data.choices[0].text.trim() }), {
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
