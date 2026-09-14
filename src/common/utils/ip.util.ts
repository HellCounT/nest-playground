import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class IpUtil {
  getClientIp = (request: Request) => {
    const xForwardedForHeader = request.headers['x-forwarded-for'];
    if (typeof xForwardedForHeader === 'string') {
      const ip = xForwardedForHeader.split(',');
      return ip[0].trim();
    } else {
      const remoteAddress = request.socket.remoteAddress;
      return remoteAddress || 'undefined';
    }
  };
}
