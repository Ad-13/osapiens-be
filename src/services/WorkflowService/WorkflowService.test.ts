import { describe, it, expect } from '@jest/globals';
import { Repository } from 'typeorm';
import { WorkflowService } from './WorkflowService';
import { Workflow } from './../../models/Workflow';
import { Task } from './../../models/Task';
import { TaskStatus, TaskType, WorkflowStatus } from './../../enums';

function makeTask(partial: Partial<Task>): Task {
  return Object.assign(new Task(), partial);
}

function fakeRepo(workflow: Workflow | null) {
  const saves: Workflow[] = [];
  const repo = {
    findOne: async () => workflow,
    save: async (w: Workflow) => { saves.push(w); return w; },
  } as unknown as Repository<Workflow>;
  return { repo, saves };
}

describe('WorkflowService.refresh', () => {
  it('marks the workflow Completed and writes a finalResult when every task completed', async () => {
    const t1 = makeTask({
      taskId: 't1',
      taskType: TaskType.analysis,
      stepNumber: 1,
      status: TaskStatus.Completed,
      output: JSON.stringify('Brazil')
    });
    const t2 = makeTask({
      taskId: 't2',
      taskType: TaskType.polygonArea,
      stepNumber: 2,
      status: TaskStatus.Completed,
      output: JSON.stringify(8363324.27)
    });
    const wf = Object.assign(new Workflow(), { workflowId: 'wf-1', tasks: [t1, t2] });
    const { repo, saves } = fakeRepo(wf);

    await new WorkflowService(repo).refresh('wf-1');

    expect(wf.status).toBe(WorkflowStatus.Completed);
    expect(saves).toHaveLength(1);
    expect(wf.finalResult).toBeDefined();

    const parsed = JSON.parse(wf.finalResult!);
    expect(parsed.status).toBe(WorkflowStatus.Completed);
    expect(parsed.workflowId).toBe('wf-1');
    expect(parsed.tasks).toHaveLength(2);
    expect(parsed.tasks[0].output).toBe('Brazil');
    expect(parsed.tasks[1].output).toBe(8363324.27);
    expect(parsed.finalReport).toContain('2 completed');
  });

  it('marks the workflow Failed (fail-fast) but does NOT write finalResult while tasks are still pending', async () => {
    const failed = makeTask({
      taskId: 'tf',
      taskType: TaskType.polygonArea,
      stepNumber: 1,
      status: TaskStatus.Failed,
      errorMessage: 'input is not a valid polygon'
    });
    const pending = makeTask({
      taskId: 'tq',
      taskType: TaskType.reportGeneration,
      stepNumber: 2,
      status: TaskStatus.Queued
    });
    const wf = Object.assign(new Workflow(), { workflowId: 'wf-2', tasks: [failed, pending] });
    const { repo } = fakeRepo(wf);

    await new WorkflowService(repo).refresh('wf-2');

    expect(wf.status).toBe(WorkflowStatus.Failed);
    expect(wf.finalResult).toBeUndefined();
  });

  it('writes finalResult including failure info once every task has settled (some failed)', async () => {
    const ok = makeTask({
      taskId: 't1',
      taskType: TaskType.analysis,
      stepNumber: 1,
      status: TaskStatus.Completed,
      output: JSON.stringify('Brazil')
    });
    const bad = makeTask({
      taskId: 't2',
      taskType: TaskType.polygonArea,
      stepNumber: 2,
      status: TaskStatus.Failed,
      errorMessage: 'input is not a valid polygon'
    });
    const wf = Object.assign(new Workflow(), { workflowId: 'wf-3', tasks: [ok, bad] });
    const { repo } = fakeRepo(wf);

    await new WorkflowService(repo).refresh('wf-3');

    expect(wf.status).toBe(WorkflowStatus.Failed);
    expect(wf.finalResult).toBeDefined();

    const parsed = JSON.parse(wf.finalResult!);
    expect(parsed.status).toBe(WorkflowStatus.Failed);
    expect(parsed.tasks[1].status).toBe(TaskStatus.Failed);
    expect(parsed.tasks[1].errorMessage).toBe('input is not a valid polygon');
    expect(parsed.tasks[1].output).toBeUndefined();
    expect(parsed.finalReport).toContain('1 completed');
    expect(parsed.finalReport).toContain('1 failed');
  });

  it('stays InProgress and writes no finalResult while a task is still running and none failed', async () => {
    const done = makeTask({
      taskId: 't1',
      taskType: TaskType.analysis,
      stepNumber: 1,
      status: TaskStatus.Completed
    });
    const running = makeTask({
      taskId: 't2',
      taskType: TaskType.polygonArea,
      stepNumber: 2,
      status: TaskStatus.InProgress
    });
    const wf = Object.assign(new Workflow(), { workflowId: 'wf-4', tasks: [done, running] });
    const { repo } = fakeRepo(wf);

    await new WorkflowService(repo).refresh('wf-4');

    expect(wf.status).toBe(WorkflowStatus.InProgress);
    expect(wf.finalResult).toBeUndefined();
  });

  it('does nothing when the workflow does not exist', async () => {
    const { repo, saves } = fakeRepo(null);

    await new WorkflowService(repo).refresh('missing');

    expect(saves).toHaveLength(0);
  });
});
