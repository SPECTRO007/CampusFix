# CampusFix — Decentralized Campus Maintenance Tracker

CampusFix is a student-built decentralized application for submitting campus maintenance reports and transparently tracking their status on an Ethereum-compatible blockchain.

## Features
- Connects to MetaMask with Ethers.js v6.
- Submits maintenance requests to the CampusFix Solidity contract.
- Reads and displays on-chain request records.
- Allows only the deploying admin wallet to update request status.
- Validates empty/oversized input and invalid request IDs in the contract.
- Displays transaction outcomes and request timestamps.

## Tech stack
Solidity, Remix IDE, Ganache, MetaMask, Ethers.js, HTML, CSS, JavaScript.

## Run locally
1. Start Ganache and note the RPC URL and chain ID shown by your installation.
2. In MetaMask, add that local network using the exact RPC URL and chain ID from Ganache.
3. Import a Ganache **test account** into MetaMask using its private key. Never use a real wallet or publish this key.
4. Open Remix, load `CampusFix.sol`, compile it, select **Injected Provider - MetaMask** as the environment, and confirm MetaMask is connected to Ganache.
5. Deploy `CampusFix.sol` and copy the new deployed contract address.
6. Replace `PASTE_GANACHE_DEPLOYED_CONTRACT_ADDRESS_HERE` in `app.js` with that address.
7. Confirm `abi.json` matches the ABI from the same compiled contract.
8. Start a local web server from this directory:
   - Windows: `py -m http.server 8000`
   - If `py` is unavailable: `python -m http.server 8000`
9. Open `http://localhost:8000` in the same browser where MetaMask is installed.
10. Click **Connect MetaMask** and approve the connection.

## Test cases
| Test | Steps | Expected result |
|---|---|---|
| Valid submission | Enter a location and description, submit and confirm in MetaMask | Transaction confirms; request appears in list |
| Empty location | Attempt to submit with location blank | Frontend blocks it; contract also validates |
| Empty description | Attempt to submit with description blank | Frontend blocks it; contract also validates |
| Oversized values | Enter location >100 or description >500 characters | Frontend/contract reject the input |
| Admin status update | Connect deploying account and change status | Transaction confirms and new status appears |
| Unauthorized status update | Connect a different Ganache account and attempt status update | Admin controls are hidden; direct contract call reverts with `Only admin can do this` |
| Invalid request ID | Call `getRequest(999)` in Remix when count is lower | Reverts with `Invalid request ID` |

## Deployment details
- Network: Fill in the exact Ganache network name and chain ID used.
- RPC URL: Fill in the URL shown by Ganache.
- Contract address: Fill in the address of the Ganache deployment.
- Deployer/admin address: Fill in the public address shown by `admin()`.

## Evidence to add
Add genuine screenshots for:
1. Successful compilation in Remix.
2. Deployment on Ganache through Remix.
3. MetaMask connected to the local network.
4. Successful request transaction.
5. Failed invalid-input or unauthorized transaction.
6. Records displayed in the frontend.

## Security notes
- Use only local test accounts and valueless test ETH.
- Never commit private keys, seed phrases, passwords, or personal/sensitive report data.
- This is an educational prototype, not a production maintenance or identity system.
