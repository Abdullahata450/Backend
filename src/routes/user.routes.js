import { Router } from 'express';
import { RegisterUser } from '../controllers/users.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// Route for registering a user
router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },      // Field for avatar image
        { name: 'coverImage', maxCount: 1 }   // Field for cover image
    ]),
    RegisterUser  // Handle the POST request with RegisterUser controller
);

export default router;
