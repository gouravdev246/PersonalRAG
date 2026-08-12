import { Router } from "express";
import { chatwithAI  , getallchathistory} from "./aiservice.controller.js";

const router = Router();

router.post("/chat", chatwithAI);
router.get("/chathistory" , getallchathistory )

export default router;
