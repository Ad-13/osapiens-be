import { Repository } from 'typeorm';
import { Workflow } from '../../models/Workflow';
import { TaskStatus, WorkflowStatus } from '../../enums';
import { buildWorkflowReport } from '../../utils';
import { WorkflowFinalResult, WorkflowStatusSummary } from '../../types';
import { Task } from '../../models/Task';

export class WorkflowService {
  constructor(private workflowRepository: Repository<Workflow>) { }

  async refresh(workflowId: string): Promise<void> {
    const workflow = await this.workflowRepository.findOne({
      where: { workflowId },
      relations: ['tasks'],
    });
    if (!workflow) return;

    workflow.status = this.deriveStatus(workflow.tasks);
    this.attachFinalResultIfSettled(workflow);

    await this.workflowRepository.save(workflow);
  }

  async getStatusSummary(workflowId: string): Promise<WorkflowStatusSummary | null> {
    const workflow = await this.workflowRepository.findOne({
      where: { workflowId },
      relations: ['tasks'],
    });

    if (!workflow) return null;

    const totalTasks = workflow.tasks.length;
    const completedTasks = workflow.tasks.filter(
      t => t.status === TaskStatus.Completed
    ).length;

    return {
      workflowId: workflow.workflowId,
      status: workflow.status,
      completedTasks,
      totalTasks,
    };
  }

  async getById(workflowId: string): Promise<Workflow | null> {
    return this.workflowRepository.findOne({ where: { workflowId } });
  }

  private deriveStatus(tasks: Task[]): WorkflowStatus {
    const anyFailed = tasks.some(t => t.status === TaskStatus.Failed);
    const allCompleted = tasks.every(t => t.status === TaskStatus.Completed);
    return anyFailed
      ? WorkflowStatus.Failed
      : allCompleted
        ? WorkflowStatus.Completed
        : WorkflowStatus.InProgress;
  }

  private attachFinalResultIfSettled(workflow: Workflow): void {
    const isSettled = workflow.tasks.every(
      t => t.status === TaskStatus.Completed || t.status === TaskStatus.Failed
    );
    if (!isSettled) return;

    const report = buildWorkflowReport(workflow.workflowId, workflow.tasks);
    const finalResult: WorkflowFinalResult = { ...report, status: workflow.status };
    workflow.finalResult = JSON.stringify(finalResult, null, 2);
    console.log(`Workfow finalReport: ${workflow.finalResult}`);
  }
}
