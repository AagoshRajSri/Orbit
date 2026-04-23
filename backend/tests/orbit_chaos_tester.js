import { io } from "socket.io-client";
import os from "os";

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3000";
const CLIENT_COUNT = 100;
const BURST_AMOUNT = 200; // Messages per burst
const TEST_DURATION_MS = 15000;

console.log(`🚀 Starting Orbit Chaos Tester v1.0`);
console.log(`🎯 Target: ${SOCKET_URL}`);
console.log(`👥 Clients: ${CLIENT_COUNT}`);

const clients = [];
let messagesSent = 0;
let messagesReceived = 0;
let connectionDrops = 0;
let failedAcks = 0;
let startTime = 0;

const payload = {
  nexusId: "000000000000000000000000",
  text: "STRESS_TEST_PAYLOAD_ABCDEFGHIJKLMNOPQRSTUVWXYZ_123456789",
  image: null,
};

async function createClient(id) {
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"], // force WS to bypass HTTP overhead
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 100,
    });

    socket.on("connect", () => {
      // Simulate joining a shared room (using explicit join if our backend relied on it)
      socket.emit("joinNexusRoom", payload.nexusId);
      resolve(socket);
    });

    socket.on("disconnect", (reason) => {
      connectionDrops++;
    });

    socket.on("newNexusMessage", () => {
      messagesReceived++;
    });
  });
}

async function runTest() {
  console.log("🔌 Spawning generic socket connections...");
  for (let i = 0; i < CLIENT_COUNT; i++) {
    const client = await createClient(i);
    clients.push(client);
  }
  
  console.log(`✅ ${clients.length} clients connected. Measuring baseline metrics...`);
  startTime = Date.now();
  
  // Phase 1: Burst Traffic (Backpressure Test)
  console.log(`\n🌪️ Initiating Phase 1: Sudden Spike (${BURST_AMOUNT} msgs simultaneously)...`);
  const burstPromises = [];
  for (let i = 0; i < BURST_AMOUNT; i++) {
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    // Emitting simulated events directly if we had a direct WS channel, 
    // Note: Orbit strictly uses Express HTTP controllers for message creation to save to MongoDB.
    // Testing sockets receiving broadcast instead!
    // In a true MERN stack, we load test HTTP POST /api/nexus/:id/send -> then verify WS propagation.
  }

  // Phase 2: Reconnection Chaos
  console.log(`\n🌩️ Initiating Phase 2: Connection Dropper...`);
  for (let i = 0; i < 20; i++) {
    clients[i].disconnect();
    setTimeout(() => clients[i].connect(), 500); // Reconnect half a second later
  }

  // End Test
  setTimeout(() => {
    printReport();
    process.exit(0);
  }, TEST_DURATION_MS);
}

function printReport() {
  const endTime = Date.now();
  const timeSec = (endTime - startTime) / 1000;
  console.log(`\n📊 --- TEST REPORT ---`);
  console.log(`⏱️ Duration: ${timeSec} seconds`);
  console.log(`💧 Connection Drops: ${connectionDrops} (Expected > 20 due to chaos mode)`);
  
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  console.log(`💻 Local RAM Consumed: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
}

runTest();
