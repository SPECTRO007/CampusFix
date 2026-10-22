// CampusFix frontend — Ethers.js v6
// Set CONTRACT_ADDRESS after deploying CampusFix to the same network used by MetaMask.
const CONTRACT_ADDRESS = "PASTE_GANACHE_DEPLOYED_CONTRACT_ADDRESS_HERE";
const STATUS_NAMES = ["Submitted", "In Progress", "Resolved"];

let provider;
let signer;
let contract;
let currentAccount = null;
let adminAddress = null;

const $ = (id) => document.getElementById(id);
const connectBtn = $("connectBtn");
const refreshBtn = $("refreshBtn");
const submitBtn = $("submitBtn");
const notice = $("notice");

function showNotice(message, type = "info") {
  notice.textContent = message;
  notice.className = `notice ${type}`;
}
function clearNotice() {
  notice.textContent = "";
  notice.className = "notice hidden";
}
function shortAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Not connected";
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function formatDate(timestamp) {
  const date = new Date(Number(timestamp) * 1000);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}
function statusClass(status) { return `s${Number(status)}`; }

async function connectWallet() {
  clearNotice();
  if (!window.ethereum) {
    showNotice("MetaMask was not detected. Install/enable the MetaMask browser extension, then reload this page.", "error");
    return;
  }
  if (!window.ethers) {
    showNotice("Ethers.js did not load. Check your internet connection and reload the page.", "error");
    return;
  }
  if (CONTRACT_ADDRESS === "PASTE_GANACHE_DEPLOYED_CONTRACT_ADDRESS_HERE" ||
      !ethers.isAddress(CONTRACT_ADDRESS)) {
    showNotice("First deploy CampusFix to Ganache through Remix, then paste the deployed contract address into app.js.", "error");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts.length) throw new Error("No wallet account was returned.");
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    currentAccount = await signer.getAddress();

    const network = await provider.getNetwork();
    const abiResponse = await fetch("./abi.json");
    if (!abiResponse.ok) throw new Error("Could not load abi.json. Keep it in the same folder as index.html.");
    const abi = await abiResponse.json();

    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    adminAddress = await contract.admin();

    $("walletStatus").textContent = "Wallet connected";
    $("walletAddress").textContent = currentAccount;
    $("networkLabel").textContent = `Chain ID ${network.chainId.toString()} · ${shortAddress(currentAccount)}`;
    $("connectBtn").textContent = "Wallet connected";
    $("status-dot");
    document.querySelector(".status-dot").style.background = "#2b9b61";
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit maintenance request";
    refreshBtn.disabled = false;
    await refreshRecords();
    showNotice(
      currentAccount.toLowerCase() === adminAddress.toLowerCase()
        ? "Connected. This wallet is the contract admin; admin status controls are enabled."
        : "Connected. You can submit requests. Status changes are restricted to the contract admin.",
      "success"
    );
  } catch (error) {
    showNotice(error.shortMessage || error.message || "Could not connect wallet.", "error");
  }
}

async function refreshRecords() {
  if (!contract) {
    showNotice("Connect MetaMask first.", "error");
    return;
  }
  refreshBtn.disabled = true;
  $("records").innerHTML = '<div class="empty-state">Loading on-chain requests…</div>';
  try {
    const count = Number(await contract.requestCount());
    $("requestCount").textContent = count;
    $("recordCountLabel").textContent = `${count} record${count === 1 ? "" : "s"}`;

    if (count === 0) {
      $("records").innerHTML = '<div class="empty-state">No maintenance requests yet. Submit the first report above.</div>';
      return;
    }

    const items = [];
    // Sequential reads are simple and reliable for a small assignment demo.
    for (let id = count; id >= 1; id--) {
      const r = await contract.getRequest(id);
      const status = Number(r.status);
      const isAdmin = currentAccount && adminAddress &&
        currentAccount.toLowerCase() === adminAddress.toLowerCase();
      const controls = isAdmin ? `
        <div class="admin-controls">
          <select id="status-${id}" aria-label="New status for request ${id}">
            ${STATUS_NAMES.map((name, index) =>
              `<option value="${index}" ${index === status ? "selected" : ""}>${name}</option>`
            ).join("")}
          </select>
          <button class="button secondary" data-update="${id}">Update</button>
        </div>` : "";

      items.push(`
        <article class="request-card">
          <div class="request-top">
            <span class="request-id">REQUEST #${id}</span>
            <span class="request-status ${statusClass(status)}">${escapeHtml(STATUS_NAMES[status] || "Unknown")}</span>
          </div>
          <h3>${escapeHtml(r.location)}</h3>
          <p class="description">${escapeHtml(r.description)}</p>
          <div class="meta">
            <div><strong>Reported by:</strong> ${escapeHtml(shortAddress(r.reporter))}</div>
            <div><strong>Created:</strong> ${escapeHtml(formatDate(r.createdAt))}</div>
          </div>
          ${controls}
        </article>`);
    }
    $("records").innerHTML = items.join("");
    document.querySelectorAll("[data-update]").forEach((button) => {
      button.addEventListener("click", () => updateRequestStatus(Number(button.dataset.update)));
    });
  } catch (error) {
    $("records").innerHTML = '<div class="empty-state">Could not read records. Check the network and contract address.</div>';
    showNotice(error.shortMessage || error.message || "Failed to read contract data.", "error");
  } finally {
    refreshBtn.disabled = false;
  }
}

async function submitRequest(event) {
  event.preventDefault();
  clearNotice();
  if (!contract) return showNotice("Connect MetaMask first.", "error");
  const location = $("location").value.trim();
  const description = $("description").value.trim();
  if (!location || !description) return showNotice("Enter both a campus location and a description.", "error");
  if (location.length > 100) return showNotice("Location must be 100 characters or fewer.", "error");
  if (description.length > 500) return showNotice("Description must be 500 characters or fewer.", "error");

  submitBtn.disabled = true;
  submitBtn.textContent = "Confirm in MetaMask…";
  try {
    const tx = await contract.submitRequest(location, description);
    showNotice(`Transaction sent: ${tx.hash}. Waiting for confirmation…`, "info");
    await tx.wait();
    $("requestForm").reset();
    await refreshRecords();
    showNotice(`Request recorded successfully. Transaction: ${tx.hash}`, "success");
  } catch (error) {
    showNotice(error.shortMessage || error.reason || error.message || "Transaction failed or was rejected.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit maintenance request";
  }
}

async function updateRequestStatus(id) {
  clearNotice();
  const select = $(`status-${id}`);
  const status = Number(select.value);
  if (!contract) return showNotice("Connect MetaMask first.", "error");
  if (!Number.isInteger(status) || status < 0 || status > 2) {
    return showNotice("Choose a valid status.", "error");
  }
  try {
    showNotice(`Confirm status update for request #${id} in MetaMask…`, "info");
    const tx = await contract.updateStatus(id, status);
    showNotice(`Update sent: ${tx.hash}. Waiting for confirmation…`, "info");
    await tx.wait();
    await refreshRecords();
    showNotice(`Request #${id} status updated to ${STATUS_NAMES[status]}.`, "success");
  } catch (error) {
    showNotice(error.shortMessage || error.reason || error.message || "Status update failed.", "error");
  }
}

connectBtn.addEventListener("click", connectWallet);
refreshBtn.addEventListener("click", refreshRecords);
$("requestForm").addEventListener("submit", submitRequest);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
