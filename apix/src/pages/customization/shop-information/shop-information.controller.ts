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
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MongoIdValidationPipe } from '../../../pipes/mongo-id-validation.pipe';
import { ShopInformationService } from './shop-information.service';
import { AddShopInformationDto } from './dto/shop-information.dto';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { VendorAuthGuard } from '../../vendor/guards/vendor-auth.guard';

@Controller('shop-information')
export class ShopInformationController {
  private logger = new Logger(ShopInformationController.name);

  constructor(private shopInformationService: ShopInformationService) {}

  /**
   * Public Api
   * getShopInformation()
   */

  @Version(VERSION_NEUTRAL)
  // Public storefront read — short browser cache is safe (server-side
  // TtlCache already serves identical data for this TTL window).
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/get')
  async getShopInformation(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopInformationService.getShopInformation(shop, select);
  }

  /**
   * Vendor Secure Api
   * addShopInformation()
   */
  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addShopInformation(
    @Body()
    addShopInformationDto: AddShopInformationDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.shopInformationService.addShopInformation(
      req.user,
      shop,
      addShopInformationDto,
    );
  }
}
