import { DataAPIClient} from "@datastax/astra-db-ts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import "dotenv/config";
import OpenAI from "openai";
import sampleData from "./sample-data.json" with {type: "json"};

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_KEY
// });

const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    apiKey: process.env.HUGGINGFACE_API_KEY,
  });

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
// const db=client.db(process.env.ASTRA_DB_API_ENDPOINT,{
//     namespace: process.env.ASTRA_DB_NAMESPACE,
// });
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT); 


const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const createCollection = async () => {
    try{
        await db.createCollection("portfolio",{
            vector: {
                dimension: 384,
            },
        });
        console.log("Collection created successfully");
    } catch (error) {
        console.error("Error creating collection:", error);
    }
};

const loadData = async () => {
    const collection = db.collection("portfolio");
    for await (const{id,info,description}of sampleData){
        const chunks = await splitter.splitText(description);
        let i=0;
        for (const chunk of chunks){
            try {
                const vector = await embeddings.embedQuery(chunk);
              
                await collection.insertOne({
                  document_id: id,
                  $vector: vector[0]?.embedding,
                  info,
                  description: chunk,
                });
              } catch (err) {
                console.error("Failed to embed or insert:", err.message);
              }
            i++;
        }
    }
    console.log("Data loaded successfully");
};
const run = async () => {
    await createCollection();
    await loadData();
  };
  
  run();