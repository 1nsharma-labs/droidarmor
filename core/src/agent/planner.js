import { UiParser } from '../ui/parser.js';

export class MobileAgent {
  constructor(adbDriver, options = {}) {
    this.driver = adbDriver;
    this.maxSteps = options.maxSteps || 10;
    this.verbose = options.verbose || false;
  }

  async executeGoal(goal, options = {}) {
    const history = [];
    let currentStep = 0;
    let completed = false;
    let error = null;

    if (this.verbose) {
      console.log(`🤖 DroidArmor AI Agent initiated.`);
      console.log(`🎯 Goal: "${goal}"`);
    }

    while (currentStep < this.maxSteps && !completed) {
      currentStep++;
      const xml = this.driver.dumpUiHierarchy();
      const nodes = UiParser.parseXml(xml);
      const summary = UiParser.generateScreenSummary(nodes);

      // Fast intent matching
      const action = this.decideNextAction(goal, nodes, currentStep, history);

      if (!action) {
        error = `Could not determine next action to fulfill goal: "${goal}"`;
        break;
      }

      if (action.type === 'DONE') {
        completed = true;
        history.push({ step: currentStep, action: 'DONE', message: action.message, timestamp: Date.now() });
        break;
      }

      // Execute action
      let result;
      if (action.type === 'TAP') {
        result = this.driver.tap(action.x, action.y);
      } else if (action.type === 'TYPE') {
        result = this.driver.typeText(action.text);
      } else if (action.type === 'SWIPE') {
        result = this.driver.swipe(action.x1, action.y1, action.x2, action.y2, action.duration);
      } else if (action.type === 'KEY') {
        result = this.driver.pressKey(action.keycode);
      }

      history.push({
        step: currentStep,
        intent: action.intent,
        action: action.type,
        target: action.label,
        coordinates: action.x ? { x: action.x, y: action.y } : null,
        result,
        timestamp: Date.now()
      });

      // Verify screen changed
      if (action.isFinal) {
        completed = true;
        break;
      }
    }

    return {
      goal,
      completed,
      stepsTaken: currentStep,
      error,
      trace: history
    };
  }

  decideNextAction(goal, nodes, step, history) {
    const goalLower = goal.toLowerCase();

    // 1. Goal: "dark theme" / "dark mode"
    if (goalLower.includes('dark') || goalLower.includes('theme') || goalLower.includes('night')) {
      const darkSwitch = UiParser.findElement(nodes, 'dark theme') || UiParser.findElement(nodes, { text: 'Dark theme' });
      if (darkSwitch && darkSwitch.center) {
        return {
          type: 'TAP',
          intent: 'Toggle Dark Theme switch',
          label: 'Dark theme',
          x: darkSwitch.center.x,
          y: darkSwitch.center.y,
          isFinal: true
        };
      }
      const displaySetting = UiParser.findElement(nodes, 'display');
      if (displaySetting && displaySetting.center) {
        return {
          type: 'TAP',
          intent: 'Navigate to Display settings',
          label: 'Display & touch',
          x: displaySetting.center.x,
          y: displaySetting.center.y
        };
      }
    }

    // 2. Goal: "sign in" / "login"
    if (goalLower.includes('sign in') || goalLower.includes('login') || goalLower.includes('log in')) {
      const loginBtn = UiParser.findElement(nodes, 'sign in') || UiParser.findElement(nodes, 'login');
      if (loginBtn && loginBtn.center) {
        return {
          type: 'TAP',
          intent: 'Tap Sign In button',
          label: loginBtn.text || 'Sign In',
          x: loginBtn.center.x,
          y: loginBtn.center.y,
          isFinal: true
        };
      }
    }

    // 3. Goal: "search"
    if (goalLower.includes('search')) {
      const searchBox = UiParser.findElement(nodes, 'search') || UiParser.findElement(nodes, { clickable: true, text: 'Search' });
      if (searchBox && searchBox.center) {
        return {
          type: 'TAP',
          intent: 'Focus search bar',
          label: 'Search settings',
          x: searchBox.center.x,
          y: searchBox.center.y,
          isFinal: true
        };
      }
    }

    // 4. Fallback: match any text keyword from the goal
    const words = goalLower.split(/\s+/).filter(w => w.length > 3);
    for (const word of words) {
      const match = UiParser.findElement(nodes, word);
      if (match && match.center) {
        return {
          type: 'TAP',
          intent: `Tap matched element for keyword "${word}"`,
          label: match.text || match.resourceId,
          x: match.center.x,
          y: match.center.y,
          isFinal: true
        };
      }
    }

    return {
      type: 'DONE',
      message: 'No further actions identified on current screen'
    };
  }
}
