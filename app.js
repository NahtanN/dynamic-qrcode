function base32ToBinary(base32) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let binary = "";

  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    binary += val.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i < binary.length; i += 8) {
    bytes.push(parseInt(binary.substr(i, 8), 2));
  }

  return new Uint8Array(bytes);
}

// Generate HMAC-SHA1 hash
async function hmacSha1(key, counter) {
  const encoder = new TextEncoder();
  const keyBytes = key instanceof Uint8Array ? key : encoder.encode(key);

  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(counter));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"],
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, counterBuffer),
  );
}

// Generate TOTP code
async function generateTOTP(secret, window = 0, step = 10, digits = 6) {
  const key = base32ToBinary(secret);
  const time = Math.floor(Date.now() / 1000 / step) + window; // Current time interval

  const hmac = await hmacSha1(key, time);
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

// Validate TOTP code
async function validateTOTP(secret, userCode, step = 10, digits = 6) {
  const code = await generateTOTP(secret, 0, step, digits);
  return code === userCode;
}

let totpSecret = "";

/*document.getElementById("generate-secret-btn").addEventListener("click", () => {*/
/*const username = document.getElementById("totp-username").value.trim();*/
/*if (username === "") {*/
/*alert("Please enter a username");*/
/*return;*/
/*}*/

/*totpSecret = btoa(username + Date.now()).substring(0, 16);*/
/*document.getElementById("totp-secret-display").innerText =*/
/*`Secret: ${totpSecret}`;*/
/*document.getElementById("generate-totp-btn").disabled = false;*/
/*document.getElementById("validate-totp-btn").disabled = false;*/
/*});*/

async function displayTOTP() {
  console.log("here");
  if (!totpSecret) return;
  const totpCode = await generateTOTP(totpSecret);
  console.log(totpCode);
  document.getElementById("totp-code-display").innerText =
    `TOTP Code: ${totpCode}`;
}

async function checkTOTP() {
  const userCode = document.getElementById("totp-input").value;
  if (!userCode) return;

  const isValid = await validateTOTP(totpSecret, userCode);
  console.log(isValid);
  document.getElementById("totp-result").innerText = isValid
    ? "✅ Codigo valido!"
    : "❌ Codigo invalido.";
}

document.getElementById("generate-qr-btn").addEventListener("click", () => {
  const username = document.getElementById("qr-username").value.trim();
  if (username === "") {
    alert("Please enter a username");
    return;
  }

  // Create a dynamic QR code with user info
  const data = {
    user: username,
    time: Date.now(),
  };
  const qrCodeData = JSON.stringify(data);
  const qrContainer = document.getElementById("qr-code-container");
  qrContainer.innerHTML = "";

  const qrImage = document.createElement("img");
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=150x150`;
  qrContainer.appendChild(qrImage);

  document.getElementById("qr-result").innerText = "QR Code Generated!";
});

function decodeOnce(codeReader, selectedDeviceId) {
  codeReader
    .decodeFromInputVideoDevice(selectedDeviceId, "video")
    .then((result) => {
      const data = JSON.parse(result.text);
      openModal(data.user);
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("result").textContent = err;
    });
}

function decodeContinuously(codeReader, selectedDeviceId) {
  codeReader.decodeFromInputVideoDeviceContinuously(
    selectedDeviceId,
    "video",
    (result, err) => {
      if (result) {
        const data = JSON.parse(result.text);
        openModal(data.user);
      }

      if (err) {
        // As long as this error belongs into one of the following categories
        // the code reader is going to continue as excepted. Any other error
        // will stop the decoding loop.
        //
        // Excepted Exceptions:
        //
        //  - NotFoundException
        //  - ChecksumException
        //  - FormatException

        if (err instanceof ZXing.NotFoundException) {
          console.log("No QR code found.");
        }

        if (err instanceof ZXing.ChecksumException) {
          console.log("A code was found, but it's read value was not valid.");
        }

        if (err instanceof ZXing.FormatException) {
          console.log("A code was found, but it was in a invalid format.");
        }
      }
    },
  );
}

window.addEventListener("load", function() {
  let selectedDeviceId;
  const codeReader = new ZXing.BrowserQRCodeReader();
  console.log("ZXing code reader initialized");

  codeReader
    .getVideoInputDevices()
    .then((videoInputDevices) => {
      const sourceSelect = document.getElementById("sourceSelect");
      selectedDeviceId = videoInputDevices[0].deviceId;
      if (videoInputDevices.length >= 1) {
        videoInputDevices.forEach((element) => {
          const sourceOption = document.createElement("option");
          sourceOption.text = element.label;
          sourceOption.value = element.deviceId;
          sourceSelect.appendChild(sourceOption);
        });

        sourceSelect.onchange = () => {
          selectedDeviceId = sourceSelect.value;
        };

        const sourceSelectPanel = document.getElementById("sourceSelectPanel");
        sourceSelectPanel.style.display = "block";
      }

      document.getElementById("startButton").addEventListener("click", () => {
        /*const decodingStyle = document.getElementById("decoding-style").value;*/
        decodeContinuously(codeReader, selectedDeviceId);

        /*        if (decodingStyle == "once") {*/
        /*decodeOnce(codeReader, selectedDeviceId);*/
        /*} else {*/
        /*decodeContinuously(codeReader, selectedDeviceId);*/
        /*}*/

        console.log(`Started decode from camera with id ${selectedDeviceId}`);
      });

      document.getElementById("resetButton").addEventListener("click", () => {
        codeReader.reset();
        document.getElementById("result").textContent = "";
        console.log("Reset.");
      });
    })
    .catch((err) => {
      console.error(err);
    });
});

function openModal(username) {
  const modal = document.getElementById("user-modal");
  modal.style.display = "block";

  document.getElementById("username").textContent = username;

  const closeModalBtn = document.getElementById("closeModalBtn");
  closeModalBtn.onclick = function() {
    modal.style.display = "none";
  };
}

window.onclick = function(event) {
  const modal = document.getElementById("user-modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};
