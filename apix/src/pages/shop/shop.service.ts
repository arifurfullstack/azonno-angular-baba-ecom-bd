import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { ErrorCodes } from 'src/enum/error-code.enum';
import { PreShop, Shop } from './interfaces/shop.interface';
import { Response } from 'express';
import {
  AddShopDto,
  AddVendorAndShopDto,
  ChangeDomainDto,
  CloneDataFromShopDto,
  FilterAndPaginationShopDto,
} from './dto/shop.dto';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import * as fs from 'fs';
import * as path from 'path';

import { ShopInformation } from '../customization/shop-information/interfaces/shop-information.interface';
import { Setting } from '../customization/setting/interface/setting.interface';
import { Product } from '../product/interfaces/product.interface';
import { Category } from '../catalog/category/interfaces/category.interface';
import { SubCategory } from '../catalog/sub-category/interfaces/sub-category.interface';
import { Brand } from '../catalog/brand/interfaces/brand.interface';
import { Tag } from '../catalog/tag/interfaces/tag.interface';
import { Carousel } from '../customization/carousel/interfaces/carousel.interface';
import {
  BuildScript,
  UpdateBuildScript,
} from '../../shared/script/interfaces/build-script.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  SslCommerzApiConfig,
  SslCommerzInit,
} from '../../shared/payment-control/interfaces/payment-control.interface';
import { OtpService } from '../otp/otp.service';
import { BulkSmsService } from '../../shared/bulk-sms/bulk-sms.service';
import { PaymentControlService } from '../../shared/payment-control/payment-control.service';
import { AffiliateProduct } from '../affiliate-product/interfaces/affiliate-product.interface';
import { EmailService } from '../../shared/email/email.service';

import { Affiliate } from '../affiliate/interfaces/affiliate.interface';
import { MongoClient } from 'mongodb';
import process from 'node:process';
const ObjectId = Types.ObjectId;

@Injectable()
export class ShopService {
  private logger = new Logger(ShopService.name);

