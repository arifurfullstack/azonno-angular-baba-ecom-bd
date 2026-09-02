import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShopInformation } from './interfaces/shop-information.interface';
import { AddShopInformationDto } from './dto/shop-information.dto';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { Vendor } from '../../vendor/interfaces/vendor.interface';
import { ErrorCodes } from '../../../enum/error-code.enum';
import { Shop } from '../../shop/interfaces/shop.interface';

import { DiscountTypeEnum } from '../../../enum/product.enum';
import * as moment from 'moment';
import { TtlCacheService } from '../../../shared/ttl-cache/ttl-cache.service';

@Injectable()
export class ShopInformationService {
  private logger = new Logger(ShopInformationService.name);

  constructor(
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private readonly ttlCache: TtlCacheService,
  ) {}

  /**
   * addShopInformation
   */
  async addShopInformation(
    vendor: Vendor,
    shop: string,
    addShopInformationDto: AddShopInformationDto,
  ): Promise<ResponsePayload> {
    try {
      // const { shop } = addShopInformationDto;
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

      const shopInformationData = await this.shopInformationModel.findOne({
        shop: shop,
      });

      if (shopInformationData) {
        await this.shopInformationModel.findByIdAndUpdate(
          shopInformationData._id,
          {
            $set: addShopInformationDto,
          },
        );
        // Prefix covers every select-variant cache entry for this shop.
        this.ttlCache.invalidatePrefix(`ui:shop-info:${shop}`);
        const data = {
          _id: shopInformationData._id,
        };

        return {
          success: true,
          message: 'Data Updated Success',
          data: data,
        } as ResponsePayload;
      } else {
        const finalData = {
          ...addShopInformationDto,
          ...{
            shop: shop,
          },
        };
        const saveData = await this.shopInformationModel.create(finalData);

        this.ttlCache.invalidatePrefix(`ui:shop-info:${shop}`);

        const data = {
          _id: saveData._id,
        };

        return {
          success: true,
          message: 'Data Added Success',
          data: data,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  /**
   * getShopInformation
   */
  async getShopInformation(
    shop: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      // Identical for every storefront visitor within the TTL window —
      // collapses the two Atlas round trips + package/expiry math into one
      // load per minute (invalidated on writes).
      return await this.ttlCache.wrap(
        `ui:shop-info:${shop}:${select ?? ''}`,
        60_000,
        () => this.loadShopInformation(shop, select),
      );
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  private async loadShopInformation(
    shop: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.shopInformationModel
        .findOne({ shop: shop })
        .select(select);

      // Shop Data
      const fShopDomain: any = await this.shopModel
        .findById(shop)
        .select(
          'domain subDomain websiteName startDate trialPeriod isTrailPrice shopType package showBranding brandingText',
        );



      let packagePrice: any;


      // Calculate Expire Date
      const startDate = moment(fShopDomain.startDate).startOf('day');
      const expireDate = startDate
        .clone()
        .add(
          fShopDomain.shopType === 'free' ? (fShopDomain.trialPeriod ?? 0) : 30,
          'days',
        )
        .startOf('day');

      const today = moment().startOf('day');

      let expireDay = expireDate.diff(today, 'days');
      // expireDay = Math.max(0, expireDay); // Ensure no negative

      const balance =
        fShopDomain.shopType === 'free'
          ? 0
          : Math.floor((packagePrice / 30) * expireDay);

      return {
        success: true,
        message: 'Success',
        data,
        fShopDomain,
        expireDate: expireDate.format('YYYY-MM-DD'),
        shopType: fShopDomain.shopType,
        trialPeriod: fShopDomain.trialPeriod,
        expireDay,
        isTrailPrice: fShopDomain.isTrailPrice,
        // expireDay : Math.max(0, expireDay), // Ensure no negative
        currentBalance: balance,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
