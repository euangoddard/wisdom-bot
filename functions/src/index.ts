import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { CommandContext, Quote, SlackResponse } from './models';
import { parseCommandContext } from './parsers';
import { pickAtRandom, requireUser, respondPrivately, respondPublicly } from './utils';

admin.initializeApp();

export const handleWisdom = functions.https.onRequest(async (request, response) => {
  if (request.method !== 'POST') {
    return response.sendStatus(405);
  }

  const data = request.body;

  if (data.token !== functions.config().slack.verification) {
    return response.status(400).send('Slack token does not match!');
  }

  if (data.command !== '/wisdom') {
    return response.status(400).send(`Cannot hand command ${data.command}`);
  }

  const context = parseCommandContext(data.text);
  let subCommandFn: Function;
  switch (context.name) {
    case 'add':
      subCommandFn = addWisdom;
      break;
    case 'get':
      subCommandFn = getWisdom;
      break;
    case 'list':
      subCommandFn = listWisdom;
      break;
    case 'help':
      subCommandFn = getHelp;
      break;
    default:
      subCommandFn = unknownSubCommand;
  }

  try {
    const result = await subCommandFn(context);
    response.send(result);
  } catch (err) {
    response.send(respondPrivately(err.toString() + '\nType `/wisdom help` for more details.'));
  }
});

const HELP_TEXT =
  'Get, list or add wisdom for a user\n' +
  '*Usage*: \n' +
  '`/wisdom add @username "The quote here"` - adds a quote for the specified user\n' +
  '`/wisdom list @username` - lists all the wisdom for the specified user\n' +
  '`/wisdom get @username` - get a nugget of wisdom at random for the specified user\n' +
  '`/wisdom help` - displays this message';

async function addWisdom(context: CommandContext): Promise<SlackResponse> {
  requireUser(context);
  const quote = context.extras.trim();
  if (!quote) {
    throw new Error('Need some wisdom to add!');
  }

  await admin
    .firestore()
    .collection('quotes')
    .add({
      quote,
      userId: context.userId,
    });
  return respondPublicly(`Added wisdom for ${context.userName}:\n> ${quote}`);
}

async function listWisdom(context: CommandContext): Promise<SlackResponse> {
  requireUser(context);
  const quotes = await getQuotesForUser(context.userId);
  let response: SlackResponse;
  if (quotes.length) {
    const quotesFormatted = quotes.map(formatQuote);
    response = respondPublicly(quotesFormatted.join('\n'));
  } else {
    response = respondPrivately(`I don't have any quotes for @${context.userName}`);
  }
  return response;
}

async function getWisdom(context: CommandContext): Promise<SlackResponse> {
  requireUser(context);
  const quotes = await getQuotesForUser(context.userId);
  let response: SlackResponse;
  if (quotes.length) {
    response = respondPublicly(formatQuote(pickAtRandom(quotes)));
  } else {
    response = respondPrivately(`I don't have any quotes for @${context.userName}`);
  }
  return response;
}

function getHelp(context: CommandContext): Promise<SlackResponse> {
  return Promise.resolve(respondPrivately(HELP_TEXT));
}

function unknownSubCommand(context: CommandContext): Promise<SlackResponse> {
  const message = context.name
    ? `I don't know how to do "${context.name}"`
    : 'Please specify a sub-command';
  throw new Error(message);
}

async function getQuotesForUser(userId: string): Promise<Quote[]> {
  const snapshot = await admin
    .firestore()
    .collection('quotes')
    .where('userId', '==', userId)
    .get();

  const quotes: Quote[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    quotes.push({ quote: data['quote'], userId: data['userId'] });
  });
  return quotes;
}

function formatQuote(quote: Quote): string {
  return `> ${quote.quote}`;
}
