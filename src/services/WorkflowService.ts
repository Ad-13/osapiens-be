import { Repository } from 'typeorm';
import { Workflow } from '../models/Workflow';
import { TaskStatus, WorkflowStatus } from '../enums';

export class WorkflowService {
    constructor(private workflowRepository: Repository<Workflow>) { }

    async updateStatus(workflowId: string): Promise<void> {
        const workflow = await this.workflowRepository.findOne({
            where: { workflowId },
            relations: ['tasks'],
        });

        if (!workflow) {
            return;
        }

        const allCompleted = workflow.tasks.every(t => t.status === TaskStatus.Completed);
        const anyFailed = workflow.tasks.some(t => t.status === TaskStatus.Failed);

        if (anyFailed) {
            workflow.status = WorkflowStatus.Failed;
        } else if (allCompleted) {
            workflow.status = WorkflowStatus.Completed;
        } else {
            workflow.status = WorkflowStatus.InProgress;
        }

        await this.workflowRepository.save(workflow);
    }
}
