import '@mysten/dapp-kit/dist/index.css';
import React, { useState, useEffect } from "react";
import { ConnectModal, useCurrentAccount, useWallets } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const [metamaskConnected, setMetamaskConnected] = useState(false);
  const [suiWalletConnected, setSuiWalletConnected] = useState(false);
  const [metamaskAddress, setMetamaskAddress] = useState(null);
  const [suiWalletAddress, setSuiWalletAddress] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

 
  const currentAccount = useCurrentAccount();

  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask and try again.");
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setMetamaskAddress(address);
        setMetamaskConnected(true);
        setErrorMessage("");

        
        localStorage.setItem("walletType", "MetaMask");
        localStorage.setItem("address", address);
        localStorage.setItem("walletConnected", "true");

        console.log("MetaMask Connected:", address);
      } else {
        throw new Error("No MetaMask accounts returned.");
      }
    } catch (error) {
      setErrorMessage(error.message || "MetaMask connection error.");
      console.error("MetaMask Error:", error);
    }
  };

 
  useEffect(() => {
    if (currentAccount && currentAccount.address) {
      setSuiWalletAddress(currentAccount.address);
      setSuiWalletConnected(true);
      setErrorMessage("");

      // Immediately store in localStorage
      localStorage.setItem("walletType", "SuiWallet");
      localStorage.setItem("address", currentAccount.address);
      localStorage.setItem("walletConnected", "true");

      console.log("Sui Wallet Connected:", currentAccount.address);
    }
  }, [currentAccount]);

  const handleNavigateToDashboard = () => {
    
    navigate("/dashboard");
  };

 
  const isAnyWalletConnected = () => metamaskConnected || suiWalletConnected;

  return (
    <div className="container">
      <h1 className="heading">Welcome to the BRIDGE</h1>

     
      <button onClick={connectMetaMask} className="button" disabled={metamaskConnected}>
        {metamaskConnected
          ? `MetaMask Connected: ${metamaskAddress}`
          : "Connect with MetaMask"}
      </button>

     
      <ConnectModal
        trigger={
          <button className="button" disabled={suiWalletConnected}>
            {suiWalletConnected
              ? `Sui Wallet Connected: ${suiWalletAddress}`
              : "Connect with SuiWallet"}
          </button>
        }
      />

      {errorMessage && <p className="error">{errorMessage}</p>}

      {isAnyWalletConnected() && (
        <button onClick={handleNavigateToDashboard} className="button">
          Continue to Dashboard
        </button>
      )}
    </div>
  );
};

export default Login;
