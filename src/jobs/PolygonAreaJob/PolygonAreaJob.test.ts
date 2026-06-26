import { describe, it, expect } from '@jest/globals';
import { PolygonAreaJob } from './PolygonAreaJob';
import { Task } from '../../models/Task';

function makeTask(geoJson: string): Task {
    const task: Partial<Task> = { taskId: 'test-task-id', geoJson };
    return task as Task;
}

describe('PolygonAreaJob', () => {
    const job = new PolygonAreaJob();

    it('returns positive area for a valid polygon', async () => {
        const square = JSON.stringify({
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        });

        const area = await job.run(makeTask(square));

        expect(typeof area).toBe('number');
        expect(area).toBeGreaterThan(0);
    });

    it('throw an error if geojson is not valid', async () => {
        const task = makeTask('not valid JSON');
        await expect(job.run(task)).rejects.toThrow('Invalid GeoJSON for task test-task-id: input is not a valid GeoJSON object');
    });

    it('throws an error if geojson is not a polygon', async () => {
        const point = JSON.stringify({ type: 'Point', coordinates: [0, 0] });
        await expect(job.run(makeTask(point))).rejects.toThrow('Invalid GeoJSON for task test-task-id: input is not a valid polygon');
    });
});
