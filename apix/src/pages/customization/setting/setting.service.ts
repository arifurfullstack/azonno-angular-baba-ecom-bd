import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { AddSettingDto } from './dto/setting.dto';
import { Setting } from './interface/setting.interface';
import { User } from '../../user/interfaces/user.interface';
import { Order } from '../../order/interfaces/order.interface';
import { MAX_NEW_REGISTRATION_ORDER_COUNT } from '../../../config/global-variables';
import { Shop } from '../../shop/interfaces/shop.interface';
import { ScriptService } from '../../../shared/script/script.service';
import { ReBuildScript } from '../../../shared/script/interfaces/build-script.interface';
import * as fs from 'fs';
import * as path from 'path';
import { UploadService } from '../../upload/upload.service';
import { TtlCacheService } from '../../../shared/ttl-cache/ttl-cache.service';

@Injectable()
export class SettingService {
  private logger = new Logger(SettingService.name);

  constructor(
    @InjectModel('Setting')
    private readonly settingModel: Model<Setting>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private configService: ConfigService,
    private scriptService: ScriptService,
    private utilsService: UtilsService,
    private readonly uploadService: UploadService,
    private readonly ttlCache: TtlCacheService,
  ) { }

  /**
   * addSetting
   * insertManySetting
   */
  async addSetting(
    shop: string,
    addSettingDto: AddSettingDto,
  ): Promise<ResponsePayload> {
    try {
      const { needRebuild } = addSettingDto;
      const settingData = await this.settingModel.findOne({ shop: shop });
      if (settingData) {
        await this.settingModel.findByIdAndUpdate(settingData._id, {
          $set: addSettingDto,
        });
        // Cached storefront settings must not serve the old snapshot.
        this.ttlCache.delete(`setting:ui:${shop}`);
        this.ttlCache.delete(`setting:sort:${shop}`);
        this.ttlCache.delete(`setting:chat:${shop}`);
        // Invalidate storage driver cache if storage settings changed
        if (addSettingDto.storageSetting) {
          this.uploadService.invalidateDriverCache(shop);
        }
        const data = {
          _id: settingData._id,
        };

        if (needRebuild) {
          const fShop = await this.shopModel
            .findById(shop)
            .select('domain subDomain theme');

          let domain: string;
          if (fShop.domain) {
            domain = fShop.domain;
          } else {
            domain = fShop.subDomain;
          }

          const buildScript: ReBuildScript = {
            targetPath: this.configService.get<string>('themeTargetPath'),
            domain: domain,
            shop: shop.toString(),
            apiBaseUrl: this.configService.get<string>('apiBaseUrl'),
          };

          console.log('buildScript', buildScript);

          await this.shopModel.findByIdAndUpdate(shop, {
            $set: {
              updateStatus: 'working',
            },
          });

          const productionBuild =
            this.configService.get<string>('productionBuild');

          // if (productionBuild) {
          await this.scriptService.executeRebuildScript(buildScript);
          // }

          // Also update shop-settings.json directly for localhost development
          await this.updateShopSettingsFile(shop);
        }

        return {
          success: true,
          message: 'Data Updated Success',
          data,
        } as ResponsePayload;
      } else {
        const mData = {
          ...addSettingDto,
          ...{
            shop: shop,
          },
        };
        const newData = new this.settingModel(mData);
        const saveData = await newData.save();
        this.ttlCache.delete(`setting:ui:${shop}`);
        this.ttlCache.delete(`setting:sort:${shop}`);
        this.ttlCache.delete(`setting:chat:${shop}`);
        const data = {
          _id: saveData._id,
        };

        return {
          success: true,
          message: 'Data Added Success',
          data,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * getSetting
   * getSettingById
   */

  async getSetting(shop: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.settingModel
        .findOne({ shop: shop })
        .select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Separate Condition Settings
   * getPaymentMethod()
   */
  async getPaymentMethods(shop: string): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('paymentMethods isCashOnDeliveryOff -_id');

      const fPaymentMethods = fSetting?.paymentMethods ?? [];
      const paymentMethods = fPaymentMethods
        .filter((f) => f.status?.toLowerCase() === 'active')
        .map((m: any) => {
          return {
            providerName: m.providerName,
            providerType: m.providerType,
            accountNumber: m.accountNumber,
            paymentInstruction: m.paymentInstruction,
            binanceType: m.binanceType,
          };
        });
      return {
        success: true,
        message: 'Success',
        data: {
          paymentMethods: paymentMethods,
          isCashOnDeliveryOff: fSetting?.isCashOnDeliveryOff,
        },
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getDeliveryCharges(shop: string, user: User): Promise<ResponsePayload> {
    try {
      const fUser = await this.userModel
        .findById(user._id)
        .select('addresses -_id');

      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('deliveryCharges -_id');

      const fAddress = fUser?.addresses ?? [];
      const fDeliveryCharges = fSetting?.deliveryCharges ?? [];
      const defaultAddress = fAddress.find((f) => f.isDefaultAddress);
      const deliveryCharges = fDeliveryCharges.filter(
        (f) => f.status === 'active',
      );

      // Example Outputs
      const result = this.calculateDeliveryCharges(
        deliveryCharges,
        defaultAddress,
      );

      return {
        success: true,
        message: 'Success',
        data: result,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getDeliveryChargesEasyCheckout(
    shop: string,
    division: string,
  ): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('deliveryCharges -_id');

      const fDeliveryCharges = fSetting?.deliveryCharges ?? [];
      const defaultAddress = { division };
      const deliveryCharges = fDeliveryCharges.filter(
        (f) => f.status === 'active',
      );

      // console.log('deliveryCharges', deliveryCharges);
      // console.log('defaultAddress', defaultAddress);
      // Example Outputs
      const result = this.calculateDeliveryCharges(
        deliveryCharges,
        defaultAddress,
      );

      return {
        success: true,
        message: 'Success',
        data: result,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getChatLink(shop: string): Promise<ResponsePayload> {
    try {
      // Identical for every storefront visitor — cache the shop's active
      // chats instead of one Atlas round trip per request.
      return await this.ttlCache.wrap(
        `setting:chat:${shop}`,
        60_000,
        async () => {
          const fSetting = await this.settingModel
            .findOne({ shop: shop })
            .select('chats -_id');

          const fChatLink = fSetting?.chats ?? [];
          const chatLink = fChatLink.filter((f) => f.status === 'active');
          return {
            success: true,
            message: 'Success',
            data: chatLink,
          } as ResponsePayload;
        },
      );
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAdvancePayment(shop: string): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('advancePayment -_id');

      const fAdvancePayment = fSetting?.advancePayment ?? [];
      const advancePayment = fAdvancePayment.filter(
        (f) => f.status === 'active',
      );
      return {
        success: true,
        message: 'Success',
        data: advancePayment,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getSocialLogins(shop: string): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('socialLogins -_id');

      const fSocialLogins = fSetting?.socialLogins ?? [];
      const socialLogins = fSocialLogins
        .filter((f) => f.status?.toLowerCase() === 'active')
        .map((m: any) => {
          return {
            providerName: m.providerName,
            authId: m.authId,
          };
        });
      return {
        success: true,
        message: 'Success',
        data: socialLogins,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getUserOffers(shop: string, user: User): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('offers -_id');

      const fOffers = fSetting?.offers ?? [];
      const offers = fOffers
        .filter((f) => f.status?.toLowerCase() === 'active')
        .map((m: any) => {
          return {
            offerType: m.offerType,
            discount: m.discount,
          };
        });

      function filterOffers(offers: any[], removeType: string) {
        return offers.filter((offer) => offer.offerType !== removeType);
      }

      let canUserGetNewRegistration: boolean = false;

      const isActiveNewRegistration = offers.find(
        (f) => f.offerType === 'new-registration',
      );
      if (isActiveNewRegistration) {
        const fUser = await this.userModel
          .findById(user._id)
          .select('registrationAt');

        const regDayAgo = this.utilsService.getDateDifference(
          new Date(fUser.registrationAt),
          new Date(),
          'days',
        );
        if (regDayAgo <= 30) {
          const orderCount = await this.orderModel.countDocuments({
            user: user._id,
          });
          canUserGetNewRegistration =
            orderCount < MAX_NEW_REGISTRATION_ORDER_COUNT;
        } else {
          canUserGetNewRegistration = false;
        }
      }

      let finalData: any[];
      if (!canUserGetNewRegistration) {
        finalData = filterOffers(offers, 'new-registration');
      } else {
        finalData = offers;
      }

      return {
        success: true,
        message: 'Success',
        data: finalData,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getOffers(shop: string): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('offers -_id');

      const fOffers = fSetting?.offers ?? [];
      const offers = fOffers
        .filter((f) => f.status?.toLowerCase() === 'active')
        .map((m: any) => {
          return {
            offerType: m.offerType,
            discount: m.discount,
          };
        });

      return {
        success: true,
        message: 'Success',
        data: offers,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Private Methods
   * calculateDeliveryCharges()
   */

  private calculateDeliveryCharges(
    deliveryCharges: any[],
    defaultAddress: any,
  ) {
    if (deliveryCharges && deliveryCharges.length && defaultAddress) {
      const { division } = defaultAddress;

      // Map delivery charges with calculated default address charges
      const processedCharges = deliveryCharges.map((delivery: any) => {
        let deliveryCharge: number;

        if (delivery.type?.toLowerCase() === 'free') {
          deliveryCharge = 0;
        } else if (delivery.city?.toLowerCase() === division?.toLowerCase()) {
          deliveryCharge = delivery.insideCity ?? 0;
        } else {
          deliveryCharge = delivery.outsideCity ?? 0;
        }

        return {
          name: delivery.name,
          type: delivery.type,
          city: delivery.city,
          insideCity: delivery.insideCity,
          outsideCity: delivery.outsideCity,
          freeDeliveryMinAmount: delivery.freeDeliveryMinAmount,
          note: delivery.note,
          deliveryCharge,
          isAdvancePayment: delivery.isAdvancePayment,
        };
      });

      // Define sorting order
      const sortingOrder: Record<string, number> = {
        free: 1,
        regular: 2,
        express: 3,
      };

      // Sort based on the type order
      return processedCharges.sort((a: any, b: any) => {
        const orderA = sortingOrder[a.type] || 99; // Default high value for undefined types
        const orderB = sortingOrder[b.type] || 99;
        return orderA - orderB;
      });
    } else if (deliveryCharges && deliveryCharges.length && !defaultAddress) {
      // Map delivery charges with calculated default address charges
      const processedCharges = deliveryCharges.map((delivery: any) => {
        let deliveryCharge: number;

        if (delivery.type?.toLowerCase() === 'free') {
          deliveryCharge = 0;
        } else {
          deliveryCharge = delivery.outsideCity ?? 0;
        }

        return {
          name: delivery.name,
          type: delivery.type,
          city: delivery.city,
          insideCity: delivery.insideCity,
          outsideCity: delivery.outsideCity,
          note: delivery.note,
          deliveryCharge,
        };
      });

      // Define sorting order
      const sortingOrder: Record<string, number> = {
        free: 1,
        regular: 2,
        express: 3,
      };

      // Sort based on the type order
      return processedCharges.sort((a: any, b: any) => {
        const orderA = sortingOrder[a.type] || 99; // Default high value for undefined types
        const orderB = sortingOrder[b.type] || 99;
        return orderA - orderB;
      });
    } else {
      return [];
    }
  }

  /**
   * Update shop-settings.json file
   * For localhost development - writes directly to UI's public folder
   */
  private async updateShopSettingsFile(shop: string): Promise<void> {
    try {
      const setting = await this.settingModel
        .findOne({ shop: shop })
        .select('themeViewSettings themeColors searchHints orderLanguage pageViewSettings -_id');

      if (setting) {
        const settingObj: any = setting.toObject();
        const settingsData = {
          shop: shop,
          themeColors: settingObj.themeColors,
          themeViewSettings: settingObj.themeViewSettings || [],
          pageViewSettings: settingObj.pageViewSettings || [],
          searchHints: settingObj.searchHints || '',
          orderLanguage: settingObj.orderLanguage || 'en',
        };

        // Path to UI's public/shop-settings.json
        const targetPath = this.configService.get<string>('themeTargetPath');
        const shopSettingsPath = path.join(
          targetPath,
          'public',
          'shop-settings.json',
        );

        // Write to file
        fs.writeFileSync(
          shopSettingsPath,
          JSON.stringify(settingsData, null, 2),
          'utf8',
        );

        console.log(`✅ Updated shop-settings.json at ${shopSettingsPath}`);
      }
    } catch (error) {
      console.error('Error updating shop-settings.json:', error);
      // Don't throw error, just log it
    }
  }
}
