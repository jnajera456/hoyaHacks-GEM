import { User } from '@/lib/models/User';
import { Topic } from '@/lib/models/Topic';
import { UploadedFile } from '@/lib/models/UploadedFile';
import { GeneratedContent } from '@/lib/models/GeneratedContent';
import { GeneratedDeck } from '@/lib/models/GeneratedDeck';
import { StudySession } from '@/lib/models/StudySession';

/**
 * Ensure collections and indexes exist for all primary models.
 * Safe to call multiple times; will sync indexes as needed.
 */
export async function ensureDbIndexes() {
  // Users
  try { await User.createCollection(); } catch {}
  try { await User.syncIndexes(); } catch {}

  // Topics
  try { await Topic.createCollection(); } catch {}
  try { await Topic.syncIndexes(); } catch {}

  // Uploaded files metadata
  try { await UploadedFile.createCollection(); } catch {}
  try { await UploadedFile.syncIndexes(); } catch {}

  // Generated content metadata
  try { await GeneratedContent.createCollection(); } catch {}
  try { await GeneratedContent.syncIndexes(); } catch {}

  // Generated decks (full payloads used by the app)
  try { await GeneratedDeck.createCollection(); } catch {}
  try { await GeneratedDeck.syncIndexes(); } catch {}

  // Study sessions
  try { await StudySession.createCollection(); } catch {}
  try { await StudySession.syncIndexes(); } catch {}
}
