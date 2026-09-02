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
import { PopupService } from './popup.service';
import {
  AddPopupDto,
  DeletePopupDto,
  FilterAndPaginationPopupDto,
  GetPopupByIdsDto,
  UpdatePopupDto,
} from './dto/popup.dto';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { VendorAuthGuard } from 'src/pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';

@Controller('popup')
export class PopupController {
  private logger = new Logger(PopupController.name);

  constructor(private popupService: PopupService) {}

  /**
   * Public Api
   * getAllPopupByShop()
   * getPopupBySlug()
   * getPopupByIds()
   */
  // Public storefront read — short browser cache is safe (server-side
  // TtlCache already serves identical data for this TTL window).
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/get-popup')
  @UsePipes(ValidationPipe)
  async getAllCarouselForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.popupService.getPopupForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllPopupByShop(
    @Body() filterPopupDto: FilterAndPaginationPopupDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.popupService.getAllPopupByShop(
      shop,
      filterPopupDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getPopupBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.popupService.getPopupBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-popups-by-ids')
  async getPopupByIds(
    @Body() getPopupByIdsDto: GetPopupByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.popupService.getPopupByIds(
      shop,
      getPopupByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addPopup()
   * getPopupById()
   * updatePopupById()
   * updateMultiplePopupById()
   * deleteMultiplePopupByIdByVendor()
   * deleteMultipleTrashPopup()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addPopup(
    @Body()
    addPopupDto: AddPopupDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.popupService.addPopup(req.user, shop, addPopupDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getPopupById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.popupService.getPopupById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updatePopupById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updatePopupDto: UpdatePopupDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.popupService.updatePopupById(
      req.user,
      shop,
      id,
      updatePopupDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultiplePopupById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updatePopupDto: UpdatePopupDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.popupService.updateMultiplePopupById(
      req.user,
      shop,
      updatePopupDto.ids,
      updatePopupDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultiplePopupByIdByVendor(
    @Body() deletePopupDto: DeletePopupDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.popupService.deleteMultiplePopupByIdByVendor(
      req.user,
      shop,
      deletePopupDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashPopup(
    @Body() deletePopupDto: DeletePopupDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.popupService.deleteMultipleTrashPopup(
      req.user,
      shop,
      deletePopupDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllPopups()
   * deleteMultiplePopupById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.popupService.deleteAllTrashByShop(shop);
  }
}
