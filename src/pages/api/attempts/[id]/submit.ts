import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const user = session.user as any;
  const { id: attemptId } = req.query;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Get attempt
    const attemptResult = await query(
      "SELECT ta.*, t.duration_minutes FROM test_attempts ta JOIN tests t ON t.id = ta.test_id WHERE ta.id = $1 AND ta.user_id = $2 AND ta.status = 'in_progress'",
      [attemptId, user.id]
    );
    if (!attemptResult.rows[0]) {
      return res.status(404).json({ error: 'Active attempt not found' });
    }
    const attempt = attemptResult.rows[0];

    // Get all questions for this test
    const questionsResult = await query(
      'SELECT * FROM questions WHERE test_id = $1',
      [attempt.test_id]
    );
    const questions = questionsResult.rows;

    // Get all answers for this attempt
    const answersResult = await query(
      'SELECT * FROM answers WHERE attempt_id = $1',
      [attemptId]
    );
    const answers = answersResult.rows;
    const answerMap = new Map(answers.map((a: any) => [a.question_id, a]));

    // ===== EVALUATION ENGINE =====
    let obtainedMarks = 0;
    let mcqCorrect = 0;
    let mcqIncorrect = 0;
    let mcqUnattempted = 0;
    let subjectiveAttempted = 0;
    let subjectiveUnattempted = 0;

    for (const question of questions) {
      const answer = answerMap.get(question.id) as any;

      if (question.question_type === 'mcq') {
        if (!answer || !answer.is_attempted || !answer.selected_option_id) {
          mcqUnattempted++;
          // Update answer record if it exists
          if (answer) {
            await query(
              'UPDATE answers SET is_correct = false, marks_awarded = 0 WHERE id = $1',
              [answer.id]
            );
          }
        } else {
          const isCorrect = answer.selected_option_id === question.correct_option_id;
          const marksAwarded = isCorrect ? question.marks : 0;
          if (isCorrect) {
            mcqCorrect++;
            obtainedMarks += marksAwarded;
          } else {
            mcqIncorrect++;
          }
          await query(
            'UPDATE answers SET is_correct = $1, marks_awarded = $2 WHERE id = $3',
            [isCorrect, marksAwarded, answer.id]
          );
        }
      } else if (question.question_type === 'subjective') {
        if (!answer || !answer.is_attempted || !answer.answer_text?.trim()) {
          subjectiveUnattempted++;
          if (answer) {
            await query(
              'UPDATE answers SET keyword_matches = $1, keyword_score = 0, marks_awarded = 0 WHERE id = $2',
              [[], answer.id]
            );
          }
        } else {
          subjectiveAttempted++;
          // Keyword-based scoring
          const keywords: string[] = question.keywords || [];
          const answerLower = answer.answer_text.toLowerCase();
          const matched = keywords.filter((kw: string) =>
            answerLower.includes(kw.toLowerCase().trim())
          );

          let keywordScore = 0;
          let marksAwarded = 0;
          if (keywords.length > 0) {
            keywordScore = Math.round((matched.length / keywords.length) * 100) / 100;
            marksAwarded = Math.round(keywordScore * question.marks * 100) / 100;
            obtainedMarks += marksAwarded;
          }

          await query(
            'UPDATE answers SET keyword_matches = $1, keyword_score = $2, marks_awarded = $3 WHERE id = $4',
            [matched, keywordScore, marksAwarded, answer.id]
          );
        }
      }
    }

    // Update attempt with results
    const updatedAttempt = await query(
      `UPDATE test_attempts SET
         status = 'submitted',
         submitted_at = NOW(),
         obtained_marks = $1,
         mcq_correct = $2,
         mcq_incorrect = $3,
         mcq_unattempted = $4,
         subjective_attempted = $5,
         subjective_unattempted = $6
       WHERE id = $7
       RETURNING *`,
      [obtainedMarks, mcqCorrect, mcqIncorrect, mcqUnattempted, subjectiveAttempted, subjectiveUnattempted, attemptId]
    );

    return res.status(200).json({ attempt: updatedAttempt.rows[0] });
  } catch (error) {
    console.error('Submit attempt error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
