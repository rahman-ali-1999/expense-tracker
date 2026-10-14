import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { db } from "../config/db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// 1. Create Expense
export const createExpense = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, amount, category, date } = req.body;
    const userId = req.user?.id;

    if (!title || !amount || !category) {
      res
        .status(400)
        .json({ error: "Title, amount, and category are required!" });
      return;
    }

    const expenseDate = date || new Date().toISOString().split("T")[0];

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO expenses (user_id, title, amount, category, date) VALUES (?, ?, ?, ?, ?)",
      [userId, title, amount, category, expenseDate],
    );

    res.status(201).json({
      message: "Expense successfully added!",
      expenseId: result.insertId,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[Expense Error] Create fail:", error.message);
      res.status(500).json({ error: "Server error while creating expense." });
    }
  }
};

// 2. Get All Expenses for Logged-in User
export const getExpenses = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const [expenses] = await db.query<RowDataPacket[]>(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
      [userId],
    );

    // Directly returning the array so frontend Array.isArray(res.data) works correctly
    res.status(200).json(expenses);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[Expense Error] Fetch fail:", error.message);
      res.status(500).json({ error: "Server error while fetching expenses." });
    }
  }
};

// 3. Update Expense
export const updateExpense = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;
    const userId = req.user?.id;

    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT * FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId],
    );

    if (existing.length === 0) {
      res.status(404).json({
        error: "Expense not found or unauthorized.",
      });
      return;
    }

    await db.query(
      "UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ? AND user_id = ?",
      [
        title || existing[0].title,
        amount || existing[0].amount,
        category || existing[0].category,
        date || existing[0].date,
        id,
        userId,
      ],
    );

    res.status(200).json({ message: "Expense successfully updated!" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[Expense Error] Update fail:", error.message);
      res.status(500).json({ error: "Server error while updating expense." });
    }
  }
};

// 4. Delete Expense
export const deleteExpense = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId],
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        error: "Expense not found or unauthorized.",
      });
      return;
    }

    res.status(200).json({ message: "Expense successfully deleted!" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[Expense Error] Delete fail:", error.message);
      res.status(500).json({ error: "Server error while deleting expense." });
    }
  }
};
