import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
async function pdfloader(filepath) {
    const loader = new PDFLoader(filepath, {
        // Optional configuration:
        splitPages: true, // Default: true. Parses each page as a separate document chunk.
    });
    // 2. Load and parse the PDF content
    const docs = await loader.load();
    const fulltext = docs.map((doc) => doc.pageContent).join(" ");
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 300, chunkOverlap: 100 });
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
export const embeddings = new VoyageEmbeddings({
    modelName: "voyage-3-lite",
    apiKey: process.env.VOYAGE_API_KEY || "pa-PJftugFAiUOLed-Wr-3LNVsulb3htquBX7D54JkLqMC",
});
const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY || "pcsk_3xpUxr_K8pn15MLkxu7tAc2frgN8ti2uQXc9kUMKVahXN3ZmsF5gE87qCWzh5omP2kS8v3"
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
export async function searchSimilarity(query, k = 2) {
    const similaritySearchResults = await vectorStore.similaritySearch(query, k);
    for (const doc of similaritySearchResults) {
        console.log(`* ${doc.pageContent} [${JSON.stringify(doc.metadata)}]`);
    }
    return similaritySearchResults;
}
