import amqp, { type Channel } from "amqplib";
import { DeadLetterExchange } from "../routing/routing.js";

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  const channel = await conn.createChannel();

  const q = await channel.assertQueue(queueName, {
    durable: queueType === SimpleQueueType.Durable,
    autoDelete: queueType === SimpleQueueType.Transient,
    exclusive: queueType === SimpleQueueType.Transient,
    arguments: { "x-dead-letter-exchange": DeadLetterExchange },
  });

  await channel.bindQueue(queueName, exchange, key);
  return [channel, q];
}
