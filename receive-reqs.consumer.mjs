import { connect } from "amqplib";
import { DatabaseSync } from "node:sqlite";
import sqlBricks from "sql-bricks";

const db = new DatabaseSync(":memory:");
let dbAlreadyExists = false;

export function insert(queryParams) {
  const { table, items } = queryParams;
  const { text, values } = sqlBricks
    .insertInto(table, items)
    .toParams({ placeholder: "?" });

  const insertStatement = db.prepare(text);
  insertStatement.run(...values);
}

export function select(query) {
  return db.prepare(query).all();
}

function prepareDb() {
  db.exec(`
      DROP TABLE IF EXISTS reqs
  `);

  db.exec(`
      CREATE TABLE reqs(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          method TEXT NOT NULL,
          ip TEXT NOT NULL,
          resourceUrl TEXT,
          time TEXT NOT NULL
      ) STRICT
  `);

  dbAlreadyExists = true;
}

function createConnection() {
  return (async () => {
    const connection = await connect({
      username: "user",
      password: "password",
      port: 5672
    });

    return await connection.createChannel();
  })();
}

async function ReceiveReqs() {
  await createConnection().then((channel) => {
    console.log("RabbitMq Consumer already is running...");

    channel.assertQueue("receiveReqs");
    channel.consume("receiveReqs", (msg) => {
      if (msg) {
        const incommingData = msg.content.toString();
        const getRequests = JSON.parse(incommingData);

        try {
          if (!dbAlreadyExists) prepareDb();
          insert({ table: "reqs", items: getRequests });
          channel.ack(msg);

          const selectReqsQuery = sqlBricks
            .select("ip,method,resourceUrl,time")
            .orderBy("method")
            .from("reqs")
            .toString();

          const reply = select(selectReqsQuery);
          for (const req of reply) {
            console.log(req);
          }
        } catch (error) {
          console.log(error);
        }
      }
    });
  });
}

ReceiveReqs();
