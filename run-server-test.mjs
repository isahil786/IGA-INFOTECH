process.env.PORT = "3000";
import "dotenv/config";
import { createServer } from "./server/index.ts";
const app = createServer();
app.listen(3000, () => console.log("TEST SERVER UP on 3000"));
