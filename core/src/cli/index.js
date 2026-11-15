#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { AdbDriver } from '../adb/driver.js';
import { UiParser } from '../ui/parser.js';
import { MobileAgent } from '../agent/planner.js';
import { MobileTestRunner } from '../runner/testRunner.js';
import { DroidMcpServer } from '../mcp/server.js';

const BANNER = `
   ____            _     _                                 
  |  _ \\ _ __ ___ (_) __| |  /\\   _ __ _ __ ___   ___  _ __ 
  | | | | '__/ _ \\| |/ _\` | /  \\ | '__| '_ \` _ \\ / _ \\| '__|
  | |_| | | | (_) | | (_| |/ /\\ \\| |  | | | | | | (_) | |   
  |____/|_|  \\___/|_|\\__,_/_/  \\_\\_|  |_| |_| |_|\\___/|_|   
                                                            
  The Open-Source Autonomous AI Mobile Agent & Fast ADB Automation CLI
  Created by Amit Sharma (@1nsharma) • 1nsharma-labs
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const driver = new AdbDriver();

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(BANNER);
    console.log(`Usage: droidarmor <command> [options]\n`);
    console.log(`Commands:`);
    console.log(`  devices            List attached Android phones, emulators & connection states`);
    console.log(`  inspect            Dump live screen and list all interactive elements with coordinates`);
    console.log(`  tap <target|x,y>   Tap an element by text, resource ID, or exact X,Y coordinates`);
    console.log(`  type <text>        Type text into the currently focused Android input field`);
    console.log(`  key <keycode>      Send keyevent (e.g. 3=HOME, 4=BACK, 66=ENTER)`);
    console.log(`  run "<goal>"       Autonomously execute a multi-step user goal using AI agent`);
    console.log(`  test <file.json>   Execute self-healing mobile test script with coordinate fallback`);
    console.log(`  mcp                Launch Model Context Protocol (MCP) server for Claude / Cursor`);
    console.log(`\nExamples:`);
    console.log(`  droidarmor devices`);
    console.log(`  droidarmor inspect`);
    console.log(`  droidarmor tap "Sign In"`);
    console.log(`  droidarmor tap 540 1260`);
    console.log(`  droidarmor run "Turn on dark theme"`);
    console.log(`  droidarmor test ./test_login.json\n`);
    process.exit(0);
  }

  if (command === 'mcp') {
    const server = new DroidMcpServer();
    server.start();
    return;
  }

  console.log(BANNER);

  if (command === 'devices') {
    const devices = driver.listDevices();
    console.log(`📱 Connected Android Devices (${devices.length}):\n`);
    devices.forEach((d, idx) => {
      const sim = d.simulated ? ' [Simulated/Fallback]' : '';
      console.log(`  [${idx + 1}] Serial: ${d.serial} | State: ${d.state} | Model: ${d.model || 'Generic'}${sim}`);
    });
    console.log('');
  } else if (command === 'inspect') {
    console.log(`🔍 Inspecting live screen UI hierarchy...\n`);
    const xml = driver.dumpUiHierarchy();
    const nodes = UiParser.parseXml(xml);
    const summary = UiParser.generateScreenSummary(nodes);
    console.log(summary);
    console.log('');
  } else if (command === 'tap') {
    const target = args[1];
    if (!target) {
      console.error(`❌ Error: Please specify a target element name or coordinates (e.g. droidarmor tap "Sign In" or droidarmor tap 500 1200)`);
      process.exit(1);
    }

    if (!isNaN(parseInt(target, 10)) && args[2] && !isNaN(parseInt(args[2], 10))) {
      const x = parseInt(target, 10);
      const y = parseInt(args[2], 10);
      const res = driver.tap(x, y);
      console.log(`👆 Tapped coordinates (${x}, ${y}) -> ${res.success ? 'SUCCESS' : 'FAILED'}`);
    } else {
      const xml = driver.dumpUiHierarchy();
      const nodes = UiParser.parseXml(xml);
      const el = UiParser.findElement(nodes, target);
      if (!el || !el.center) {
        console.error(`❌ Element "${target}" not found on screen.`);
        process.exit(1);
      }
      const res = driver.tap(el.center.x, el.center.y);
      console.log(`👆 Tapped "${target}" at (${el.center.x}, ${el.center.y}) -> ${res.success ? 'SUCCESS' : 'FAILED'}`);
    }
  } else if (command === 'type') {
    const text = args.slice(1).join(' ');
    if (!text) {
      console.error(`❌ Error: Please specify text to type (e.g. droidarmor type "hello@example.com")`);
      process.exit(1);
    }
    const res = driver.typeText(text);
    console.log(`⌨️  Typed "${text}" -> ${res.success ? 'SUCCESS' : 'FAILED'}`);
  } else if (command === 'run') {
    const goal = args.slice(1).join(' ');
    if (!goal) {
      console.error(`❌ Error: Please specify a goal (e.g. droidarmor run "Turn on dark theme")`);
      process.exit(1);
    }
    console.log(`🎯 Executing Autonomous Goal: "${goal}"\n`);
    const agent = new MobileAgent(driver, { verbose: true });
    const result = await agent.executeGoal(goal);
    console.log(`\n📊 Goal Execution Report:`);
    console.log(`  Status:      ${result.completed ? '✅ COMPLETED' : '❌ FAILED'}`);
    console.log(`  Steps Taken: ${result.stepsTaken}`);
    if (result.error) console.log(`  Error:       ${result.error}`);
    console.log(`  Action Trace:`);
    result.trace.forEach(t => {
      console.log(`    - Step ${t.step}: [${t.action}] ${t.intent || t.message || ''}`);
    });
    console.log('');
  } else if (command === 'test') {
    const file = args[1];
    if (!file) {
      console.error(`❌ Error: Please specify test spec file path (e.g. droidarmor test ./flow.json)`);
      process.exit(1);
    }

    let spec;
    if (fs.existsSync(file)) {
      spec = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } else {
      // Run built-in demo test
      console.log(`ℹ️  Running built-in test suite demonstration...\n`);
      spec = {
        name: "Settings Toggle & Authentication Test",
        steps: [
          { action: "assertVisible", target: "Settings" },
          { action: "tap", target: "Display & touch", fallbackCoordinates: [192, 1050] },
          { action: "tap", target: "Dark theme" },
          { action: "tap", target: "Sign In", fallbackCoordinates: [540, 1260] }
        ]
      };
    }

    const runner = new MobileTestRunner(driver);
    const result = await runner.runTest(spec);

    console.log(`🧪 Test Suite: "${result.testName}"`);
    console.log(`  Status:        ${result.status === 'PASSED' ? '✅ PASSED' : result.status === 'PASSED_WITH_HEALING' ? '⚠️ PASSED WITH HEALING' : '❌ FAILED'}`);
    console.log(`  Executed:      ${result.executedSteps} / ${result.totalSteps} steps`);
    console.log(`  Self-Healed:   ${result.healedSteps} locators`);
    console.log(`  Duration:      ${result.durationMs}ms`);
    console.log(`\nDetailed Steps:`);
    result.steps.forEach(s => {
      const badge = s.status === 'PASS' ? '✅' : '❌';
      const healBadge = s.healed ? ' 🔧 [HEALED]' : '';
      console.log(`  ${badge} Step ${s.stepNumber}: ${s.action} -> ${s.target} (${s.durationMs}ms)${healBadge}`);
      if (s.details) console.log(`     ${s.details}`);
    });
    console.log('');
  } else {
    console.error(`Unknown command: "${command}". Run "droidarmor help" for usage.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
