import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;
  const { id: attemptId } = req.query;

  if (req.method === 'POST') {
    const { question_id, selected_option_id, answer_text } = req.body;

    if (!question_id) {
      return res.status(400).json({ error: 'question_id is required' });
    }

    try {
      // Verify attempt belongs to user and is in progress
      const attemptResult = await query(
        "SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2 AND status = 'in_progress'",
        [attemptId, user.id]
      );
      if (!attemptResult.rows[0]) {
        return res.status(404).json({ error: 'Active attempt not found' });
      }

      const isAttempted = selected_option_id !== undefined || (answer_text !== undefined && answer_text.trim() !== '');

      // Upsert answer
      const result = await query(
        `INSERT INTO answers (attempt_id, question_id, selected_option_id, answer_text, is_attempted)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (attempt_id, question_id)
         DO UPDATE SET
           selected_option_id = EXCLUDED.selected_option_id,
           answer_text = EXCLUDED.answer_text,
           is_attempted = EXCLUDED.is_attempted,
           updated_at = NOW()
         RETURNING *`,
        [attemptId, question_id, selected_option_id || null, answer_text || null, isAttempted]
      );

      // Update time remaining if provided
      if (req.body.time_remaining_seconds !== undefined) {
        await query(
          'UPDATE test_attempts SET time_remaining_seconds = $1 WHERE id = $2',
          [req.body.time_remaining_seconds, attemptId]
        );
      }

      return res.status(200).json({ answer: result.rows[0] });
    } catch (error) {
      console.error('Save answer error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const attemptResult = await query(
        'SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2',
        [attemptId, user.id]
      );
      if (!attemptResult.rows[0]) return res.status(404).json({ error: 'Attempt not found' });

      const answersResult = await query(
        'SELECT * FROM answers WHERE attempt_id = $1',
        [attemptId]
      );

      return res.status(200).json({ attempt: attemptResult.rows[0], answers: answersResult.rows });
    } catch (error) {
      console.error('GET answers error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
