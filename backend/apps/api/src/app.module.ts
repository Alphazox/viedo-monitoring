import { Module } from '@nestjs/common';
import { createConfigModule } from '@video-analytics/config';
import { DatabaseModule } from '@video-analytics/database';
import { LoggerModule } from '@video-analytics/logger';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BuildingsModule } from './buildings/buildings.module';
import { CameraGroupsModule } from './camera-groups/camera-groups.module';
import { CamerasModule } from './cameras/cameras.module';
import { apiEnvSchema } from './config/api-env.schema';
import { FloorsModule } from './floors/floors.module';
import { HealthModule } from './health/health.module';
import { LiveStreamModule } from './live-stream/live-stream.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RecordingsModule } from './recordings/recordings.module';
import { RedisModule } from './redis/redis.module';
import { RolesModule } from './roles/roles.module';
import { SitesModule } from './sites/sites.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { UsersModule } from './users/users.module';
import { ZonesModule } from './zones/zones.module';

@Module({
  imports: [
    createConfigModule(apiEnvSchema),
    RateLimitModule,
    LoggerModule,
    DatabaseModule,
    RedisModule,
    TenancyModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    OrganizationsModule,
    SitesModule,
    BuildingsModule,
    FloorsModule,
    ZonesModule,
    CamerasModule,
    CameraGroupsModule,
    RecordingsModule,
    LiveStreamModule,
    HealthModule,
  ],
})
export class AppModule {}
