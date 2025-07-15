import express from 'express';
import controller from '../controllers/bookings';
import extendBookingController from '../controllers/extendBooking';
const router = express.Router();

router.get('/', controller.healthCheck);
router.post('/api/v1/booking/', controller.createBooking);
router.patch('/api/v1/booking/:id', extendBookingController);

export = router;
