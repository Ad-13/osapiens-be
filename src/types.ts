import { TaskType, WorkflowStatus } from "./enums";
import { Task } from "./models/Task";

export interface WorkflowReport {
  workflowId: string;
  tasks: WorkflowReportTask[];
  finalReport: string;
}

export type WorkflowReportTask =
  Pick<Task, "taskId" | "taskType" | "status" | "errorMessage"> & {
    output: unknown;
  };

export interface WorkflowStep {
  taskType: TaskType;
  stepNumber: number;
  dependsOn?: number; // step number
}

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
}

export type WorkflowFinalResult = WorkflowReport & {
  status: WorkflowStatus;
};

export interface WorkflowStatusSummary {
  workflowId: string;
  status: WorkflowStatus;
  completedTasks: number;
  totalTasks: number;
}
