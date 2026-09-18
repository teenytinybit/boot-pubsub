import amqp from "amqplib";
import { declareAndBind, type SimpleQueueType } from "./consume.js";

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
  const [channel, q] = await declareAndBind(conn, exchange, queueName, key, queueType);

  await channel.consume(q.queue, (msg) => {
    if (msg) {
      let data;
      try {
        data = JSON.parse(msg.content.toString());
      } catch (error) {
        console.log(error);
        return;
      }

      handler(data);
      channel.ack(msg);
    }
  });
}
