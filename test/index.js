import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-10d3953f7b126f0b-ngmd58-45aac55f",
  baseURL: "https://9router-production-8f6a.up.railway.app/v1",
});

const response = await client.chat.completions.create({
  model: "auto",
  messages: [
    {
      role: "user",
      content: "Explain database indexing in simple terms.",
    },
  ],
});

console.log(response.choices[0].message.content);
