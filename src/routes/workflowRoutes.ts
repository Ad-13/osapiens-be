import { Router } from 'express';
import { getResults, getStatus } from '../controllers/workflowController';

const router = Router();

router.get('/:id/status', getStatus);
router.get('/:id/results', getResults);

export default router;
