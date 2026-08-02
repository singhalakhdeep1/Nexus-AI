// MLflow tracking client integration

export interface RunInfo {
  runId: string;
  experimentId: string;
  status: string;
  startTime: number;
  endTime?: number;
  metrics: Record<string, number>;
  params: Record<string, string>;
  tags: Record<string, string>;
}

export interface ExperimentInfo {
  experimentId: string;
  name: string;
  location: string;
  lifecycleStage: string;
}

class MLflowClient {
  private trackingUri: string;
  private apiKey?: string;

  constructor(trackingUri: string, apiKey?: string) {
    this.trackingUri = trackingUri;
    this.apiKey = apiKey;
  }

  // Create an experiment
  async createExperiment(name: string): Promise<string> {
    const response = await fetch(`${this.trackingUri}/api/2.0/mlflow/experiments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    return data.experiment_id;
  }

  // List experiments
  async listExperiments(): Promise<ExperimentInfo[]> {
    const response = await fetch(`${this.trackingUri}/api/2.0/mlflow/experiments/list`, {
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    const data = await response.json();
    return data.experiments.map((exp: any) => ({
      experimentId: exp.experiment_id,
      name: exp.name,
      location: exp.artifact_location,
      lifecycleStage: exp.lifecycle_stage,
    }));
  }

  // Create a run
  async createRun(experimentId: string): Promise<string> {
    const response = await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({ experiment_id: experimentId }),
    });

    const data = await response.json();
    return data.run.info.run_id;
  }

  // Log a parameter
  async logParam(runId: string, key: string, value: string): Promise<void> {
    await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/log-parameter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({ run_id: runId, key, value }),
    });
  }

  // Log a metric
  async logMetric(runId: string, key: string, value: number, timestamp?: number): Promise<void> {
    await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/log-metric`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        run_id: runId,
        key,
        value,
        timestamp: timestamp || Date.now(),
        step: 0,
      }),
    });
  }

  // Log a batch of metrics
  async logMetrics(runId: string, metrics: Record<string, number>): Promise<void> {
    for (const [key, value] of Object.entries(metrics)) {
      await this.logMetric(runId, key, value);
    }
  }

  // Log a tag
  async logTag(runId: string, key: string, value: string): Promise<void> {
    await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/set-tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({ run_id: runId, key, value }),
    });
  }

  // End a run
  async endRun(runId: string, status: string = 'FINISHED'): Promise<void> {
    await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/terminate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({ run_id: runId, status }),
    });
  }

  // Get run info
  async getRun(runId: string): Promise<RunInfo> {
    const response = await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/get?run_id=${runId}`, {
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    const data = await response.json();
    const run = data.run;

    return {
      runId: run.info.run_id,
      experimentId: run.info.experiment_id,
      status: run.info.status,
      startTime: run.info.start_time,
      endTime: run.info.end_time,
      metrics: run.data?.metrics || {},
      params: run.data?.params || {},
      tags: run.data?.tags || {},
    };
  }

  // Search runs
  async searchRuns(experimentIds: string[]): Promise<RunInfo[]> {
    const filter = experimentIds.map((id) => `attributes.experiment_id = '${id}'`).join(' or ');
    
    const response = await fetch(
      `${this.trackingUri}/api/2.0/mlflow/runs/search?filter=${encodeURIComponent(filter)}`,
      {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
      }
    );

    const data = await response.json();
    return data.runs.map((run: any) => ({
      runId: run.info.run_id,
      experimentId: run.info.experiment_id,
      status: run.info.status,
      startTime: run.info.start_time,
      endTime: run.info.end_time,
      metrics: run.data?.metrics || {},
      params: run.data?.params || {},
      tags: run.data?.tags || {},
    }));
  }
}

// Create MLflow client
export function createMLflowClient(trackingUri?: string, apiKey?: string): MLflowClient {
  return new MLflowClient(
    trackingUri || process.env.MLFLOW_TRACKING_URI || 'http://localhost:5000',
    apiKey || process.env.MLFLOW_API_KEY
  );
}
