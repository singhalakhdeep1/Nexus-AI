// CrewAI-inspired multi-agent system

export interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
}

export interface Task {
  id: string;
  description: string;
  expectedOutput: string;
  agentId: string;
}

export class Crew {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();

  // Add an agent to the crew
  addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  // Add a task to the crew
  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  // Execute the crew's tasks
  async execute(): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const [taskId, task] of this.tasks.entries()) {
      const agent = this.agents.get(task.agentId);
      if (!agent) {
        throw new Error(`Agent ${task.agentId} not found for task ${taskId}`);
      }

      const result = await this.executeTask(task, agent);
      results.set(taskId, result);
    }

    return results;
  }

  // Execute a single task with an agent
  private async executeTask(task: Task, agent: Agent): Promise<any> {
    console.log(`Agent ${agent.name} (${agent.role}) executing task: ${task.description}`);

    // Simulate task execution
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      taskId: task.id,
      agentId: agent.id,
      agentName: agent.name,
      result: `Completed: ${task.expectedOutput}`,
      timestamp: new Date().toISOString(),
    };
  }

  // Get all agents
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Get all tasks
  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  // Create a research crew
  static createResearchCrew(): Crew {
    const crew = new Crew();

    const researcher: Agent = {
      id: 'researcher',
      name: 'Researcher',
      role: 'Senior Research Analyst',
      goal: 'Discover cutting-edge developments in AI',
      backstory: 'You are a veteran research analyst with a keen eye for emerging trends.',
      tools: ['search', 'read'],
    };

    const writer: Agent = {
      id: 'writer',
      name: 'Writer',
      role: 'Technical Writer',
      goal: 'Write compelling technical content',
      backstory: 'You are an experienced technical writer who makes complex topics accessible.',
      tools: ['write', 'edit'],
    };

    crew.addAgent(researcher);
    crew.addAgent(writer);

    crew.addTask({
      id: 'research-task',
      description: 'Research latest AI developments',
      expectedOutput: 'A comprehensive report on AI developments',
      agentId: 'researcher',
    });

    crew.addTask({
      id: 'write-task',
      description: 'Write a blog post based on research',
      expectedOutput: 'A well-written blog post',
      agentId: 'writer',
    });

    return crew;
  }
}
