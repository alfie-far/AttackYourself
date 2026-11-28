#!/usr/bin/env node
import { resolve } from 'node:path';
import { replayJournal } from './src/journal.mjs';
const file=process.argv[2];
if(!file||process.argv.length!==3){
  console.error('Usage: npm run replay -- /path/to/episode.jsonl');process.exit(2);
}
try {
  const {events,projection}=await replayJournal(resolve(file));
  console.log(JSON.stringify({journal:resolve(file),eventsVerified:events.length,hashChain:'PASS',replay:projection},null,2));
} catch(error) {
  console.error('REPLAY REJECTED:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
}
