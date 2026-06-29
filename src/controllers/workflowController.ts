import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Workflow } from '../models/Workflow';
import { WorkflowService } from '../services/WorkflowService';
import { WorkflowStatus } from '../enums';

function getService(): WorkflowService {
  return new WorkflowService(AppDataSource.getRepository(Workflow));
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const summary = await getService().getStatusSummary(id);
    if (!summary) {
      res.status(404).json({ message: `Workflow ${id} not found.` });
      return;
    }
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({ message: 'Failed to fetch workflow status' });
  }
}

export async function getResults(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const workflow = await getService().getById(id);
    if (!workflow) {
      res.status(404).json({ message: `Workflow ${id} not found.` });
      return;
    }
    if (workflow.status !== WorkflowStatus.Completed) {
      res.status(400).json({
        message: `Workflow ${id} is not completed yet (current status: ${workflow.status}).`,
        status: workflow.status,
      });
      return;
    }
    res.status(200).json({
      workflowId: workflow.workflowId,
      status: workflow.status,
      finalResult: workflow.finalResult ? JSON.parse(workflow.finalResult) : null,
    });
  } catch (error) {
    console.error('Error fetching workflow results:', error);
    res.status(500).json({ message: 'Failed to fetch workflow results' });
  }
}
