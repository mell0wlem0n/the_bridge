#!/bin/bash
action=$1
amount=$2
receiver_address=$3
coin_object_id=$4

ETH_RPC_URL="http://127.0.0.1:8545"  #
ETH_CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3" 
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"


SUI_PACKAGE_ID="0x5852ffb77c1ffa607dc175d08052b6254cd271ab8fe286664473229c4299b5e2"
SUI_ADMIN_CAP_OBJECT_ID="0xa97fa44a1a958d7027c169e902481ac75ab80567d4e55dc9ccb577aa78be1710"

echo "Received Address: $receiver_address"

if [ "$action" == "mint" ]; then
    echo "Minting $amount IBT on Sui for Ethereum"
    sui client call --package "$SUI_PACKAGE_ID" --module IBTToken --function mint_to_destination --args "$SUI_ADMIN_CAP_OBJECT_ID" "$receiver_address" "$amount" --gas-budget 10000000
elif [ "$action" == "burn" ]; then
    echo "Switching to the connected account address: $receiver_address"
    sui client switch --address $receiver_address
    echo "Admin Cap ID: $SUI_ADMIN_CAP_OBJECT_ID"
    echo "Coin Object ID: $coin_object_id"
    echo "Amount: $(echo "$amount")"
    echo "Destination Chain: Ethereum"
    echo "Burning $amount IBT on Sui for Ethereum"
    sui client call --package "$SUI_PACKAGE_ID" --module IBTToken --function burn_exact_for_bridge --args "$SUI_ADMIN_CAP_OBJECT_ID" "$coin_object_id" "$amount" "\"Ethereum\"" --gas-budget 10000000
elif [ "$action" == "eth" ]; then
    echo "Minting $amount IBT on Ethereum for $receiver_address"
    wei_amount=$(cast --to-wei $amount ether)
    cast send --rpc-url $ETH_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY $ETH_CONTRACT_ADDRESS "mintForBridge(address,uint256,string)" $receiver_address $wei_amount "\"Sui\""
else
    echo "Invalid action. Use 'mint', 'burn', or 'eth'."
    exit 1
fi