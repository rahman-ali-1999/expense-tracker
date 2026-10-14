import { Router } from "express";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Saare expense routes pe JWT verify middleware apply hoga
router.use(verifyToken);

router.post("/", createExpense);
router.get("/", getExpenses);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
