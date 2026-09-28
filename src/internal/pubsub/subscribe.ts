import amqp from "amqplib";
import { declareAndBind, type SimpleQueueType } from "./consume.js";

export enum AckType {
  Ack = "Ack",
  NackRequeue = "NackRequeue",
  NackDiscard = "NackDiscard",
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => Promise<AckType> | AckType,
): Promise<void> {
  const [channel, q] = await declareAndBind(conn, exchange, queueName, key, queueType);

  await channel.consume(q.queue, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      const ackType = await handler(data);
      console.log("Acking message...Ack type: ", ackType);
      if (ackType === "Ack") {
        channel.ack(msg);
        console.log("Message acked.");
      } else if (ackType === "NackRequeue") {
        channel.nack(msg, false, true);
        console.log("Message requeued.");
      } else if (ackType === "NackDiscard") {
        channel.nack(msg, false, false);
        console.log("Message discarded.");
      }
    } catch (error) {
      console.log(error);
      return;
    }
  });
}
