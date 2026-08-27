import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SettingSchema } from '../customization/setting/schema/setting.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'Setting', schema: SettingSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}

