import { getRealId } from "./src/lib/obfuscation.js";

const fakeId = "orb_eefe81ca9fcf8b7a36f7bbab54f04db9f25c255e198fca3532a029932cbc5e59aa6b04dd99e05689";
console.log("Fake ID:", fakeId);
try {
  const realId = getRealId(fakeId);
  console.log("Real ID:", realId);
  console.log("Is equal:", realId === fakeId);
} catch (e) {
  console.error("Error:", e.message);
}
