export DEPLOYMENT_OUTPUT="$(pnpm -C contracts/ethereum deploy-contracts)"
echo "$DEPLOYMENT_OUTPUT"

export STABLECOIN_ADDRESS="$(echo "$DEPLOYMENT_OUTPUT" | tail -n 1)"

if [[ $STABLECOIN_ADDRESS != 0x* ]]; then
  echo "Deployment failed" 1>&2
  exit 1
fi

curl -X POST \
  http://localhost:8090/api/collections/stable_coins/records \
  -H 'content-type: application/json' \
  -d '{
  "name": "USD Coin",
  "symbol": "USDC",
  "address": "'$STABLECOIN_ADDRESS'"
}'

pnpm -C frontend dev-host
