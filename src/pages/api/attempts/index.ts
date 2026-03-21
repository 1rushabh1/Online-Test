import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let result;
    if (user.role === 'admin') {
      // Admin: see all attempts on their tests
      result = await query(
        `SELECT ta.*, t.title as test_title, u.name as user_name, u.email as user_email
         FROM test_attempts ta
         JOIN tests t ON t.id = ta.test_id
         JOIN users u ON u.id = ta.user_id
         WHERE t.created_by = $1
         ORDER BY ta.created_at DESC`,
        [user.id]
      );
    } else {
      // Test-taker: see own attempts
      result = await query(
        `SELECT ta.*, t.title as test_title
         FROM test_attempts ta
         JOIN tests t ON t.id = ta.test_id
         WHERE ta.user_id = $1
         ORDER BY ta.created_at DESC`,
        [user.id]
      );
    }

    return res.status(200).json({ attempts: result.rows });
  } catch (error) {
    console.error('GET attempts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
