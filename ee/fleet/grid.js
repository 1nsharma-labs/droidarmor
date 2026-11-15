import { AdbDriver } from '../../core/src/adb/driver.js';
import { MobileTestRunner } from '../../core/src/runner/testRunner.js';
import { EnterpriseLicenseVerifier } from '../license/verifier.js';

export class DeviceGridCoordinator {
  constructor(licenseKey, options = {}) {
    this.verification = EnterpriseLicenseVerifier.verifyKey(licenseKey);
    if (!this.verification.valid) {
      throw new Error(`Enterprise License required to run multi-device grid: ${this.verification.reason}`);
    }
    this.options = options;
  }

  async runParallelSuite(testSpec, deviceSerials = []) {
    const startTime = Date.now();
    const targets = deviceSerials.length > 0 ? deviceSerials : ['device-1', 'device-2', 'device-3'];

    const runs = targets.map(async (serial) => {
      const driver = new AdbDriver({ deviceSerial: serial, simulate: true });
      const runner = new MobileTestRunner(driver);
      const res = await runner.runTest(testSpec);
      return {
        deviceSerial: serial,
        ...res
      };
    });

    const results = await Promise.all(runs);
    const passed = results.filter(r => r.status.startsWith('PASSED')).length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const healed = results.reduce((sum, r) => sum + r.healedSteps, 0);

    return {
      suite: testSpec.name,
      totalDevices: targets.length,
      passed,
      failed,
      totalHealedLocators: healed,
      durationMs: Date.now() - startTime,
      deviceRuns: results
    };
  }
}
