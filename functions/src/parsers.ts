import { CommandContext, UserToken } from './models';

export function parseCommandContext(commandRaw: string): CommandContext {
  const commandParts = (commandRaw || '').split(' ');
  const { userId, userName } = parseUserToken(commandParts[1] || '');
  return {
    name  : commandParts[0],
    extras: stripQuotes(commandParts.slice(2).join(' ')),
    userId,
    userName,
  };
}

function parseUserToken(userToken: string): UserToken {
  const tokenRe = /^<(.+?)\|(.+?)>$/;
  const matches = userToken.match(tokenRe);
  const tokenData: UserToken = {userId: '', userName: ''};
  if (matches) {
    tokenData.userId = matches[1];
    tokenData.userName = matches[2];
  }
  return tokenData;
}

function stripQuotes(value: string): string {
  return value.replace(/^["']/, '').replace(/["']$/, '');
}