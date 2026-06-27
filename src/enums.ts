export enum TaskStatus {
  Queued = 'queued',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed'
}

export enum TaskType {
  analysis = 'analysis',
  notification = 'notification',
  polygonArea = 'polygonArea',
  reportGeneration = 'reportGeneration'
}

export enum WorkflowStatus {
  Initial = 'initial',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed'
}
