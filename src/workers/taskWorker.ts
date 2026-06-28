import { AppDataSource } from '../data-source';
import { TaskRunner } from '../services/taskRunner';
import { TaskStatus } from '../enums';
import { Task } from '../models/Task';
import { Workflow } from '../models/Workflow';
import { WorkflowService } from '../services/WorkflowService';

export async function taskWorker() {
    const taskRepository = AppDataSource.getRepository(Task);
    const workflowRepository = AppDataSource.getRepository(Workflow);
    const workflowService = new WorkflowService(workflowRepository);
    const taskRunner = new TaskRunner(taskRepository, workflowService);

    while (true) {
        const task = await taskRepository.findOne({
            where: { status: TaskStatus.Queued },
            relations: { dependsOn: true, workflow: { tasks: true } },
            order: { stepNumber: 'ASC' },
        });

        if (task) {
            try {
                const dependency = task.dependsOn;
                if (dependency?.status === TaskStatus.Failed) {
                    await taskRunner.skipDueToFailedDependency(task);
                    console.log(`Skipped: dependency (step ${dependency.stepNumber}) failed.`);
                    continue;
                }
                if (dependency && dependency.status !== TaskStatus.Completed) {
                    console.log(`Task ${task.taskId} is waiting for task for step ${dependency.stepNumber} to complete.`);
                    continue;
                }
                await taskRunner.run(task);
            } catch (error) {
                console.error('Task execution failed. Task status has already been updated by TaskRunner.');
                console.error(error);
            }
        }

        // Wait before checking for the next task again
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}
