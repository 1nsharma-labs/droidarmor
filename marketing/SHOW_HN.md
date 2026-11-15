# Show HN: DroidArmor – Open-source autonomous AI mobile agent & self-healing ADB runner

Hey Hacker News,

I’m Amit (@1nsharma), founder of 1nsharma-labs. Today I’m releasing **DroidArmor** (Apache 2.0).

### The Problem
Automating mobile UI interactions and tests on Android has been notoriously painful:
1. **Appium bloat:** Huge dependency trees, flaky server processes, and sluggish response times.
2. **Brittle locators:** Mobile app layouts drift constantly, breaking test suites and CI pipelines whenever a resource ID or view hierarchy shifts.
3. **No native AI / MCP integration:** Autonomous agents (like Claude Desktop or Cursor) have great computer-use capabilities for desktop browsers, but controlling a physical Android phone has remained cumbersome.

### What DroidArmor Does
DroidArmor is a zero-runtime-dependency CLI and Node 24 engine that connects directly to `adb`:
- **Fast Coordinate & Dynamic ADB Control:** Sub-50ms tap, type, swipe, and keyevent dispatch.
- **Autonomous Reactive Agent:** Observe-Plan-Act loop that reads UIAutomator XML, extracts interactive elements and center bounds, and fulfills high-level goals (`droidarmor run "Turn on dark theme"`).
- **Self-Healing Test Runner:** Uses the *Dynamic-First, Coordinate-Fallback* philosophy. If dynamic selectors break due to UI drift, it seamlessly falls back to verified relative/absolute coordinates.
- **Native Model Context Protocol (MCP) Server:** Works out of the box with Claude Desktop and Cursor.
- **Graceful Simulator Fallback:** If you don't have a phone plugged in, it simulates a realistic Pixel 8 Pro UI hierarchy so your tests and development workflows never crash.

- **GitHub:** https://github.com/1nsharma-labs/droidarmor
- **Live In-Browser Interactive Phone Demo:** https://1nsharma-labs.github.io/droidarmor/

I'd love your feedback, questions, and PRs!
