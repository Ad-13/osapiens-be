import { AppDataSource } from '../data-source';
import { TaskRunner } from '../services/taskRunner';
import { TaskStatus } from '../enums';
import { Task } from '../models/Task';

export async function taskWorker() {
    const taskRepository = AppDataSource.getRepository(Task);
    const taskRunner = new TaskRunner(taskRepository);

    while (true) {
        const task = await taskRepository.findOne({
            where: { status: TaskStatus.Queued },
            relations: { workflow: { tasks: true } },
            order: { stepNumber: 'ASC' },
        });

        if (task) {
            try {
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
