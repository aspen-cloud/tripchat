import { Schema as S, Models } from "@triplit/db";

export const schema = {
  chats: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String(),
    }),
  },
  messages: {
    schema: S.Schema({
      id: S.Id(),
      chatId: S.String(),
      user: S.String(),
      text: S.String(),
      createdAt: S.Date({ default: S.Default.now() }),
    }),
  },
} satisfies Models<any, any>;
