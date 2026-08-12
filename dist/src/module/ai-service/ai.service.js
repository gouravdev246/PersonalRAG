import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
async function pdfloader(filepath) {
    const loader = new PDFLoader(filepath, {
        // Optional configuration:
        splitPages: true, // Default: true. Parses each page as a separate document chunk.
    });
    // 2. Load and parse the PDF content
    const docs = await loader.load();
    const fulltext = docs.map((doc) => doc.pageContent).join(" ");
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 200 });
    const texts = await splitter.splitText(fulltext);
    const finalText = texts.map((text, index) => {
        return {
            pageContent: text,
            metadata: {
                source: "Gourav_Personal_RAG_Knowledge_Base.pdf",
                page: index + 1,
            }
        };
    });
    return finalText;
}
export const embeddings = new CohereEmbeddings({
    model: "embed-english-v3.0", // Natively outputs 1024 dimensions!
    apiKey: process.env.COHERE_API_KEY || "cohere_80MPM7UISi61ZpjQ0f3lddU8myQ72Y2UlYcooRPy35bLW1",
});
const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY || "pcsk_3xpUxr_K8pn15MLkxu7tAc2frgN8ti2uQXc9kUMKVahXN3ZmsF5gE87qCWzh5omP2kS8v3",
});
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || "personalrag");
export const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
});
export async function generateEmbeddingStoreDB() {
    console.log("Generate Starting....");
    const targetPdfPath = fs.existsSync(path.resolve(process.cwd(), "public/Gourav_Personal_RAG_Knowledge_Base.pdf"))
        ? path.resolve(process.cwd(), "public/Gourav_Personal_RAG_Knowledge_Base.pdf")
        : path.resolve(import.meta.dirname, "../../../public/Gourav_Personal_RAG_Knowledge_Base.pdf");
    const Document = await pdfloader(targetPdfPath);
    await vectorStore.addDocuments(Document);
    console.log("All Done ... ");
}
export async function searchSimilarity(query, k = 5) {
    const similaritySearchResults = await vectorStore.similaritySearch(query, k);
    return similaritySearchResults;
}
// Call generateEmbeddingStoreDB() manually when indexing new documents
