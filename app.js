let totpSecret = "";

document.getElementById("generate-secret-btn").addEventListener("click", () => {
  const username = document.getElementById("totp-username").value.trim();
  if (username === "") {
    alert("Please enter a username");
    return;
  }

  totpSecret = btoa(username + Date.now()).substring(0, 16);
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
      console.log(result);
      document.getElementById("result").textContent = result.text;
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
        // properly decoded qr code
        console.log("Found QR code!", result);
        document.getElementById("result").textContent = result.text;
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
        const decodingStyle = document.getElementById("decoding-style").value;

        if (decodingStyle == "once") {
          decodeOnce(codeReader, selectedDeviceId);
        } else {
          decodeContinuously(codeReader, selectedDeviceId);
        }

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
