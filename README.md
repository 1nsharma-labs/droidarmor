<h1 align="center">🤖 DroidArmor</h1>

<p align="center">
  <b>The Open-Source Autonomous AI Mobile Agent & Fast ADB Automation CLI for Android</b><br>
  Control Android phones with AI, execute natural language tasks, and run resilient self-healing tests via native ADB and Model Context Protocol (MCP).
</p>

<p align="center">
  <a href="https://github.com/1nsharma-labs/droidarmor/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/droidarmor"><img src="https://img.shields.io/badge/npm-v1.0.0-blue.svg" alt="npm version"></a>
  <a href="https://github.com/1nsharma-labs/droidarmor/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-green.svg" alt="License"></a>
  <a href="https://1nsharma-labs.github.io/droidarmor/"><img src="https://img.shields.io/badge/Live_Demo-Interactive_Phone-orange.svg" alt="Live Demo"></a>
  <a href="https://polar.sh/1nsharma-labs"><img src="https://img.shields.io/badge/Sponsor-Polar.sh-purple.svg" alt="Sponsor"></a>
</p>

---

## 🌟 Why DroidArmor?

Traditional mobile test automation tools like Appium are bloated, brittle, and require complex server installations with flaky locators that break every time UI layouts change.

**DroidArmor** is a zero-runtime-dependency CLI and Node.js engine that gives developers, QA engineers, and autonomous AI agents direct, lightning-fast control over any Android device or emulator.

* ⚡ **Zero External Dependencies:** Built with pure native Node 24 ESM and system `adb`.
* 🤖 **Autonomous AI Mobile Agent:** Executes natural language instructions (e.g. *"Open Settings, find Display, enable Dark Theme"*) via a reactive Observe-Plan-Act-Verify loop.
* 🔧 **Self-Healing Test Runner:** Adheres to the *Dynamic-First, Coordinate-Fallback* philosophy. If dynamic resource IDs drift, DroidArmor automatically recovers using verified coordinate fallbacks.
* 🔮 **Native Model Context Protocol (MCP) Server:** Connects directly to **Claude Desktop** and **Cursor** so LLMs can see the device screen and control real Android phones.
* 📱 **Graceful Fallback Simulation:** Works out of the box even without a physical device attached (provides simulated Pixel 8 Pro virtual hierarchies for testing & CI).

---

## 🚀 Quick Start

### Installation

Install globally or run on demand via `npx`:

```bash
# Run directly without installation
npx -y droidarmor help

# Or install globally
npm install -g droidarmor
```

---

## 💻 CLI Commands

### 1. Discover Connected Devices
Lists all attached physical Android phones, emulators, and connection states:
```bash
droidarmor devices
```

### 2. Inspect Live Screen UI Hierarchy
Dumps the current screen, parses interactive elements, and calculates precise center click coordinates:
```bash
droidarmor inspect
```

### 3. Tap Elements by Name or Coordinates
```bash
# Tap by visible text or resource ID
droidarmor tap "Sign In"

# Tap by exact pixel coordinates
droidarmor tap 540 1260
```

### 4. Input Text into Focused Fields
```bash
droidarmor type "developer@1nsharma.com"
```

### 5. Run Autonomous AI Goals
```bash
droidarmor run "Turn on dark theme"
```

### 6. Execute Self-Healing Test Suites
Run declarative JSON test specifications with automatic locator healing:
```bash
droidarmor test ./test_flow.json
```

---

## 🔮 Model Context Protocol (MCP) Integration

DroidArmor includes a built-in MCP stdio server. Add it to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "droidarmor": {
      "command": "npx",
      "args": ["-y", "droidarmor", "mcp"]
    }
  }
}
```

Now Claude Desktop and Cursor can directly call:
* `droidarmor_list_devices`
* `droidarmor_inspect_ui`
* `droidarmor_tap`
* `droidarmor_type`
* `droidarmor_swipe`
* `droidarmor_run_goal`

---

## 🧪 Self-Healing Test Specification Example

Create a `settings_test.json` file:

```json
{
  "name": "Settings Dark Mode & Authentication Test",
  "steps": [
    { "action": "assertVisible", "target": "Settings" },
    { "action": "tap", "target": "Display & touch", "fallbackCoordinates": [192, 1050] },
    { "action": "tap", "target": "Dark theme" },
    { "action": "tap", "target": "Sign In", "fallbackCoordinates": [540, 1260] }
  ]
}
```

Run it:
```bash
droidarmor test settings_test.json
```

---

## 💼 Commercial & Enterprise Edition

DroidArmor follows the **Open-Core** model:
* **Community Core (Apache 2.0):** 100% Free for local execution, single device, full MCP server, and CLI tools.
* **Enterprise Edition (BSL 1.1):** Includes the **Device Grid Coordinator** (`ee/fleet/grid.js`) for running tests in parallel across 50+ real devices simultaneously, historical flake analysis, and priority enterprise support.

### Direct Contact & Payment
* **Lead Architect:** **Amit Sharma** ([@1nsharma](https://github.com/1nsharma))
* **Direct Email:** [amitsharma9976@gmail.com](mailto:amitsharma9976@gmail.com)
* **Direct UPI / PhonePe / GPay / Paytm:** `6393741171` (UPI ID: `6393741171@upi`)
* **Global Sponsorship & Cards:** [polar.sh/1nsharma-labs](https://polar.sh/1nsharma-labs) &bull; [github.com/sponsors/1nsharma](https://github.com/sponsors/1nsharma)

---

## 🌐 The 1nsharma Ecosystem

* [**OmniMCP**](https://github.com/1nsharma-labs/omnimcp) — Universal Model Context Protocol Hub for Mobile, Desktop, Workspace & Memory.
* [**PromptArmor**](https://github.com/1nsharma-labs/promptarmor) — Sub-2ms Local Prompt Injection & Jailbreak Firewall.
* [**TokenArmor**](https://github.com/1nsharma-labs/tokenarmor) — Open-Source AI Gateway & Token FinOps Firewall.
* [**1nsharma/SLASH**](https://github.com/1nsharma/SLASH) — Unified System & Digital Network Intelligence Graph.
* [**1nsharma/Urlmind**](https://github.com/1nsharma/Urlmind) — Understand Anything on the Internet from a Single URL.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/1nsharma"><b>Amit Sharma</b></a> (@1nsharma-labs)
</p>
