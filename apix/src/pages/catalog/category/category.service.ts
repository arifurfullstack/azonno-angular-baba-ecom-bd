import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddCategoryDto,
  FilterAndPaginationCategoryDto,
  GetCategoryByIdsDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import { Category } from './interfaces/category.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_CATEGORY_UPLOAD } from '../../../config/global-variables';
import { Product } from '../../product/interfaces/product.interface';
import { TtlCacheService } from '../../../shared/ttl-cache/ttl-cache.service';

const ObjectId = Types.ObjectId;

@Injectable()
export class CategoryService {
  private logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private utilsService: UtilsService,
    private readonly ttlCache: TtlCacheService,
  ) {
    this.checkExpireEveryday();
    this.recountCategoryProductsHourly();
  }

  /**
   * addCategory()
   * getAllCategoryByShop()
   * getCategoryById()
   * getAllCategorys()
   * getCategoryBySlug()
   * getCategoryByIds()
   * updateCategoryById()
   * updateMultipleCategoryById()
   * updateMultipleVendorCategoryById()
   * deleteMultipleTrashCategory()
   * deleteMultipleCategoryByIdByVendor()
   * deleteMultipleCategoryById()
   */
  async addCategory(
    vendor: Vendor,
    shop: string,
    addCategoryDto: AddCategoryDto,
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

      const totalCategory = await this.categoryModel.countDocuments({
        shop: shop,
      });

      if (totalCategory && totalCategory > MAX_CATEGORY_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your category upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addCategoryDto,
        ...{
          shop: shop,
          slug: this.utilsService.transformToSlug(addCategoryDto.name),
        },
      };

      const saveData = await this.categoryModel.create(finalData);
      this.ttlCache.delete(`ui:category:${shop}`);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Category added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllCategoryForUi(shop: string): Promise<ResponsePayload> {
    try {
      // Identical for every storefront visitor — cache the shop's list
      // instead of one Atlas round trip per request (invalidated on writes).
      const data = await this.ttlCache.wrap(`ui:category:${shop}`, 60_000, () =>
        this.categoryModel
          .find({ shop: shop, status: 'publish' })
          .select('name slug images')
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

  async getAllCategoryByShop(
    shop: string,
    filterCategoryDto: FilterAndPaginationCategoryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      // NOTE: categoryProducts recount moved to an hourly cron
      // (recountCategoryProductsHourly) — this public read used to run an
      // unbounded aggregate + bulkWrite on every request.

      // Modify Filter
      const { filter } = filterCategoryDto;
      filterCategoryDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllCategorys(filterCategoryDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getCategoryById(
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

      const data = await this.categoryModel
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

  async getAllCategorys(
    filterCategoryDto: FilterAndPaginationCategoryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterCategoryDto;
    const { pagination } = filterCategoryDto;
    const { sort } = filterCategoryDto;
    const { select } = filterCategoryDto;
    const { filterGroup } = filterCategoryDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateCategoryGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubCategoryGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['category._id']) {
        filter['category._id'] = new ObjectId(filter['category._id']);
      }

      if (filter['subCategory._id']) {
        filter['subCategory._id'] = new ObjectId(filter['subCategory._id']);
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
    let groupCategory: any;
    let groupBrand: any;
    let groupSubCategory: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.category) {
        groupCategory = {
          $group: {
            _id: { category: '$category._id' },
            name: { $first: '$category.name' },
            slug: { $first: '$category.slug' },
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

      if (filterGroup.subCategory) {
        groupSubCategory = {
          $group: {
            _id: { subCategory: '$subCategory._id' },
            name: { $first: '$subCategory.name' },
            slug: { $first: '$subCategory.slug' },
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

      // Category Groups
      if (groupCategory) {
        // aggregateCategoryGroupStages.push({ $match: mFilter });
        aggregateCategoryGroupStages.push(groupCategory);
      }

      // Sub Category Groups
      if (groupSubCategory) {
        // aggregateSubCategoryGroupStages.push({ $match: mFilter });
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupCategory) {
        aggregateCategoryGroupStages.push(groupCategory);
      }
      if (groupSubCategory) {
        aggregateSubCategoryGroupStages.push(groupSubCategory);
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
      const dataAggregates = await this.categoryModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;
      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.categoryModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.categoryModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.categoryModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            categoryAggregates && categoryAggregates.length
              ? categoryAggregates
              : [],
          subCategories:
            subCategoryAggregates && subCategoryAggregates.length
              ? subCategoryAggregates
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

  async getCategoryBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.categoryModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.categoryModel.findByIdAndUpdate(data._id, {
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

  async getCategoryByIds(
    shop: string,
    getCategoryByIdsDto: GetCategoryByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getCategoryByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.categoryModel
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
   * updateCategoryById
   * updateMultipleCategoryById
   */
  async updateCategoryById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateCategoryDto;

      // Check if vendor has access to the shop
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

      let finalSlug: string;
      const fData = await this.categoryModel.findOne({ _id: id, shop: shop });

      if (!fData) {
        return {
          success: false,
          message: 'Category not found!',
        };
      }

      // Check if category name is changed
      const isNameChanged = fData.name.trim() !== name.trim();

      // Generate slug only if name is changed
      if (isNameChanged) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.categoryModel.exists({ slug: newSlug });
        if (isExists) {
          finalSlug = this.utilsService.transformToSlug(name, true);
        } else {
          finalSlug = newSlug;
        }
      } else {
        finalSlug = fData.slug;
      }

      const finalData = {
        ...updateCategoryDto,
        slug: finalSlug,
      };

      // Update the category
      await this.categoryModel.findByIdAndUpdate(id, {
        $set: finalData,
      });
      this.ttlCache.delete(`ui:category:${shop}`);

      // Only update products if the name has changed
      if (isNameChanged) {
        await this.productModel.updateMany(
          {
            'category._id': fData._id,
            shop: shop,
          },
          {
            $set: {
              'category.name': name,
              'category.slug': finalSlug,
            },
          },
        );
      }

      return {
        success: true,
        message: 'Success! Category updated successfully.',
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleCategoryById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateCategoryDto: UpdateCategoryDto,
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
        if (updateCategoryDto.slug) {
          delete updateCategoryDto.slug;
        }
        await this.categoryModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateCategoryDto },
        );
        this.ttlCache.delete(`ui:category:${shop}`);

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

  async deleteMultipleTrashCategory(
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

      await this.categoryModel.deleteMany({ _id: ids, status: 'trash' });
      this.ttlCache.delete(`ui:category:${shop}`);
      return {
        success: true,
        message: 'Success! Category permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleCategoryByIdByVendor(
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

      // await this.categoryModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.categoryModel.deleteMany({ _id: ids });
      this.ttlCache.delete(`ui:category:${shop}`);

      return {
        success: true,
        message: 'Success! Category deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleCategoryById(ids: string[]): Promise<ResponsePayload> {
    try {
      // Resolve affected shops before the delete so their UI caches
      // can be invalidated.
      const shops = await this.categoryModel.distinct('shop', { _id: ids });
      await this.categoryModel.deleteMany({ _id: ids });
      for (const shop of shops) {
        this.ttlCache.delete(`ui:category:${shop}`);
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

      await this.categoryModel.deleteMany({ shop: shop, status: 'trash' });
      this.ttlCache.delete(`ui:category:${shop}`);
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
      await this.categoryModel.deleteMany({
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

  /**
   * Hourly cron that recomputes every category's categoryProducts counter
   * in one all-shops aggregate + one bulkWrite. Replaces the per-request
   * recount that used to run inside getAllCategoryByShop.
   */
  private recountCategoryProductsHourly() {
    // First run shortly after boot (offset from autoIndex work), then hourly.
    schedule.scheduleJob(new Date(Date.now() + 30_000), () => {
      this.updateAllCategoryProductCounts().catch((err) =>
        this.logger.error('categoryProducts recount failed:', err),
      );
    });
    schedule.scheduleJob('15 * * * *', () => {
      this.updateAllCategoryProductCounts().catch((err) =>
        this.logger.error('categoryProducts recount failed:', err),
      );
    });
  }

  private async updateAllCategoryProductCounts(): Promise<void> {
    const result = await this.productModel.aggregate([
      {
        $group: {
          _id: { shop: '$shop', category: '$category._id' },
          productCount: { $sum: 1 },
        },
      },
      {
        // Products without a category land in a null bucket — skip them.
        $match: { '_id.category': { $ne: null } },
      },
    ]);

    const bulkOps = result.map((item) => ({
      updateOne: {
        filter: { _id: item._id.category },
        update: { $set: { categoryProducts: item.productCount } },
      },
    }));

    if (bulkOps.length) {
      await this.categoryModel.bulkWrite(bulkOps, { ordered: false });
    }
  }

}
