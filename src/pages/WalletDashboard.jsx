import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWallets, useDisconnectWallet, useCurrentAccount } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui.js/client";
import { bridgeTokens } from "./bridgeUtils";
import Web3 from "web3";
import "../styles/WalletDashboard.css";

const WalletDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const walletAdapters = useWallets();
  const { mutate: disconnectSui } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();

  const [walletType, setWalletType] = useState(() => {
    return localStorage.getItem("walletType") || location.state?.walletType || "Unknown";
  });

  const [address, setAddress] = useState(() => {
    return localStorage.getItem("address") || location.state?.address || "N/A";
  });

  // IBT balance, bridging inputs:
  const [ibttBalance, setIbttBalance] = useState("0");
  const [bridgeAmount, setBridgeAmount] = useState("");
  const [recvAddress, setRecvAddress] = useState("");

  useEffect(() => {
    if (walletType !== "Unknown") {
      localStorage.setItem("walletType", walletType);
    }
    if (address !== "N/A") {
      localStorage.setItem("address", address);
    }
  }, [walletType, address]);

  useEffect(() => {
    if (walletType === "MetaMask") {
      if (window.ethereum) {
        window.ethereum
          .request({ method: "eth_accounts" })
          .then((accounts) => {
            if (accounts && accounts.length > 0) {
              setAddress(accounts[0]);
            } else {
              setWalletType("Unknown");
              setAddress("N/A");
            }
          })
          .catch((err) => {
            console.error("Silent connect (MetaMask) error:", err);
            setWalletType("Unknown");
            setAddress("N/A");
          });
      } else {
        setWalletType("Unknown");
        setAddress("N/A");
      }
    } else if (walletType === "SuiWallet") {
      if (currentAccount && currentAccount.address) {
        setAddress(currentAccount.address);
      } else {
        const suiAdapter = walletAdapters.find((adapter) => adapter.name === "Sui Wallet");
        if (suiAdapter && suiAdapter.connect) {
          suiAdapter
            .connect()
            .then(() => {
              if (currentAccount && currentAccount.address) {
                setAddress(currentAccount.address);
              } else {
                setTimeout(() => {
                  if (currentAccount && currentAccount.address) {
                    setAddress(currentAccount.address);
                  } else {
                    console.warn("Sui silent connect attempt did not yield an address.");
                  }
                }, 1000);
              }
            })
            .catch((err) => {
              console.warn("SuiWallet auto-connect error:", err);
            });
        } else {
          console.warn(
            "No Sui Wallet adapter with a connect() method found, or user not connected."
          );
        }
      }
    }
  }, []);
  const fetchBalance = async (theWalletType, theAddress) => {
    try {
      if (theWalletType === "MetaMask") {
        if (!Web3.utils.isAddress(theAddress)) {
          console.warn("Skipping MetaMask fetch; invalid Ethereum address:", theAddress);
          setIbttBalance("0");
          return;
        }
        const IBTTOKEN_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          [
            {
              constant: true,
              inputs: [{ name: "_owner", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "balance", type: "uint256" }],
              payable: false,
              stateMutability: "view",
              type: "function",
            },
          ],
          IBTTOKEN_CONTRACT_ADDRESS
        );
        const balance = await contract.methods.balanceOf(theAddress).call();
        setIbttBalance(web3.utils.fromWei(balance, "ether"));
      } else if (theWalletType === "SuiWallet") {
        if (!theAddress || theAddress === "N/A") {
          console.warn("Skipping Sui fetch; invalid address:", theAddress);
          setIbttBalance("0");
          return;
        }
        const suiClient = new SuiClient({ url: "http://127.0.0.1:9000" });
        const IBTTOKEN_TYPE =
          "0x5852ffb77c1ffa607dc175d08052b6254cd271ab8fe286664473229c4299b5e2::IBTToken::IBTToken";
        const result = await suiClient.getBalance({
          owner: theAddress,
          coinType: IBTTOKEN_TYPE,
        });
        if (result && result.totalBalance) {
          const rawBalance = parseInt(result.totalBalance, 10);
          setIbttBalance(rawBalance.toString());
        } else {
          setIbttBalance("0");
        }
      } else {
        setIbttBalance("0");
      }
    } catch (error) {
      console.error("Error fetching IBTToken balance:", error);
      setIbttBalance("Error fetching balance");
    }
  };

  useEffect(() => {
    if (walletType !== "Unknown" && address !== "N/A") {
      fetchBalance(walletType, address);
    }
  }, [walletType, address]);

  const handleWalletTypeChange = async (selectedType) => {
    setWalletType(selectedType);

    if (selectedType === "MetaMask") {
      try {
        if (!window.ethereum) {
          console.error("MetaMask not installed.");
          setAddress("N/A");
          return;
        }
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length) {
          setAddress(accounts[0]);
        } else {
          console.error("No MetaMask accounts found.");
          setAddress("N/A");
        }
      } catch (err) {
        console.error("MetaMask connection error:", err);
        setAddress("N/A");
      }
    } else if (selectedType === "SuiWallet") {
      if (currentAccount && currentAccount.address) {
        setAddress(currentAccount.address);
      } else {
        const suiAdapter = walletAdapters.find((adapter) => adapter.name === "Sui Wallet");
        if (suiAdapter && suiAdapter.connect) {
          try {
            await suiAdapter.connect();
            setTimeout(() => {
              if (currentAccount && currentAccount.address) {
                setAddress(currentAccount.address);
              } else {
                console.warn("No SuiWallet address found after connect attempt.");
                setAddress("N/A");
              }
            }, 1000);
          } catch (connectErr) {
            console.error("SuiWallet connection error:", connectErr);
            setAddress("N/A");
          }
        } else {
          console.warn("Sui Wallet adapter not found or connect() not available.");
          setAddress("N/A");
        }
      }
    } else {
      setAddress("N/A");
    }
  };

  const handleBridge = async () => {
    try {
      console.log("Starting token bridge...");

      if (!currentAccount) {
        console.error(
          "FAIL: No current account (Sui). If bridging from Ethereum, it's okay as long as we have an address."
        );
      } else {
        console.log("PASS: Sui current account found:", currentAccount.address);
      }

      const destinationChain = walletType === "MetaMask" ? "Sui" : "Ethereum";
      let bridgeResult;

      if (walletType === "MetaMask") {
        console.log("MetaMask wallet detected. Initiating bridge process...");
        bridgeResult = await bridgeTokens(walletType, recvAddress, bridgeAmount, destinationChain, {
          address,
        });

        const mintResponse = await fetch("http://localhost:3000/api/mint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recvAddress,
            amount: bridgeAmount,
            destinationChain: "Sui",
          }),
        });
        if (!mintResponse.ok) {
          throw new Error(await mintResponse.text());
        }
        console.log("Minting response:", await mintResponse.json());
      } else if (walletType === "SuiWallet") {
        console.log("Sui wallet detected. Initiating bridge process...");
        bridgeResult = await bridgeTokens(
          walletType,
          recvAddress,
          bridgeAmount,
          destinationChain,
          currentAccount
        );
      }

      console.log("Bridge process complete.", bridgeResult);
      await fetchBalance(walletType, address);
    } catch (error) {
      console.error("Error in bridging:", error);
    }
  };

  const handleLogout = async () => {
    try {
      if (walletType === "SuiWallet") {
        await disconnectSui();
      } else if (walletType === "MetaMask") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }

      setWalletType("Unknown");
      setAddress("N/A");
      setIbttBalance("0");

      localStorage.removeItem("walletType");
      localStorage.removeItem("address");

      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const formattedAddress = address && address.length > 10 ? address : address;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-heading">Dashboard</h1>

      <div className="wallet-info">
        <label>
          <strong>Select Wallet:</strong>{" "}
          <select value={walletType} onChange={(e) => handleWalletTypeChange(e.target.value)}>
            <option value="Unknown" disabled>
              -- Select a Wallet --
            </option>
            <option value="MetaMask">MetaMask</option>
            <option value="SuiWallet">SuiWallet</option>
          </select>
        </label>

        <p>
          <strong>Wallet Address:</strong> {formattedAddress}
        </p>
        <p>
          <strong>IBTToken Balance:</strong> {ibttBalance} IBT
        </p>
      </div>

      <div className="options">
        <input
          type="number"
          value={bridgeAmount}
          onChange={(e) => setBridgeAmount(e.target.value)}
          placeholder="Amount to bridge"
        />
        <input
          type="text"
          value={recvAddress}
          onChange={(e) => setRecvAddress(e.target.value)}
          placeholder="Receiving Address"
        />
        <button onClick={handleBridge} className="dashboard-button">
          Bridge Tokens
        </button>
      </div>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default WalletDashboard;
