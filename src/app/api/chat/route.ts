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
        stream: true,
      };
    } else if (provider === "openrouter") {
      if (!apiKey) throw new Error("API Key is required for OpenRouter");
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      payload = {
        model: model || "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
        messages: messages,
        stream: true,
      };
    } else if (provider === "custom") {
      if (!apiKey) throw new Error("API Key is required for Cloud APIs");
      apiUrl = "https://api.together.xyz/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      payload = {
        model: model,
        messages: messages,
        stream: true,
      };
    } else if (provider === "groq") {
      if (!apiKey) throw new Error("API Key is required for Groq");
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      payload = {
        model: model || "mixtral-8x7b-32768",
        messages: messages,
        stream: true,
      };
    } else {
      throw new Error("Invalid provider selected");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.text();
      let errorMsg = `API error: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errData);
        errorMsg = parsed.error?.message || parsed.error || errorMsg;
      } catch (e) {
        errorMsg = errData || errorMsg;
      }
      return NextResponse.json({ error: "API Error", details: errorMsg }, { status: response.status });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (provider === "ollama") {
              if (line.trim() === "") continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.content) {
                  controller.enqueue(new TextEncoder().encode(parsed.message.content));
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            } else {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
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
