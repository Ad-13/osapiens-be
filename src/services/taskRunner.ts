import { Repository } from 'typeorm';
import { Task } from '../models/Task';
import { getJobForTaskType } from '../jobs/JobFactory';
import { Result } from "../models/Result";
import { TaskStatus } from '../enums';
import { WorkflowService } from './WorkflowService/WorkflowService';

export class TaskRunner {
    constructor(
        private taskRepository: Repository<Task>,
        private workflowService: WorkflowService,
    ) { }

    /**
     * Runs the appropriate job based on the task's type, managing the task's status.
     * @param task - The task entity that determines which job to run.
     * @throws If the job fails, it rethrows the error.
     */
    async run(task: Task): Promise<void> {
        task.status = TaskStatus.InProgress;
        task.progress = 'starting job...';

        try {
            await this.taskRepository.save(task);
            const job = getJobForTaskType(task.taskType);

            console.log(`Starting job ${task.taskType} for task ${task.taskId}...`);

            const resultRepository = this.taskRepository.manager.getRepository(Result);
            const taskResult = await job.run(task);

            console.log(`Job ${task.taskType} for task ${task.taskId} completed successfully.`);

            const result = new Result();
            result.taskId = task.taskId!;
            result.data = JSON.stringify(taskResult ?? null);

            await resultRepository.save(result);

            task.resultId = result.resultId!;
            task.output = JSON.stringify(taskResult ?? null);
            task.status = TaskStatus.Completed;
            task.progress = null;

            await this.taskRepository.save(task);
        } catch (error: any) {
            console.error(`Error running job ${task.taskType} for task ${task.taskId}:`, error);
            task.errorMessage = error?.message ?? String(error);
            task.status = TaskStatus.Failed;
            task.progress = null;
            await this.taskRepository.save(task);

            throw error;
        } finally {
            await this.workflowService.refresh(task.workflow.workflowId);
        }
    }

    async skipDueToFailedDependency(task: Task): Promise<void> {
        task.status = TaskStatus.Failed;
        task.errorMessage = `Skipped: dependency (step ${task.dependsOn?.stepNumber}) failed`;
        task.progress = null;
        await this.taskRepository.save(task);
        await this.workflowService.refresh(task.workflow.workflowId);
    }
}
