import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddProductDto,
  FilterAndPaginationProductDto,
  GetProductByIdsDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Product } from './interfaces/product.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_PRODUCT_UPLOAD } from '../../config/global-variables';
import { FbCatalogService } from '../../shared/fb-catalog/fb-catalog.service';
import { Setting } from '../customization/setting/interface/setting.interface';
import { ShopInformation } from '../customization/shop-information/interfaces/shop-information.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { AffiliateProduct } from '../affiliate-product/interfaces/affiliate-product.interface';
import { Category } from '../catalog/category/interfaces/category.interface';
import { SubCategory } from '../catalog/sub-category/interfaces/sub-category.interface';

import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Brand } from '../catalog/brand/interfaces/brand.interface';
import * as fs from 'fs';
import * as FormData from 'form-data';
import * as path from 'path';

const ObjectId = Types.ObjectId;

@Injectable()
export class ProductService {
  private logger = new Logger(ProductService.name);

  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('AffiliateProduct')
    private readonly affiliateProductModel: Model<AffiliateProduct>,
    private utilsService: UtilsService,
    private fbCatalogService: FbCatalogService,
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('SubCategory')
    private readonly subCategoryModel: Model<SubCategory>,
    @InjectModel('ChildCategory')
    private readonly childCategoryModel: Model<SubCategory>,
    @InjectModel('Brand') private brandModel: Model<Brand>,
    private readonly configService: ConfigService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addProduct()
   * getAllProductByShop()
   * getProductById()
   * getAllProducts()
   * getProductBySlug()
   * getProductByIds()
   * updateProductById()
   * updateMultipleProductById()
   * updateMultipleVendorProductById()
   * deleteMultipleTrashProduct()
   * deleteMultipleProductByIdByVendor()
   * deleteMultipleProductById()
   */
  async addProduct(
    vendor: Vendor,
    shop: string,
    addProductDto: AddProductDto,
  ): Promise<ResponsePayload> {
    try {
      let fSlug: string;
      let fData: any;
      let finalSlug: string;

      const { quantity, name, autoSlug, slug } = addProductDto;

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

      const totalProducts = await this.productModel.countDocuments({
        shop: shop,
      });

      if (totalProducts && totalProducts > MAX_PRODUCT_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your product upload limit with this shop.',
        } as ResponsePayload;
      }

      if (autoSlug) {
        fSlug = this.utilsService.transformToSlug(name);
        fData = await this.productModel.exists({ slug: fSlug });

        finalSlug = fData
          ? this.utilsService.transformToSlug(name, true)
          : fSlug;
      } else {
        fSlug = this.utilsService.transformToSlug(slug);
        fData = await this.productModel.exists({ slug: fSlug });

        finalSlug = fData
          ? this.utilsService.transformToSlug(slug, true)
          : fSlug;
      }

      const defaultData = {
        slug: finalSlug,
        quantity: quantity ? quantity : 0,
        dateString: this.utilsService.getDateString(new Date()),
      };

      const finalData = {
        ...addProductDto,
        ...defaultData,
        ...{
          shop: shop,
          month: this.utilsService.getDateMonth(new Date(), false),
          year: this.utilsService.getDateYear(new Date()),
        },
      };

      const saveData: any = await this.productModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting.facebookCatalog &&
        fSetting.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      // ADD affiliate Product
      if (saveData && saveData.isAffiliateProduct) {
        const mData = {
          ...saveData.toObject(), // ensure plain object
          image: saveData.images?.[0] ?? null,
          ownerId: shop,
          ownerType: 'shop',
          url: saveData.affiliateUrl ?? null,
          description: saveData.affiliateDescription ?? null,
          price: saveData.affiliatePrice ?? 0,
        };

        // ✅ await is needed
        const saveAffiliateProductData: any =
          await this.affiliateProductModel.create(mData);

        // ✅ use _id properly
        await this.productModel.findByIdAndUpdate(saveData._id, {
          $set: { affiliateProduct: saveAffiliateProductData._id },
        });
      }

      return {
        success: true,
        message: 'Success! Product added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async bulkInsertProducts(
    products: any[],
    shop: string,
  ): Promise<ResponsePayload> {
    try {
      const insertedProducts = [];
      const failedProducts = [];

      for (const p of products) {
        try {
          // ✅ Unique Slug Generation
          let slug = this.utilsService.transformToSlug(p.slug);
          let count = 1;
          while (await this.productModel.exists({ slug })) {
            slug = `${p.slug}-${count++}`;
          }

          // ✅ Category Handling
          let category = await this.categoryModel.findOne({
            name: p.category,
            shop,
          });

          if (!category) {
            category = await this.categoryModel.create({
              name: p.category,
              shop,
              slug: this.utilsService.transformToSlug(p.category, true),
              status: 'publish',
            });
          }

          // ✅ SubCategory Handling
          let subCategory = await this.subCategoryModel.findOne({
            name: p.subCategory,
            shop,
            'category._id': category._id,
          });
          if (!subCategory) {
            subCategory = await this.subCategoryModel.create({
              name: p.subCategory,
              shop,
              slug: this.utilsService.transformToSlug(p.subCategory, true),
              category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
              },
              status: 'publish',
            });
          }

          // ✅ ChildCategory Handling
          let childCategory = null;
          if (p.childCategory) {
            childCategory = await this.childCategoryModel.findOne({
              name: p.childCategory,
              shop,
              'category._id': category._id,
              'subCategory._id': subCategory._id,
            });
            if (!childCategory) {
              childCategory = await this.childCategoryModel.create({
                name: p.childCategory,
                shop,
                slug: this.utilsService.transformToSlug(p.childCategory, true),
                category: {
                  _id: category._id,
                  name: category.name,
                  slug: category.slug,
                },
                subCategory: {
                  _id: subCategory._id,
                  name: subCategory.name,
                  slug: subCategory.slug,
                },
                status: 'publish',
              });
            }
          }

          // ✅ Brand Handling
          let brand = null;
          if (p.brand) {
            brand = await this.brandModel.findOne({ name: p.brand, shop });
            if (!brand) {
              brand = await this.brandModel.create({
                name: p.brand,
                slug: this.utilsService.transformToSlug(p.brand, true),
                shop,
                status: 'publish',
              });
            }
          }

          // ✅ Image Upload
          const images: any[] = [];
          // if (p.thumbnail_img) {
          //   const thumbUpload = await this.downloadAndUploadImage(
          //     p.thumbnail_img,
          //     shop,
          //   );
          //   if (thumbUpload.length) {
          //     images.push(thumbUpload[0]); // first image for thumbnail
          //   }
          // }
          if (p.photos) {
            const photoUrls = p.photos
              .split(',')
              .map((p) => p.trim())
              .filter((url) => this.isValidImageUrl(url));
            for (const url of photoUrls) {
              const uploaded = await this.downloadAndUploadImage(url, shop);
              const uploadedUrls = uploaded.map((img) => img.url); // ✅ শুধু URL
              // console.log('✅ Uploaded URLs:', uploadedUrls);
              images.push(...uploadedUrls); // ✅ শুধু string[] হবে
            }
          }

          // ✅ Product Create
          const product = await this.productModel.create({
            shop,
            name: p.name,
            slug,
            sku: p.sku,
            costPrice: p.costPrice,
            salePrice: p.salePrice,
            regularPrice: p.regularPrice,
            quantity: p.quantity,
            unit: p.unit,
            seoTitle: p.seoTitle,
            seoDescription: p.seoDescription,
            description: p.description,
            keyFeature: p.keyFeature,
            category: {
              _id: category._id,
              name: category.name,
              slug: category.slug,
            },
            subCategory: {
              _id: subCategory._id,
              name: subCategory.name,
              slug: subCategory.slug,
            },
            childCategory: childCategory
              ? {
                _id: childCategory._id,
                name: childCategory.name,
                slug: childCategory.slug,
              }
              : null,
            brand: brand
              ? {
                _id: brand._id,
                name: brand.name,
                slug: brand.slug,
              }
              : null,
            images,
            status: 'publish',
          });
          insertedProducts.push(product);
        } catch (err) {
          failedProducts.push({ product: p, error: err.message });
        }
      }

      return {
        success: true,
        message: 'Product import process completed',
        insertedCount: insertedProducts.length,
        failedCount: failedProducts.length,
        failedProducts,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }

  async downloadAndUploadImage(url: string, shopId: string): Promise<any[]> {
    try {
      const headRes = await axios.head(url);
      if (headRes.status !== 200) {
        throw new Error(`Image not found at URL: ${url}`);
      }

      const extension = path.extname(url.split('?')[0]) || '.jpg';
      const filename = uuidv4() + extension;
      const tempPath = `./upload/${filename}`;
      const uploadDir = './upload';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const response = await axios.get(url, { responseType: 'stream' });
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(true));
        writer.on('error', reject);
      });

      const formData = new FormData();
      formData.append('image', fs.createReadStream(tempPath));
      const uploadRes = await axios.post(
        `${this.configService.get('cdnUrlBase')}/upload/single-image?shop=${shopId}`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      fs.unlinkSync(tempPath);

      return [uploadRes.data];
    } catch (err) {
      console.error(`Image upload failed: ${err.message} | URL: ${url}`);
      return [];
    }
  }

