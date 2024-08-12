import { Router } from "express";
import { RegisterUser } from "../controllers/users.controllers.js";


const router = Router();
                                               // the link should look like http:localhost:8000/api/v1/users/register 
router.route("/register").post(RegisterUser)  // from here it will go to controller if it is a post request
                                              

export default router