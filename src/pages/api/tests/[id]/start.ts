import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;
  const { id: testId } = req.query;

  if (req.method === 'POST') {
    try {
      // Check test exists and is published
      const testResult = await query(
        "SELECT * FROM tests WHERE id = $1 AND status = 'published'",
        [testId]
      );
      if (!testResult.rows[0]) return res.status(404).json({ error: 'Test not found or not published' });

      const test = testResult.rows[0];

      // Check for existing in-progress attempt
      const existingAttempt = await query(
        "SELECT * FROM test_attempts WHERE test_id = $1 AND user_id = $2 AND status = 'in_progress'",
        [testId, user.id]
      );

      if (existingAttempt.rows[0]) {
        return res.status(200).json({ attempt: existingAttempt.rows[0], resumed: true });
      }

      // Check if already submitted
      const submittedAttempt = await query(
        "SELECT * FROM test_attempts WHERE test_id = $1 AND user_id = $2 AND status = 'submitted'",
        [testId, user.id]
      );
      if (submittedAttempt.rows[0]) {
        return res.status(409).json({ error: 'You have already submitted this test', attemptId: submittedAttempt.rows[0].id });
      }

      // Get total marks
      const marksResult = await query(
        'SELECT COALESCE(SUM(marks), 0)::int as total FROM questions WHERE test_id = $1',
        [testId]
      );
      const totalMarks = marksResult.rows[0].total;

      // Create new attempt
      const attemptResult = await query(
        `INSERT INTO test_attempts (test_id, user_id, total_marks, time_remaining_seconds)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [testId, user.id, totalMarks, test.duration_minutes * 60]
      );

      return res.status(201).json({ attempt: attemptResult.rows[0], resumed: false });
    } catch (error) {
      console.error('Start attempt error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
