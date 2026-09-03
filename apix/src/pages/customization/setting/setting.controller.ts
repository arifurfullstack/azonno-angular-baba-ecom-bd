import {
  Body,
  Controller,
  Get,
  Header,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { AddSettingDto } from './dto/setting.dto';
import { SettingService } from './setting.service';
import { THEME_CATALOG } from '../../../config/theme-catalog';
import { MongoIdValidationPipe } from '../../../pipes/mongo-id-validation.pipe';
import { UserAuthGuard } from '../../user/guards/user-auth.guard';
import { VendorAuthGuard } from '../../vendor/guards/vendor-auth.guard';

@Controller('setting')
export class SettingController {
  private logger = new Logger(SettingController.name);

  constructor(private settingService: SettingService) {}

  /**
   * Public theme catalog — single source of truth the admin theme-view page
   * renders from (same payload is used to validate themeViewSettings writes).
   * No shop pipe on purpose: the catalog is identical for every shop, and the
   * admin auth interceptor appends ?shop=<id> to every request.
   */
  @Version(VERSION_NEUTRAL)
  @Header('Cache-Control', 'public, max-age=3600')
  @Get('/theme-catalog')
  getThemeCatalog(): ResponsePayload {
    return { success: true, message: 'Success', data: THEME_CATALOG };
  }

  /**
   * addSetting
   * insertManySetting
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addSetting(
    @Body()
    addSettingDto: AddSettingDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.addSetting(shop, addSettingDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get')
  async getSetting(
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.getSetting(shop, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-payment-methods')
  async getPaymentMethods(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.getPaymentMethods(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-delivery-charges')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getDeliveryCharges(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.settingService.getDeliveryCharges(shop, req.user);
  }

  @Version(VERSION_NEUTRAL)
  // Public storefront read — short browser cache is safe (server-side
  // TtlCache already serves identical data for this TTL window).
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/get-chat-link')
  @UsePipes(ValidationPipe)
  async getChatLink(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.getChatLink(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-advance-payment')
  @UsePipes(ValidationPipe)
  async getAdvancePayment(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.getAdvancePayment(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-delivery-charges-easy-checkout')
  @UsePipes(ValidationPipe)
  async getDeliveryChargesEasyCheckout(
    @Query('division') division: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.getDeliveryChargesEasyCheckout(
      shop,
      division,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-social-logins')
  @UsePipes(ValidationPipe)
  async getSocialLogins(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.getSocialLogins(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-offers')
  async getOffers(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.settingService.getOffers(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-user-offers')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getUserOffers(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.settingService.getUserOffers(shop, req.user);
  }
}
