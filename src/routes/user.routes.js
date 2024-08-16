import { Router } from 'express';
import { RegisterUser, loginUser, logoutUser,refreshAccessToken } from '../controllers/users.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/Auth.middleware.js';

const router = Router();

// Route for registering a user
router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },      // Field for avatar image
        { name: 'coverImage', maxCount: 1 }   // Field for cover image
    ]),
    RegisterUser  // Handle the POST request with RegisterUser controller
);

router.route('/login').post(loginUser);

//secured Route
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/refres-token').post(refreshAccessToken)



export default router;
