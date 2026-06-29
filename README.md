## Improvements & New Features

This section documents the work added on top of the base challenge.

### Refactoring (foundation)
- Extracted `TaskStatus`, `WorkflowStatus`, and `TaskType` enums into `src/enums.ts`
  to remove inverted dependencies (models no longer import from workers/factories).
- Moved `TaskRunner` into `src/services/` — it is a service-layer orchestrator,
  not a worker.
- Introduced a `WorkflowService` that owns all workflow-lifecycle logic
  (status recomputation and final-result aggregation), keeping `TaskRunner` thin.

### Implemented Tasks
1. **PolygonAreaJob** — calculates polygon area (m²) via `@turf/area`,
   validates GeoJSON, fails the task gracefully on invalid input.
2. **ReportGenerationJob** — aggregates the outputs of all preceding tasks
   into a JSON report.
3. **Interdependent tasks** — a `dependsOn` field (single earlier task).
   Dependencies must reference strictly earlier steps, which makes the
   dependency graph acyclic by construction. A task whose dependency failed
   is auto-failed with a descriptive message.
4. **Workflow finalResult** — once every task settles, an aggregated result
   (including failure information) is persisted to `Workflow.finalResult`.
   Also fixed a bug where a failing final task left the workflow stuck
   `in_progress`.
5. **GET /workflow/:id/status** — workflow progress (completed vs total).
6. **GET /workflow/:id/results** — final aggregated result of a finished workflow.

## Running the Tests

```bash
npm test          # run the full Jest suite
```

Unit tests cover the pure domain logic: dependency resolution
(`resolveDependencies`), report generation, polygon-area calculation, and the workflow service
(status transitions + settle-gated finalResult).

## API Reference

### `POST /analysis`
Creates a workflow from the YAML definition and queues its tasks.

**Request**
```json
{
  "clientId": "client123",
  "geoJson": { "type": "Polygon", "coordinates": [[[ -63.62, -10.31 ], [ -63.62, -10.37 ], [ -63.61, -10.37 ], [ -63.61, -10.31 ], [ -63.62, -10.31 ]]] }
}
```

**Response — `202 Accepted`**
```json
{
  "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
  "message": "Workflow created and tasks queued from YAML definition."
}
```

---

### `GET /workflow/:id/status`
Returns the current progress of a workflow.

**Response — `200 OK`**
```json
{
  "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
  "status": "in_progress",
  "completedTasks": 2,
  "totalTasks": 4
}
```

**Response — `404 Not Found`** (unknown workflow id)
```json
{ "message": "Workflow <id> not found." }
```

---

### `GET /workflow/:id/results`
Returns the aggregated final result of a completed workflow.

**Response — `200 OK`**
```json
{
  "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
  "status": "completed",
  "finalResult": {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "completed",
    "tasks": [
      { "taskId": "...", "taskType": "analysis",         "status": "completed", "output": "Brazil" },
      { "taskId": "...", "taskType": "notification",      "status": "completed", "output": null },
      { "taskId": "...", "taskType": "polygonArea",       "status": "completed", "output": 8363324.27 },
      { "taskId": "...", "taskType": "reportGeneration",  "status": "completed", "output": { "workflowId": "...", "tasks": [], "finalReport": "..." } }
    ],
    "finalReport": "Aggregated 4 task(s): 4 completed, 0 failed."
  }
}
```

**Response — `404 Not Found`** (unknown workflow id)
```json
{ "message": "Workflow <id> not found." }
```

**Response — `400 Bad Request`** (workflow not completed yet)
```json
{
  "message": "Workflow <id> is not completed yet (current status: in_progress).",
  "status": "in_progress"
}
```

## Testing the New Features Manually

Postman:
# 1) create a workflow (capture workflowId from the response)
POST http://localhost:3000/analysis \
  header "Content-Type: application/json" \
  body '{"clientId":"client123","geoJson":{"type":"Polygon","coordinates":[[[-63.62,-10.31],[-63.62,-10.37],[-63.61,-10.37],[-63.61,-10.31],[-63.62,-10.31]]]}}'

# 2) poll status (Task 5)
GET http://localhost:3000/workflow/<WORKFLOW_ID>/status

# 3) results (Task 6): 400 until completed, then 200 with finalResult
GET http://localhost:3000/workflow/<WORKFLOW_ID>/results
