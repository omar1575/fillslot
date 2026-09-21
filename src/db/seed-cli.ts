import { config } from "dotenv";
config({ path: ".env.local" });

import { seed } from "./seed";
import { getDb } from "./index";

async function main() {
  const db = await getDb();
  const result = await seed(db);
  console.log("Seeded Fillslot", result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
