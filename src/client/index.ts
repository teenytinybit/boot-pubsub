import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";

const connStr = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril client...");
  const connection = await amqp.connect(connStr);
  console.log("Connected to RabbitMQ");

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    connection.close();
  });

  const username = await clientWelcome();
  declareAndBind(
    connection,
    ExchangePerilDirect,
    `pause.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
