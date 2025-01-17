 #!/bin/bash

if [ -z "$1" ]; then

    echo "Usage: $0 <private_key>"

    exit 1

fi

PRIVATE_KEY=$1

RPC_URL="http://127.0.0.1:8545"
CONTRACT_PATH="contracts/ethereum/src/IBTToken.sol:MyToken"

echo "Deploying contract from $CONTRACT_PATH to $RPC_URL with provided private key..."

forge create --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY $CONTRACT_PATH


if [ $? -eq 0 ]; then

    echo "Contract deployed successfully!"

else

    echo "Deployment failed!"

fi