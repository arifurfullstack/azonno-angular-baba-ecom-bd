import {
  Body,
  Controller,
  Get,
  Header,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CarouselService } from './carousel.service';
import {
  AddCarouselDto,
  DeleteCarouselDto,
  FilterAndPaginationCarouselDto,
  GetCarouselByIdsDto,
  UpdateCarouselDto,
} from './dto/carousel.dto';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { VendorAuthGuard } from 'src/pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';

@Controller('carousel')
export class CarouselController {
  private logger = new Logger(CarouselController.name);

  constructor(private carouselService: CarouselService) {}

  /**
   * Public Api
   * getAllCarouselForUi()
   * getAllCarouselByShop()
   * getCarouselBySlug()
   * getCarouselByIds()
   */
  // Public storefront read — short browser cache is safe (server-side
  // TtlCache already serves identical data for this TTL window).
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllCarouselForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.carouselService.getAllCarouselForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllCarouselByShop(
    @Body() filterCarouselDto: FilterAndPaginationCarouselDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.carouselService.getAllCarouselByShop(
      shop,
      filterCarouselDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getCarouselBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.carouselService.getCarouselBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-carousels-by-ids')
  async getCarouselByIds(
    @Body() getCarouselByIdsDto: GetCarouselByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.carouselService.getCarouselByIds(
      shop,
      getCarouselByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addCarousel()
   * getCarouselById()
   * updateCarouselById()
   * updateMultipleCarouselById()
   * deleteMultipleCarouselByIdByVendor()
   * deleteMultipleTrashCarousel()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addCarousel(
    @Body()
    addCarouselDto: AddCarouselDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.carouselService.addCarousel(
      req.user,
      shop,
      addCarouselDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getCarouselById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.carouselService.getCarouselById(
      req.user,
      shop,
      id,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateCarouselById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateCarouselDto: UpdateCarouselDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.carouselService.updateCarouselById(
      req.user,
      shop,
      id,
      updateCarouselDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleCarouselById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateCarouselDto: UpdateCarouselDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.carouselService.updateMultipleCarouselById(
      req.user,
      shop,
      updateCarouselDto.ids,
      updateCarouselDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleCarouselByIdByVendor(
    @Body() deleteCarouselDto: DeleteCarouselDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.carouselService.deleteMultipleCarouselByIdByVendor(
      req.user,
      shop,
      deleteCarouselDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashCarousel(
    @Body() deleteCarouselDto: DeleteCarouselDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.carouselService.deleteMultipleTrashCarousel(
      req.user,
      shop,
      deleteCarouselDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllCarousels()
   * deleteMultipleCarouselById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.carouselService.deleteAllTrashByShop(shop);
  }
}
