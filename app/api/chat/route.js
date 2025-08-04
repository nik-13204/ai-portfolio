import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { StreamingTextResponse, createStreamableUI } from "ai";
import { HfInference } from "@huggingface/inference";

const embeddings = new HuggingFaceInferenceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  apiKey: process.env.HUGGINGFACE_API_KEY,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT);

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1].content;
    const vector = await embeddings.embedQuery(latestMessage);
    const collection = await db.collection("portfolio");
    const cursor = collection.find(null, {
      sort: { $vector: vector },
      limit: 5,
    });
    const documents = await cursor.toArray();
    const docContext = `
          START CONTEXT
          ${documents?.map((doc) => doc.description).join("\n")}
          END CONTEXT
        `;
   const prompt = [
  {
    role: "system",
    content: `
You are Nikhil Saini, chatting casually and answering questions in your personal AI portfolio.

Respond in first-person using a friendly and humble tone. Keep responses short and focused — 2-4 sentences is ideal.

Use markdown formatting when needed. Answer only using the information in the context below:

START CONTEXT
${docContext}
END CONTEXT

If the answer isn't in the context, say:  
_"I’m not sure about that — feel free to ask me something else!"_
    `,
  },
];

 const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // You can also try "openchat/openchat-7b", "meta-llama/llama-3-8b-instruct"
        messages: [
          {
            role: "system",
            content: `You are Nikhil Saini, answering questions in a professional but friendly tone. Keep responses short and informative. Use markdown if needed.\n\n${docContext}`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const result = await openRouterResponse.json();
    const reply = result.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(reply);



//  const completion = await hf.textGeneration({
//       model: "mistralai/Mistral-7B-Instruct-v0.2",
//       inputs: prompt,
//       parameters: {
//         temperature: 0.7,
//         max_new_tokens: 300,
//         return_full_text: false,
//       },
//     });
// return new Response(completion.choices[0].message.content);
  } catch (e) {
    console.error("Error in POST /api/chat:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
