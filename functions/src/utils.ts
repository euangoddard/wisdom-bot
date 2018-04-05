import { CommandContext, SlackResponse } from './models';

export function requireUser(context: CommandContext) {
  if (!(context.userName && context.userId)) {
    throw new Error(`You must pass a user, e.g. \`@username\` to \`${context.name}\``);
  }
}

export function respondPublicly(message: string): SlackResponse {
  return {
    text: message,
    response_type: 'in_channel',
  };
}

export function respondPrivately(message: string): SlackResponse {
  return {
    text: message,
    response_type: 'ephemeral',
  };
}

export function pickAtRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
