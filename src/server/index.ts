import amqp from "amqplib";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";

const connStr = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril server...");
  const connection = await amqp.connect(connStr);
  console.log("Connected to RabbitMQ");

  const channel = await connection.createConfirmChannel();
  console.log("Created confirm channel");

  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    connection.close();
  });

  printServerHelp();
  while (true) {
    const inputArr = await getInput();
    if (inputArr.length) {
      const command = inputArr[0];
      if (command === "pause") {
        console.log("Sending pause command...");
        await publishJSON(channel, ExchangePerilDirect, PauseKey, {
          isPaused: true,
        });
      } else if (command === "resume") {
        console.log("Sending resume command...");
        await publishJSON(channel, ExchangePerilDirect, PauseKey, {
          isPaused: false,
        });
      } else if (command === "quit") {
        console.log("Shutting down...");
        process.exit(0);
      } else {
        console.log("Unknown command:", command);
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
