import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { query } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const user = session.user as any;
  if (user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  const { id: testId } = req.query;

  // Verify test ownership
  const testResult = await query(
    "SELECT * FROM tests WHERE id = $1 AND created_by = $2",
    [testId, user.id],
  );
  if (!testResult.rows[0])
    return res.status(404).json({ error: "Test not found" });

  if (req.method === "GET") {
    const result = await query(
      "SELECT * FROM questions WHERE test_id = $1 ORDER BY order_index ASC",
      [testId],
    );
    return res.status(200).json({ questions: result.rows });
  }

  if (req.method === "POST") {
    const {
      question_text,
      question_type,
      topic_tags,
      marks,
      options,
      correct_option_id,
      keywords,
    } = req.body;

    if (!question_text || !question_type) {
      return res
        .status(400)
        .json({ error: "Question text and type are required" });
    }

    if (question_type === "mcq") {
      if (!options || options.length < 2) {
        return res
          .status(400)
          .json({ error: "MCQ must have at least 2 options" });
      }
      if (!correct_option_id) {
        return res
          .status(400)
          .json({ error: "MCQ must have a correct answer" });
      }
    }

    try {
      // Get max order_index
      const orderResult = await query(
        "SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM questions WHERE test_id = $1",
        [testId],
      );
      const nextOrder = orderResult.rows[0].next_order;

      const result = await query(
        `INSERT INTO questions 
          (test_id, question_text, question_type, topic_tags, marks, order_index, options, correct_option_id, keywords)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          testId,
          question_text.trim(),
          question_type,
          topic_tags || [],
          marks || 1,
          nextOrder,
          options ? JSON.stringify(options) : null,
          correct_option_id || null,
          keywords || [],
        ],
      );

      return res.status(201).json({ question: result.rows[0] });
    } catch (error) {
      console.error("POST question error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
