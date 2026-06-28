import { Task } from "./models/Task";
import { WorkflowStep } from "./types";

export function resolveDependencies(steps: WorkflowStep[], tasks: Task[]): Task[] {
  const taskByStep = new Map<number, Task>(tasks.map(t => [t.stepNumber, t]));
  const dependents: Task[] = [];

  for (const step of steps) {
    if (step.dependsOn == null) continue;

    if (step.dependsOn >= step.stepNumber) {
      throw new Error(
        `Step ${step.stepNumber} can only depend on a strictly earlier step, but dependsOn=${step.dependsOn}.`
      );
    }

    const task = taskByStep.get(step.stepNumber);
    const dependency = taskByStep.get(step.dependsOn);
    if (!task || !dependency) {
      throw new Error(`Step ${step.stepNumber} depends on unknown step ${step.dependsOn}.`);
    }

    task.dependsOn = dependency;
    dependents.push(task);
  }

  return dependents;
}
