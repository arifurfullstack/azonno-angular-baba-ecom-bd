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
import { TagService } from './tag.service';
import {
  AddTagDto,
  DeleteTagDto,
  FilterAndPaginationTagDto,
  GetTagByIdsDto,
  UpdateTagDto,
} from './dto/tag.dto';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { VendorAuthGuard } from 'src/pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';

@Controller('tag')
export class TagController {
  private logger = new Logger(TagController.name);

  constructor(private tagService: TagService) {}

  /**
   * Public Api
   * getAllTagByShop()
   * getTagBySlug()
   * getTagByIds()
   */
  // Public storefront read — short browser cache is safe (server-side
  // TtlCache already serves identical data for this TTL window).
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllTagForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getAllTagForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllTagByShop(
    @Body() filterTagDto: FilterAndPaginationTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getAllTagByShop(
      shop,
      filterTagDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getTagBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getTagBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-tags-by-ids')
  async getTagByIds(
    @Body() getTagByIdsDto: GetTagByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getTagByIds(shop, getTagByIdsDto, select);
  }

  /**
   * Vendor Secure Api
   * addTag()
   * getTagById()
   * updateTagById()
   * updateMultipleTagById()
   * deleteMultipleTagByIdByVendor()
   * deleteMultipleTrashTag()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addTag(
    @Body()
    addTagDto: AddTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.addTag(req.user, shop, addTagDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getTagById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.getTagById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateTagById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateTagDto: UpdateTagDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.updateTagById(
      req.user,
      shop,
      id,
      updateTagDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleTagById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateTagDto: UpdateTagDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.updateMultipleTagById(
      req.user,
      shop,
      updateTagDto.ids,
      updateTagDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTagByIdByVendor(
    @Body() deleteTagDto: DeleteTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.deleteMultipleTagByIdByVendor(
      req.user,
      shop,
      deleteTagDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashTag(
    @Body() deleteTagDto: DeleteTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.deleteMultipleTrashTag(
      req.user,
      shop,
      deleteTagDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllTags()
   * deleteMultipleTagById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.deleteAllTrashByShop(shop);
  }
}
