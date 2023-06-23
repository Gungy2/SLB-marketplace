# SLB-marketplace

This is the main repository containing the SLB Exchange built for my MEng Finaly Year Project.

## Cloning the repository

The repository should be cloned using:

```sh
git clone --recurse-submodules git@github.com:Gungy2/SLB-marketplace.git
```

since it contains a submodule.

## Running The Exchange

First change the address in `contracts/ethereum/scripts/deploy.js` to your local Metamask address.

### Using Docker

The easiest way to run the exchange is using Docker Compose:

```sh
docker compose up
```

### Manually

These steps need to be taken in order to run the exchange manually.

1. [Install `pnpm`](https://pnpm.io/installation)

2. Install the JavaScript dependencies:

```sh
pnpm install
```

2. Compile the Reach contracts:

```sh
./reach compile app/index.rsh -o app/build
```

3. Start the database:

```sh
frontend/pocketbase/pocketbase serve
```

4. [Install and run Ganache on port 7545](https://trufflesuite.com/ganache/)

5. Execute the `run.sh` script, that deploys the contracts:

```sh
./run.sh
```

## Executing the Test

In order to execute the tests in all subdirectories run:

1. [Install `pnpm`](https://pnpm.io/installation)

2. Install the JavaScript dependencies:

```sh
pnpm install
```

3. Compile the Reach contracts:

```sh
./reach compile app/index.rsh -o app/build
```

4. Compile the Solidity contracts:

```sh
pnpm -C contracts/ethereum compile
```

5. Execute the command:

```sh
pnpm test
```
