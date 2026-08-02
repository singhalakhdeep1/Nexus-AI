// MemGPT-inspired memory-augmented agent

export interface Memory {
  id: string;
  content: string;
  importance: number;
  timestamp: Date;
  tags: string[];
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class MemGPTAgent {
  private memories: Memory[] = [];
  private conversation: Message[] = [];
  private memoryLimit = 100;

  // Add a memory
  addMemory(content: string, importance: number = 0.5, tags: string[] = []): void {
    const memory: Memory = {
      id: `mem-${Date.now()}-${Math.random()}`,
      content,
      importance,
      timestamp: new Date(),
      tags,
    };

    this.memories.push(memory);

    // Prune memories if over limit
    if (this.memories.length > this.memoryLimit) {
      this.memories.sort((a, b) => b.importance - a.importance);
      this.memories = this.memories.slice(0, this.memoryLimit);
    }
  }

  // Search memories
  searchMemories(query: string, limit: number = 5): Memory[] {
    const lowerQuery = query.toLowerCase();
    return this.memories
      .filter((m) => m.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  // Get relevant memories for context
  getRelevantMemories(query: string): string {
    const relevant = this.searchMemories(query, 3);
    return relevant.map((m) => m.content).join('\n');
  }

  // Add message to conversation
  addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.conversation.push({
      role,
      content,
      timestamp: new Date(),
    });
  }

  // Get conversation history
  getConversationHistory(limit: number = 10): Message[] {
    return this.conversation.slice(-limit);
  }

  // Generate response with memory
  async generateResponse(userMessage: string): Promise<string> {
    this.addMessage('user', userMessage);

    // Get relevant memories
    const relevantMemories = this.getRelevantMemories(userMessage);
    const conversationHistory = this.getConversationHistory(5);

    // In a real implementation, this would use an LLM
    const response = this.simulateLLMResponse(userMessage, relevantMemories, conversationHistory);

    this.addMessage('assistant', response);

    // Store important information as memory
    if (userMessage.length > 50) {
      this.addMemory(userMessage, 0.7, ['user_input']);
    }

    return response;
  }

  // Simulate LLM response
  private simulateLLMResponse(
    userMessage: string,
    memories: string,
    history: Message[]
  ): string {
    return `Based on our conversation history and relevant memories, here's my response to: "${userMessage}"`;
  }

  // Reflect on conversation and update memories
  async reflect(): Promise<void> {
    const recentMessages = this.getConversationHistory(20);
    
    // Extract important information
    for (const msg of recentMessages) {
      if (msg.content.length > 100) {
        this.addMemory(msg.content, 0.6, ['reflection']);
      }
    }
  }

  // Get all memories
  getAllMemories(): Memory[] {
    return [...this.memories];
  }

  // Clear conversation
  clearConversation(): void {
    this.conversation = [];
  }

  // Clear memories
  clearMemories(): void {
    this.memories = [];
  }
}
