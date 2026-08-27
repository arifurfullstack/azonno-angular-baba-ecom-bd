import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingSchema } from './schema/setting.schema';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';
import { UserSchema } from '../../user/schema/user.schema';
import { OrderSchema } from '../../order/schema/order.schema';
import { ShopSchema } from '../../shop/schema/shop.schema';
import { UploadModule } from '../../upload/upload.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Setting', schema: SettingSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
    UploadModule,
  ],
  providers: [SettingService],
  controllers: [SettingController],
})
export class SettingModule {}
