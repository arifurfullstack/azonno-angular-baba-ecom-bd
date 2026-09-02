import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddSeoPageDto,
  FilterAndPaginationSeoPageDto,
  GetSeoPageByIdsDto,
  UpdateSeoPageDto,
} from './dto/seo-page.dto';
import { SeoPage } from './interfaces/seo-page.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_BANNER_UPLOAD } from '../../config/global-variables';
import { TtlCacheService } from '../../shared/ttl-cache/ttl-cache.service';

const ObjectId = Types.ObjectId;

@Injectable()
export class SeoPageService {
  private logger = new Logger(SeoPageService.name);

  constructor(
    @InjectModel('SeoPage') private readonly seoPageModel: Model<SeoPage>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
    private readonly ttlCache: TtlCacheService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addSeoPage()
   * getAllSeoPageByShop()
   * getSeoPageById()
   * getAllSeoPages()
   * getSeoPageBySlug()
   * getSeoPageByIds()
   * updateSeoPageById()
   * updateMultipleSeoPageById()
   * updateMultipleVendorSeoPageById()
   * deleteMultipleTrashSeoPage()
   * deleteMultipleSeoPageByIdByVendor()
   * deleteMultipleSeoPageById()
   */
  async addSeoPage(
    vendor: Vendor,
    shop: string,
    addSeoPageDto: AddSeoPageDto,
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

      const totalSeoPage = await this.seoPageModel.countDocuments({
        shop: shop,
      });

      if (totalSeoPage && totalSeoPage > MAX_BANNER_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your seoPage upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addSeoPageDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.seoPageModel.create(finalData);
      this.ttlCache.invalidatePrefix(`ui:seo-page:${shop}`);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! SeoPage added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSeoPageByShop(
    shop: string,
    filterSeoPageDto: FilterAndPaginationSeoPageDto,
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
      const { filter } = filterSeoPageDto;
      filterSeoPageDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllSeoPages(filterSeoPageDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSeoPageForUi(payload: any): Promise<ResponsePayload> {
    try {
      const { shop, status, page, limit } = payload;

      const tagName = payload['type'];
      const mFilter: any = { shop: shop };

      if (status) {
        mFilter.status = status;
      }

      if (tagName) {
        mFilter['type'] = tagName;
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Identical for every storefront visitor with the same query —
      // cache per (shop, filter, page) instead of two Atlas round trips
      // per request (invalidated on writes via the shop prefix).
      const [data, totalCount] = await this.ttlCache.wrap(
        `ui:seo-page:${shop}:${status ?? ''}:${tagName ?? ''}:${page}:${limit}`,
        60_000,
        async () =>
          Promise.all([
            this.seoPageModel
              .find(mFilter)
              .select('seoTitle seoDescription images seoKeyword')
              .skip(Number(skip))
              .limit(Number(limit))
              .lean({ virtuals: true }),
            this.seoPageModel.countDocuments(mFilter),
          ]),
      );

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
        count: totalCount,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getSeoPageById(
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

      const data = await this.seoPageModel
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

  async getAllSeoPages(
    filterSeoPageDto: FilterAndPaginationSeoPageDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterSeoPageDto;
    const { pagination } = filterSeoPageDto;
    const { sort } = filterSeoPageDto;
    const { select } = filterSeoPageDto;
    const { filterGroup } = filterSeoPageDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateSeoPageGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubSeoPageGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['seoPage._id']) {
        filter['seoPage._id'] = new ObjectId(filter['seoPage._id']);
      }

      if (filter['subSeoPage._id']) {
        filter['subSeoPage._id'] = new ObjectId(filter['subSeoPage._id']);
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
    }
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      // const mSearchQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '');

      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { title: this.utilsService.createRegexFromString(searchQuery) },
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
    let groupSeoPage: any;
    let groupBrand: any;
    let groupSubSeoPage: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.seoPage) {
        groupSeoPage = {
          $group: {
            _id: { seoPage: '$seoPage._id' },
            name: { $first: '$seoPage.name' },
            slug: { $first: '$seoPage.slug' },
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

      if (filterGroup.subSeoPage) {
        groupSubSeoPage = {
          $group: {
            _id: { subSeoPage: '$subSeoPage._id' },
            name: { $first: '$subSeoPage.name' },
            slug: { $first: '$subSeoPage.slug' },
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

      // SeoPage Groups
      if (groupSeoPage) {
        // aggregateSeoPageGroupStages.push({ $match: mFilter });
        aggregateSeoPageGroupStages.push(groupSeoPage);
      }

      // Sub SeoPage Groups
      if (groupSubSeoPage) {
        // aggregateSubSeoPageGroupStages.push({ $match: mFilter });
        aggregateSubSeoPageGroupStages.push(groupSubSeoPage);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupSeoPage) {
        aggregateSeoPageGroupStages.push(groupSeoPage);
      }
      if (groupSubSeoPage) {
        aggregateSubSeoPageGroupStages.push(groupSubSeoPage);
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
      const dataAggregates = await this.seoPageModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let seoPageAggregates: any;
      let subSeoPageAggregates: any;
      let brandAggregates: any;
      // SeoPage
      if (filterGroup && filterGroup.isGroup && filterGroup.seoPage) {
        seoPageAggregates = await this.seoPageModel.aggregate(
          aggregateSeoPageGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub SeoPage
      if (filterGroup && filterGroup.isGroup && filterGroup.subSeoPage) {
        subSeoPageAggregates = await this.seoPageModel.aggregate(
          aggregateSubSeoPageGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.seoPageModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            seoPageAggregates && seoPageAggregates.length
              ? seoPageAggregates
              : [],
          subCategories:
            subSeoPageAggregates && subSeoPageAggregates.length
              ? subSeoPageAggregates
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

  async getSeoPageBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.seoPageModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.seoPageModel.findByIdAndUpdate(data._id, {
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

  async getSeoPageByIds(
    shop: string,
    getSeoPageByIdsDto: GetSeoPageByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getSeoPageByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.seoPageModel
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
   * updateSeoPageById
   * updateMultipleSeoPageById
   */
  async updateSeoPageById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateSeoPageDto: UpdateSeoPageDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updateSeoPageDto;

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
      const fData = await this.seoPageModel.findOne({ _id: id, shop: shop });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.seoPageModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateSeoPageDto,
      };

      await this.seoPageModel.findByIdAndUpdate(id, {
        $set: finalData,
      });
      this.ttlCache.invalidatePrefix(`ui:seo-page:${shop}`);

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleSeoPageById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateSeoPageDto: UpdateSeoPageDto,
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
        // if (updateSeoPageDto.slug) {
        //   delete updateSeoPageDto.slug;
        // }
        await this.seoPageModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateSeoPageDto },
        );
        this.ttlCache.invalidatePrefix(`ui:seo-page:${shop}`);

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

  async deleteMultipleTrashSeoPage(
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

      await this.seoPageModel.deleteMany({ _id: ids, status: 'trash' });
      this.ttlCache.invalidatePrefix(`ui:seo-page:${shop}`);
      return {
        success: true,
        message: 'Success! SeoPage permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSeoPageByIdByVendor(
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

      // await this.seoPageModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.seoPageModel.deleteMany({ _id: ids });
      this.ttlCache.invalidatePrefix(`ui:seo-page:${shop}`);

      return {
        success: true,
        message: 'Success! SeoPage deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSeoPageById(ids: string[]): Promise<ResponsePayload> {
    try {
      // Resolve affected shops before the delete so their UI caches
      // can be invalidated.
      const shops = await this.seoPageModel.distinct('shop', { _id: ids });
      await this.seoPageModel.deleteMany({ _id: ids });
      for (const shop of shops) {
        this.ttlCache.invalidatePrefix(`ui:seo-page:${shop}`);
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

      await this.seoPageModel.deleteMany({ shop: shop, status: 'trash' });
      this.ttlCache.invalidatePrefix(`ui:seo-page:${shop}`);
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
      await this.seoPageModel.deleteMany({
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
