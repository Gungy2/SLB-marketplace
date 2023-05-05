export DEPLOYMENT_OUTPUT="$(pnpm -C contracts/ethereum deploy-contracts)"
echo "$DEPLOYMENT_OUTPUT"

export PUBLIC_STABLECOIN_ADDRESS="$(echo "$DEPLOYMENT_OUTPUT" | tail -n 1)"

if [[ $PUBLIC_STABLECOIN_ADDRESS != 0x* ]]; then
  echo "Deployment Failed" 1>&2
  exit 1
fi
pnpm -C frontend dev-host
