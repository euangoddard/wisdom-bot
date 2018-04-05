export interface UserToken {
  userId: string;
  userName: string;
}

export interface CommandContext extends UserToken {
  name: string;
  extras: string;
}


type SlackResponseType = 'in_channel' | 'ephemeral';

export interface SlackResponse {
  text: string;
  response_type: SlackResponseType;
}

export interface Quote {
  quote: string;
  userId: string;
}