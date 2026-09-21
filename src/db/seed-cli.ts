import "dotenv/config";
import { seed } from "./seed";
import { getDb } from "./index";

async function main() {
  const db = await getDb();
  const result = await seed(db);
  console.log("Seeded Fillslot", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
