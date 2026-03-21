import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const testResult = await query(
        'SELECT * FROM tests WHERE id = $1',
        [id]
      );
      if (!testResult.rows[0]) return res.status(404).json({ error: 'Test not found' });

      const test = testResult.rows[0];

      // Non-admins can only access published tests
      if (user.role !== 'admin' && test.status !== 'published') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const questionsResult = await query(
        'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_index ASC',
        [id]
      );

      return res.status(200).json({ test, questions: questionsResult.rows });
    } catch (error) {
      console.error('GET test error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { title, description, duration_minutes, status } = req.body;

    try {
      const testResult = await query('SELECT * FROM tests WHERE id = $1 AND created_by = $2', [id, user.id]);
      if (!testResult.rows[0]) return res.status(404).json({ error: 'Test not found' });

      const result = await query(
        `UPDATE tests 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             duration_minutes = COALESCE($3, duration_minutes),
             status = COALESCE($4, status)
         WHERE id = $5 AND created_by = $6
         RETURNING *`,
        [title?.trim(), description?.trim() ?? null, duration_minutes ? parseInt(duration_minutes) : null, status, id, user.id]
      );

      return res.status(200).json({ test: result.rows[0] });
    } catch (error) {
      console.error('PUT test error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    try {
      const testResult = await query('SELECT * FROM tests WHERE id = $1 AND created_by = $2', [id, user.id]);
      if (!testResult.rows[0]) return res.status(404).json({ error: 'Test not found' });

      await query('DELETE FROM tests WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Test deleted' });
    } catch (error) {
      console.error('DELETE test error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
