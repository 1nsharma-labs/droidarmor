import assert from 'assert';
import { AdbDriver } from '../core/src/adb/driver.js';
import { UiParser } from '../core/src/ui/parser.js';
import { MobileAgent } from '../core/src/agent/planner.js';
import { MobileTestRunner } from '../core/src/runner/testRunner.js';
import { EnterpriseLicenseVerifier } from '../ee/license/verifier.js';
import { DeviceGridCoordinator } from '../ee/fleet/grid.js';

console.log('🧪 Running DroidArmor Test Suite...\n');

// 1. AdbDriver Tests
console.log('▶ Testing AdbDriver (Device Discovery & Actions)...');
const driver = new AdbDriver({ simulate: true });
const devices = driver.listDevices();
assert(devices.length > 0, 'Should return at least one device');
console.log(`  ✔ Discovered ${devices.length} device(s) [${devices[0].model}]`);

const tapRes = driver.tap(100, 200);
assert(tapRes.success === true, 'Tap action should succeed');
console.log('  ✔ Adb tap verified');

const typeRes = driver.typeText('test_user');
assert(typeRes.success === true, 'Type action should succeed');
console.log('  ✔ Adb text typing verified');

const swipeRes = driver.swipe(100, 500, 100, 100);
assert(swipeRes.success === true, 'Swipe action should succeed');
console.log('  ✔ Adb swipe verified');

const keyRes = driver.pressKey(4);
assert(keyRes.success === true, 'Keyevent action should succeed');
console.log('  ✔ Adb keyevent verified');

// 2. UiParser Tests
console.log('\n▶ Testing UiParser (XML Hierarchy & Bounds)...');
const xml = driver.dumpUiHierarchy();
assert(xml.includes('<hierarchy'), 'Hierarchy XML should be present');

const nodes = UiParser.parseXml(xml);
assert(nodes.length > 0, 'Should parse XML nodes');
console.log(`  ✔ Parsed ${nodes.length} hierarchy nodes`);

const signInEl = UiParser.findElement(nodes, 'Sign In');
assert(signInEl !== null, 'Should find Sign In element');
assert(signInEl.center.x === 540, 'Sign In center X should be 540');
assert(signInEl.center.y === 1260, 'Sign In center Y should be 1260');
console.log(`  ✔ Element found at exact coordinates (${signInEl.center.x}, ${signInEl.center.y})`);

const summary = UiParser.generateScreenSummary(nodes);
assert(summary.includes('Screen State'), 'Summary should be generated');
console.log('  ✔ Screen summary for AI agent generated successfully');

// 3. Autonomous MobileAgent Tests
console.log('\n▶ Testing MobileAgent (Observe-Plan-Act Loop)...');
const agent = new MobileAgent(driver);
const agentResult = await agent.executeGoal('Turn on dark theme');
assert(agentResult.completed === true, 'Agent goal should complete');
assert(agentResult.stepsTaken > 0, 'Agent should take at least 1 step');
console.log(`  ✔ Autonomous goal fulfilled in ${agentResult.stepsTaken} step(s)`);

// 4. Self-Healing MobileTestRunner Tests
console.log('\n▶ Testing MobileTestRunner (Self-Healing Locators)...');
const testRunner = new MobileTestRunner(driver);
const testSpec = {
  name: 'Self-Healing Test Spec',
  steps: [
    { action: 'assertVisible', target: 'Settings' },
    { action: 'tap', target: 'Display & touch' },
    // Intentional missing locator to test self-healing coordinate fallback
    { action: 'tap', target: 'NonExistentButton', fallbackCoordinates: [540, 1260] }
  ]
};

const testResult = await testRunner.runTest(testSpec);
assert(testResult.status === 'PASSED_WITH_HEALING', 'Test should pass with healing');
assert(testResult.healedSteps === 1, 'Exactly 1 step should be healed');
console.log(`  ✔ Self-healing test passed: ${testResult.healedSteps} locator(s) auto-repaired`);

// 5. Enterprise License & Grid Tests
console.log('\n▶ Testing Enterprise Edition (License Verification & Fleet Grid)...');
const licenseKey = EnterpriseLicenseVerifier.generateSampleKey('tester@corp.internal');
const verif = EnterpriseLicenseVerifier.verifyKey(licenseKey);
assert(verif.valid === true, 'Enterprise license should verify');
console.log(`  ✔ Verified license for: ${verif.licensee} (${verif.plan})`);

const grid = new DeviceGridCoordinator(licenseKey);
const gridRes = await grid.runParallelSuite(testSpec, ['device-alpha', 'device-beta']);
assert(gridRes.totalDevices === 2, 'Should execute across 2 devices');
assert(gridRes.passed === 2, 'All devices should pass');
console.log(`  ✔ Parallel fleet execution succeeded across ${gridRes.totalDevices} devices in ${gridRes.durationMs}ms`);

console.log('\n🎉 ALL DROIDARMOR TESTS PASSED WITH 100% SUCCESS!\n');
