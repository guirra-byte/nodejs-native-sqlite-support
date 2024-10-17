import { reqEvent } from "./req-event";
import { connect } from "amqplib";

async function createConnection() {
  return (async () => {
    const connection = await connect({
      username: "user",
      password: "password",
      port: 5672
    });

    return await connection.createChannel();
  })();
}

async function DispatchRequest() {
  reqEvent.on("receiveReq", async (data) => {
    const getRequests = reqEvent.getReqsByUrl(data);
    if (getRequests) {
      const channel = await createConnection();

      channel.assertQueue("receiveReqs");
      channel.publish(
        "",
        "receiveReqs",
        Buffer.from(JSON.stringify(getRequests))
      );
    }
  });
}

export { DispatchRequest };
