import { describe, it, expect } from '@jest/globals';
import { ReportGenerationJob } from './ReportGenerationJob';
import { Task } from '../../models/Task';
import { Workflow } from '../../models/Workflow';
import { TaskStatus, TaskType } from '../../enums';

function makeTask(partial: Partial<Task>): Task {
  return Object.assign(new Task(), partial);
}

describe('ReportGenerationJob', () => {
  it('parses and aggregates outputs of preceding completed tasks (excluding itself)', async () => {
    const workflow = Object.assign(new Workflow(), { workflowId: 'wf-1' });
    const t1 = makeTask({
      taskId: 't1',
      taskType: TaskType.analysis,
      stepNumber: 1,
      status: TaskStatus.Completed,
      output: JSON.stringify('Brazil'),
      workflow
    });
    const t2 = makeTask({
      taskId: 't2',
      taskType: TaskType.polygonArea,
      stepNumber: 2,
      status: TaskStatus.Completed,
      output: JSON.stringify(8363324.27),
      workflow
    });
    const report = makeTask({
      taskId: 't3',
      taskType: TaskType.reportGeneration,
      stepNumber: 3,
      status: TaskStatus.InProgress,
      workflow
    });
    workflow.tasks = [t1, t2, report];

    const result = await new ReportGenerationJob().run(report);

    expect(result.workflowId).toBe('wf-1');
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]).toMatchObject({
      taskId: 't1',
      taskType: TaskType.analysis,
      status: TaskStatus.Completed,
      output: 'Brazil'
    });
    expect(result.tasks[1].output).toBe(8363324.27);
    expect(typeof result.tasks[1].output).toBe('number');
    expect(result.finalReport).toContain('2 completed');
  });

  it('surfaces the persisted errorMessage for failed tasks and undefined their output', async () => {
    const workflow = Object.assign(new Workflow(), { workflowId: 'wf-2' });
    const failed = makeTask({
      taskId: 'tf',
      taskType: TaskType.polygonArea,
      stepNumber: 1,
      status: TaskStatus.Failed,
      errorMessage: 'input is not a valid polygon',
      workflow
    });
    const report = makeTask({
      taskId: 'tr',
      taskType: TaskType.reportGeneration,
      stepNumber: 2,
      status: TaskStatus.InProgress,
      workflow
    });
    workflow.tasks = [failed, report];

    const result = await new ReportGenerationJob().run(report);

    expect(result.tasks[0].status).toBe(TaskStatus.Failed);
    expect(result.tasks[0].errorMessage).toBe('input is not a valid polygon');
    expect(result.tasks[0].output).toBeUndefined();
    expect(result.finalReport).toContain('1 failed');
  });

  it('returns an empty task list when there are no preceding tasks', async () => {
    const workflow = Object.assign(new Workflow(), { workflowId: 'wf-4' });
    const report = makeTask({
      taskId: 'only',
      taskType: TaskType.reportGeneration,
      stepNumber: 1,
      status: TaskStatus.InProgress,
      workflow
    });
    workflow.tasks = [report];

    const result = await new ReportGenerationJob().run(report);

    expect(result.tasks).toHaveLength(0);
    expect(result.finalReport).toContain('0 completed');
  });
});
