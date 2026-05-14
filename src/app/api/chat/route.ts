import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, provider, apiKey } = body;

    let apiUrl = "";
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let payload: any = {};

    if (provider === "ollama") {
      apiUrl = "http://127.0.0.1:11434/api/chat";
      payload = {
        model: model || "llama3",
        messages: messages,
        stream: false,
      };
    } else if (provider === "openrouter") {
      if (!apiKey) {
        throw new Error("API Key is required for OpenRouter");
      }
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      
      // Map system messages if necessary or just pass directly
      payload = {
        model: model || "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
        messages: messages,
        stream: false,
      };
    } else if (provider === "custom") {
      if (!apiKey) {
        throw new Error("API Key is required for Cloud APIs");
      }
      // Assuming a generic OpenAI-compatible endpoint if they put a custom one
      // Wait, we need a base URL for custom. Let's just stick to OpenRouter and Ollama for now to keep it simple, 
      // or we can allow Together AI.
      apiUrl = "https://api.together.xyz/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      payload = {
        model: model,
        messages: messages,
        stream: false,
      };
    } else {
      throw new Error("Invalid provider selected");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.error || `API error: ${response.statusText}`);
    }

    let assistantContent = "";
    if (provider === "ollama") {
      assistantContent = data.message?.content || "";
    } else {
      assistantContent = data.choices?.[0]?.message?.content || "";
    }

    return NextResponse.json({
      role: "assistant",
      content: assistantContent,
    });
  } catch (error: any) {
    console.error("Error communicating with AI provider:", error);
    return NextResponse.json(
      { 
        error: "Failed to connect to the model provider.",
        details: error.message
      },
      { status: 500 }
    );
  }
}
