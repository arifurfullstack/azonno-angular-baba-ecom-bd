import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddTagDto,
  FilterAndPaginationTagDto,
  GetTagByIdsDto,
  UpdateTagDto,
} from './dto/tag.dto';
import { Tag } from './interfaces/tag.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import {
  MAX_PRODUCT_UPLOAD,
  MAX_TAGS_UPLOAD,
} from '../../../config/global-variables';
import { Product } from '../../product/interfaces/product.interface';
import { TtlCacheService } from '../../../shared/ttl-cache/ttl-cache.service';

const ObjectId = Types.ObjectId;

@Injectable()
export class TagService {
  private logger = new Logger(TagService.name);

  constructor(
    @InjectModel('Tag') private readonly tagModel: Model<Tag>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private utilsService: UtilsService,
    private readonly ttlCache: TtlCacheService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addTag()
   * getAllTagByShop()
   * getTagById()
   * getAllTags()
   * getTagBySlug()
   * getTagByIds()
   * updateTagById()
   * updateMultipleTagById()
   * updateMultipleVendorTagById()
   * deleteMultipleTrashTag()
   * deleteMultipleTagByIdByVendor()
   * deleteMultipleTagById()
   */
  async addTag(
    vendor: Vendor,
    shop: string,
    addTagDto: AddTagDto,
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

      const totalTags = await this.tagModel.countDocuments({
        shop: shop,
      });

      if (totalTags && totalTags > MAX_TAGS_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your tag upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addTagDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.tagModel.create(finalData);
      this.ttlCache.delete(`ui:tag:${shop}`);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Tag added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllTagForUi(shop: string): Promise<ResponsePayload> {
    try {
      // Identical for every storefront visitor — cache the shop's list
      // instead of one Atlas round trip per request (invalidated on writes).
      const data = await this.ttlCache.wrap(`ui:tag:${shop}`, 60_000, () =>
        this.tagModel
          .find({ shop: shop, status: 'publish', isShow: true })
          .select('name startDate images')
          .sort({ priority: -1 })
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

  async getAllTagByShop(
    shop: string,
    filterTagDto: FilterAndPaginationTagDto,
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
      const { filter } = filterTagDto;
      filterTagDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllTags(filterTagDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getTagById(
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

      const data = await this.tagModel
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

  async getAllTags(
    filterTagDto: FilterAndPaginationTagDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterTagDto;
    const { pagination } = filterTagDto;
    const { sort } = filterTagDto;
    const { select } = filterTagDto;
    const { filterGroup } = filterTagDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateTagGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubTagGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['tag._id']) {
        filter['tag._id'] = new ObjectId(filter['tag._id']);
      }

      if (filter['subTag._id']) {
        filter['subTag._id'] = new ObjectId(filter['subTag._id']);
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
    let groupTag: any;
    let groupBrand: any;
    let groupSubTag: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.tag) {
        groupTag = {
          $group: {
            _id: { tag: '$tag._id' },
            name: { $first: '$tag.name' },
            slug: { $first: '$tag.slug' },
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

      if (filterGroup.subTag) {
        groupSubTag = {
          $group: {
            _id: { subTag: '$subTag._id' },
            name: { $first: '$subTag.name' },
            slug: { $first: '$subTag.slug' },
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

      // Tag Groups
      if (groupTag) {
        // aggregateTagGroupStages.push({ $match: mFilter });
        aggregateTagGroupStages.push(groupTag);
      }

      // Sub Tag Groups
      if (groupSubTag) {
        // aggregateSubTagGroupStages.push({ $match: mFilter });
        aggregateSubTagGroupStages.push(groupSubTag);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupTag) {
        aggregateTagGroupStages.push(groupTag);
      }
      if (groupSubTag) {
        aggregateSubTagGroupStages.push(groupSubTag);
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
      const dataAggregates = await this.tagModel.aggregate(aggregateStages, {
        allowDiskUse: true,
      });

      // GROUP FILTER PRODUCTS DATA
      let tagAggregates: any;
      let subTagAggregates: any;
      let brandAggregates: any;
      // Tag
      if (filterGroup && filterGroup.isGroup && filterGroup.tag) {
        tagAggregates = await this.tagModel.aggregate(aggregateTagGroupStages, {
          allowDiskUse: true,
        });
      }

      // Sub Tag
      if (filterGroup && filterGroup.isGroup && filterGroup.subTag) {
        subTagAggregates = await this.tagModel.aggregate(
          aggregateSubTagGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.tagModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            tagAggregates && tagAggregates.length ? tagAggregates : [],
          subCategories:
            subTagAggregates && subTagAggregates.length ? subTagAggregates : [],
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

  async getTagBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.tagModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.tagModel.findByIdAndUpdate(data._id, {
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

  async getTagByIds(
    shop: string,
    getTagByIdsDto: GetTagByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getTagByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.tagModel
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
   * updateTagById
   * updateMultipleTagById
   */
  async updateTagById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateTagDto: UpdateTagDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateTagDto;

      // Check vendor access to shop
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! You do not have access to this shop.',
        };
      }

      // Check if tag exists
      const fData = await this.tagModel.findOne({ _id: id, shop: shop });

      if (!fData) {
        return {
          success: false,
          message: 'Tag not found!',
        };
      }

      const isNameChanged = fData.name.trim() !== name.trim();

      // Update the tag
      await this.tagModel.findByIdAndUpdate(id, {
        $set: updateTagDto,
      });
      this.ttlCache.delete(`ui:tag:${shop}`);

      // If name changed, update tag name inside all product documents
      if (isNameChanged) {
        await this.productModel.updateMany(
          {
            'tags._id': fData._id,
            shop: shop,
          },
          {
            $set: {
              'tags.$.name': name, // only the matched tag in array will be updated
            },
          },
        );
      }

      return {
        success: true,
        message: 'Success! Tag updated successfully.',
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  // async updateTagById(
  //   vendor: Vendor,
  //   shop: string,
  //   id: string,
  //   updateTagDto: UpdateTagDto,
  // ): Promise<ResponsePayload> {
  //   try {
  //     // const { name } = updateTagDto;
  //
  //     const fShop = await this.shopModel.exists({
  //       _id: shop,
  //       'users._id': vendor._id,
  //     });
  //
  //     if (!fShop) {
  //       return {
  //         success: false,
  //         message: 'Sorry! you have no access in this shop',
  //       } as ResponsePayload;
  //     }
  //
  //     let finalSlug: string;
  //     const fData = await this.tagModel.findOne({ _id: id, shop: shop });
  //
  //     // Check Slug
  //     // if (fData?.name.trim() !== name.trim()) {
  //     //   const newSlug = this.utilsService.transformToSlug(name);
  //
  //     //   const isExists = await this.tagModel.exists({ slug: newSlug });
  //     //   if (isExists) {
  //     //     finalSlug = this.utilsService.transformToSlug(name, true);
  //     //   } else {
  //     //     finalSlug = newSlug;
  //     //   }
  //     // } else {
  //     //   finalSlug = fData.slug;
  //     // }
  //
  //     const finalData = {
  //       ...updateTagDto,
  //     };
  //
  //     await this.tagModel.findByIdAndUpdate(id, {
  //       $set: finalData,
  //     });
  //
  //     return {
  //       success: true,
  //       message: 'Success! data updated successfully.',
  //     } as ResponsePayload;
  //   } catch (err) {
  //     console.log(err);
  //     throw new InternalServerErrorException();
  //   }
  // }

  async updateMultipleTagById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateTagDto: UpdateTagDto,
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
        // if (updateTagDto.slug) {
        //   delete updateTagDto.slug;
        // }
        await this.tagModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateTagDto },
        );
        this.ttlCache.delete(`ui:tag:${shop}`);

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

  async deleteMultipleTrashTag(
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

      await this.tagModel.deleteMany({ _id: ids, status: 'trash' });
      this.ttlCache.delete(`ui:tag:${shop}`);
      return {
        success: true,
        message: 'Success! Tag permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTagByIdByVendor(
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

      // await this.tagModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.tagModel.deleteMany({ _id: ids });
      this.ttlCache.delete(`ui:tag:${shop}`);

      return {
        success: true,
        message: 'Success! Tag deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTagById(ids: string[]): Promise<ResponsePayload> {
    try {
      // Resolve affected shops before the delete so their UI caches
      // can be invalidated.
      const shops = await this.tagModel.distinct('shop', { _id: ids });
      await this.tagModel.deleteMany({ _id: ids });
      for (const shop of shops) {
        this.ttlCache.delete(`ui:tag:${shop}`);
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

      await this.tagModel.deleteMany({ shop: shop, status: 'trash' });
      this.ttlCache.delete(`ui:tag:${shop}`);
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
      // console.log(tenDaysAgo.toISOString().split('T')[0]);
      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.tagModel.deleteMany({
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
