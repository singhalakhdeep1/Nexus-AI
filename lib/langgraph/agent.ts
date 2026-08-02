import { StateGraph, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

// Define the state interface
interface AgentState {
  messages: BaseMessage[];
  nextAction: string;
  context: Record<string, any>;
}

// Define nodes
async function researchNode(state: AgentState): Promise<Partial<AgentState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  // Simulate research
  return {
    messages: [new AIMessage('Research completed: Found relevant information.')],
    context: { ...state.context, researchData: '...' },
  };
}

async function analysisNode(state: AgentState): Promise<Partial<AgentState>> {
  // Simulate analysis
  return {
    messages: [new AIMessage('Analysis completed: Data processed.')],
    context: { ...state.context, analysisResults: '...' },
  };
}

async function synthesisNode(state: AgentState): Promise<Partial<AgentState>> {
  // Simulate synthesis
  return {
    messages: [new AIMessage('Synthesis completed: Final report generated.')],
    nextAction: 'done',
  };
}

// Define edges
function shouldContinue(state: AgentState): string {
  if (state.nextAction === 'done') {
    return END;
  }
  return 'research';
}

// Create the graph
export function createAgentGraph() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      nextAction: {
        reducer: (x: string, y: string) => y || x,
        default: () => 'research',
      },
      context: {
        reducer: (x: Record<string, any>, y: Record<string, any>) => ({ ...x, ...y }),
        default: () => ({}),
      },
    },
  });

  workflow.addNode('research', researchNode);
  workflow.addNode('analysis', analysisNode);
  workflow.addNode('synthesis', synthesisNode);

  workflow.setEntryPoint('research');
  workflow.addEdge('research', 'analysis');
  workflow.addEdge('analysis', 'synthesis');
  workflow.addConditionalEdges('synthesis', shouldContinue);

  return workflow.compile();
}

// Run the agent
export async function runAgent(input: string) {
  const graph = createAgentGraph();
  const result = await graph.invoke({
    messages: [new HumanMessage(input)],
    nextAction: 'research',
    context: {},
  });

  return result;
}
