import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddCarouselDto,
  FilterAndPaginationCarouselDto,
  GetCarouselByIdsDto,
  UpdateCarouselDto,
} from './dto/carousel.dto';
import { Carousel } from './interfaces/carousel.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_CAROUSEL_UPLOAD, MAX_PRODUCT_UPLOAD } from "../../../config/global-variables";
import { TtlCacheService } from '../../../shared/ttl-cache/ttl-cache.service';
const ObjectId = Types.ObjectId;

@Injectable()
export class CarouselService {
  private logger = new Logger(CarouselService.name);

  constructor(
    @InjectModel('Carousel') private readonly carouselModel: Model<Carousel>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
    private readonly ttlCache: TtlCacheService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addCarousel()
   * getAllCarouselByShop()
   * getCarouselById()
   * getAllCarousels()
   * getCarouselBySlug()
   * getCarouselByIds()
   * updateCarouselById()
   * updateMultipleCarouselById()
   * updateMultipleVendorCarouselById()
   * deleteMultipleTrashCarousel()
   * deleteMultipleCarouselByIdByVendor()
   * deleteMultipleCarouselById()
   */
  async addCarousel(
    vendor: Vendor,
    shop: string,
    addCarouselDto: AddCarouselDto,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const totalCarousel = await this.carouselModel.countDocuments({
        shop: shop,
      });

      if (totalCarousel && totalCarousel > MAX_CAROUSEL_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your carousel upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addCarouselDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.carouselModel.create(finalData);
      this.ttlCache.delete(`ui:carousel:${shop}`);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Carousel added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllCarouselByShop(
    shop: string,
    filterCarouselDto: FilterAndPaginationCarouselDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      // Modify Filter
      const { filter } = filterCarouselDto;
      filterCarouselDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllCarousels(filterCarouselDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getCarouselById(
    vendor: Vendor,
    shop: string,
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const data = await this.carouselModel
        .findOne({ _id: id, shop: shop })
        .select(select);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllCarouselForUi(shop: string): Promise<ResponsePayload> {
    try {
      // Identical for every storefront visitor — cache the shop's list
      // instead of one Atlas round trip per request (invalidated on writes).
      const data = await this.ttlCache.wrap(`ui:carousel:${shop}`, 60_000, () =>
        this.carouselModel
          .find({ shop: shop, status: 'publish' })
          .select('name images url urlType')
          .sort({ priority: 1 })
          .limit(5)
          .lean({ virtuals: true }),
      );

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllCarousels(
    filterCarouselDto: FilterAndPaginationCarouselDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterCarouselDto;
    const { pagination } = filterCarouselDto;
    const { sort } = filterCarouselDto;
    const { select } = filterCarouselDto;
    const { filterGroup } = filterCarouselDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateCarouselGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubCarouselGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['carousel._id']) {
        filter['carousel._id'] = new ObjectId(filter['carousel._id']);
      }

      if (filter['subCarousel._id']) {
        filter['subCarousel._id'] = new ObjectId(filter['subCarousel._id']);
      }

      if (filter['brand._id']) {
        filter['brand._id'] = new ObjectId(filter['brand._id']);
      }

      if (filter['tags']) {
        filter['tags'] = new ObjectId(filter['tags']);
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      // const mSearchQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '');

      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: this.utilsService.createRegexFromString(searchQuery) },
              { url: this.utilsService.createRegexFromString(searchQuery) },
              // { name: { $regex: mSearchQuery, $options: 'i' } },
            ],
          },
        ],
      };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { name: 1 };
    }

    // GROUPING FOR FILTER PRODUCTS
    let groupCarousel: any;
    let groupBrand: any;
    let groupSubCarousel: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.carousel) {
        groupCarousel = {
          $group: {
            _id: { carousel: '$carousel._id' },
            name: { $first: '$carousel.name' },
            slug: { $first: '$carousel.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.brand) {
        groupBrand = {
          $group: {
            _id: { brand: '$brand._id' },
            name: { $first: '$brand.name' },
            slug: { $first: '$brand.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.subCarousel) {
        groupSubCarousel = {
          $group: {
            _id: { subCarousel: '$subCarousel._id' },
            name: { $first: '$subCarousel.name' },
            slug: { $first: '$subCarousel.slug' },
            total: { $sum: 1 },
          },
        };
      }
    }

    // Search A-Z
    if (searchQuery) {
      aggregateStages.push({
        $addFields: {
          sortBySearch: {
            $indexOfCP: ['$name', searchQuery.toLowerCase()],
          },
        },
      });
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      // Main
      aggregateStages.push({ $match: mFilter });

      // Carousel Groups
      if (groupCarousel) {
        // aggregateCarouselGroupStages.push({ $match: mFilter });
        aggregateCarouselGroupStages.push(groupCarousel);
      }

      // Sub Carousel Groups
      if (groupSubCarousel) {
        // aggregateSubCarouselGroupStages.push({ $match: mFilter });
        aggregateSubCarouselGroupStages.push(groupSubCarousel);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupCarousel) {
        aggregateCarouselGroupStages.push(groupCarousel);
      }
      if (groupSubCarousel) {
        aggregateSubCarouselGroupStages.push(groupSubCarousel);
      }
      if (groupBrand) {
        aggregateBrandGroupStages.push(groupBrand);
      }
    }

    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);

      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      // Main
      const dataAggregates = await this.carouselModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let carouselAggregates: any;
      let subCarouselAggregates: any;
      let brandAggregates: any;
      // Carousel
      if (filterGroup && filterGroup.isGroup && filterGroup.carousel) {
        carouselAggregates = await this.carouselModel.aggregate(
          aggregateCarouselGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Carousel
      if (filterGroup && filterGroup.isGroup && filterGroup.subCarousel) {
        subCarouselAggregates = await this.carouselModel.aggregate(
          aggregateSubCarouselGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.carouselModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            carouselAggregates && carouselAggregates.length
              ? carouselAggregates
              : [],
          subCategories:
            subCarouselAggregates && subCarouselAggregates.length
              ? subCarouselAggregates
              : [],
          brands:
            brandAggregates && brandAggregates.length ? brandAggregates : [],
        };
      } else {
        allFilterGroups = null;
      }

      if (pagination) {
        if (
          pagination.currentPage < 1 &&
          filter == null &&
          JSON.stringify(sort) == JSON.stringify({ createdAt: -1 })
        ) {
        }

        return {
          ...{ ...dataAggregates[0] },
          ...{
            success: true,
            message: 'Success',
            filterGroup: allFilterGroups,
          },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
          filterGroup: allFilterGroups,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getCarouselBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.carouselModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.carouselModel.findByIdAndUpdate(data._id, {
          $inc: {
            totalView: 1,
          },
        });
      }

      return {
        success: true,
        message: 'Success! data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCarouselByIds(
    shop: string,
    getCarouselByIdsDto: GetCarouselByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getCarouselByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.carouselModel
        .find({ _id: mIds, shop: shop })
        .select(select);

      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * updateCarouselById
   * updateMultipleCarouselById
   */
  async updateCarouselById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateCarouselDto: UpdateCarouselDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updateCarouselDto;

      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      let finalSlug: string;
      const fData = await this.carouselModel.findOne({ _id: id, shop: shop });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.carouselModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateCarouselDto,
      };

      await this.carouselModel.findByIdAndUpdate(id, {
        $set: finalData,
      });
      this.ttlCache.delete(`ui:carousel:${shop}`);

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleCarouselById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateCarouselDto: UpdateCarouselDto,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      if (ids && ids.length) {
        const mIds = ids.map((m) => new ObjectId(m));

        // Delete No Multiple Action Data
        // if (updateCarouselDto.slug) {
        //   delete updateCarouselDto.slug;
        // }
        await this.carouselModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateCarouselDto },
        );
        this.ttlCache.delete(`ui:carousel:${shop}`);

        return {
          success: true,
          message: 'Success! multiple data updated successfully',
        } as ResponsePayload;
      } else {
        return {
          success: true,
          message: 'Sorry! no id found',
        } as ResponsePayload;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTrashCarousel(
    vendor: Vendor,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.carouselModel.deleteMany({ _id: ids, status: 'trash' });
      this.ttlCache.delete(`ui:carousel:${shop}`);
      return {
        success: true,
        message: 'Success! Carousel permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleCarouselByIdByVendor(
    vendor: Vendor,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      // await this.carouselModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.carouselModel.deleteMany({ _id: ids });
      this.ttlCache.delete(`ui:carousel:${shop}`);

      return {
        success: true,
        message: 'Success! Carousel deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleCarouselById(ids: string[]): Promise<ResponsePayload> {
    try {
      // Resolve affected shops before the delete so their UI caches
      // can be invalidated.
      const shops = await this.carouselModel.distinct('shop', { _id: ids });
      await this.carouselModel.deleteMany({ _id: ids });
      for (const shop of shops) {
        this.ttlCache.delete(`ui:carousel:${shop}`);
      }
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteAllTrashByShop(shop: string): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.carouselModel.deleteMany({ shop: shop, status: 'trash' });
      this.ttlCache.delete(`ui:carousel:${shop}`);
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  private async checkExpireEveryday() {
    schedule.scheduleJob('30 3 * * *', async () => {
      await this.checkExpireFromDb();
    });
  }

  private async checkExpireFromDb() {
    try {
      // Calculate the date 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      console.log(tenDaysAgo.toISOString().split('T')[0]);
      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.carouselModel.deleteMany({
        status: 'trash',
        deleteDateString: {
          $lte: tenDaysAgo.toISOString().split('T')[0], // Compare as ISO string for date format matching
        },
      });

      // console.log('Auto-deletion task executed successfully.');
    } catch (err) {
      console.error('Error during auto-deletion:', err);
    }
  }
}
