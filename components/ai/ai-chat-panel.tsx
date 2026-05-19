"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface AIChatPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectContext?: string;
}

export function AIChatPanel({ open, onOpenChange, projectContext }: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm NexusAI. I can help you break down features, write task descriptions, plan sprints, and more. What would you like to work on?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        const content = input.trim();
        if (!content || isStreaming) return;

        const userMessage: Message = { id: Date.now().toString(), role: "user", content };
        const assistantId = (Date.now() + 1).toString();
        const assistantMessage: Message = { id: assistantId, role: "assistant", content: "" };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput("");
        setIsStreaming(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
                    projectContext,
                }),
            });

            if (!res.ok) throw new Error("Stream failed");

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") break;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulated += parsed.content;
                                setMessages((prev) =>
                                    prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
                                );
                            }
                        } catch { }
                    }
                }
            }
        } catch (err) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m
                )
            );
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
                <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        NexusAI
                    </SheetTitle>
                </SheetHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3",
                                    message.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === "assistant" && (
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted rounded-tl-sm"
                                    )}
                                >
                                    {message.content || (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Thinking…
                                        </span>
                                    )}
                                </div>
                                {message.role === "user" && (
                                    <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                        <AvatarFallback className="text-xs bg-secondary">
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Suggestions */}
                <div className="px-4 py-2 border-t border-b flex gap-2 overflow-x-auto no-scrollbar">
                    {["Break down this feature", "Write acceptance criteria", "Plan a sprint", "Identify blockers"].map((s) => (
                        <button
                            key={s}
                            className="shrink-0 text-xs px-3 py-1 rounded-full border hover:bg-muted transition-colors whitespace-nowrap"
                            onClick={() => setInput(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="px-4 py-3 flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask NexusAI anything…"
                        disabled={isStreaming}
                        className="flex-1"
                    />
                    <Button
                        size="icon"
                        onClick={sendMessage}
                        disabled={!input.trim() || isStreaming}
                    >
                        {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
