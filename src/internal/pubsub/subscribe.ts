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
  handler: (data: T) => AckType,
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

      const ackType = handler(data);
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
    }
  });
}
