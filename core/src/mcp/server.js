import readline from 'readline';
import { AdbDriver } from '../adb/driver.js';
import { UiParser } from '../ui/parser.js';
import { MobileAgent } from '../agent/planner.js';

export class DroidMcpServer {
  constructor(options = {}) {
    this.driver = new AdbDriver(options);
    this.agent = new MobileAgent(this.driver);
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const request = JSON.parse(trimmed);
        const response = await this.handleMessage(request);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (err) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: `Parse error: ${err.message}` }
        }) + '\n');
      }
    });

    process.stderr.write('📱 DroidArmor MCP Server running on stdio\n');
  }

  async handleMessage(req) {
    const { id, method, params } = req;

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'droidarmor-mcp',
            version: '1.0.0'
          }
        }
      };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'droidarmor_list_devices',
              description: 'Lists all connected Android devices, emulators, and their states.',
              inputSchema: { type: 'object', properties: {} }
            },
            {
              name: 'droidarmor_inspect_ui',
              description: 'Dumps and parses the current Android screen hierarchy into compact interactive elements.',
              inputSchema: {
                type: 'object',
                properties: {
                  device_serial: { type: 'string', description: 'Target device serial (optional)' }
                }
              }
            },
            {
              name: 'droidarmor_tap',
              description: 'Taps an element on the Android device by element label, text, resource-id, or (x, y) coordinates.',
              inputSchema: {
                type: 'object',
                properties: {
                  target: { type: 'string', description: 'Text, label, or resource-id to tap' },
                  x: { type: 'number', description: 'X coordinate (optional)' },
                  y: { type: 'number', description: 'Y coordinate (optional)' },
                  device_serial: { type: 'string', description: 'Device serial' }
                }
              }
            },
            {
              name: 'droidarmor_type',
              description: 'Types text into the active focused input field on Android.',
              inputSchema: {
                type: 'object',
                properties: {
                  text: { type: 'string', description: 'Text string to type' },
                  device_serial: { type: 'string', description: 'Device serial' }
                },
                required: ['text']
              }
            },
            {
              name: 'droidarmor_swipe',
              description: 'Performs a swipe gesture between two points on the phone screen.',
              inputSchema: {
                type: 'object',
                properties: {
                  x1: { type: 'number' },
                  y1: { type: 'number' },
                  x2: { type: 'number' },
                  y2: { type: 'number' },
                  duration_ms: { type: 'number', default: 300 }
                },
                required: ['x1', 'y1', 'x2', 'y2']
              }
            },
            {
              name: 'droidarmor_run_goal',
              description: 'Runs autonomous AI mobile agent loop to fulfill a high-level goal on Android (e.g. "turn on dark mode", "sign in").',
              inputSchema: {
                type: 'object',
                properties: {
                  goal: { type: 'string', description: 'High-level task or goal description' }
                },
                required: ['goal']
              }
            }
          ]
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        let content = '';

        if (toolName === 'droidarmor_list_devices') {
          const devices = this.driver.listDevices();
          content = JSON.stringify(devices, null, 2);
        } else if (toolName === 'droidarmor_inspect_ui') {
          const xml = this.driver.dumpUiHierarchy(args.device_serial);
          const nodes = UiParser.parseXml(xml);
          content = UiParser.generateScreenSummary(nodes);
        } else if (toolName === 'droidarmor_tap') {
          let x = args.x;
          let y = args.y;

          if (args.target && (x === undefined || y === undefined)) {
            const xml = this.driver.dumpUiHierarchy(args.device_serial);
            const nodes = UiParser.parseXml(xml);
            const found = UiParser.findElement(nodes, args.target);
            if (found && found.center) {
              x = found.center.x;
              y = found.center.y;
            } else {
              throw new Error(`Target element "${args.target}" not found on screen.`);
            }
          }

          const res = this.driver.tap(x, y, args.device_serial);
          content = `Tapped (${x}, ${y}): ${JSON.stringify(res)}`;
        } else if (toolName === 'droidarmor_type') {
          const res = this.driver.typeText(args.text, args.device_serial);
          content = `Typed "${args.text}": ${JSON.stringify(res)}`;
        } else if (toolName === 'droidarmor_swipe') {
          const res = this.driver.swipe(args.x1, args.y1, args.x2, args.y2, args.duration_ms, args.device_serial);
          content = `Swiped: ${JSON.stringify(res)}`;
        } else if (toolName === 'droidarmor_run_goal') {
          const agentRes = await this.agent.executeGoal(args.goal);
          content = JSON.stringify(agentRes, null, 2);
        } else {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool "${toolName}" not found.` }
          };
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: content }]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `Error: ${err.message}` }]
          }
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {}
    };
  }
}
