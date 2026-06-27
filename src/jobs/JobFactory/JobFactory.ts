import { Job } from '../Job';
import { DataAnalysisJob } from '../DataAnalysisJob';
import { EmailNotificationJob } from '../EmailNotificationJob';
import { PolygonAreaJob } from '../PolygonAreaJob';
import { TaskType } from '../../enums';
import { ReportGenerationJob } from '../ReportGenerationJob';

const jobMap: Record<string, () => Job> = {
    [TaskType.analysis]: () => new DataAnalysisJob(),
    [TaskType.notification]: () => new EmailNotificationJob(),
    [TaskType.polygonArea]: () => new PolygonAreaJob(),
    [TaskType.reportGeneration]: () => new ReportGenerationJob(),
};

export function getJobForTaskType(taskType: string): Job {
    const jobFactory = jobMap[taskType];
    if (!jobFactory) {
        throw new Error(`No job found for task type: ${taskType}`);
    }
    return jobFactory();
}
