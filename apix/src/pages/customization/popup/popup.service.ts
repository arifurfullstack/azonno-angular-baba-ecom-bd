import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddPopupDto,
  FilterAndPaginationPopupDto,
  GetPopupByIdsDto,
  UpdatePopupDto,
} from './dto/popup.dto';
import { Popup } from './interfaces/popup.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { TtlCacheService } from '../../../shared/ttl-cache/ttl-cache.service';
const ObjectId = Types.ObjectId;

@Injectable()
export class PopupService {
  private logger = new Logger(PopupService.name);

  constructor(
    @InjectModel('Popup') private readonly popupModel: Model<Popup>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
    private readonly ttlCache: TtlCacheService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addPopup()
   * getAllPopupByShop()
   * getPopupById()
   * getAllPopups()
   * getPopupBySlug()
   * getPopupByIds()
   * updatePopupById()
   * updateMultiplePopupById()
   * updateMultipleVendorPopupById()
   * deleteMultipleTrashPopup()
   * deleteMultiplePopupByIdByVendor()
   * deleteMultiplePopupById()
   */
  async addPopup(
    vendor: Vendor,
    shop: string,
    addPopupDto: AddPopupDto,
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

      const finalData = {
        ...addPopupDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.popupModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      this.ttlCache.delete(`ui:popup:${shop}`);

      return {
        success: true,
        message: 'Success! Popup added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPopupForUi(shop: string): Promise<ResponsePayload> {
    try {
      // Identical for every storefront visitor — cache the shop's popup
      // instead of one Atlas round trip per request (invalidated on writes).
      const data = await this.ttlCache.wrap(`ui:popup:${shop}`, 60_000, () =>
        this.popupModel
          .findOne({ shop: shop, status: 'publish' })
          .select('url urlType images')
          .sort({ createdAt: -1 })
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

  async getAllPopupByShop(
    shop: string,
    filterPopupDto: FilterAndPaginationPopupDto,
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
      const { filter } = filterPopupDto;
      filterPopupDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllPopups(filterPopupDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPopupById(
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

      const data = await this.popupModel
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

  async getAllPopups(
    filterPopupDto: FilterAndPaginationPopupDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterPopupDto;
    const { pagination } = filterPopupDto;
    const { sort } = filterPopupDto;
    const { select } = filterPopupDto;
    const { filterGroup } = filterPopupDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregatePopupGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubPopupGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['popup._id']) {
        filter['popup._id'] = new ObjectId(filter['popup._id']);
      }

      if (filter['subPopup._id']) {
        filter['subPopup._id'] = new ObjectId(filter['subPopup._id']);
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
    let groupPopup: any;
    let groupBrand: any;
    let groupSubPopup: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.popup) {
        groupPopup = {
          $group: {
            _id: { popup: '$popup._id' },
            name: { $first: '$popup.name' },
            slug: { $first: '$popup.slug' },
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

      if (filterGroup.subPopup) {
        groupSubPopup = {
          $group: {
            _id: { subPopup: '$subPopup._id' },
            name: { $first: '$subPopup.name' },
            slug: { $first: '$subPopup.slug' },
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

      // Popup Groups
      if (groupPopup) {
        // aggregatePopupGroupStages.push({ $match: mFilter });
        aggregatePopupGroupStages.push(groupPopup);
      }

      // Sub Popup Groups
      if (groupSubPopup) {
        // aggregateSubPopupGroupStages.push({ $match: mFilter });
        aggregateSubPopupGroupStages.push(groupSubPopup);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupPopup) {
        aggregatePopupGroupStages.push(groupPopup);
      }
      if (groupSubPopup) {
        aggregateSubPopupGroupStages.push(groupSubPopup);
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
      const dataAggregates = await this.popupModel.aggregate(aggregateStages, {
        allowDiskUse: true,
      });

      // GROUP FILTER PRODUCTS DATA
      let popupAggregates: any;
      let subPopupAggregates: any;
      let brandAggregates: any;
      // Popup
      if (filterGroup && filterGroup.isGroup && filterGroup.popup) {
        popupAggregates = await this.popupModel.aggregate(
          aggregatePopupGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Popup
      if (filterGroup && filterGroup.isGroup && filterGroup.subPopup) {
        subPopupAggregates = await this.popupModel.aggregate(
          aggregateSubPopupGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.popupModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            popupAggregates && popupAggregates.length ? popupAggregates : [],
          subCategories:
            subPopupAggregates && subPopupAggregates.length
              ? subPopupAggregates
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

  async getPopupBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.popupModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.popupModel.findByIdAndUpdate(data._id, {
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

  async getPopupByIds(
    shop: string,
    getPopupByIdsDto: GetPopupByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getPopupByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.popupModel
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
   * updatePopupById
   * updateMultiplePopupById
   */
  async updatePopupById(
    vendor: Vendor,
    shop: string,
    id: string,
    updatePopupDto: UpdatePopupDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updatePopupDto;

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
      const fData = await this.popupModel.findOne({ _id: id, shop: shop });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.popupModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updatePopupDto,
      };

      await this.popupModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      this.ttlCache.delete(`ui:popup:${shop}`);

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultiplePopupById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updatePopupDto: UpdatePopupDto,
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
        // if (updatePopupDto.slug) {
        //   delete updatePopupDto.slug;
        // }
        await this.popupModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updatePopupDto },
        );

        this.ttlCache.delete(`ui:popup:${shop}`);

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

  async deleteMultipleTrashPopup(
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

      await this.popupModel.deleteMany({ _id: ids, status: 'trash' });

      this.ttlCache.delete(`ui:popup:${shop}`);

      return {
        success: true,
        message: 'Success! Popup permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePopupByIdByVendor(
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

      // await this.popupModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );


      await this.popupModel.deleteMany({ _id: ids });

      this.ttlCache.delete(`ui:popup:${shop}`);

      return {
        success: true,
        message: 'Success! Popup deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePopupById(ids: string[]): Promise<ResponsePayload> {
    try {
      // Resolve affected shops before the delete so their UI caches
      // can be invalidated.
      const shops = await this.popupModel.distinct('shop', { _id: ids });
      await this.popupModel.deleteMany({ _id: ids });
      for (const shop of shops) {
        this.ttlCache.delete(`ui:popup:${shop}`);
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

      await this.popupModel.deleteMany({ shop: shop, status: 'trash' });

      this.ttlCache.delete(`ui:popup:${shop}`);

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
      await this.popupModel.deleteMany({
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
