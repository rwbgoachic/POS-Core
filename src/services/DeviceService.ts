export interface DeviceConfig {
  type: 'printer' | 'scanner' | 'cash_drawer';
  port?: string;
  baudRate?: number;
  driver?: string;
}

export class DeviceService {
  private static instance: DeviceService;
  private devices: Map<string, DeviceConfig> = new Map();

  private constructor() {}

  public static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async registerDevice(id: string, config: DeviceConfig): Promise<void> {
    this.devices.set(id, config);
  }

  async unregisterDevice(id: string): Promise<void> {
    this.devices.delete(id);
  }

  async getDevice(id: string): Promise<DeviceConfig | undefined> {
    return this.devices.get(id);
  }

  async listDevices(): Promise<Map<string, DeviceConfig>> {
    return this.devices;
  }

  async sendCommand(deviceId: string, command: string): Promise<void> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    // Implementation would depend on the specific device type and driver
    console.log(`Sending command "${command}" to device ${deviceId}`);
  }
}