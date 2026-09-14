import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";

const connStr = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril server...");
  const connection = await amqp.connect(connStr);
  console.log("Connected to RabbitMQ");

  const channel = await connection.createConfirmChannel();
  console.log("Created confirm channel");

  await publishJSON(channel, ExchangePerilDirect, PauseKey, {
    isPaused: true,
  } as PlayingState);

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    connection.close();
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
