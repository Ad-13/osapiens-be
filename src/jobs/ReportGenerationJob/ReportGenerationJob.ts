import { TaskStatus } from "../../enums";
import { Task } from "../../models/Task";
import { WorkflowReport } from "../../types";
import { Job } from "../Job";

export class ReportGenerationJob implements Job {
  async run(task: Task): Promise<WorkflowReport> {
    console.log(`\nRunning report generation for task ${task.taskId}...`);

    const workflow = task.workflow;
    const siblings = (workflow?.tasks ?? [])
      .filter(t => t.stepNumber < task.stepNumber)
      .sort((a, b) => a.stepNumber - b.stepNumber);

    const completed = siblings.filter(e => e.status === TaskStatus.Completed).length;
    const failed = siblings.filter(e => e.status === TaskStatus.Failed).length;

    const tasks = siblings.map(t => ({
      taskId: t.taskId,
      taskType: t.taskType,
      status: t.status,
      output: t.output ? JSON.parse(t.output) : undefined,
      errorMessage: t.errorMessage ?? undefined,
    }));

    const report = {
      workflowId: workflow.workflowId,
      tasks,
      finalReport: `Aggregated ${tasks.length} task(s): ${completed} completed, ${failed} failed.`,
    };

    console.log(`Report generation completed: ${JSON.stringify(report, null, 2)}`);

    return report;
  }
}
