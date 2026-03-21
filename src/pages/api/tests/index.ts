import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;

  if (req.method === 'GET') {
    try {
      let sql: string;
      let params: any[];

      if (user.role === 'admin') {
        // Admins see all their tests
        sql = `
          SELECT t.*, COUNT(q.id)::int as question_count
          FROM tests t
          LEFT JOIN questions q ON q.test_id = t.id
          WHERE t.created_by = $1
          GROUP BY t.id
          ORDER BY t.created_at DESC
        `;
        params = [user.id];
      } else {
        // Test-takers see only published tests
        sql = `
          SELECT t.*, COUNT(q.id)::int as question_count,
            ta.id as attempt_id, ta.status as attempt_status,
            ta.obtained_marks, ta.total_marks
          FROM tests t
          LEFT JOIN questions q ON q.test_id = t.id
          LEFT JOIN test_attempts ta ON ta.test_id = t.id AND ta.user_id = $1
          WHERE t.status = 'published'
          GROUP BY t.id, ta.id, ta.status, ta.obtained_marks, ta.total_marks
          ORDER BY t.created_at DESC
        `;
        params = [user.id];
      }

      const result = await query(sql, params);
      return res.status(200).json({ tests: result.rows });
    } catch (error) {
      console.error('GET tests error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { title, description, duration_minutes } = req.body;
    if (!title || !duration_minutes) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }

    try {
      const result = await query(
        'INSERT INTO tests (title, description, duration_minutes, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [title.trim(), description?.trim() || null, parseInt(duration_minutes), user.id]
      );
      return res.status(201).json({ test: result.rows[0] });
    } catch (error) {
      console.error('POST tests error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
