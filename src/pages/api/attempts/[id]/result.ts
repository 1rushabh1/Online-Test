import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;
  const { id: attemptId } = req.query;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Admins can view any attempt; users only their own
    let attemptResult;
    if (user.role === 'admin') {
      attemptResult = await query(
        `SELECT ta.*, t.title as test_title, t.description as test_description,
                u.name as user_name, u.email as user_email
         FROM test_attempts ta
         JOIN tests t ON t.id = ta.test_id
         JOIN users u ON u.id = ta.user_id
         WHERE ta.id = $1`,
        [attemptId]
      );
    } else {
      attemptResult = await query(
        `SELECT ta.*, t.title as test_title, t.description as test_description
         FROM test_attempts ta
         JOIN tests t ON t.id = ta.test_id
         WHERE ta.id = $1 AND ta.user_id = $2`,
        [attemptId, user.id]
      );
    }

    if (!attemptResult.rows[0]) return res.status(404).json({ error: 'Attempt not found' });
    const attempt = attemptResult.rows[0];

    // Get questions
    const questionsResult = await query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_index ASC',
      [attempt.test_id]
    );

    // Get answers
    const answersResult = await query(
      'SELECT * FROM answers WHERE attempt_id = $1',
      [attemptId]
    );

    return res.status(200).json({
      attempt,
      questions: questionsResult.rows,
      answers: answersResult.rows,
    });
  } catch (error) {
    console.error('GET attempt result error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
