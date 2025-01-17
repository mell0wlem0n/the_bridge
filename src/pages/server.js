import express from "express";
import { exec } from "child_process";
import util from "util";
import cors from "cors";

const execAsync = util.promisify(exec);
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend's URL
    methods: ["GET", "POST"], // Allowed methods
    allowedHeaders: ["Content-Type"], // Allowed headers
  })
);
app.use(express.json());

const bridgeScriptPath = "./bridge.sh";

/**
 * Mint tokens via bridge.sh
 */
app.post("/api/mint", async (req, res) => {
  console.log("MINTING?");
  const { recvAddress, amount, destinationChain } = req.body;

  if (!recvAddress || !amount || !destinationChain) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let command;

  if (destinationChain === "Sui") {
    command = `bash ${bridgeScriptPath} mint ${amount} ${recvAddress} sui`;
  } else if (destinationChain === "Ethereum") {
    // Use 'eth' for Ethereum minting
    command = `bash ${bridgeScriptPath} eth ${amount} ${recvAddress}`;
  } else {
    return res.status(400).json({ error: "Invalid destination chain" });
  }

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error("Mint command error:", stderr);
      return res.status(500).json({ error: stderr });
    }
    console.log("Mint command output:", stdout);
    res.json({ message: "Mint operation successful", output: stdout });
  } catch (error) {
    console.error("Error executing mint command:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

app.post("/api/burn", async (req, res) => {
  const { amount, userAddress, coinObjectId } = req.body;

  if (!amount || !userAddress || !coinObjectId) {
    console.log(amount);
    console.log(userAddress);
    console.log(coinObjectId);

    return res.status(400).json({ error: "Missing required fields" });
  }

  let command = `bash ${bridgeScriptPath} burn ${amount} ${userAddress} ${coinObjectId}`;

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error("Burn command error:", stderr);
      return res.status(500).json({ error: stderr });
    }
    console.log("Burn command output:", stdout);
    res.json({ message: "Burn operation successful", output: stdout });
  } catch (error) {
    console.error("Error executing burn command:", error);
    res.status(500).json({ error: error.message });
  }
});