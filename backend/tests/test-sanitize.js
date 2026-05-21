import { sanitizeForOrbit } from "../src/lib/obfuscation.js";

const populatedMessage = {
  _id: "65e23abc1234567890abcdef",
  senderId: {
    _id: "65e23def1234567890abcdef",
    username: "test",
    profilePic: ""
  },
  nexusId: "65e23ghi1234567890abcdef"
};

console.log("Original:", JSON.stringify(populatedMessage, null, 2));
console.log("Sanitized:", JSON.stringify(sanitizeForOrbit(populatedMessage), null, 2));
