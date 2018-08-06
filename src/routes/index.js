import { Router } from 'express';
import authRoutes from './auth';
import controllers from './controllers';

const router = new Router();

router.use( '/auth', authRoutes );

router.get( '/cals', controllers.getCalories );

router.get( '/monthly', controllers.getMonthly );

router.get( '/since', controllers.getDataSince );

export default router;
