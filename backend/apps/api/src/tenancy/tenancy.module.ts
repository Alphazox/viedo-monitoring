import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantContextInterceptor } from './tenant-context.interceptor';

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor }],
})
export class TenancyModule {}
