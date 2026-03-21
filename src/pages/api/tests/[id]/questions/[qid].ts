import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { id: testId, qid } = req.query;

  // Verify test ownership
  const testResult = await query('SELECT id FROM tests WHERE id = $1 AND created_by = $2', [testId, user.id]);
  if (!testResult.rows[0]) return res.status(404).json({ error: 'Test not found' });

  if (req.method === 'PUT') {
    const { question_text, topic_tags, marks, options, correct_option_id, keywords } = req.body;

    try {
      const result = await query(
        `UPDATE questions
         SET question_text = COALESCE($1, question_text),
             topic_tags = COALESCE($2, topic_tags),
             marks = COALESCE($3, marks),
             options = COALESCE($4, options),
             correct_option_id = COALESCE($5, correct_option_id),
             keywords = COALESCE($6, keywords)
         WHERE id = $7 AND test_id = $8
         RETURNING *`,
        [
          question_text?.trim(),
          topic_tags,
          marks,
          options ? JSON.stringify(options) : null,
          correct_option_id,
          keywords,
          qid,
          testId,
        ]
      );

      if (!result.rows[0]) return res.status(404).json({ error: 'Question not found' });
      return res.status(200).json({ question: result.rows[0] });
    } catch (error) {
      console.error('PUT question error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM questions WHERE id = $1 AND test_id = $2 RETURNING id', [qid, testId]);
      if (!result.rows[0]) return res.status(404).json({ error: 'Question not found' });
      return res.status(200).json({ message: 'Question deleted' });
    } catch (error) {
      console.error('DELETE question error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
