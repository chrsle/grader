// src/utils/openai.js
import openai from 'openai';

openai.apiKey = process.env.OPENAI_API_KEY;

export const verifyAnswers = async (extractedText) => {
  const prompt = `The following is a student's math assignment. Please determine if the answers are correct and provide explanations.

  Assignment:
  ${extractedText}

  Response:
  `;

  const response = await openai.Completion.create({
    engine: 'davinci-codex',
    prompt: prompt,
    max_tokens: 500
  });

  return response.choices[0].text.trim();
};
