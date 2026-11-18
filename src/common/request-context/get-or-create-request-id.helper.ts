import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'node:http';

export function getOrCreateRequestId(req: IncomingMessage): string {
  if (req.id != null) return String(req.id);

  const header = req.headers['x-request-id'];

  const requestId =
    typeof header === 'string' && header.length > 0 && header.length <= 128
      ? header
      : uuidv4();

  req.id = requestId;

  return requestId;
}
