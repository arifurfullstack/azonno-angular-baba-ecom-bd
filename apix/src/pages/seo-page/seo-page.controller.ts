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
import { SeoPageService } from './seo-page.service';
import {
  AddSeoPageDto,
  DeleteSeoPageDto,
  FilterAndPaginationSeoPageDto,
  GetSeoPageByIdsDto,
  UpdateSeoPageDto,
} from './dto/seo-page.dto';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { VendorAuthGuard } from 'src/pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';

@Controller('seo-page')
export class SeoPageController {
  private logger = new Logger(SeoPageController.name);

  constructor(private seoPageService: SeoPageService) {}

  /**
   * Public Api
   * getAllSeoPageByShop()
   * getSeoPageBySlug()
   * getSeoPageByIds()
   */
  // Public storefront read — short browser cache is safe (server-side
  // TtlCache already serves identical data for this TTL window).
  @Header('Cache-Control', 'public, max-age=30')
  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllTagForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query() query: Record<string, any>,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.getAllSeoPageForUi(query);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllSeoPageByShop(
    @Body() filterSeoPageDto: FilterAndPaginationSeoPageDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.getAllSeoPageByShop(
      shop,
      filterSeoPageDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getSeoPageBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.getSeoPageBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-seoPages-by-ids')
  async getSeoPageByIds(
    @Body() getSeoPageByIdsDto: GetSeoPageByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.getSeoPageByIds(
      shop,
      getSeoPageByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addSeoPage()
   * getSeoPageById()
   * updateSeoPageById()
   * updateMultipleSeoPageById()
   * deleteMultipleSeoPageByIdByVendor()
   * deleteMultipleTrashSeoPage()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addSeoPage(
    @Body()
    addSeoPageDto: AddSeoPageDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.addSeoPage(req.user, shop, addSeoPageDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getSeoPageById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.getSeoPageById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateSeoPageById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSeoPageDto: UpdateSeoPageDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.updateSeoPageById(
      req.user,
      shop,
      id,
      updateSeoPageDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleSeoPageById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSeoPageDto: UpdateSeoPageDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.updateMultipleSeoPageById(
      req.user,
      shop,
      updateSeoPageDto.ids,
      updateSeoPageDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleSeoPageByIdByVendor(
    @Body() deleteSeoPageDto: DeleteSeoPageDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.deleteMultipleSeoPageByIdByVendor(
      req.user,
      shop,
      deleteSeoPageDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashSeoPage(
    @Body() deleteSeoPageDto: DeleteSeoPageDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.deleteMultipleTrashSeoPage(
      req.user,
      shop,
      deleteSeoPageDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllSeoPages()
   * deleteMultipleSeoPageById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.seoPageService.deleteAllTrashByShop(shop);
  }
}
