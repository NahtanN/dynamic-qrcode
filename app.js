// --- TOTP Section ---
let totpSecret = "";

document.getElementById("generate-secret-btn").addEventListener("click", () => {
  const username = document.getElementById("totp-username").value.trim();
  if (username === "") {
    alert("Please enter a username");
    return;
  }
  // For simplicity, simulate secret generation
  totpSecret = btoa(username + Date.now()).substring(0, 16); // Basic encoding for demo purposes
  document.getElementById("totp-secret-display").innerText =
    `Secret: ${totpSecret}`;
  document.getElementById("generate-totp-btn").disabled = false;
  document.getElementById("validate-totp-btn").disabled = false;
});

// Generate a mock TOTP code
document.getElementById("generate-totp-btn").addEventListener("click", () => {
  if (!totpSecret) return;
  const totpCode = (Math.floor(Math.random() * 900000) + 100000).toString(); // Mock 6-digit code
  document.getElementById("totp-code-display").innerText =
    `TOTP Code: ${totpCode}`;
  sessionStorage.setItem("totpCode", totpCode); // Store for validation
});

// Validate TOTP Code
document.getElementById("validate-totp-btn").addEventListener("click", () => {
  const userCode = document.getElementById("totp-input").value.trim();
  const storedCode = sessionStorage.getItem("totpCode");

  if (userCode === storedCode) {
    document.getElementById("totp-result").innerText = "✅ Code is valid!";
  } else {
    document.getElementById("totp-result").innerText = "❌ Invalid code.";
  }
});

// --- QR Code Section ---
document.getElementById("generate-qr-btn").addEventListener("click", () => {
  const username = document.getElementById("qr-username").value.trim();
  if (username === "") {
    alert("Please enter a username");
    return;
  }

  // Create a dynamic QR code with user info
  const qrCodeData = `User: ${username}, Time: ${Date.now()}`;
  const qrContainer = document.getElementById("qr-code-container");
  qrContainer.innerHTML = ""; // Clear previous QR code

  const qrImage = document.createElement("img");
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=150x150`;
  qrContainer.appendChild(qrImage);

  document.getElementById("qr-result").innerText = "QR Code Generated!";
});
