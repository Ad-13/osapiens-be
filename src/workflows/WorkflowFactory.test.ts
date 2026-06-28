import { describe, it, expect } from '@jest/globals';
import { Task } from '../models/Task';
import { TaskType } from '../enums';
import { WorkflowStep } from '../types';
import { resolveDependencies } from '../utils';

/** Builds a bare Task with just the field resolveDependencies cares about. */
function makeTask(stepNumber: number): Task {
    const task = new Task();
    task.stepNumber = stepNumber;
    return task;
}

describe('resolveDependencies', () => {
    it('sets no dependency and returns an empty list when no step declares dependsOn', () => {
        const steps: WorkflowStep[] = [
            { taskType: TaskType.analysis, stepNumber: 1 },
            { taskType: TaskType.polygonArea, stepNumber: 2 },
        ];
        const tasks = [makeTask(1), makeTask(2)];

        const dependents = resolveDependencies(steps, tasks);

        expect(dependents).toHaveLength(0);
        expect(tasks[0].dependsOn).toBeUndefined();
        expect(tasks[1].dependsOn).toBeUndefined();
    });

    it('wires a linear chain so each task references its declared earlier dependency', () => {
        const steps: WorkflowStep[] = [
            { taskType: TaskType.analysis, stepNumber: 1 },
            { taskType: TaskType.polygonArea, stepNumber: 2, dependsOn: 1 },
            { taskType: TaskType.notification, stepNumber: 3, dependsOn: 2 },
        ];
        const t1 = makeTask(1);
        const t2 = makeTask(2);
        const t3 = makeTask(3);

        const dependents = resolveDependencies(steps, [t1, t2, t3]);

        expect(t1.dependsOn).toBeUndefined();
        expect(t2.dependsOn).toBe(t1);
        expect(t3.dependsOn).toBe(t2);

        expect(dependents).toHaveLength(2);
        expect(dependents).toContain(t2);
        expect(dependents).toContain(t3);
    });

    it('throws when a step depends on a later step (forward reference)', () => {
        const steps: WorkflowStep[] = [
            { taskType: TaskType.analysis, stepNumber: 1, dependsOn: 2 },
            { taskType: TaskType.polygonArea, stepNumber: 2 },
        ];
        const tasks = [makeTask(1), makeTask(2)];

        expect(() => resolveDependencies(steps, tasks)).toThrow(/strictly earlier step/);
    });

    it('throws when a step depends on itself', () => {
        const steps: WorkflowStep[] = [
            { taskType: TaskType.analysis, stepNumber: 1, dependsOn: 1 },
        ];
        const tasks = [makeTask(1)];

        expect(() => resolveDependencies(steps, tasks)).toThrow(/strictly earlier step/);
    });

    it('throws when a step depends on a non-existent earlier step', () => {
        const steps: WorkflowStep[] = [
            { taskType: TaskType.analysis, stepNumber: 1 },
            { taskType: TaskType.notification, stepNumber: 3, dependsOn: 2 }, // step 2 is missing
        ];
        const tasks = [makeTask(1), makeTask(3)];

        expect(() => resolveDependencies(steps, tasks)).toThrow(/unknown step/);
    });
});
