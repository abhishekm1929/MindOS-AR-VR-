let adaptClickCount = 0;

function simulateCognitiveAdaptation() {
  const demo = document.getElementById("demo");
  const container = demo.querySelector(".container");

  adaptClickCount++;

  // Set background and text color for visibility
  demo.style.background = "#E3F2FD";
  container.style.color = "#111";

  // Remove previous message if exists
  const existingMessage = document.getElementById("adapt-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Add the new message
  let messageText = "";
  if (adaptClickCount === 1) {
    messageText = "⚡ Interface adapted for fast decision-makers.";
  } else if (adaptClickCount === 2) {
    messageText = "🧠 Interface adapted for deliberate decision-makers.";
  }

  if (adaptClickCount <= 2) {
    const message = document.createElement("p");
    message.id = "adapt-message";
    message.textContent = messageText;
    container.appendChild(message);
  }
}
