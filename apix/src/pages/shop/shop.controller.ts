import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post, Put,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { ShopService } from './shop.service';
import { Response } from 'express';
import {
  AddShopDto,
  ChangeDomainDto,
  FilterAndPaginationShopDto, UpdateShopDto,
} from './dto/shop.dto';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';
import { UpdateProductDto } from '../product/dto/product.dto';

@Controller('shop')
export class ShopController {
  private logger = new Logger(ShopController.name);

  constructor(private shopService: ShopService) {}

  /**
   * Frontend
   */

  /**
   * Payment Control Methods
   * callbackStripePayment()
   * callbackSslCommerzPayment()
   */

  @Get('/callback-stripe-payment-by-shop')
  async callbackStripePayment(
    @Res() res: Response,
    @Query('status') status: string,
    @Query('preShopId') preShopId: string,
    @Query('sessionId') sessionId: string,
    @Query('type') type: string, // ✅ Add this line
  ): Promise<any> {
    return this.shopService.callbackStripePayment(
      res,
      status,
      preShopId,
      sessionId,
      type,
    );
  }

  @Post('/callback-ssl-commerz-payment')
  async callbackSslCommerzPayment(
    @Res() res: Response,
    @Query('tran_id') tran_id: string,
    @Query('status') status: string,
    @Query('type') type: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.callbackSslCommerzPayment(
      res,
      tran_id,
      status,
      type,
    );
  }

  /**
   * checkShopAvailability()
   * addShop()
   * insertManyShop()
   * getAllShop()
   * getAllShopBasic()
   * getShopById()
   * updateShopById()
   * updateMultipleShopById()
   * deleteShopById()
   * deleteMultipleShopById()
   */

  @Post('/create')
  // @ApiHeader({
  //   name: 'vendor',
  //   description: VENDOR_AUTH_TOKEN_DEV,
  //   required: true,
  // })

  // @UseGuards(AffiliateAuthGuard)
  async createShop(
    @Body()
    addShopDto: AddShopDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.shopService.createShop(req.user, addShopDto);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllShop(
    @Body() filterShopDto: FilterAndPaginationShopDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.shopService.getAllShop(filterShopDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-basic')
  async getAllShopBasic(): Promise<ResponsePayload> {
    return await this.shopService.getAllShopBasic();
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by/:id')
  async getShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getShopById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-shop-info-by/:id')
  async getShopInfoById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getShopInfoById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-shop-vendor-by-id/:id')
  @UsePipes(ValidationPipe)
  async updateShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.updateShopById(
      id,
      updateShopDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-setting-by-shop/:id')
  async getSettingByShop(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getSettingByShop(id);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-setting-by-domain')
  async getSettingByDomain(
    @Query('domain') domain: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getSettingByDomain(domain);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-page/:pageName')
  @UsePipes(ValidationPipe)
  async getShopPageByPage(
    @Param('pageName') pageName: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getShopPageByPage(pageName, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-shop-category')
  async getShopCategory(): Promise<ResponsePayload> {
    return await this.shopService.getShopCategory();
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-shop-sub-category')
  async getShopSubCategory(): Promise<ResponsePayload> {
    return await this.shopService.getShopSubCategory();
  }

  @Post('/replace-all-url')
  async replaceUrl(
    @Body() body: { fromUrl: string; toUrl: string },
  ): Promise<{ message: string }> {
    const { fromUrl, toUrl } = body;
    await this.shopService.replaceUrlInAllCollections(fromUrl, toUrl);
    return { message: 'All URLs replaced successfully' };
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-test')
  async getTest(): Promise<ResponsePayload> {
    return await this.shopService.getTest();
  }
}
