import { TaskStatus } from "./enums";
import { Task } from "./models/Task";
import { WorkflowReport, WorkflowReportTask, WorkflowStep } from "./types";

export function resolveDependencies(steps: WorkflowStep[], tasks: Task[]): Task[] {
  const taskByStep = new Map<number, Task>(tasks.map(t => [t.stepNumber, t]));
  const dependents: Task[] = [];

  for (const step of steps) {
    if (step.dependsOn == null) continue;

    if (step.dependsOn >= step.stepNumber) {
      throw new Error(
        `Step ${step.stepNumber} can only depend on a strictly earlier step, but dependsOn=${step.dependsOn}.`
      );
    }

    const task = taskByStep.get(step.stepNumber);
    const dependency = taskByStep.get(step.dependsOn);
    if (!task || !dependency) {
      throw new Error(`Step ${step.stepNumber} depends on unknown step ${step.dependsOn}.`);
    }

    task.dependsOn = dependency;
    dependents.push(task);
  }

  return dependents;
}

export function buildWorkflowReport(workflowId: string, tasks: Task[]): WorkflowReport {
  const ordered = [...tasks].sort((a, b) => a.stepNumber - b.stepNumber);

  const reportTasks: WorkflowReportTask[] = ordered.map(t => ({
    taskId: t.taskId,
    taskType: t.taskType,
    status: t.status,
    output: t.output ? JSON.parse(t.output) : undefined,
    errorMessage: t.errorMessage ?? undefined,
  }));

  const completed = reportTasks.filter(t => t.status === TaskStatus.Completed).length;
  const failed = reportTasks.filter(t => t.status === TaskStatus.Failed).length;

  return {
    workflowId,
    tasks: reportTasks,
    finalReport: `Aggregated ${reportTasks.length} task(s): ${completed} completed, ${failed} failed.`,
  };
}
