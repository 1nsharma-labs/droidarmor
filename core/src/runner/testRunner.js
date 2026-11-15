import { UiParser } from '../ui/parser.js';

export class MobileTestRunner {
  constructor(adbDriver) {
    this.driver = adbDriver;
  }

  async runTest(testSpec) {
    const startTime = Date.now();
    const results = [];
    let healedCount = 0;
    let failed = false;
    let failureReason = null;

    for (let i = 0; i < (testSpec.steps || []).length; i++) {
      const step = testSpec.steps[i];
      const stepStartTime = Date.now();
      let stepStatus = 'PASS';
      let healed = false;
      let details = '';

      try {
        const xml = this.driver.dumpUiHierarchy();
        const nodes = UiParser.parseXml(xml);

        if (step.action === 'tap') {
          let element = UiParser.findElement(nodes, step.target);
          let targetCoords = null;

          if (element && element.center) {
            targetCoords = element.center;
          } else if (step.fallbackCoordinates) {
            // Self-healing coordinate fallback
            targetCoords = { x: step.fallbackCoordinates[0], y: step.fallbackCoordinates[1] };
            healed = true;
            healedCount++;
            details = `Self-healed locator for "${step.target}" using coordinates fallback [${targetCoords.x}, ${targetCoords.y}]`;
          } else {
            throw new Error(`Element "${step.target}" not found on screen and no fallback coordinates provided.`);
          }

          this.driver.tap(targetCoords.x, targetCoords.y);
        } else if (step.action === 'type') {
          this.driver.typeText(step.text);
        } else if (step.action === 'swipe') {
          const coords = step.coordinates || [500, 1500, 500, 500];
          this.driver.swipe(coords[0], coords[1], coords[2], coords[3], step.duration || 300);
        } else if (step.action === 'assertVisible') {
          const element = UiParser.findElement(nodes, step.target);
          if (!element) {
            throw new Error(`Assertion failed: Element "${step.target}" is not visible on current screen.`);
          }
          details = `Verified element "${step.target}" is visible.`;
        } else if (step.action === 'key') {
          this.driver.pressKey(step.keycode || 4); // default BACK key
        }
      } catch (err) {
        stepStatus = 'FAIL';
        failed = true;
        failureReason = err.message;
        details = err.message;
      }

      results.push({
        stepNumber: i + 1,
        action: step.action,
        target: step.target || step.text || 'system',
        status: stepStatus,
        healed,
        details,
        durationMs: Date.now() - stepStartTime
      });

      if (failed) break;
    }

    return {
      testName: testSpec.name || 'Unnamed Mobile Test',
      status: failed ? 'FAILED' : (healedCount > 0 ? 'PASSED_WITH_HEALING' : 'PASSED'),
      totalSteps: (testSpec.steps || []).length,
      executedSteps: results.length,
      healedSteps: healedCount,
      failureReason,
      durationMs: Date.now() - startTime,
      steps: results
    };
  }
}
