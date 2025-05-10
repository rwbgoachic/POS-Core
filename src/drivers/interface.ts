import { DeviceConfig, DeviceService } from '../services/DeviceService';

export interface DeviceDriver {
  initialize(): Promise<void>;
  sendCommand(command: string): Promise<void>;
  close(): Promise<void>;
}

export abstract class BaseDevice implements DeviceDriver {
  protected deviceService: DeviceService;
  protected deviceId: string;
  protected config: DeviceConfig;

  constructor(deviceId: string, config: DeviceConfig) {
    this.deviceService = DeviceService.getInstance();
    this.deviceId = deviceId;
    this.config = config;
  }

  async initialize(): Promise<void> {
    await this.deviceService.registerDevice(this.deviceId, this.config);
  }

  async sendCommand(command: string): Promise<void> {
    await this.deviceService.sendCommand(this.deviceId, command);
  }

  async close(): Promise<void> {
    await this.deviceService.unregisterDevice(this.deviceId);
  }
}