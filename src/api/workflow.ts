import { PostbotClient } from './client.js';

export interface WorkflowExecutionResult {
  executionId: string;
  workflowType: string;
  status: string;
  result: Record<string, unknown>;
  steps: Array<{
    stepName: string;
    status: string;
    message: string;
    output?: Record<string, unknown>;
  }>;
  errorMessage?: string;
}

export class WorkflowApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  async executeWorkflow(
    workflowType: string,
    input: Record<string, unknown>,
  ): Promise<WorkflowExecutionResult> {
    const response = await this.client.post<WorkflowExecutionResult>('/workflow/execute', {
      workflowType,
      input,
    });
    return response.data;
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecutionResult> {
    const response = await this.client.get<WorkflowExecutionResult>(`/workflow/execution/${executionId}`);
    return response.data;
  }

  async retryExecution(executionId: string): Promise<WorkflowExecutionResult> {
    const response = await this.client.post<WorkflowExecutionResult>(`/workflow/execution/${executionId}/retry`);
    return response.data;
  }

  async listDefinitions(): Promise<string[]> {
    const response = await this.client.get<string[]>('/workflow/definitions');
    return response.data;
  }
}
