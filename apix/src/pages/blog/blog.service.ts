import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddBlogDto,
  FilterAndPaginationBlogDto,
  GetBlogByIdsDto,
  UpdateBlogDto,
} from './dto/blog.dto';
import { Blog } from './interfaces/blog.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_BANNER_UPLOAD } from '../../config/global-variables';
import { TtlCacheService } from '../../shared/ttl-cache/ttl-cache.service';

const ObjectId = Types.ObjectId;

@Injectable()
export class BlogService {
  private logger = new Logger(BlogService.name);

  constructor(
    @InjectModel('Blog') private readonly blogModel: Model<Blog>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
    private readonly ttlCache: TtlCacheService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addBlog()
   * getAllBlogByShop()
   * getBlogById()
   * getAllBlogs()
   * getBlogBySlug()
   * getBlogByIds()
   * updateBlogById()
   * updateMultipleBlogById()
   * updateMultipleVendorBlogById()
   * deleteMultipleTrashBlog()
   * deleteMultipleBlogByIdByVendor()
   * deleteMultipleBlogById()
   */
  async addBlog(
    vendor: Vendor,
    shop: string,
    addBlogDto: AddBlogDto,
  ): Promise<ResponsePayload> {
    try {
      const { title, autoSlug, slug } = addBlogDto;
      const mData = addBlogDto;
      let fSlug: string;
      let fData: any;
      let finalSlug: string;
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

      const totalBlog = await this.blogModel.countDocuments({
        shop: shop,
      });

      if (totalBlog && totalBlog > MAX_BANNER_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your blog upload limit with this shop.',
        } as ResponsePayload;
      }

      if (autoSlug) {
        fSlug = this.utilsService.transformToSlug(title);
        fData = await this.blogModel.exists({ slug: fSlug });

        finalSlug = fData
          ? this.utilsService.transformToSlug(title, true)
          : fSlug;
      } else {
        fSlug = this.utilsService.transformToSlug(slug);
        fData = await this.blogModel.exists({ slug: fSlug });

        finalSlug = fData
          ? this.utilsService.transformToSlug(slug, true)
          : fSlug;
      }

      const finalData = {
        ...mData,
        ...{
          shop: shop,
          slug: finalSlug,
        },
      };

      const saveData = await this.blogModel.create(finalData);
      this.ttlCache.delete(`ui:blog:${shop}`);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Blog added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllBlogForUi(shop: string): Promise<ResponsePayload> {
    try {
      // Identical for every storefront visitor — cache the shop's list
      // instead of one Atlas round trip per request (invalidated on writes).
      const data = await this.ttlCache.wrap(`ui:blog:${shop}`, 60_000, () =>
        this.blogModel
          .find({ shop: shop, status: 'publish' })
          .select(
            'title totalView authorName description shortDesc createdAt slug images',
          )
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

  async getAllBlogByShop(
    shop: string,
    filterBlogDto: FilterAndPaginationBlogDto,
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
      const { filter } = filterBlogDto;
      filterBlogDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllBlogs(filterBlogDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getBlogById(
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

      const data = await this.blogModel
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

  async getAllBlogs(
    filterBlogDto: FilterAndPaginationBlogDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterBlogDto;
    const { pagination } = filterBlogDto;
    const { sort } = filterBlogDto;
    const { select } = filterBlogDto;
    const { filterGroup } = filterBlogDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateBlogGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubBlogGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['blog._id']) {
        filter['blog._id'] = new ObjectId(filter['blog._id']);
      }

      if (filter['subBlog._id']) {
        filter['subBlog._id'] = new ObjectId(filter['subBlog._id']);
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
    let groupBlog: any;
    let groupBrand: any;
    let groupSubBlog: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.blog) {
        groupBlog = {
          $group: {
            _id: { blog: '$blog._id' },
            name: { $first: '$blog.name' },
            slug: { $first: '$blog.slug' },
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

      if (filterGroup.subBlog) {
        groupSubBlog = {
          $group: {
            _id: { subBlog: '$subBlog._id' },
            name: { $first: '$subBlog.name' },
            slug: { $first: '$subBlog.slug' },
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

      // Blog Groups
      if (groupBlog) {
        // aggregateBlogGroupStages.push({ $match: mFilter });
        aggregateBlogGroupStages.push(groupBlog);
      }

      // Sub Blog Groups
      if (groupSubBlog) {
        // aggregateSubBlogGroupStages.push({ $match: mFilter });
        aggregateSubBlogGroupStages.push(groupSubBlog);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupBlog) {
        aggregateBlogGroupStages.push(groupBlog);
      }
      if (groupSubBlog) {
        aggregateSubBlogGroupStages.push(groupSubBlog);
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
      const dataAggregates = await this.blogModel.aggregate(aggregateStages, {
        allowDiskUse: true,
      });

      // GROUP FILTER PRODUCTS DATA
      let blogAggregates: any;
      let subBlogAggregates: any;
      let brandAggregates: any;
      // Blog
      if (filterGroup && filterGroup.isGroup && filterGroup.blog) {
        blogAggregates = await this.blogModel.aggregate(
          aggregateBlogGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Blog
      if (filterGroup && filterGroup.isGroup && filterGroup.subBlog) {
        subBlogAggregates = await this.blogModel.aggregate(
          aggregateSubBlogGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.blogModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            blogAggregates && blogAggregates.length ? blogAggregates : [],
          subCategories:
            subBlogAggregates && subBlogAggregates.length
              ? subBlogAggregates
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

  async getBlogBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.blogModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.blogModel.findByIdAndUpdate(data._id, {
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

  async blogViewCount(id: string, user?: string): Promise<ResponsePayload> {
    try {
      await this.blogModel.findByIdAndUpdate(
        id,
        {
          $inc: { totalView: 1 },
        },
        {
          upsert: true,
          new: true,
        },
      );

      // if (user) {
      //   const fData = await this.blogModel.findOne({
      //     product: id,
      //     user: user,
      //   });
      //   if (!fData) {
      //     const fProduct = await this.blogModel.findById(id);
      //     const jProduct = JSON.parse(JSON.stringify(fProduct));
      //     const sData = new this.productViewModel({
      //       ...jProduct,
      //       ...{
      //         user: user,
      //         product: id,
      //         totalView: 1,
      //         _id: null,
      //       },
      //     });
      //     await sData.save();
      //   } else {
      //     await this.productViewModel.findByIdAndUpdate(fData._id, {
      //       $inc: { totalView: 1 },
      //     });
      //   }
      // }

      return {
        success: true,
        message: 'Success',
        data: null,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getBlogByIds(
    shop: string,
    getBlogByIdsDto: GetBlogByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getBlogByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.blogModel
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
   * updateBlogById
   * updateMultipleBlogById
   */
  async updateBlogById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateBlogDto: UpdateBlogDto,
  ): Promise<ResponsePayload> {
    try {
      const {  title, autoSlug, slug } = updateBlogDto;

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


      let fSlug: string;
      let fData: any;
      let finalSlug: string;

      if (autoSlug) {
        const fData:any = await this.blogModel.findOne({ _id: id, shop });

        if (fData) {
          if (fData.title.trim() !== title.trim()) {
            // title change → always generate fresh slug
            const newSlug = this.utilsService.transformToSlug(title);
            const isExists = await this.blogModel.exists({
              slug: newSlug,
              shop,
            });
            finalSlug = isExists
              ? this.utilsService.transformToSlug(title, true)
              : newSlug;
          } else {
            // name same → use given
            finalSlug = fData.slug;
          }
        }
      }
      else {
        const fData:any = await this.blogModel.findOne({ _id: id, shop });

        if (fData) {
          if (fData.slug.trim() !== slug.trim()) {
            fSlug = this.utilsService.transformToSlug(slug);
            const isExists = await this.blogModel.exists({ slug: fSlug });

            finalSlug = isExists
              ? this.utilsService.transformToSlug(slug, true)
              : fSlug;
          } else {
            // name same → use given
            finalSlug = fData.slug;
          }
        }
      }



      const finalData = {
        ...updateBlogDto,
        ...{
          slug: finalSlug,
        },
      };

      await this.blogModel.findByIdAndUpdate(id, {
        $set: finalData,
      });
      this.ttlCache.delete(`ui:blog:${shop}`);

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleBlogById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateBlogDto: UpdateBlogDto,
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
        // if (updateBlogDto.slug) {
        //   delete updateBlogDto.slug;
        // }
        await this.blogModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateBlogDto },
        );
        this.ttlCache.delete(`ui:blog:${shop}`);

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

  async deleteMultipleTrashBlog(
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

      await this.blogModel.deleteMany({ _id: ids, status: 'trash' });
      this.ttlCache.delete(`ui:blog:${shop}`);
      return {
        success: true,
        message: 'Success! Blog permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBlogByIdByVendor(
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

      // await this.blogModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.blogModel.deleteMany({ _id: ids });
      this.ttlCache.delete(`ui:blog:${shop}`);

      return {
        success: true,
        message: 'Success! Blog deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBlogById(ids: string[]): Promise<ResponsePayload> {
    try {
      // Resolve affected shops before the delete so their UI caches
      // can be invalidated.
      const shops = await this.blogModel.distinct('shop', { _id: ids });
      await this.blogModel.deleteMany({ _id: ids });
      for (const shop of shops) {
        this.ttlCache.delete(`ui:blog:${shop}`);
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

      await this.blogModel.deleteMany({ shop: shop, status: 'trash' });
      this.ttlCache.delete(`ui:blog:${shop}`);
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
      await this.blogModel.deleteMany({
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