  isValidImageUrl(url: string): boolean {
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url); // ✅ added `i` flag
  }

  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getAllProductForUi(payload: any): Promise<ResponsePayload> {
    try {
      const { shop, status, page, limit } = payload;
      const fSetting: any = await this.settingModel
        .findOne({ shop: shop })
        .select('productSetting -_id');

      const tagName = payload['tags.name'];
      const mFilter: any = { shop: shop };
      // if (filter) {
      //   mFilter = { ...filter, ...mFilter };
      // }

      if (status) {
        mFilter.status = status;
      }

      if (tagName) {
        mFilter['tags.name'] = tagName;
      }

      let sortQuery: any = {};
      if (fSetting.productSetting.isEnableSoldQuantitySort) {
        sortQuery = { totalSold: -1 };
      } else if (fSetting.productSetting.isEnablePrioritySort) {
        sortQuery = { priority: -1 };
      } else {
        sortQuery = { createdAt: -1 };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const data = await this.productModel
        .find(mFilter)
        .select(
          'name variation variationOptions isEnablePhoneModel variation2Options seoKeyword seoTitle seoDescription variation2 slug tags quantity regularPrice salePrice images variationList isVariation prices ratingCount ratingTotal reviewTotal',
        )
        .skip(Number(skip))
        .limit(Number(limit))
        .sort(sortQuery);

      const totalCount = await this.productModel.countDocuments(mFilter);

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

  async getAllProductForCSV(payload: any): Promise<ResponsePayload> {
    try {
      const { shop } = payload;

      const mFilter: any = {
        shop: shop,
        isFacebookCatalog: true,
        status: 'publish',
      };

      const data = await this.productModel
        .find(mFilter)
        .select(
          'name shop variation variationOptions variation2Options  variation2 slug  quantity category brand regularPrice salePrice images variationList isVariation prices',
        )
        .sort({ priority: -1 });

      const totalCount = await this.productModel.countDocuments(mFilter);

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

  async getAllProductByShop(
    shop: string,
    filterProductDto: FilterAndPaginationProductDto,
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
      const { filter } = filterProductDto;
      filterProductDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllProducts(filterProductDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllProductByShopUi(
    shop: string,
    filterProductDto: FilterAndPaginationProductDto,
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
      const { filter } = filterProductDto;
      filterProductDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllProducts(filterProductDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getProductById(
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

      const data = await this.productModel
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

  async getAllProducts(
    filterProductDto: FilterAndPaginationProductDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterProductDto;
    const { pagination } = filterProductDto;
    const { sort } = filterProductDto;
    const { select } = filterProductDto;
    const { filterGroup } = filterProductDto;

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

      if (filter['skinType._id']) {
        filter['skinType._id'] = new ObjectId(filter['skinType._id']);
      }

      if (filter['skinConcern._id']) {
        filter['skinConcern._id'] = new ObjectId(filter['skinConcern._id']);
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
              { keyWord: this.utilsService.createRegexFromString(searchQuery) },
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
        groupCategory = [
          {
            $match: { shop: new ObjectId(filter.shop) }, // Filter by shop ID
          },
          {
            $group: {
              _id: { category: '$category._id' },
              name: { $first: '$category.name' },
              slug: { $first: '$category.slug' },
              images: { $first: '$category.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }

      if (filterGroup.brand) {
        groupBrand = [
          {
            $match: { shop: filter.shop }, // Filter by shop ID
          },
          {
            $group: {
              _id: { brand: '$brand._id' },
              name: { $first: '$brand.name' },
              slug: { $first: '$brand.slug' },
              images: { $first: '$brand.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }

      if (filterGroup.subCategory) {
        groupSubCategory = [
          {
            $match: { shop: filter.shop }, // Filter by shop ID
          },
          {
            $group: {
              _id: { subCategory: '$subCategory._id' },
              name: { $first: '$subCategory.name' },
              slug: { $first: '$subCategory.slug' },
              images: { $first: '$subCategory.images' },
              total: { $sum: 1 },
            },
          },
        ];
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
      const dataAggregates = await this.productModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;

      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.productModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.productModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.productModel.aggregate(
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

  async getProductBySlug(
    shop: string,
    slug: string,
    select: string,
    domain?: string,
  ): Promise<ResponsePayload> {
    try {
      let activeShopId = shop;
      if (!activeShopId || activeShopId === 'undefined' || !Types.ObjectId.isValid(activeShopId)) {
        if (domain) {
          const cleanDomain = domain.replace(/^https?:\/\//, '').split(':')[0].replace('www.', '');
          const fShop = await this.shopModel.findOne({ domain: cleanDomain }).select('_id');
          if (fShop) activeShopId = fShop._id.toString();
        }
        if (!activeShopId || activeShopId === 'undefined') {
          const defaultShop = await this.shopModel.findOne({}).select('_id');
          if (defaultShop) activeShopId = defaultShop._id.toString();
        }
      }

      const query: any = { slug: slug };
      if (activeShopId && Types.ObjectId.isValid(activeShopId)) {
        query.shop = activeShopId;
      }

      const data = await this.productModel
        .findOne(query)
        .select(select);

      // Increment view count
      if (data) {
        await this.productModel.findByIdAndUpdate(data._id, {
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

  async getProductBySlugForPrerender(
    domain: string,
    slug: string,
    select: string,
  ): Promise<any> {
    try {
      let fShop = await this.shopModel
        .findOne({ domain: domain })
        .select('_id');
      if (!fShop) {
        const count = await this.shopModel.countDocuments();
        if (count === 1) {
          fShop = await this.shopModel.findOne({}).select('_id');
        }
      }
      if (!fShop) return null;
      return await this.productModel
        .findOne({ slug: slug, shop: fShop._id })
        .select(select);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopByDomainForPrerender(domain: string): Promise<any> {
    try {
      let fShop = await this.shopModel
        .findOne({ domain: domain })
        .select('_id');
      if (!fShop) {
        const count = await this.shopModel.countDocuments();
        if (count === 1) {
          fShop = await this.shopModel.findOne({}).select('_id');
        }
      }
      if (!fShop) return null;
      return await this.shopInformationModel
        .findOne({ shop: fShop._id })
        .select('websiteName shortDescription logoPrimary');
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getProductByUserById(
    shop: string,
    id: string,
    select: string,
    domain?: string,
  ): Promise<ResponsePayload> {
    try {
      let activeShopId = shop;
      if (!activeShopId || activeShopId === 'undefined' || !Types.ObjectId.isValid(activeShopId)) {
        if (domain) {
          const cleanDomain = domain.replace(/^https?:\/\//, '').split(':')[0].replace('www.', '');
          const fShop = await this.shopModel.findOne({ domain: cleanDomain }).select('_id');
          if (fShop) activeShopId = fShop._id.toString();
        }
        if (!activeShopId || activeShopId === 'undefined') {
          const defaultShop = await this.shopModel.findOne({}).select('_id');
          if (defaultShop) activeShopId = defaultShop._id.toString();
        }
      }

      const query: any = { _id: id };
      if (activeShopId && Types.ObjectId.isValid(activeShopId)) {
        query.shop = activeShopId;
      }

      const data = await this.productModel
        .findOne(query)
        .select(select);

      // Increment view count
      if (data) {
        await this.productModel.findByIdAndUpdate(data._id, {
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

  async getProductByIds(
    shop: string,
    getProductByIdsDto: GetProductByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getProductByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.productModel
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
   * updateProductById
   * updateMultipleProductById
   */
  async updateProductById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ResponsePayload> {
    try {
      const { name, autoSlug, slug } = updateProductDto;

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
        const fData = await this.productModel.findOne({ _id: id, shop });

        if (fData) {
          if (fData.name.trim() !== name.trim()) {
            // name change → always generate fresh slug
            const newSlug = this.utilsService.transformToSlug(name);
            const isExists = await this.productModel.exists({
              slug: newSlug,
              shop,
            });
            finalSlug = isExists
              ? this.utilsService.transformToSlug(name, true)
              : newSlug;
          } else {
            // name same → use given
            finalSlug = fData.slug;
          }
        }

        // fSlug = this.utilsService.transformToSlug(name);
        // fData = await this.productModel.exists({ slug: fSlug });
        //
        // finalSlug = fData
        //   ? this.utilsService.transformToSlug(name, true)
        //   : fSlug;
      } else {
        const fData = await this.productModel.findOne({ _id: id, shop });

        if (fData) {
          if (fData.slug.trim() !== slug.trim()) {
            fSlug = this.utilsService.transformToSlug(slug);
            const isExists = await this.productModel.exists({ slug: fSlug });

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
        ...updateProductDto,
        ...{
          slug: finalSlug,
        },
      };

      await this.productModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting.facebookCatalog &&
        fSetting.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      // Update affiliate Product

      if (fData) {
        await this.updateAffiliateProduct(fData);
      }

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleProductById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateProductDto: UpdateProductDto,
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
      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting.facebookCatalog &&
        fSetting.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      if (ids && ids.length) {
        const mIds = ids.map((m) => new ObjectId(m));

        // Delete No Multiple Action Data
        if (updateProductDto.slug) {
          delete updateProductDto.slug;
        }
        await this.productModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateProductDto },
        );

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

  async cloneProductByVendor(
    vendor: Vendor,
    shop: string,
    id: string,
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

      const data = await this.productModel.findById(id);
      const jData = JSON.stringify(data);
      const product = JSON.parse(jData);

      product.name = `${product.name}(Clone-${this.utilsService.getRandomInt(
        0,
        100,
      )})`;

      product.slug = this.utilsService.transformToSlug(product.name, true);

      delete product._id;
      delete product.createdAt;
      delete product.updatedAt;

      const newData = new this.productModel(product);
      const saveData = await newData.save();

      const response = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Data Clone Success',
        data: response,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async deleteMultipleTrashProduct(
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

      await this.productModel.deleteMany({ _id: ids, status: 'trash' });

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting.facebookCatalog &&
        fSetting.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }
      return {
        success: true,
        message: 'Success! Product permanently deleted successfully.',
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

      await this.productModel.deleteMany({ shop: shop, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleProductByIdByVendor(
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

      await this.productModel.updateMany(
        { _id: ids },
        {
          $set: {
            status: 'trash',
            deleteDateString: this.utilsService.getDateString(new Date()),
          },
        },
      );
      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting.facebookCatalog &&
        fSetting.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      return {
        success: true,
        message: 'Success! Product deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleProductsById(
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

      await this.productModel.deleteMany({ _id: ids });

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting.facebookCatalog &&
        fSetting.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      return {
        success: true,
        message: 'Success! Product deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleProductById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.productModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  private async productUpdateOnFbCatalog(shop: string) {
    const fShop = await this.shopModel.findById(shop).select('domain');

    const data = JSON.parse(
      JSON.stringify(
        await this.productModel.find({
          shop: shop,
          isFacebookCatalog: true,
          status: 'publish',
        }),
      ),
    );

    // Adjust Variation with Dynamic Variation Name
    function transformVariationProduct(product: any) {
      return {
        id: product._id,
        item_group_id: product._id,
        title: product.name,
        price: `${product.regularPrice} BDT`,
        sale_price: `${product.salePrice} BDT`,
        description: 'Your product description will be here',
        availability: product?.quantity > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        link: `https://${fShop?.domain}/product-details/${product.slug}`,
        image_link:
          product.images && product.images.length
            ? product.images[0]
            : 'https://cdn.saleecom.com/upload/images/placeholder.png',
        brand: product.brand?.name ?? 'unknown',
        variations: product.variationList.map((variation: any) => {
          const variationObj = {
            id: variation._id,
            item_group_id: product._id,
            title: product.name,
            description: 'Your product description will be here',
            availability: product?.quantity > 0 ? 'in stock' : 'out of stock',
            condition: 'new',
            sku: variation.sku ?? variation._id,
            price: `${variation.regularPrice} BDT`,
            sale_price: `${variation.salePrice} BDT`,
            link: `https://${fShop?.domain}/product-details/${product.slug}`,
            image_link:
              variation.image ??
              (product.images && product.images.length
                ? product.images[0]
                : 'https://cdn.saleecom.com/upload/images/placeholder.png'),
            brand: product.brand?.name ?? 'unknown',
            fb_product_category: product.category?.name ?? null,
          };

          // Assign variations dynamically
          if (product.variation) {
            const [key, value] = [
              product.variation.toLowerCase(),
              variation.name.split(',')[0],
            ];
            variationObj[key] = value;
          }
          if (product.variation2 && variation.name.includes(',')) {
            const [_, value] = variation.name.split(',');
            const key = product.variation2.toLowerCase();
            variationObj[key] = value;
          }

          return variationObj;
        }),
      };
    }

    // Modify Product Data
    const mProductData = data.map((m) => {
      if (m.isVariation) {
        return transformVariationProduct(m);
      } else {
        return {
          id: m._id,
          item_group_id: m._id,
          title: m.name,
          description: 'Your product description will be here',
          availability: m?.quantity > 0 ? 'in stock' : 'out of stock',
          condition: 'new',
          price: `${m.regularPrice} BDT`,
          sale_price: `${m.salePrice} BDT`,
          link: `https://${fShop?.domain}/product-details/${m.slug}`,
          image_link:
            m.images && m.images.length
              ? m.images[0]
              : 'https://cdn.saleecom.com/upload/images/placeholder.png',
          additional_image_link:
            m.images && m.images.length > 1 ? m.images.slice(1) : [],
          brand: m.brand?.name ?? 'unknown',
          fb_product_category: m.category?.name ?? null,
        };
      }
    });

    // Make Structure for FB Pixel Format
    const formattedProducts = [];

    for (const product of mProductData) {
      if (product.variations && product.variations.length > 0) {
        // Handle Variants
        for (const variant of product.variations) {
          formattedProducts.push(variant);
        }
      } else {
        // Handle Standalone Product (No Variants)
        formattedProducts.push(product);
      }
    }

    // Make Structure for CSV
    function normalizeForCsv<T extends Record<string, any>>(
      jsonData: T[],
    ): T[] {
      // Extract all possible keys dynamically (excluding 'id' and 'title')
      const allKeys = new Set<string>();

      jsonData.forEach((product) => {
        Object.keys(product).forEach((key) => {
          if (key !== 'id' && key !== 'title') {
            allKeys.add(key);
          }
        });
      });

      // Convert Set to an array
      const extraFields = Array.from(allKeys);

      // Normalize each object by ensuring all keys exist with default values
      return jsonData.map((product) => {
        const normalizedProduct: Record<string, any> = {
          id: product.id,
          title: product.title,
        };

        // Assign default empty values for unknown fields
        extraFields.forEach((field) => {
          normalizedProduct[field] = product[field] ?? '';
        });

        return normalizedProduct as T;
      });
    }

    const finalData = normalizeForCsv(formattedProducts);
    await this.fbCatalogService.addFbCatalogProduct(shop, finalData);
  }

  /**
   * Corn JOB
   */
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
      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.productModel.deleteMany({
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

  private async updateAffiliateProduct(finalData: any) {
    if (finalData) {
      const fData: any = await this.productModel.findOne({
        _id: finalData._id,
        shop: finalData.shop,
      });

      if (fData && fData.isAffiliateProduct && fData.affiliateProduct) {
        const mData = {
          ...fData.toObject(), // ✅ Make plain object first
          image: fData.images?.length ? fData.images[0] : null,
          ownerId: fData.shop,
          ownerType: 'shop',
          url: fData.affiliateUrl ?? null,
          description: fData.affiliateDescription ?? null,
          price: fData.affiliatePrice ?? 0,
        };

        await this.affiliateProductModel.findByIdAndUpdate(
          fData.affiliateProduct,
          { $set: mData },
          { new: true }, // return updated document
        );
      } else {
        // ADD affiliate Product
        if (fData && fData.isAffiliateProduct) {
          const mData = {
            ...fData.toObject(), // ensure plain object
            image: fData.images?.[0] ?? null,
            ownerId: fData.shop,
            ownerType: 'shop',
            url: fData.affiliateUrl ?? null,
            description: fData.affiliateDescription ?? null,
            price: fData.affiliatePrice ?? 0,
          };

          // ✅ await is needed
          const saveAffiliateProductData: any =
            await this.affiliateProductModel.create(mData);

          // ✅ use _id properly
          await this.productModel.findByIdAndUpdate(fData._id, {
            $set: { affiliateProduct: saveAffiliateProductData._id },
          });
        } else {
          if (fData && fData.affiliateProduct && !fData.isAffiliateProduct) {
            await this.affiliateProductModel.findByIdAndUpdate(
              fData.affiliateProduct,
              {
                $set: { status: 'draft' },
              },
            );
          }
        }
      }
    }
  }
}
