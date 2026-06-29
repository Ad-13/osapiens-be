import { Task } from "../../models/Task";
import { WorkflowReport } from "../../types";
import { buildWorkflowReport } from "../../utils";
import { Job } from "../Job";

export class ReportGenerationJob implements Job {
  async run(task: Task): Promise<WorkflowReport> {
    console.log(`\nRunning report generation for task ${task.taskId}...`);

    const workflow = task.workflow;

    const precedingTasks = (workflow?.tasks ?? []).filter(t => t.stepNumber < task.stepNumber);

    const report = buildWorkflowReport(workflow.workflowId, precedingTasks);

    console.log(`Report generation completed: ${JSON.stringify(report, null, 2)}`);

    return report;
  }
}
