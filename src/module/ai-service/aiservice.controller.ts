import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { vectorStore, searchSimilarity } from "./ai.service.js";

export async function chatwithAI(req: Request, res: Response) {
    try {
        const { user_query } = req.body;
        if (!user_query) {
            return res.status(400).json({ success: false, message: "user_query is required" });
        }
        const searchResults = await searchSimilarity(user_query, 5);

        const formattedContext = searchResults.length > 0
            ? searchResults.map((doc: { pageContent: string }, idx: number) => `[Source Chunk ${idx + 1}]:\n${doc.pageContent}`).join("\n\n---\n\n")
            : "No specific background document chunks were retrieved for this query.";


        const llmAns = await fetch(process.env.BL_API_ENDPOINT!, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.BL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: `You are Gourav's Personal AI Assistant, created to represent Gourav and answer questions about Gourav's background, projects, skills, and experience.

Guidelines:
1. GREETINGS & CASUAL CHAT: Respond warmly and conversationally to greetings (e.g. "Hi", "Hello", "How are you?"), introduce yourself as Gourav's AI Assistant, and invite the user to ask about Gourav's work.
2. KNOWLEDGE RETRIEVAL: Answer questions about Gourav, his projects, skills, or experience using the Context provided below. Synthesize details from the context intelligently to give complete, direct, and well-structured answers.
3. UNKNOWN INFORMATION: If the user asks a question about Gourav or his work that is completely absent from the context, state: "I don't have that specific detail in my knowledge base, but feel free to ask about Gourav's projects or skills!"
4. SAFETY: Do NOT generate malicious code, database injection scripts, or perform database operations. If requested, politely state: "I can't do that."`
                    },
                    {
                        role: "user",
                        content: `Context:\n${formattedContext}\n\nUser Question: ${user_query}`
                    }
                ],
                max_tokens: 600,
                temperature: 0.3,
                stream: false
            }),
        });

        const llmAnsJson = await llmAns.json();
        const llmResponse = llmAnsJson.choices?.[0]?.message?.content || "No response generated";


        const user_message = await prisma.chat.create({
            data: {
                user_query: user_query,
                ai_ans: llmResponse
            }
        })

        return res.status(200).json({
            success: true,
            data: llmResponse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
}



export async function getallchathistory(req: Request, res: Response) {

    const data = await prisma.chat.findMany({
        orderBy: {
            created_at: 'desc'
        }
    })

    return res.status(200).json({
        success: true,
        data: data
    });
}