  constructor(
    @InjectModel('Shop')
    private readonly shopModel: Model<Shop>,
    @InjectModel('PreShop')
    private readonly preShopModel: Model<PreShop>,

    @InjectModel('Vendor') private readonly vendorModel: Model<Vendor>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('SubCategory')
    private readonly subCategoryModel: Model<SubCategory>,

    @InjectModel('Brand') private readonly brandModel: Model<Brand>,
    @InjectModel('Tag') private readonly tagModel: Model<Tag>,
    @InjectModel('Carousel') private readonly carouselModel: Model<Carousel>,

    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<Affiliate>,
    @InjectModel('AffiliateProduct')
    private readonly affiliateProductModel: Model<AffiliateProduct>,

    @InjectConnection() private readonly connection: Connection,
    private readonly paymentControlService: PaymentControlService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly httpService: HttpService,
    private readonly otpService: OtpService,
    private readonly bulkSmsService: BulkSmsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Main Ui
   */

  /**
   * Main Ui
   */

  /**
   * checkShopAvailability()
   * buildShop()
   * insertManyShop()
   * getAllShop()
   * getAllShopBasic()
   * getShopById()
   * updateShopById()
   * updateMultipleShopById()
   * deleteShopById()
   * deleteMultipleShopById()
   * getShopCategory()
   * getShopSubCategory()
   */

  async createVendorAndShop(
    admin: any,
    addVendorAndShopDto: AddVendorAndShopDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        name,
        username,
        password,
        email,
        phoneNo,
        theme,
        domain,
        packageId,
        registrationType,
        websiteName,
        themeColor,
        needWebsiteBuild,
        serverIp,
        domainType,
        needData,
        isSsr,
        cloneWebUrl,
      } = addVendorAndShopDto;

      // Check Shop Availability
      const fShop = await this.shopModel.exists({ domain: domain });
      if (fShop) {
        return {
          success: false,
          message: `Sorry! website domain name not available for domain`,
        } as ResponsePayload;
      }

      let fPort: any;

      // Register new Vendor
      if (registrationType !== 'default') {
        return {
          success: false,
          message: 'Sorry! Only default registration is available',
          data: null,
        } as ResponsePayload;
      }

      if (username) {
        const existingUsername = await this.vendorModel.findOne({ username });
        if (existingUsername) {
          return {
            success: false,
            message: `Sorry! Username already exists`,
            data: null,
          } as ResponsePayload;
        }
      }

      if (email) {
        const existingEmail = await this.vendorModel.findOne({ email });
        if (existingEmail) {
          return {
            success: false,
            message: `Sorry! Email already exists`,
            data: null,
          } as ResponsePayload;
        }
      }

      if (phoneNo) {
        const existingPhoneNo = await this.vendorModel.findOne({ phoneNo });
        if (existingPhoneNo) {
          return {
            success: false,
            message: `Sorry! Phone number already exists`,
            data: null,
          } as ResponsePayload;
        }
      }
      const salt = await bcrypt.genSalt();
      const hashedPass = await bcrypt.hash(password, salt);

      const vendorRegData: any = {
        name: name,
        username: username,
        phoneNo: phoneNo,
        email: email,
        registrationType: registrationType,
        isPasswordLess: false,
        password: hashedPass,
        registrationAt: this.utilsService.getDateString(new Date()),
        lastLoggedIn: null,
        role: 'owner',
        status: 'active',
      };

      const saveVendorData = await this.vendorModel.create(vendorRegData);

      // Create shop
      const shopData: any = {
        ...addVendorAndShopDto,
        ...{
          dateString: this.utilsService.getDateString(new Date()),
          owner: saveVendorData._id,

          port: isSsr ? fPort[0].port : null,
          users: [
            {
              _id: saveVendorData._id,
              username: vendorRegData.username,
              email: vendorRegData.email,
              phoneNo: vendorRegData.phoneNo,
              role: 'admin',
            },
          ],
          buildStatus: 'complete',
          status: 'publish',
          startDate: this.utilsService.getDateString(new Date()),
          paymentStatus: 'custom',
          country: {
            name: 'Bangladesh',
            code: 'BD',
          },
        },
      };
      const saveShop = await this.shopModel.create(shopData);

      // Update Shop Information
      await this.shopInformationModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
        fabIcon: 'https://cdn.saleecom.com/upload/static/favicon.ico',
        shortDescription:
          'A Best Online shop in Bangladesh, All the product are available online.',
        socialLinks: [
          {
            type: 0,
            value: 'https://facebook.com',
          },
          {
            type: 5,
            value: 'https://tiktok.com',
          },
          {
            type: 1,
            value: 'https://youtube.com',
          },
          {
            type: 3,
            value: 'https://instagram.com',
          },
        ],
        addresses: [
          {
            type: null,
            value: 'Mirpur 10, Dhaka, Bangladesh',
          },
        ],
        emails: [
          {
            type: null,
            value: 'mail@gmail.com',
          },
        ],
        phones: [
          {
            type: null,
            value: '+8801000000000',
          },
        ],
        whatsappNumber: '+8801000000000',
      });

      // Update Port
      // Update Settings

      await this.settingModel.create({
        shop: saveShop._id,
        websiteName: websiteName,

        themeColors: themeColor,
        searchHints: null,
        currency: {
          name: 'Bangladesh',
          code: 'BDT',
          symbol: '৳',
        },
        country: {
          name: 'Bangladesh',
          code: 'BD',
        },
      });

      if (needWebsiteBuild) {
        const buildScript: BuildScript = {
          port: shopData.port ?? null,
          domain: shopData.domain,

          shop: saveShop._id.toString(),
          serverIp: serverIp,
          isSsr: isSsr,
          domainType: domainType,
          buildType: null,
          oldDomainType: null,
        };

        // console.log('buildScript', buildScript);

        const productionBuild =
          this.configService.get<string>('productionBuild');

        if (productionBuild) {
        }
      }

      if (needData) {
        const fromShop = await this.shopModel.findOne({
          domain: cloneWebUrl ?? 'gadgetshob.saleecom.shop',
        });
        if (fromShop) {
          const data: any = {
            fromShop: fromShop._id,
            toShop: saveShop._id,
          };
          await this.cloneDataFromShop(data);
        }
      }

      return {
        success: true,
        data: {
          shop: saveShop._id,
        },
        message: `Success! Shop created successfully`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async createShop(
    admin: any,
    addShopDto: AddShopDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        theme,
        domain,
        subDomain,
        packageId,
        owner,
        websiteName,
        needWebsiteBuild,
      } = addShopDto;

      let filter: any;
      if (domain) {
        filter = { domain: domain };
      } else {
        filter = { subDomain: subDomain };
      }

      // Check Shop Availability
      const fShop = await this.shopModel.exists(filter);
      if (fShop) {
        return {
          success: false,
          message: `Sorry! website domain name not available for domain`,
        } as ResponsePayload;
      }

      const fVendor = await this.vendorModel.findById(owner);
      if (fVendor?.role !== 'owner') {
        return {
          success: false,
          message: `Sorry! this role can not open a shop`,
        } as ResponsePayload;
      }

      // Create shop
      const shopData: any = {
        ...addShopDto,
        ...{
          dateString: this.utilsService.getDateString(new Date()),
          owner: owner,

          users: [
            {
              _id: fVendor._id,
              username: fVendor.username,
              email: fVendor.email,
              phoneNo: fVendor.phoneNo,
              role: 'admin',
            },
          ],
          buildStatus: 'complete',
          status: 'publish',
          startDate: this.utilsService.getDateString(new Date()),
          paymentStatus: 'custom',
        },
      };
      const saveShop = await this.shopModel.create(shopData);

      // Update Shop Information
      await this.shopInformationModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
      });

      // Update Settings

      return {
        success: true,
        data: {
          shop: saveShop._id,
        },
        message: `Success! Shop created successfully`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSettingByShop(shop: string): Promise<ResponsePayload> {
    try {
      const fSetting = JSON.parse(
        JSON.stringify(
          await this.settingModel
            .findOne({ shop: shop })
            .select(
              'shop themeColors themeViewSettings pageViewSettings searchHints orderLanguage productSetting -_id',
            ),
        ),
      );
      return {
        success: true,
        message: 'Success',
        data: fSetting,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getSettingByDomain(domain: string): Promise<ResponsePayload> {
    try {
      if (!domain) {
        return {
          success: false,
          message: 'Domain name is required',
        } as ResponsePayload;
      }
      let hostname = domain.trim().toLowerCase();
      if (hostname.startsWith('www.')) {
        hostname = hostname.replace('www.', '');
      }
      hostname = hostname.split(':')[0];

      const domainRegex = new RegExp('^' + hostname + '(:[0-9]+)?/?$');
      const shop = await this.shopModel.findOne({
        $or: [{ domain: domainRegex }, { subDomain: domainRegex }],
      });

      if (!shop) {
        return {
          success: false,
          message: 'Shop not found for domain: ' + hostname,
        } as ResponsePayload;
      }

      return await this.getSettingByShop(shop._id.toString());
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async versionUpdateByShop(shopId: string): Promise<ResponsePayload> {
    try {
      // Check Shop Availability
      const fShop = await this.shopModel.findById(shopId);
      if (!fShop) {
        return {
          success: false,
          message: `Sorry! no shop found.`,
        } as ResponsePayload;
      }

      let domain: any;
      if (fShop.domain) {
        domain = fShop.domain;
      } else {
        domain = fShop.subDomain;
      }

      const buildScript: UpdateBuildScript = {
        domain: domain,
        shop: fShop._id.toString(),
      };

      // Update Shop Theme
      await this.shopModel.findByIdAndUpdate(fShop._id, {
        $set: {
          updateStatus: 'pending',
        },
      });

      const productionBuild = this.configService.get<string>('productionBuild');

      return {
        success: true,
        message: 'Success! updated successfully',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async getAllShop(
    filterShopDto: FilterAndPaginationShopDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterShopDto;
    const { pagination } = filterShopDto;
    const { sort } = filterShopDto;
    const { select } = filterShopDto;

    if (filter && filter['users._id']) {
      filter['users._id'] = new ObjectId(filter['users._id']);
    }

    // Essential Variables
    const aggregateSbanneres = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      const regex = this.utilsService.createRegexFromString(searchQuery);

      const orConditions: any[] = [
        { name: regex },
        { subDomain: regex },
        { domain: regex },
        { websiteName: regex },
        { 'users.phoneNo': regex },
        { 'users.email': regex },
      ];

      // Attempt to add _id match if valid
      try {
        if (ObjectId.isValid(searchQuery)) {
          orConditions.unshift({ _id: new ObjectId(searchQuery) });
        }
      } catch (e) {
        // skip invalid _id
      }

      mFilter = {
        $and: [mFilter, { $or: orConditions }],
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
      mSelect = {
        name: 1,
      };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateSbanneres.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSbanneres.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSbanneres.push({ $project: mSelect });
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

      aggregateSbanneres.push(mPagination);

      aggregateSbanneres.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.shopModel.aggregate(aggregateSbanneres);
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Bannerion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllShopBasic() {
    try {
      const pageSize = 10;
      const currentPage = 1;

      const data = await this.shopModel
        .find()
        .skip(pageSize * (currentPage - 1))
        .limit(Number(pageSize));
      return {
        success: true,
        message: 'Success',

        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.shopModel.findById(id).select(select);
      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopInfoById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.shopModel
        .findById(id)
        .select('websiteName owner')
        .populate('owner', 'name phoneNo'); // select fields from User model

      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateShopById(
    id: string,
    updateShopDto: any,
  ): Promise<ResponsePayload> {
    try {
      const foundShop = await this.shopModel.findOne({ _id: id });

      if (!foundShop) {
        throw new BadRequestException('Shop not found by the given ID');
      }

      const updatedShop = await this.shopModel.findByIdAndUpdate(
        id,
        { $set: updateShopDto },
        { new: true }, // returns the updated document
      );

      return {
        success: true,
        message: 'Shop updated successfully',
        data: updatedShop,
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(`Failed to update shop: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }


  async getShopPageByPage(
    pageName: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.shopModel
        .findOne({ pageName: pageName })
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

  async renewMultipleShop(
    ids: string[],
    updateShopDto: any,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));
    const renewDay = updateShopDto.renewDay || 30;

    try {
      for (const id of mIds) {
        const fShop: any = await this.shopModel
          .findById(id)
          .select('startDate package');

        const date = new Date(fShop.startDate);
        date.setDate(date.getDate() + renewDay);

        const extendedDate = date.toISOString().split('T')[0];
        await this.shopModel.findByIdAndUpdate(id, {
          $set: {
            startDate: extendedDate,
          },
        });

        const report: any = {
          shop: id,
          package: fShop.package,
          starDate:
            fShop.startDate ?? this.utilsService.getDateString(new Date()),
          endDate: extendedDate,
          month: this.utilsService.getDateMonth(
            fShop.startDate ? new Date(fShop.startDate) : new Date(),
          ),
          year: this.utilsService.getDateYear(
            fShop.startDate ? new Date(fShop.startDate) : new Date(),
          ),
          amount: 499,
          renewDate: this.utilsService.getDateString(new Date()),
        };

        // await this.subscriptionReportModel.create(report);
      }
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopCategory(): Promise<ResponsePayload> {
    try {
      const filePath = path.join('./upload', 'json', 'shop-category.json');

      const jsonData = fs.readFileSync(filePath, 'utf8');

      return {
        success: true,
        message: 'Success',
        data: JSON.parse(jsonData),
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopSubCategory(): Promise<ResponsePayload> {
    try {
      const filePath = path.join('./upload', 'json', 'shop-sub-category.json');

      const jsonData = fs.readFileSync(filePath, 'utf8');

      return {
        success: true,
        message: 'Success',
        data: JSON.parse(jsonData),
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async cloneDataFromShop(
    cloneDataFromShopDto: CloneDataFromShopDto,
  ): Promise<ResponsePayload> {
    try {
      const { fromShop, toShop } = cloneDataFromShopDto;

      const fCarousels = JSON.parse(
        JSON.stringify(
          await this.carouselModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fCategories = JSON.parse(
        JSON.stringify(
          await this.categoryModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fSubCategories = JSON.parse(
        JSON.stringify(
          await this.subCategoryModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fBrands = JSON.parse(
        JSON.stringify(
          await this.brandModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fTags = JSON.parse(
        JSON.stringify(
          await this.tagModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fProducts = JSON.parse(
        JSON.stringify(
          await this.productModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const nCarousels = fCarousels.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.carouselModel.insertMany(nCarousels);

      const nCategories = fCategories.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.categoryModel.insertMany(nCategories);

      const nSubCategories = fSubCategories.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.subCategoryModel.insertMany(nSubCategories);

      const nBrands = fBrands.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.brandModel.insertMany(nBrands);

      const nTags = fTags.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.tagModel.insertMany(nTags);

      const nProducts = fProducts.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.productModel.insertMany(nProducts);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Manage Stripe Payment Api
   * payWithStripe()
   * callbackStripePayment()
   */

  async callbackStripePayment(
    res: Response,
    status: string,
    preShopId: string,
    sessionId: string,
    type?: string,
  ): Promise<any> {
    try {
      const redirectBase = this.configService.get<string>('frontendUrl');

      let model: any;
      let redirectUrl = redirectBase;
      let recipientPhone = '';
      const paymentRefId = '';

      if (type === 'Pre Shop') {
        model = await this.preShopModel.findOne({
          _id: preShopId,
        });
        if (!model) {
          return res.redirect(
            `${redirectBase}/payment/fail?message=Payment Config failed. No Payment config found.`,
          );
        }
        redirectUrl = `${redirectBase}/website-builder/${model._id}`;
        recipientPhone = model.phoneNo;
      } else if (type === 'Shop Renew') {
      }

      if (status === 'success') {
        console.log('ok');
        // Mark as paid
        await model?.constructor?.findByIdAndUpdate(model?._id, {
          $set: {
            paymentStatus: 'paid',
            paymentApiTrxID: sessionId,
            paymentRefId: sessionId,
            paymentMethod: 'Stripe',
            paidAmount: model?.amount,
          },
        });

        // type === 'Shop Renew'

        if (type === 'Shop Renew') {
          const fShop: any = await this.shopModel
            .findById(model.shop)
            .select(
              'startDate package shopType affiliateProductId affiliateId dateString',
            );

          // Determine base date
          const baseDate =
            fShop.shopType === 'free' ? new Date() : new Date(fShop.startDate);
          baseDate.setDate(
            baseDate.getDate() + (fShop.shopType === 'free' ? 0 : 30),
          );

          const extendedDate = baseDate.toISOString().split('T')[0];

          const updateData: any = {
            startDate: extendedDate,
          };

          if (fShop.shopType === 'free') {
            updateData.shopType = 'professional';
            updateData.trialPeriod = 0;

            if (fShop?.affiliateId && fShop.shopType === 'free') {
              await this.createAffiliateReport(fShop);
              // await this.createAffiliateReport(shopData);
              // console.log( 'Free');
            }
          }

          await this.shopModel.findByIdAndUpdate(model.shop, {
            $set: updateData,
          });
        }

        // Send SMS
        const msg =
          type === 'Pre Shop'
            ? `Thank you for your payment. Complete your website from here: ${redirectUrl}. You can anytime create your website from here.`
            : `We appreciate your renewal payment. Your subscription has been updated successfully.`;
        // this.bulkSmsService.sentSmsByany(recipientPhone, msg);
        await this.emailService.sendEmail(
          model?.email,
          'Payment complete',
          msg,
          model?.email,
        );

        return res.redirect(`${redirectUrl}?paymentStatus=paid`);
      } else {
        return res.redirect(`${redirectUrl}?paymentStatus=failed`);
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Manage SSL Commerz Payment Api
   * payWithSslCommerz()
   * callbackSslCommerzPayment()
   */
  private async payWithSslCommerz(
    sslCommerzInit: SslCommerzInit,
    sslDirect?: string,
    type?: string,
  ) {
    try {
      const { tran_id } = sslCommerzInit;
      const responsePayload =
        await this.paymentControlService.sslCommerzInit(sslCommerzInit);

      if (responsePayload['status'] === 'SUCCESS') {
        if (type === 'Pre Shop') {
          await this.preShopModel.findByIdAndUpdate(tran_id, {
            $set: {
              paymentRefId: responsePayload['sessionkey'],
              paymentApiType: 'SSl Commerz',
              paymentMethod: 'SSl Commerz',
            },
          });
        } else if (type === 'Shop Renew') {
        }

        const getPaymentRedirectUrl = (): string => {
          switch (sslDirect) {
            case 'bkash':
              return responsePayload.desc.find((f: any) => f.name === 'bKash')
                .redirectGatewayURL;

            case 'nagad':
              return responsePayload.desc.find((f: any) => f.name === 'Nagad')
                .redirectGatewayURL;

            default:
              return responsePayload['GatewayPageURL'];
          }
        };

        return {
          success: true,
          message: 'Success! Redirecting to the payment page',
          response: responsePayload,
          data: {
            _id: tran_id,
            providerName: 'SSl Commerz',
            link: getPaymentRedirectUrl(),
          },
        };
      } else {
        return {
          success: false,
          message: 'Error! Something went wrong. Please try again.',
          data: {
            _id: null,
            providerName: 'SSl Commerz',
            link: null,
          },
        };
      }
    } catch (err) {
      console.log(err);
    }
  }

  async callbackSslCommerzPayment(
    res: Response,
    tran_id: any,
    status: string,
    type: string,
  ): Promise<any> {
    try {
      const redirectBase = this.configService.get<string>('frontendUrl');
      const sslCommerzStoreId =
        this.configService.get<string>('sslCommerzStoreId');
      const sslCommerzStorePassword = this.configService.get<string>(
        'sslCommerzStorePassword',
      );
      const sslCommerzProduction = this.configService.get<string>(
        'sslCommerzProduction',
      );
      const sslBaseURL = `https://${sslCommerzProduction ? 'securepay' : 'sandbox'}.sslcommerz.com`;

      let model: any;
      let redirectUrl = '';
      let recipientPhone = '';
      let paymentRefId = '';

      if (type === 'Pre Shop') {
        model = await this.preShopModel.findOne({
          _id: tran_id,
          paymentMethod: 'SSl Commerz',
        });
        if (!model) {
          return res.redirect(
            `${redirectBase}/payment/fail?message=Payment Config failed. No Payment config found.`,
          );
        }
        redirectUrl = `${redirectBase}/website-builder/${model._id}`;
        recipientPhone = model.phoneNo;
        paymentRefId = model.paymentRefId;
      } else if (type === 'Shop Renew') {
        model = {};
        if (!model) {
          return res.redirect(
            `${redirectBase}/shop-payment/unknown?paymentStatus=failed`,
          );
        }
        redirectUrl = `${redirectBase}/shop-payment/${model.shop}`;
        recipientPhone = model.phoneNo;
        paymentRefId = model.paymentRefId;
      }

      const sslCommerzApiConfig: SslCommerzApiConfig = {
        baseUrl: sslBaseURL,
        store_id: sslCommerzStoreId,
        store_passwd: sslCommerzStorePassword,
        sessionKey: paymentRefId,
        tran_id: tran_id,
      };

      if (status === 'VALID') {
        const result =
          await this.paymentControlService.transactionQueryBySessionId(
            sslCommerzApiConfig,
          );

        if (result?.status === 'VALID') {
          // Mark as paid
          await model.constructor.findByIdAndUpdate(model._id, {
            $set: { paymentStatus: 'paid' },
          });

          // type === 'Shop Renew'

          if (type === 'Shop Renew') {
            const fShop: any = await this.shopModel
              .findById(model.shop)
              .select(
                'startDate package shopType affiliateProductId affiliateId dateString',
              );

            // Determine base date
            const baseDate =
              fShop.shopType === 'free'
                ? new Date()
                : new Date(fShop.startDate);
            baseDate.setDate(
              baseDate.getDate() + (fShop.shopType === 'free' ? 0 : 30),
            );

            const extendedDate = baseDate.toISOString().split('T')[0];

            const updateData: any = {
              startDate: extendedDate,
            };

            if (fShop.shopType === 'free') {
              updateData.shopType = 'professional';
              updateData.trialPeriod = 0;

              if (fShop?.affiliateId && fShop.shopType === 'free') {
                await this.createAffiliateReport(fShop);
                // await this.createAffiliateReport(shopData);
                // console.log( 'Free');
              }
            }

            await this.shopModel.findByIdAndUpdate(model.shop, {
              $set: updateData,
            });
          }

          // Send SMS
          const msg =
            type === 'Pre Shop'
              ? `Thank you for your payment. Complete your website from here: ${redirectUrl}. You can anytime create your website from here.`
              : `We appreciate your renewal payment. Your subscription has been updated successfully.`;
          this.bulkSmsService.sentSmsByAdmin(recipientPhone, msg);

          return res.redirect(`${redirectUrl}?paymentStatus=paid`);
        } else {
          return res.redirect(`${redirectUrl}?paymentStatus=failed`);
        }
      } else {
        return res.redirect(`${redirectUrl}?paymentStatus=failed`);
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // Create Affiliate Sale Report
  private async createAffiliateReport(saveShop: any) {
    const affiliateProductData: any = await this.affiliateProductModel.findById(
      saveShop.affiliateProductId,
    );

    const finalData = {
      type: 'earning',
      affiliate: saveShop.affiliateId,
      product: saveShop.affiliateProductId,
      ownerId: affiliateProductData.ownerId, // owner ID
      ownerType: affiliateProductData.ownerType, // assuming this is a shop
      shopId: saveShop._id, // shop ID
      amount: affiliateProductData.price,
      status: 'pending', // or 'pending', based on your logic
      dateString: saveShop.dateString,
    };

    // console.log('finalData', finalData);

    // await this.affiliateReportModel.create(finalData);
  }

  // async getShopDashboardStats(): Promise<ResponsePayload> {
  //   try {
  //     const today = this.utilsService.getDateString(new Date());
  //
  //     const [totalShop, ownDomain, subDomain, todayShop, demoShop] =
  //       await Promise.all([
  //         this.shopModel.countDocuments({ shopType: { $ne: 'demo' } }),
  //         this.shopModel.countDocuments({ domainType: { $ne: 'sub-domain' } }),
  //         this.shopModel.countDocuments({ domainType: 'sub-domain' }),
  //         this.shopModel.countDocuments({
  //           shopType: { $ne: 'demo' },
  //           dateString: today,
  //         }),
  //         this.shopModel.countDocuments({ shopType: 'demo' }),
  //       ]);
  //     return {
  //       success: true,
  //       message: 'Success',
  //       data: {
  //         totalShop,
  //         ownDomain,
  //         subDomain,
  //         todayShop,
  //         demoShop,
  //       },
  //     } as ResponsePayload;
  //   } catch (err) {
  //     throw new InternalServerErrorException(err.message);
  //   }
  // }

  async getShopDashboardStats(): Promise<ResponsePayload> {
    try {
      const today = this.utilsService.getDateString(new Date());
      const now = new Date();

      // -------------------------------
      // Last Month Range (String)
      // -------------------------------
      const lastMonthFirstDay = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const lastMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);

      const lastMonthFirstDayStr = `${lastMonthFirstDay.getFullYear()}-${String(
        lastMonthFirstDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(lastMonthFirstDay.getDate()).padStart(2, '0')}`;

      const lastMonthLastDayStr = `${lastMonthLastDay.getFullYear()}-${String(
        lastMonthLastDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(lastMonthLastDay.getDate()).padStart(2, '0')}`;

      // -------------------------------
      // This Month Range (String)
      // -------------------------------
      const thisMonthFirstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthLastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      );

      const thisMonthFirstDayStr = `${thisMonthFirstDay.getFullYear()}-${String(
        thisMonthFirstDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(thisMonthFirstDay.getDate()).padStart(2, '0')}`;

      const thisMonthLastDayStr = `${thisMonthLastDay.getFullYear()}-${String(
        thisMonthLastDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(thisMonthLastDay.getDate()).padStart(2, '0')}`;

      // ---------------------------------
      // Total Stats
      // ---------------------------------
      const [totalShop, ownDomain, subDomain, todayShop, demoShop] =
        await Promise.all([
          this.shopModel.countDocuments({ shopType: { $ne: 'demo' } }),
          this.shopModel.countDocuments({ domainType: { $ne: 'sub-domain' } }),
          this.shopModel.countDocuments({ domainType: 'sub-domain' }),
          this.shopModel.countDocuments({
            shopType: { $ne: 'demo' },
            dateString: today,
          }),
          this.shopModel.countDocuments({ shopType: 'demo' }),
        ]);

      // ---------------------------------
      // Fetch Shops in Month Ranges
      // ---------------------------------
      const lastMonthShops: any = await this.shopModel
        .find({
          startDate: { $gte: lastMonthFirstDayStr, $lte: lastMonthLastDayStr },
          shopType: 'professional',
        })
        .lean();

      const thisMonthShops: any = await this.shopModel
        .find({
          startDate: { $gte: thisMonthFirstDayStr, $lte: thisMonthLastDayStr },
          shopType: 'professional',
        })
        .lean();

      // ---------------------------------
      // Count Logic
      // ---------------------------------
      let lastMonthPurchaseShop = 0;
      let lastMonthRenewShop = 0;

      let thisMonthPurchaseShop = 0;
      let thisMonthRenewShop = 0;

      // Last Month Shops
      lastMonthShops.forEach((shop) => {
        const createdAt = new Date(shop.createdAt);
        const startDate = new Date(shop.startDate);
        const diffDays = Math.ceil(
          Math.abs(startDate.getTime() - createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 30) {
          lastMonthPurchaseShop += 1;
        } else {
          lastMonthRenewShop += 1;
        }
      });

      // This Month Shops
      thisMonthShops.forEach((shop) => {
        const createdAt = new Date(shop.createdAt);
        const startDate = new Date(shop.startDate);
        const diffDays = Math.ceil(
          Math.abs(startDate.getTime() - createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 30) {
          thisMonthPurchaseShop += 1;
        } else {
          thisMonthRenewShop += 1;
        }
      });

      return {
        success: true,
        message: 'Success',
        data: {
          totalShop,
          ownDomain,
          subDomain,
          todayShop,
          demoShop,
          lastMonthPurchaseShop,
          lastMonthRenewShop,
          thisMonthPurchaseShop,
          thisMonthRenewShop,
        },
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async replaceUrlInAllCollections(
    fromUrl: string,
    toUrl: string,
  ): Promise<void> {
    const collections = await this.connection.db.collections();

    for (const collection of collections) {
      console.log(`🔍 Checking collection: ${collection.collectionName}`);
      const docs = await collection.find({}).toArray();

      for (const doc of docs) {
        const updatedFields: Record<string, any> = {};

        this.deepReplaceSelective(doc, fromUrl, toUrl, '', updatedFields);

        if (Object.keys(updatedFields).length > 0) {
          console.log(
            `📄 Updating document _id: ${doc._id} in ${collection.collectionName}`,
          );
          console.log(`➡️ Modified fields:`, updatedFields);

          await collection.updateOne({ _id: doc._id }, { $set: updatedFields });
        }
      }
    }

    console.log('✅ URL replacement completed in all collections.');
  }

  private deepReplaceSelective(
    obj: any,
    from: string,
    to: string,
    path: string,
    updatedFields: Record<string, any>,
  ): void {
    if (typeof obj === 'string') {
      if (obj.includes(from)) {
        updatedFields[path] = obj.replaceAll(from, to);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = path ? `${path}.${index}` : `${index}`;
        this.deepReplaceSelective(item, from, to, newPath, updatedFields);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        this.deepReplaceSelective(obj[key], from, to, newPath, updatedFields);
      }
    }
  }

  async getTest(): Promise<ResponsePayload> {
    try {

      // const value = process.env.JWT_PRIVATE_KEY_USER;
      const mongoCluster = this.configService.get<string>('mongoCluster');
      const port = this.configService.get<string>('port');

      return {
        success: true,
        message: 'Success',
        data: {
          'port': port,
          'mongoCluster': mongoCluster

        },
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }
}
