import { TaskStatus, TaskType } from "./enums";
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
