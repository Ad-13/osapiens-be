import type { Feature, GeoJsonObject, Geometry } from "geojson";
import { Task } from "../../models/Task";
import { Job } from "../Job";
import { area } from "@turf/turf";

export class PolygonAreaJob implements Job {
  async run(task: Task): Promise<number> {
    console.log(`Running polygon area calculation for task ${task.taskId}...`);

    let geoJson: GeoJsonObject;

    try {
      geoJson = JSON.parse(task.geoJson);
    } catch {
      throw new Error(`Invalid GeoJSON for task ${task.taskId}: input is not a valid GeoJSON object`);
    }

    const geometryType = geoJson?.type === 'Feature' ? (geoJson as Feature).geometry.type : geoJson.type;

    if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
      throw new Error(`Invalid GeoJSON for task ${task.taskId}: input is not a valid polygon`);
    }

    const areaInSquareMeters = area(geoJson as Geometry | Feature);
    console.log(`Polygon area for task ${task.taskId} is ${areaInSquareMeters} square meters`);

    return areaInSquareMeters;
  }
}
