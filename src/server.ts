import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { reqEvent } from "./req-event";
import { DispatchRequest } from "./req-listener";
import requestIp from "request-ip";

const ipMiddleware = (request: IncomingMessage) => {
  const clientIp = requestIp.getClientIp(request);
  if (!clientIp) {
    return null;
  }

  return clientIp;
};

const nodeServer = createServer(
  (request: IncomingMessage, response: ServerResponse) => {
    const requesterIp = ipMiddleware(request);
    if (!requesterIp) {
      return response.end();
    }

    reqEvent.receiveReq({
      time: new Date(),
      ip: requesterIp,
      method: request.method || "",
      resourceUrl: request.url ?? "http://localhost:3333"
    });

    reqEvent.emit("receiveReq", request.url);
  }
);

nodeServer.listen(3333, async () => {
  console.log("Server already is running on port: 3333");
  await DispatchRequest().then(() =>
    console.log("RabbitMq Publisher already is running...")
  );

  setTimeout(async () => {
    await fetch("http://localhost:3333", {
      method: "POST",
      body: JSON.stringify({
        data: "Hello World"
      })
    });
  }, 2000);
});
