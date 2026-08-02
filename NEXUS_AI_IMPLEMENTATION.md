# Nexus-AI - AI Agent Frameworks Implementation

## Overview
This document describes the AI agent frameworks and ML tools implementation added to Nexus-AI.

## Technologies Added

### 1. LangGraph
- **langgraph** - LangGraph for building stateful agents
- **@langchain/langgraph** - LangChain LangGraph integration

### 2. AutoGPT
- **autogpt** - Autonomous agent framework

### 3. CrewAI
- **crewai** - Multi-agent collaboration framework

### 4. MemGPT
- **memgpt** - Memory-augmented LLM agents

### 5. Semantic Kernel
- **semantic-kernel** - Microsoft Semantic Kernel

### 6. Hugging Face
- **@huggingface/inference** - Hugging Face Inference API
- **@huggingface/transformers** - Transformers.js

### 7. MLflow
- **mlflow** - ML experiment tracking

### 8. Cloudflare Workers
- **@cloudflare/workers-types** - Cloudflare Workers types
- **wrangler** - Cloudflare Workers CLI

## Files Created

### LangGraph
- `lib/langgraph/agent.ts` - LangGraph stateful agent with research, analysis, and synthesis nodes

### AutoGPT
- `lib/autogpt/agent.ts` - AutoGPT-inspired autonomous agent with task planning and execution

### CrewAI
- `lib/crewai/crew.ts` - CrewAI-inspired multi-agent system with agent and task management

### MemGPT
- `lib/memgpt/agent.ts` - MemGPT-inspired memory-augmented agent with conversation and memory management

### Semantic Kernel
- `lib/semantic-kernel/kernel.ts` - Semantic Kernel implementation with plugins, skills, and functions

### Hugging Face
- `lib/huggingface/client.ts` - Hugging Face inference client for text generation, classification, NER, QA, summarization, translation, image classification, zero-shot classification, feature extraction

### MLflow
- `lib/mlflow/client.ts` - MLflow tracking client for experiment management, run tracking, metrics logging

### Cloudflare Workers
- `workers/index.ts` - Cloudflare Worker with health check, text generation, embedding, and cache endpoints
- `wrangler.toml` - Cloudflare Workers configuration

### Deployment
- `vercel.json` - Vercel deployment configuration with environment variables

## Features

### LangGraph Agent
- Stateful agent with message, action, and context channels
- Research, analysis, and synthesis nodes
- Conditional edges for flow control
- Graph compilation and execution

### AutoGPT Agent
- Task planning based on goals
- Dependency-aware task execution
- Memory management
- Performance reflection

### CrewAI System
- Multi-agent collaboration
- Agent and task management
- Role-based agent definitions
- Pre-built research crew template

### MemGPT Agent
- Memory-augmented conversations
- Importance-based memory pruning
- Memory search and retrieval
- Conversation history management
- Reflection and memory updates

### Semantic Kernel
- Plugin and skill system
- Function registration and execution
- Memory integration
- Pre-built text, math, and time skills
- Default kernel with common skills

### Hugging Face Integration
- Text generation with various models
- Text classification and sentiment analysis
- Named entity recognition
- Question answering
- Summarization
- Translation
- Image classification
- Zero-shot classification
- Feature extraction for embeddings

### MLflow Tracking
- Experiment creation and listing
- Run management
- Parameter and metric logging
- Tag management
- Run search and retrieval

### Cloudflare Worker
- Health check endpoint
- Text generation endpoint
- Embedding generation endpoint
- KV cache operations
- D1 database integration

## Usage

### LangGraph
```typescript
import { createAgentGraph, runAgent } from '@/lib/langgraph/agent';

const result = await runAgent('Analyze the latest AI trends');
```

### AutoGPT
```typescript
import { AutoGPTAgent } from '@/lib/autogpt/agent';

const agent = new AutoGPTAgent({
  name: 'ResearchAgent',
  goal: 'Research AI developments',
  constraints: ['Use reliable sources'],
  tools: ['search', 'read'],
});

const tasks = await agent.plan('Research GPT-4');
await agent.executeTask(tasks[0].id);
```

### CrewAI
```typescript
import { Crew } from '@/lib/crewai/crew';

const crew = Crew.createResearchCrew();
const results = await crew.execute();
```

### MemGPT
```typescript
import { MemGPTAgent } from '@/lib/memgpt/agent';

const agent = new MemGPTAgent();
const response = await agent.generateResponse('Tell me about AI');
await agent.reflect();
```

### Semantic Kernel
```typescript
import { SemanticKernel } from '@/lib/semantic-kernel/kernel';

const kernel = SemanticKernel.createDefault();
const result = await kernel.executeFunction('text', 'generation', 'generate', { prompt: 'Hello' });
```

### Hugging Face
```typescript
import { generateText, classifyText, summarizeText } from '@/lib/huggingface/client';

const text = await generateText('gpt2', 'Once upon a time');
const classification = await classifyText('This is great!');
const summary = await summarizeText('Long text...');
```

### MLflow
```typescript
import { createMLflowClient } from '@/lib/mlflow/client';

const client = createMLflowClient();
const experimentId = await client.createExperiment('my-experiment');
const runId = await client.createRun(experimentId);
await client.logMetric(runId, 'accuracy', 0.95);
await client.endRun(runId);
```

## Installation Required

To use these features, run:
```bash
pnpm install
```

This will install all the AI/ML dependencies.

## Notes
- All code is written but packages are not installed (per user request)
- TypeScript errors are expected until packages are installed
- Cloudflare Workers require wrangler CLI
- MLflow requires a tracking server
- Hugging Face API requires API key
- Redis is already configured via Upstash
