import { Router } from 'express';
import {  RegisterUser, 
          loginUser, 
          logoutUser,
          refreshAccessToken,
          changeUserPassword,
          getCurrentUser,
          UpdateAccountDetails,
          updateUserAvatar,
          updateUserCoverImage,
          getUserChannleProfile } from '../controllers/users.controllers.js';

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
router.route('/change-password').post(verifyJWT,changeUserPassword)  //hnadle it latter
router.route('/current-user').get(verifyJWT,getCurrentUser)  //hnadle it latter
router.route('/update-account').patch(verifyJWT,UpdateAccountDetails)  //hnadle it latter
router.route('/avatar').patch(verifyJWT,upload.single('avatar'),updateUserAvatar)
router.route('/cover-image').patch(verifyJWT,upload.single('coverImage'),updateUserCoverImage)
router.route('/c/:username').get(verifyJWT,getUserChannleProfile)


export default router;
