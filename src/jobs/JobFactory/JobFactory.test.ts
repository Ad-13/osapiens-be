import { describe, it, expect } from '@jest/globals';
import { getJobForTaskType } from './JobFactory';
import { DataAnalysisJob } from '../DataAnalysisJob';
import { EmailNotificationJob } from '../EmailNotificationJob';
import { PolygonAreaJob } from '../PolygonAreaJob';

describe('getJobForTaskType', () => {
    it('returns DataAnalysisJob for "analysis"', () => {
        expect(getJobForTaskType('analysis')).toBeInstanceOf(DataAnalysisJob);
    });

    it('returns EmailNotificationJob for "notification"', () => {
        expect(getJobForTaskType('notification')).toBeInstanceOf(EmailNotificationJob);
    });

    it('returns PolygonAreaJob for "polygonArea"', () => {
        expect(getJobForTaskType('polygonArea')).toBeInstanceOf(PolygonAreaJob);
    });

    it('throws an error for an unknown task type', () => {
        expect(() => getJobForTaskType('does-not-exist')).toThrow('No job found for task type: does-not-exist');
    });
});
