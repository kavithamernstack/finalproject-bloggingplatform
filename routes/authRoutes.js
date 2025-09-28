// routes/authRoutes.js
import { Router } from "express";
import { register, login, myAccount, requestReset, passwordReset } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const route = Router();

route.post("/register", register);
route.post("/login", login);
route.get("/myaccount", protect, myAccount);   // <-- protected
route.get("/profile", protect, myAccount);     // keep profile protected
route.post("/request-reset", requestReset);    // <-- public, user may be logged out
route.post("/reset/:token", passwordReset);

export default route;
