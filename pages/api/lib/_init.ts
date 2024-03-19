import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../lib/_connectToDatabase';
import {
  handleInvalidPrivateCommand,
  handleMembersCommand,
  handleStartCommand,
  handleSubmitStandup,
  handleSubscribeCommand,
  handleUnsubscribeCommand,
} from './_commandHandlers';
import { getCommandType } from './command-helpers/_getCommandType';
import { isValidMessage } from './_isValidMessage';
import type { Member } from '@/pages/api/lib/_types';

/**
 * The beginning
 *
 * @param userId
 */
export const startBot = async (userId: number) => {
  const { db } = await connectToDatabase();

  await db.collection<Member>('users').updateOne(
    { userId },
    {
      $set: {
        botCanMessage: true,
      },
    },
  );
};

export const processMessage = async (
  req: NextApiRequest,
  res: NextApiResponse<{ status: string }>,
) => {
  const { body } = req;
  const message = body?.message || body?.edited_message;
  const { chat, entities, text, message_id, from } = message || {};

  // Check if the message is valid and contains required properties
  if (!isValidMessage(message)) {
    console.log('Quitting early', message, body);
    return res.status(200).json({ status: 'invalid' });
  }

  const commandType = getCommandType(chat, entities, text);
  switch (commandType) {
    case 'start':
      return await handleStartCommand(from.id, chat.id, message_id, res);
    case 'invalidPrivate':
      return await handleInvalidPrivateCommand(chat.id, message_id, res);
    case 'submitStandup':
      return await handleSubmitStandup(chat.id, from.id, message_id, body, res);
    case 'subscribe':
      return await handleSubscribeCommand(
        chat.id,
        from.id,
        chat.title,
        from,
        message_id,
        res,
      );
    case 'members':
      return await handleMembersCommand(
        chat.id,
        from.id,
        chat.title,
        from,
        message_id,
        res,
      );
    case 'unsubscribe':
      return await handleUnsubscribeCommand(chat.id, from.id, message_id, res);
    default:
      return res.status(200).json({ status: 'invalid command' });
  }
};
