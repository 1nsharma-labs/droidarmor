import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class AdbDriver {
  constructor(options = {}) {
    this.adbPath = options.adbPath || 'adb';
    this.defaultSerial = options.deviceSerial || null;
    this.simulate = options.simulate || false;
    this.mockState = {
      currentScreen: 'home',
      activePackage: 'com.android.settings',
      activity: '.SettingsActivity',
      inputText: '',
      history: []
    };
  }

  isAdbAvailable() {
    try {
      execSync(`${this.adbPath} version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  listDevices() {
    if (this.simulate || !this.isAdbAvailable()) {
      return [
        {
          serial: 'emulator-5554',
          state: 'device',
          product: 'sdk_gphone64_arm64',
          model: 'Pixel_8_Pro_Virtual',
          device: 'husky',
          simulated: true
        }
      ];
    }

    try {
      const output = execSync(`${this.adbPath} devices -l`, { encoding: 'utf-8' });
      const lines = output.trim().split('\n').slice(1);
      const devices = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+/);
        const serial = parts[0];
        const state = parts[1];

        const modelMatch = trimmed.match(/model:([^\s]+)/);
        const deviceMatch = trimmed.match(/device:([^\s]+)/);

        devices.push({
          serial,
          state,
          model: modelMatch ? modelMatch[1] : 'Unknown',
          device: deviceMatch ? deviceMatch[1] : 'Unknown',
          simulated: false
        });
      }

      if (devices.length === 0) {
        return [
          {
            serial: 'emulator-5554',
            state: 'device',
            product: 'sdk_gphone64_arm64',
            model: 'Pixel_8_Pro_Virtual',
            device: 'husky',
            simulated: true
          }
        ];
      }

      return devices;
    } catch {
      return [
        {
          serial: 'emulator-5554',
          state: 'device',
          model: 'Pixel_8_Pro_Virtual',
          simulated: true
        }
      ];
    }
  }

  getTargetSerial(serial) {
    if (serial) return serial;
    if (this.defaultSerial) return this.defaultSerial;
    const devices = this.listDevices();
    return devices[0]?.serial || 'emulator-5554';
  }

  isDeviceSimulated(serial) {
    const s = this.getTargetSerial(serial);
    return this.simulate || s.includes('Virtual') || !this.isAdbAvailable();
  }

  tap(x, y, serial = null) {
    const target = this.getTargetSerial(serial);
    if (this.isDeviceSimulated(target)) {
      this.mockState.history.push({ action: 'tap', x, y, timestamp: Date.now() });
      return { success: true, action: 'tap', x, y, target, simulated: true };
    }

    try {
      execSync(`${this.adbPath} -s ${target} shell input tap ${Math.round(x)} ${Math.round(y)}`);
      return { success: true, action: 'tap', x, y, target, simulated: false };
    } catch (err) {
      return { success: false, error: err.message, target };
    }
  }

  typeText(text, serial = null) {
    const target = this.getTargetSerial(serial);
    if (this.isDeviceSimulated(target)) {
      this.mockState.inputText += text;
      this.mockState.history.push({ action: 'type', text, timestamp: Date.now() });
      return { success: true, action: 'type', text, target, simulated: true };
    }

    try {
      const escaped = text.replace(/([ '";&$])/g, '\\$1');
      execSync(`${this.adbPath} -s ${target} shell input text "${escaped}"`);
      return { success: true, action: 'type', text, target, simulated: false };
    } catch (err) {
      return { success: false, error: err.message, target };
    }
  }

  swipe(x1, y1, x2, y2, durationMs = 300, serial = null) {
    const target = this.getTargetSerial(serial);
    if (this.isDeviceSimulated(target)) {
      this.mockState.history.push({ action: 'swipe', x1, y1, x2, y2, durationMs, timestamp: Date.now() });
      return { success: true, action: 'swipe', x1, y1, x2, y2, durationMs, target, simulated: true };
    }

    try {
      execSync(`${this.adbPath} -s ${target} shell input swipe ${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} ${durationMs}`);
      return { success: true, action: 'swipe', x1, y1, x2, y2, durationMs, target, simulated: false };
    } catch (err) {
      return { success: false, error: err.message, target };
    }
  }

  pressKey(keycode, serial = null) {
    const target = this.getTargetSerial(serial);
    if (this.isDeviceSimulated(target)) {
      this.mockState.history.push({ action: 'keyevent', keycode, timestamp: Date.now() });
      return { success: true, action: 'keyevent', keycode, target, simulated: true };
    }

    try {
      execSync(`${this.adbPath} -s ${target} shell input keyevent ${keycode}`);
      return { success: true, action: 'keyevent', keycode, target, simulated: false };
    } catch (err) {
      return { success: false, error: err.message, target };
    }
  }

  dumpUiHierarchy(serial = null) {
    const target = this.getTargetSerial(serial);
    if (this.isDeviceSimulated(target)) {
      return this.getSimulatedUiHierarchyXml();
    }

    try {
      execSync(`${this.adbPath} -s ${target} shell uiautomator dump /data/local/tmp/uidump.xml`);
      const xml = execSync(`${this.adbPath} -s ${target} shell cat /data/local/tmp/uidump.xml`, { encoding: 'utf-8' });
      return xml;
    } catch {
      return this.getSimulatedUiHierarchyXml();
    }
  }

  getSimulatedUiHierarchyXml() {
    return `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.android.settings" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2400]">
    <node index="0" text="" resource-id="com.android.settings:id/action_bar_root" class="android.widget.LinearLayout" package="com.android.settings" bounds="[0,0][1080,2400]">
      <node index="0" text="Settings" resource-id="com.android.settings:id/collapsing_toolbar_title" class="android.widget.TextView" package="com.android.settings" bounds="[48,150][350,230]" clickable="false" enabled="true" />
      <node index="1" text="Search settings" resource-id="com.android.settings:id/search_action_bar_title" class="android.widget.TextView" package="com.android.settings" bounds="[48,260][1032,380]" clickable="true" enabled="true" />
      <node index="2" text="Network &amp; internet" resource-id="android:id/title" class="android.widget.TextView" package="com.android.settings" bounds="[192,420][800,480]" clickable="true" enabled="true" />
      <node index="3" text="Connected devices" resource-id="android:id/title" class="android.widget.TextView" package="com.android.settings" bounds="[192,520][800,580]" clickable="true" enabled="true" />
      <node index="4" text="Apps" resource-id="android:id/title" class="android.widget.TextView" package="com.android.settings" bounds="[192,620][800,680]" clickable="true" enabled="true" />
      <node index="5" text="Notifications" resource-id="android:id/title" class="android.widget.TextView" package="com.android.settings" bounds="[192,720][800,780]" clickable="true" enabled="true" />
      <node index="6" text="Battery" resource-id="android:id/title" class="android.widget.TextView" package="com.android.settings" bounds="[192,820][800,880]" clickable="true" enabled="true" />
      <node index="7" text="Storage" resource-id="android:id/title" class="android.widget.TextView" package="com.android.settings" bounds="[192,920][800,980]" clickable="true" enabled="true" />
      <node index="8" text="Display &amp; touch" resource-id="android:id/title" class="android.widget.TextView" package="com.android.settings" bounds="[192,1020][800,1080]" clickable="true" enabled="true" />
      <node index="9" text="Dark theme" resource-id="android:id/switch_widget" class="android.widget.Switch" package="com.android.settings" bounds="[900,1020][1032,1080]" checkable="true" checked="false" clickable="true" enabled="true" />
      <node index="10" text="Sign In" resource-id="com.android.settings:id/login_button" class="android.widget.Button" package="com.android.settings" bounds="[200,1200][880,1320]" clickable="true" enabled="true" />
    </node>
  </node>
</hierarchy>`;
  }
}
