import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ErrorCodes } from '../../enum/error-code.enum';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { Order } from './interfaces/order.interface';
import {
  AddOrderByUserDto,
  AddOrderDto,
  FilterAndPaginationOrderDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { User } from '../user/interfaces/user.interface';
import { UniqueId } from '../../interfaces/unique-id.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { Product } from '../product/interfaces/product.interface';
import { Cart } from '../cart/interfaces/cart.interface';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import { NotificationService } from '../notification/notification.service';
import { LogReportService } from '../../shared/log-report/log-report.service';
import { Setting } from '../customization/setting/interface/setting.interface';
import { BulkSmsService } from '../../shared/bulk-sms/bulk-sms.service';
import { SmsSentConfig } from '../../shared/bulk-sms/interfaces/bulk-sms.interface';
import { PaymentControlService } from '../../shared/payment-control/payment-control.service';
import {
  BkashApiConfig,
  SslCommerzApiConfig,
  SslCommerzInit,
} from '../../shared/payment-control/interfaces/payment-control.interface';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CourierService } from '../../shared/courier/courier.service';
import {
  CourierApiConfig,
  SteadfastCourierPayload,
} from '../../shared/courier/interfaces/courier.interface';
import { ShopInformation } from '../customization/shop-information/interfaces/shop-information.interface';
import {
  FRAUD_CHECK_DAILY_LIMIT,
  MAX_NEW_REGISTRATION_ORDER_COUNT,
  MAX_ORDER_CREATE,
} from '../../config/global-variables';
import * as schedule from 'node-schedule';
import { Coupon } from '../offers/coupon/interfaces/coupon.interface';
import { DiscountTypeEnum } from '../../enum/product.enum';
import { GetUserByIdsDto } from '../user/dto/user.dto';
import { EmailService } from '../../shared/email/email.service';
import { IncompleteOrder } from './interfaces/incomplete-order.interface';
import { HttpService } from '@nestjs/axios';
import { AffiliateProduct } from '../affiliate-product/interfaces/affiliate-product.interface';
import { AffiliateReport } from '../affiliate-report/interfaces/affiliate-report.interface';
import axios from 'axios';
import { IpBlock } from '../ip-block/interfaces/ip-block.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class OrderService {
  private logger = new Logger(OrderService.name);

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('UniqueId') private readonly uniqueIdModel: Model<UniqueId>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Cart') private readonly cartModel: Model<Cart>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('Coupon') private readonly couponModel: Model<Coupon>,
    @InjectModel('Vendor') private readonly vendorModel: Model<Vendor>,
    @InjectModel('IncompleteOrder')
    private readonly incompleteOrderModel: Model<IncompleteOrder>,
    @InjectModel('AffiliateProduct')
    private readonly affiliateProductModel: Model<AffiliateProduct>,
    @InjectModel('AffiliateReport')
    private readonly affiliateReportModel: Model<AffiliateReport>,

    @InjectModel('IpBlock')
    private readonly ipBlockModel: Model<IpBlock>,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly bulkSmsService: BulkSmsService,
    private readonly paymentControlService: PaymentControlService,
    private readonly courierService: CourierService,
    private readonly notificationService: NotificationService,
    private readonly logReportService: LogReportService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
  ) {
    // Job Scheduler
    this.checkExpireEveryday();
    this.checkAndUpdateCourierStatus();
  }

  /**
   * addOrder()
   * addOrderByUser()
   * getAllOrderByShop()
   * getAllOrders()
   * getAllOrdersByUser()
   * getOrderById()
   * updateOrderById()
   * updateOrderBeforePaymentByUser()
   * updateMultipleOrderById()
   * deleteMultipleTrashOrder()
   * deleteMultipleOrderByIdByVendor()
   * deleteMultipleOrderById()
   */

  // async getAllOrderForUi(shop: string): Promise<ResponsePayload> {
  //   try {
  //     const today = new Date();
  //     const startDate = this.utilsService.getNextDateString(today, -6); // 6 days ago from today
  //     const endDate = this.utilsService.getNextDateString(today, 0); // today
  //
  //     const data = await this.orderModel
  //       .find({
  //         shop: shop,
  //         checkoutDate: { $gte: startDate, $lte: endDate },
  //       })
  //       .select('name checkoutDate orderedItems grandTotal orderStatus')
  //       .limit(15)
  //       .sort({ checkoutDate: -1 });
  //
  //     return {
  //       success: true,
  //       message: 'Success! Data fetch successfully.',
  //       data,
  //     } as ResponsePayload;
  //   } catch (err) {
  //     throw new InternalServerErrorException(err.message);
  //   }
  // }

  async getAllOrderForUi(
    shop: string,
    page: number,
    limit: number,
  ): Promise<ResponsePayload> {
    try {
      const today = new Date();
      const startDate = this.utilsService.getNextDateString(today, -6);
      const endDate = this.utilsService.getNextDateString(today, 0);

      const skip = (page - 1) * limit;

      const data = await this.orderModel
        .find({
          shop: shop,
          checkoutDate: { $gte: startDate, $lte: endDate },
        })
        .select('name checkoutDate orderedItems grandTotal orderStatus')
        .sort({ checkoutDate: -1 })
        .skip(skip)
        .limit(limit);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async addOrder(
    shop: string,
    addOrderDto: AddOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderType, orderedItems, incompleteOrderId } = addOrderDto;

      // Limit with this shop
      const totalOrders = await this.orderModel.countDocuments({
        shop: shop,
      });

      if (totalOrders && totalOrders > MAX_ORDER_CREATE) {
        return {
          success: false,
          message: 'Sorry! exists your order create limit with this shop.',
        } as ResponsePayload;
      }
      // Increment Order Id Unique
      const incOrder = await this.uniqueIdModel.findOneAndUpdate(
        { shop: shop },
        { $inc: { orderId: 1 } },
        { new: true, upsert: true, returnDocument: 'after' },
      );

      const orderIdUnique = this.utilsService.padLeadingZeros(incOrder.orderId);

      const dataExtra = {
        shop: shop,
        orderId: orderIdUnique,
        month: this.utilsService.getDateMonth(new Date(), false),
        year: this.utilsService.getDateYear(new Date()),
        // orderTimeline: {
        //   pending: {
        //     date: this.utilsService.getDateString(new Date()),
        //     time: this.utilsService.getCurrentTime(),
        //   },
        // },
      };

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods courierMethods productSetting -_id',
        );
      console.log('fSetting', fSetting);

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      const mData = { ...addOrderDto, ...dataExtra };

      const saveData: any = await this.orderModel.create(mData);
      const data = {
        _id: saveData._id,
        orderId: saveData.orderId,
        orderType: saveData.orderType,
      };

      if (addOrderDto?.orderStatus) {
        await this.adjustDataOnOrderStatusUpdate({
          order_id: saveData._id,
          orderStatus: addOrderDto?.orderStatus,
          smsMethod: smsMethod,
          smsSendingOption: smsSendingOption,
          fProductSetting: fProductSetting,
        });

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: addOrderDto?.orderStatus,
          courierMethod: courierMethod,
          id: saveData._id,
        });
      }

      // Clean Incomplete Order
      if (saveData && incompleteOrderId) {
        try {
          // console.log('Deleting Incomplete Order ID:', incompleteOrderId);
          const result =
            await this.incompleteOrderModel.findByIdAndDelete(
              incompleteOrderId,
            );
          if (result) {
            console.log('Incomplete order deleted successfully');
          } else {
            console.log('No incomplete order found with given ID');
          }
        } catch (error) {
          console.error('Error deleting incomplete order:', error.message);
        }
      }

      // Delete Carts
      if (addOrderDto.user) {
        const productIds = orderedItems.map((m) => new ObjectId(m.product));
        await this.cartModel.deleteMany({
          product: { $in: productIds },
        });
      }

      // Notification

      const nData = {
        name: ` Order create  successful`,
        description: `Your order id is ${orderIdUnique}. `,
        url: `/single-order/${saveData._id}`,
        user: addOrderDto.user,
        shop: shop,
        isRead: false,
      };
      await this.notificationService.createNotification(nData);

      // Courier Manage

      if (saveData.orderStatus === 'confirmed') {
        // Setting Data
        const fSetting = await this.settingModel
          .findOne({ shop: shop })
          .select(
            'smsSendingOption currency smsMethods courierMethods productSetting -_id',
          );
        // Courier Providers
        const fCourierMethods = fSetting?.courierMethods ?? [];
        const courierMethod = fCourierMethods.find(
          (f: any) => f.status === 'active',
        );

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: saveData.orderStatus,
          courierMethod: courierMethod,
          id: saveData._id,
        });
      }

      return {
        success: true,
        message: 'Success! order placed successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  private getAdvancePaymentAmount(
    advancePayment: any[],
    division: string,
    deliveryChargeAmount: number,
    cartSaleSubTotal: number,
  ): number {
    if (advancePayment && advancePayment.length) {
      // Find the custom_advance_payment object
      const customAdvance = advancePayment.find(
        (item) =>
          item.providerName === 'custom_advance_payment' &&
          item.status === 'active' &&
          cartSaleSubTotal >= item.minimumAmount,
      );

      // If custom_advance_payment meets criteria, return its advancePaymentAmount
      if (customAdvance) {
        return customAdvance.advancePaymentAmount ?? 0;
      }

      // Else, check for advance_delivery_payment and matching division
      const deliveryAdvance = advancePayment.find(
        (item) =>
          item.providerName === 'advance_delivery_payment' &&
          item.status === 'active' &&
          item.division &&
          item.division.includes(division),
      );

      if (deliveryAdvance) {
        return deliveryChargeAmount;
      }

      // If none match, return 0
      return 0;
    } else {
      return 0;
    }
  }

  async addOrderByUser(
    shop: string,
    user: User,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    try {
      const {
        division,
        deliveryType,
        phoneNo,
        carts,
        cartData,
        orderType,
        userOffer,
        needSaveAddress,
        advancePayment,
        coupon,
        incompleteOrderId,
        affiliateId,
        affiliateProductId,
      } = addOrderByUserDto;

      let cartItems: any[] = [];

      // Limit with this shop
      const totalOrders = await this.orderModel.countDocuments({
        shop: shop,
      });

      if (totalOrders && totalOrders > MAX_ORDER_CREATE) {
        return {
          success: false,
          message: 'Sorry! exists your order create limit with this shop.',
        } as ResponsePayload;
      }

      if (!user) {
        const fProducts = JSON.parse(
          JSON.stringify(
            await this.productModel.find({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            }),
          ),
        );

        if (fProducts && fProducts.length) {
          cartItems = cartData.map((t1) => ({
            ...t1,
            ...{ product: fProducts.find((t2) => t2._id === t1.product) },
          }));
        }
      } else {
        cartItems = JSON.parse(
          JSON.stringify(
            await this.cartModel
              .find({ _id: { $in: carts } })
              .populate(
                'product',
                '_id name slug images isEnablePhoneModel  category isVariation variationList variation2Options variation2 variationOptions subCategory childCategory brand regularPrice salePrice costPrice variation model minimumWholesaleQuantity deliveryCharge advancePayment',
              ),
          ),
        );
      }

      // Set Auth User if Have
      if (user) {
        addOrderByUserDto.user = user._id;
      }

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'deliveryCharges currency country orderSetting productSetting smsSendingOption smsMethods paymentMethods offers orderNotification advancePayment -_id',
        );

      // ✅ STEP 1: Blocked IP Check

      // IP Block Logic here
      if (fSetting.orderSetting.isEnableSingleIpBlock) {
        const isBlocked = await this.isIpBlocked(userIpAddress, shop, phoneNo);
        if (isBlocked) {
          return {
            success: false,
            message: 'You are blocked from placing order. Please try later.',
          };
        }
      }

      // Ip Wise Order Limit And Block Time Check Logic here
      if (fSetting.orderSetting.isEnableIpWiseOrderLimitAndBlockTime) {
        const isBlocked = await this.isIpBlocked(userIpAddress, shop, phoneNo);
        if (isBlocked) {
          return {
            success: false,
            message: 'You are temporarily blocked from placing orders.',
          };
        }
      }

      //Order Notification
      const fOrderNotification = fSetting?.orderNotification ?? {};

      //Product Setting
      const fProductSetting = fSetting?.productSetting ?? {};

      // Delivery Charges
      const fDeliveryCharges = fSetting?.deliveryCharges ?? [];
      const deliveryCharges = fDeliveryCharges.filter(
        (f) => f.status === 'active',
      );

      // Shop Data
      const fShopInfo = await this.shopModel
        .findById(shop)
        .select('domain subDomain users');

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      // Payment Providers
      const fPaymentMethods = fSetting?.paymentMethods ?? [];

      const products = this.getOrderItems(cartItems);
      const orderIdUnique = await this.getUniqueOrderId(shop);

      let offerDiscount: any;
      if (user && userOffer) {
        const fOffers = fSetting?.offers ?? [];
        offerDiscount = await this.offerDiscountAmount({
          offersSetting: fOffers,
          user: user,
          subTotal: this.cartSaleSubTotal(cartItems),
          userOffer: userOffer,
        });
      }

      // Previous Order Counts

      let previousOrderCounts: number = 0;

      if (phoneNo) {
        previousOrderCounts = await this.orderModel.countDocuments({
          shop,
          phoneNo,
          status: { $ne: 'trash' },
        });
      }

      // Coupon Calculation

      let couponDiscount: number;

      if (coupon) {
        const couponData: any = await this.couponModel.findOne({
          _id: coupon,
          shop,
        });

        if (couponData) {
          if (couponData.discountType === DiscountTypeEnum.PERCENTAGE) {
            couponDiscount = Math.floor(
              (couponData.discountAmount / 100) *
                this.cartSaleSubTotal(cartItems),
            );
          } else if (couponData.discountType === DiscountTypeEnum.CASH) {
            couponDiscount = Math.floor(couponData.discountAmount);
          } else {
            couponDiscount = 0;
          }
        }
      }

      const { deliveryCharge: finalDeliveryCharge, isInsideCity } =
        this.getDeliveryCharge(
          deliveryCharges,
          division,
          deliveryType,
          cartItems,
        );

      const { total: deliveryChargeTotal, hasZero: hasZeroDeliveryCharge } =
        this.getCartDeliveryChargeTotal(cartItems, isInsideCity);

      const orderSensitiveData: any = {
        shop: shop,
        carts: orderType === 'anonymous' ? [] : carts,
        orderId: orderIdUnique,
        orderedFrom: addOrderByUserDto?.orderFrom,
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        checkoutDate: this.utilsService.getDateString(new Date()),
        checkoutTime: this.utilsService.getCurrentTime(),
        month: this.utilsService.getDateMonth(new Date(), false),
        year: this.utilsService.getDateYear(new Date()),
        orderTimeline: {
          pending: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        },
        subTotal: this.cartRegularSubTotal(cartItems),
        discount: this.cartDiscountAmount(cartItems),

        deliveryCharge: fProductSetting.isEnableDeliveryCharge
          ? hasZeroDeliveryCharge
            ? deliveryChargeTotal + finalDeliveryCharge
            : deliveryChargeTotal
          : finalDeliveryCharge,

        offerDiscount: offerDiscount,
        grandTotal: this.getOrderGrandTotal(
          cartItems,
          fProductSetting.isEnableDeliveryCharge
            ? hasZeroDeliveryCharge
              ? deliveryChargeTotal + finalDeliveryCharge
              : deliveryChargeTotal
            : finalDeliveryCharge,
          offerDiscount,
          couponDiscount,
        ),
        orderedItems: products,
        coupon: coupon ?? null,
        couponDiscount: couponDiscount ?? 0,
        previousOrderCount: previousOrderCounts ?? 0,
        userIpAddress: userIpAddress ?? null,
      };

      let finalOrderData: any;

      if (advancePayment && advancePayment > 0) {
        // Advance Payment
        const advancePaymentData: any[] =
          fSetting?.advancePayment && fSetting?.advancePayment.length
            ? fSetting?.advancePayment.filter((f) => f.status === 'active')
            : [];

        const cartSaleSubTotal = this.cartSaleSubTotal(cartItems);

        const finalAdvancePaymentAmount = this.getAdvancePaymentAmount(
          advancePaymentData,
          division,
          fProductSetting.isEnableDeliveryCharge
            ? hasZeroDeliveryCharge
              ? deliveryChargeTotal + finalDeliveryCharge
              : deliveryChargeTotal
            : finalDeliveryCharge,
          cartSaleSubTotal,
        );

        const { total: advancePaymentTotal, hasZero: hasZeroAdvancePayment } =
          this.cartAdvancePaymentTotal(cartItems);

        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
          ...{
            advancePaymentStatus: 'pending',
            paidAmount: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
            advancePayment: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
          },
        };
      } else {
        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
        };
      }

      // console.log('finalOrderData', finalOrderData);

      // Save Order to Appropriate Model
      // const saveData: any = {};
      const saveData = await this.orderModel.create(finalOrderData);

      this.updateProductQty(finalOrderData);

      const data = {
        _id: saveData._id,
        orderId: saveData.orderId,
        providerName: saveData.providerName,
        providerType: saveData.providerType,
      };

      // Ip Wise Order Limit And Block Time

      if (saveData && fSetting) {
        // ✅ Step 2: Count orders in last X minutes
        const isLimitEnabled =
          fSetting?.orderSetting?.isEnableIpWiseOrderLimitAndBlockTime;
        const limit = fSetting?.orderSetting?.ipWiseOrderLimit || 5;
        const blockDuration =
          fSetting?.orderSetting?.ipWiseOrderBlockTime || 1440; // in minutes
        let ipOrderCount = 0;

        if (isLimitEnabled) {
          const fromTime = new Date(Date.now() - blockDuration * 60 * 1000);
          ipOrderCount = await this.orderModel.countDocuments({
            shop,
            userIpAddress,
            createdAt: { $gte: fromTime },
            status: { $ne: 'trash' }, // skip deleted orders
          });
        }

        // ✅ Step 4: If limit exceeded, block IP
        if (isLimitEnabled && ipOrderCount >= limit) {
          const type = `Auto Block after ${ipOrderCount} orders`;
          await this.blockIp(saveData, blockDuration, type);
        }
      }

      // Clean Incomplete Order
      if (saveData && incompleteOrderId) {
        try {
          // console.log('Deleting Incomplete Order ID:', incompleteOrderId);
          const result =
            await this.incompleteOrderModel.findByIdAndDelete(
              incompleteOrderId,
            );
          if (result) {
            console.log('Incomplete order deleted successfully');
          } else {
            console.log('No incomplete order found with given ID');
          }
        } catch (error) {
          console.error('Error deleting incomplete order:', error.message);
        }
      }

      // Affiliate Sale Report generate

      if (affiliateId && affiliateProductId && finalOrderData) {
        await this.createAffiliateReport(finalOrderData);
      }

      // Save Address
      if (user && needSaveAddress) {
        const addressData: any = {
          addressType: addOrderByUserDto['addressType'],
          name: addOrderByUserDto.name,
          phoneNo: addOrderByUserDto.phoneNo,
          division: addOrderByUserDto.division,
          area: addOrderByUserDto['area'],
          zone: addOrderByUserDto['zone'],
          shippingAddress: addOrderByUserDto['shippingAddress'],
          isDefaultAddress: false,
        };

        const fUser = await this.userModel
          .findById(user._id)
          .select('addresses');

        const fAddress = fUser?.addresses.find(
          (f) => f.addressType === addOrderByUserDto['addressType'],
        );
        if (fAddress) {
          await this.userModel.findByIdAndUpdate(
            user._id,
            {
              $set: {
                'addresses.$[address]': {
                  ...addressData,
                  ...{ _id: fAddress._id },
                },
              },
            },
            { arrayFilters: [{ 'address._id': fAddress._id }] },
          );
        } else {
          if (fUser?.addresses && fUser?.addresses.length < 3) {
            await this.userModel.findByIdAndUpdate(
              user._id,
              {
                $push: { addresses: addressData },
              },
              { returnDocument: 'after' },
            );
          }
        }
      }

      // Provider wise response
      switch (data.providerName) {
        case 'Cash on Delivery':
          // Remove from Carts
          if (user) {
            await this.cartModel.deleteMany({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            });
          }

          // Sms Sending
          if (smsMethod && smsSendingOption && smsSendingOption.orderPlaced) {
            const smsSentConfig: SmsSentConfig = {
              providerName: smsMethod.providerName,
              smsSenderSecret: smsMethod.secretKey,
              smsSenderId: smsMethod.senderId,
              smsClientId: smsMethod.clientId,
              apiKey: smsMethod.apiKey,
              phoneNo: phoneNo,
              countryCode: smsMethod?.currency?.countryCode,
              message: `Thank you for shopping with ${fShopInfo?.domain}! Your order ${saveData.orderId} has been successfully placed.`,
            };
            this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
          }

          // Order Notification For Admin

          if (
            saveData &&
            fOrderNotification &&
            (fOrderNotification.isEnableSMSNotification ||
              fOrderNotification.isEnableEmailNotification)
          ) {
            this.orderNotificationForAdmin(
              saveData,
              fSetting,
              fOrderNotification,
            );
          }

          return {
            success: true,
            message: 'Success! Order place successfull.',
            data: data,
          } as ResponsePayload;

        case 'Bkash':
          if (user) {
            await this.cartModel.deleteMany({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            });
          }
          const fMethod = fPaymentMethods.find(
            (f) => f.providerName === 'Bkash',
          );
          if (fMethod && fMethod.providerType === 'api') {
            const bkashApiConfig: BkashApiConfig = {
              url: fMethod.production
                ? 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout'
                : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout',
              appKey: fMethod.apiKey,
              appSecret: fMethod.secretKey,
              username: fMethod.username,
              password: fMethod.password,
              production: fMethod.production,
              callbackURL: `${this.configService.get<string>('apiBaseUrl')}/api/order/callback-bkash-payment`,

              amount:
                finalOrderData.advancePayment &&
                finalOrderData.advancePayment > 0
                  ? finalOrderData.advancePayment
                  : finalOrderData.grandTotal,
              order_Id: saveData._id.toString(),
            };

            return this.payWithBkash(bkashApiConfig);
          } else {
            if (fMethod.providerType !== 'api') {
              if (
                saveData &&
                fOrderNotification &&
                (fOrderNotification.isEnableSMSNotification ||
                  fOrderNotification.isEnableEmailNotification)
              ) {
                this.orderNotificationForAdmin(
                  saveData,
                  fSetting,
                  fOrderNotification,
                );
              }
              return {
                success: true,
                message: 'Success! Order place with cash on delivery.',
                data: data,
              } as ResponsePayload;
            } else {
              return {
                success: false,
                message: 'Sorry! Payment method not found.',
                data: data,
              } as ResponsePayload;
            }
          }

        case 'Nagad':
          const fNagadMethod = fPaymentMethods.find(
            (f) => f.providerName === 'Nagad',
          );
          if (fNagadMethod.providerType !== 'api') {
            if (
              saveData &&
              fOrderNotification &&
              (fOrderNotification.isEnableSMSNotification ||
                fOrderNotification.isEnableEmailNotification)
            ) {
              this.orderNotificationForAdmin(
                saveData,
                fSetting,
                fOrderNotification,
              );
            }
            return {
              success: true,
              message: 'Success! Order place with cash on delivery.',
              data: data,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Payment method not found.',
              data: data,
            } as ResponsePayload;
          }

        case 'Rocket':
          if (user) {
            await this.cartModel.deleteMany({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            });
          }
          const fRocketMethod = fPaymentMethods.find(
            (f) => f.providerName === 'Rocket',
          );
          if (fRocketMethod.providerType !== 'api') {
            if (
              saveData &&
              fOrderNotification &&
              (fOrderNotification.isEnableSMSNotification ||
                fOrderNotification.isEnableEmailNotification)
            ) {
              this.orderNotificationForAdmin(
                saveData,
                fSetting,
                fOrderNotification,
              );
            }
            return {
              success: true,
              message: 'Success! Order place with cash on delivery.',
              data: data,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Payment method not found.',
              data: data,
            } as ResponsePayload;
          }

        case 'Binance':
          if (user) {
            await this.cartModel.deleteMany({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            });
          }
          const fBinanceMethod = fPaymentMethods.find(
            (f) => f.providerName === 'Binance',
          );
          if (fBinanceMethod.providerType !== 'api') {
            if (
              saveData &&
              fOrderNotification &&
              (fOrderNotification.isEnableSMSNotification ||
                fOrderNotification.isEnableEmailNotification)
            ) {
              this.orderNotificationForAdmin(
                saveData,
                fSetting,
                fOrderNotification,
              );
            }
            return {
              success: true,
              message: 'Success! Order place with cash on delivery.',
              data: data,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Payment method not found.',
              data: data,
            } as ResponsePayload;
          }

        // case 'Stripe': {
        //   const fStripeMethod = fPaymentMethods.find(
        //     (f) => f.providerName === 'Stripe',
        //   );
        //   if (!fStripeMethod || fStripeMethod.providerType !== 'api') {
        //     return {
        //       success: false,
        //       message: 'Stripe payment method not found.',
        //       data,
        //     };
        //   }
        //
        //   const totalAmount =
        //     finalOrderData.advancePayment && finalOrderData.advancePayment > 0
        //       ? finalOrderData.advancePayment
        //       : finalOrderData.grandTotal;
        //
        //   const stripeConfig = {
        //     secretKey: fStripeMethod.secretKey,
        //     production: fStripeMethod.production,
        //     amount: totalAmount,
        //     currency: fSetting?.currency?.code,
        //     orderId: saveData._id.toString(),
        //     baseUrl: this.configService.get<string>('apiBaseUrl'),

        //   };
        //
        //   return await this.payWithStripe(stripeConfig);
        // }
        case 'Stripe':
          // Remove from Carts
          if (user) {
            await this.cartModel.deleteMany({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            });
          }

          // Sms Sending
          if (smsMethod && smsSendingOption && smsSendingOption.orderPlaced) {
            const smsSentConfig: SmsSentConfig = {
              providerName: smsMethod.providerName,
              smsSenderSecret: smsMethod.secretKey,
              smsSenderId: smsMethod.senderId,
              smsClientId: smsMethod.clientId,
              apiKey: smsMethod.apiKey,
              phoneNo: phoneNo,
              countryCode: smsMethod?.currency?.countryCode,
              message: `Thank you for shopping with ${fShopInfo?.domain}! Your order ${saveData.orderId} has been successfully placed.`,
            };
            this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
          }

          // Order Notification For Admin

          if (
            saveData &&
            fOrderNotification &&
            (fOrderNotification.isEnableSMSNotification ||
              fOrderNotification.isEnableEmailNotification)
          ) {
            this.orderNotificationForAdmin(
              saveData,
              fSetting,
              fOrderNotification,
            );
          }

          return {
            success: true,
            message: 'Success! Order place successfull.',
            data: data,
          } as ResponsePayload;

        case 'SSl Commerz':
          const fMethodSSL = fPaymentMethods.find(
            (f) => f.providerName === 'SSl Commerz',
          );
          if (fMethodSSL && fMethodSSL.providerType === 'api') {
            const sslBaseURL = `https://${
              fMethodSSL.production ? 'securepay' : 'sandbox'
            }.sslcommerz.com`;

            const callBackBaseUrlSsl = this.configService.get<string>('apiBaseUrl');

            const sslCommerzInit: SslCommerzInit = {
              baseUrl: sslBaseURL,
              store_id: fMethodSSL.username,
              store_passwd: fMethodSSL.password,
              tran_id: saveData._id.toString(),
              total_amount:
                finalOrderData.advancePayment &&
                finalOrderData.advancePayment > 0
                  ? finalOrderData.advancePayment
                  : finalOrderData.grandTotal,
              currency: 'BDT',
              // ipn_url: `${callBackBaseUrlSsl}/api/order/callback-ssl-commerz-payment`,
              success_url: `${callBackBaseUrlSsl}/api/order/callback-ssl-commerz-payment?status=VALID&tran_id=${saveData._id.toString()}`,
              fail_url: `${callBackBaseUrlSsl}/api/order/callback-ssl-commerz-payment?status=FAILED&tran_id=${saveData._id.toString()}`,
              cancel_url: `${callBackBaseUrlSsl}/api/order/callback-ssl-commerz-payment?status=CANCELLED&tran_id=${saveData._id.toString()}`,
              shipping_method: 'Courier',

              // Product
              product_name: 'E-commerce webiste product',
              product_category: 'E-commerce',
              product_profile: 'general',

              // Customer
              cus_name: finalOrderData?.name ?? 'Unknown',
              cus_email: finalOrderData?.email ?? 'saleecom.client@gmail.com',
              cus_add1: finalOrderData?.shippingAddress ?? 'Dhaka',
              cus_add2: '',
              cus_city: finalOrderData?.division ?? 'Dhaka',
              cus_state: '',
              cus_postcode: finalOrderData?.area ?? 'Dhaka',
              cus_country: 'Bangladesh',
              cus_phone: finalOrderData?.phoneNo ?? '01773253900',
              cus_fax: '',

              // Shipping
              ship_name: 'Default',
              ship_add1: finalOrderData?.shippingAddress ?? 'Dhaka',
              ship_add2: '',
              ship_city: finalOrderData?.division ?? 'Dhaka',
              ship_state: '',
              ship_postcode: finalOrderData?.division ?? 'Dhaka',
              ship_country: 'Bangladesh',
            };
            return this.payWithSslCommerz(sslCommerzInit);
          } else {
            if (fMethodSSL.providerType !== 'api') {
              return {
                success: true,
                message: 'Success! Order place with cash on delivery.',
                data: data,
              } as ResponsePayload;
            } else {
              return {
                success: false,
                message: 'Sorry! Payment method not found.',
                data: data,
              } as ResponsePayload;
            }
          }

        default:
          return {
            success: true,
            message: 'Success! order placed successfully.',
            data: data,
          } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async addOrderByAnonymous(
    shop: string,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    return this.addOrderByUser(shop, null, addOrderByUserDto, userIpAddress);
  }

  async addIncompleteOrderByAnonymous(
    shop: string,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    return this.addIncompleteOrderByUser(
      shop,
      null,
      addOrderByUserDto,
      userIpAddress,
    );
  }

  async addIncompleteOrderByUser(
    shop: string,
    user: User,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    try {
      const {
        division,
        deliveryType,
        phoneNo,
        carts,
        cartData,
        orderType,
        userOffer,
        needSaveAddress,
        advancePayment,
        coupon,
      } = addOrderByUserDto;

      let cartItems: any[] = [];

      if (!user) {
        const fProducts = JSON.parse(
          JSON.stringify(
            await this.productModel.find({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            }),
          ),
        );

        if (fProducts && fProducts.length) {
          cartItems = cartData.map((t1) => ({
            ...t1,
            ...{ product: fProducts.find((t2) => t2._id === t1.product) },
          }));
        }
      } else {
        cartItems = JSON.parse(
          JSON.stringify(
            await this.cartModel
              .find({ _id: { $in: carts } })
              .populate(
                'product',
                '_id name slug images category isVariation variationList variation2Options variation2 variationOptions subCategory childCategory brand regularPrice salePrice costPrice variation model minimumWholesaleQuantity deliveryCharge advancePayment',
              ),
          ),
        );
      }

      // Set Auth User if Have
      if (user) {
        addOrderByUserDto.user = user._id;
      }

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'deliveryCharges currency country productSetting smsSendingOption smsMethods paymentMethods offers orderNotification advancePayment -_id',
        );

      //Product Setting
      const fProductSetting = fSetting?.productSetting ?? {};

      // Delivery Charges
      const fDeliveryCharges = fSetting?.deliveryCharges ?? [];
      const deliveryCharges = fDeliveryCharges.filter(
        (f) => f.status === 'active',
      );

      // Shop Data
      const fShopInfo = await this.shopModel
        .findById(shop)
        .select('domain subDomain users');

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      // Payment Providers
      const fPaymentMethods = fSetting?.paymentMethods ?? [];

      const products = this.getOrderItems(cartItems);
      const orderIdUnique = await this.getUniqueIncompleteOrderId(shop);

      let offerDiscount: any;
      if (user && userOffer) {
        const fOffers = fSetting?.offers ?? [];
        offerDiscount = await this.offerDiscountAmount({
          offersSetting: fOffers,
          user: user,
          subTotal: this.cartSaleSubTotal(cartItems),
          userOffer: userOffer,
        });
      }

      // Previous Order Counts

      let previousOrderCounts: number = 0;

      if (phoneNo) {
        previousOrderCounts = await this.incompleteOrderModel.countDocuments({
          shop,
          phoneNo,
          status: { $ne: 'trash' },
        });
      }

      // Coupon Calculation

      let couponDiscount: number;

      if (coupon) {
        const couponData: any = await this.couponModel.findOne({
          _id: coupon,
          shop,
        });

        if (couponData) {
          if (couponData.discountType === DiscountTypeEnum.PERCENTAGE) {
            couponDiscount = Math.floor(
              (couponData.discountAmount / 100) *
                this.cartSaleSubTotal(cartItems),
            );
          } else if (couponData.discountType === DiscountTypeEnum.CASH) {
            couponDiscount = Math.floor(couponData.discountAmount);
          } else {
            couponDiscount = 0;
          }
        }
      }

      // const finalDeliveryCharge = this.getDeliveryCharge(
      //   deliveryCharges,
      //   division,
      //   deliveryType,
      //   cartItems,
      // );

      const { deliveryCharge: finalDeliveryCharge, isInsideCity } =
        this.getDeliveryCharge(
          deliveryCharges,
          division,
          deliveryType,
          cartItems,
        );

      // const { total: deliveryChargeTotal, hasZero: hasZeroDeliveryCharge } =
      //   this.cartDeliveryChargeTotal(cartItems);

      const { total: deliveryChargeTotal, hasZero: hasZeroDeliveryCharge } =
        this.getCartDeliveryChargeTotal(cartItems, isInsideCity);

      const orderSensitiveData: any = {
        shop: shop,
        carts: carts,
        orderId: orderIdUnique,
        orderedFrom: 'website',
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        checkoutDate: this.utilsService.getDateString(new Date()),
        checkoutTime: this.utilsService.getCurrentTime(),
        month: this.utilsService.getDateMonth(new Date(), false),
        year: this.utilsService.getDateYear(new Date()),
        orderTimeline: {
          pending: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        },
        subTotal: this.cartRegularSubTotal(cartItems),
        discount: this.cartDiscountAmount(cartItems),
        deliveryCharge: fProductSetting.isEnableDeliveryCharge
          ? hasZeroDeliveryCharge
            ? deliveryChargeTotal + finalDeliveryCharge
            : deliveryChargeTotal
          : finalDeliveryCharge,
        offerDiscount: offerDiscount,
        grandTotal: this.getOrderGrandTotal(
          cartItems,
          fProductSetting.isEnableDeliveryCharge
            ? hasZeroDeliveryCharge
              ? deliveryChargeTotal + finalDeliveryCharge
              : deliveryChargeTotal
            : finalDeliveryCharge,
          offerDiscount,
          couponDiscount,
        ),
        orderedItems: products,
        coupon: coupon ?? null,
        couponDiscount: couponDiscount ?? 0,
        previousOrderCount: previousOrderCounts ?? 0,
        userIpAddress: userIpAddress ?? null,
      };

      let finalOrderData: any;

      if (advancePayment && advancePayment > 0) {
        // Advance Payment
        const advancePaymentData: any[] =
          fSetting?.advancePayment && fSetting?.advancePayment.length
            ? fSetting?.advancePayment.filter((f) => f.status === 'active')
            : [];

        const cartSaleSubTotal = this.cartSaleSubTotal(cartItems);

        const finalAdvancePaymentAmount = this.getAdvancePaymentAmount(
          advancePaymentData,
          division,
          fProductSetting.isEnableDeliveryCharge
            ? hasZeroDeliveryCharge
              ? deliveryChargeTotal + finalDeliveryCharge
              : deliveryChargeTotal
            : finalDeliveryCharge,
          cartSaleSubTotal,
        );

        const { total: advancePaymentTotal, hasZero: hasZeroAdvancePayment } =
          this.cartAdvancePaymentTotal(cartItems);

        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
          ...{
            advancePaymentStatus: 'pending',
            paidAmount: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
            advancePayment: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
          },
        };
      } else {
        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
        };
      }

      // const saveData = await this.orderModel.create(finalOrderData);
      // Save Order to Appropriate Model
      // const saveData: any = {}
      const saveData = await this.incompleteOrderModel.create(finalOrderData);

      const data = {
        _id: saveData._id,
        orderId: saveData.orderId,
        providerName: saveData.providerName,
        providerType: saveData.providerType,
      };

      return {
        success: true,
        message: 'Success! Incomplete Order place.',
        data: data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllOrderByShop(
    vendor: Vendor,
    shop: string,
    filterAndPaginationOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
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

      // Modify Filter
      const { filter } = filterAndPaginationOrderDto;
      filterAndPaginationOrderDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllOrders(filterAndPaginationOrderDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllIncompleteOrderByShop(
    vendor: Vendor,
    shop: string,
    filterAndPaginationOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
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

      // Modify Filter
      const { filter } = filterAndPaginationOrderDto;
      filterAndPaginationOrderDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllIncompleteOrders(
        filterAndPaginationOrderDto,
        searchQuery,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserDataByPhoneNo(
    shop: string,
    getUserByIdsDto: GetUserByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.orderModel
        .findOne({ phoneNo: getUserByIdsDto.phoneNo, shop: shop })
        .select('phone shippingAddress');

      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllOrderByUser(
    user: User,
    shop: string,
    filterAndPaginationOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      const userData = await this.userModel.findById(user._id);

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      let { filter } = filterAndPaginationOrderDto;

      filter = {
        ...filter,
        ...{
          shop: shop,
          $or: [
            { user: user._id }, // Matches if user is provided
            { phoneNo: userData?.phoneNo }, // Matches if phoneNo is provided
          ],
        },
      };

      // Add user filter if user ID is provided
      // if (user?._id) {
      //   filter.user = user._id;
      // }
      //
      // // console.log('phoneNo',phoneNo);
      // // Add phone number filter if provided
      // if (phoneNo) {
      //   filter.phoneNo = phoneNo;
      // }

      filterAndPaginationOrderDto.filter = filter;
      // Modify Filter
      // const { filter } = filterAndPaginationOrderDto;
      // filterAndPaginationOrderDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllOrders(filterAndPaginationOrderDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllOrders(
    filterOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterOrderDto;
    const { pagination } = filterOrderDto;
    const { sort } = filterOrderDto;
    const { select } = filterOrderDto;

    // Essential Variables
    const aggregatesOrders = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['user']) {
        filter['user'] = new ObjectId(filter['user']);
      }

      if (!filter['user'] && filter['phoneNo']) {
        mFilter['phoneNo'] = filter['phoneNo'];
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }

      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { orderId: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
              { email: { $regex: searchQuery, $options: 'i' } },
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
      mSelect = {
        name: 1,
      };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregatesOrders.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregatesOrders.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregatesOrders.push({ $project: mSelect });
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

      aggregatesOrders.push(mPagination);

      aggregatesOrders.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.orderModel.aggregate(aggregatesOrders);
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
        throw new BadRequestException('Error! Orderion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllIncompleteOrders(
    filterOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterOrderDto;
    const { pagination } = filterOrderDto;
    const { sort } = filterOrderDto;
    const { select } = filterOrderDto;

    // Essential Variables
    const aggregatesOrders = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['user']) {
        filter['user'] = new ObjectId(filter['user']);
      }

      if (!filter['user'] && filter['phoneNo']) {
        mFilter['phoneNo'] = filter['phoneNo'];
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { orderId: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
              { email: { $regex: searchQuery, $options: 'i' } },
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
      mSelect = {
        name: 1,
      };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregatesOrders.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregatesOrders.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregatesOrders.push({ $project: mSelect });
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

      aggregatesOrders.push(mPagination);

      aggregatesOrders.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates =
        await this.incompleteOrderModel.aggregate(aggregatesOrders);
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
        throw new BadRequestException('Error! Orderion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllOrdersByUser(
    shop: string,
    user: User,
    filterOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      let { filter } = filterOrderDto;
      filter = {
        ...filter,
        ...{
          shop: shop,
          user: { $ne: null, $eq: user._id },
        },
      };
      // if (user && user._id) {
      //   // If user ID exists, filter by user ID
      //   filter.user = user._id;
      // } else if (filter.phoneNo) {
      //   // If user ID is null, filter by phoneNo if provided
      //   filter.user = null;
      //   // filter.phoneNo = filter.phoneNo;
      // }
      // if (user?._id) {
      //   filter.user = user._id;
      // }

      // Add phone number filter if provided
      // if (phoneNo) {
      //   filter.phoneNo = phoneNo;
      // }

      filterOrderDto.filter = filter;
      return this.getAllOrders(filterOrderDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getOrderById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.orderModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success! Order fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getIncompleteOrderById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.incompleteOrderModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success! Order fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getOrderByOrderId(
    shop: string,
    orderId: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const data = await this.orderModel
        .findOne({ shop: shop, orderId: orderId })
        .select(select);
      return {
        success: true,
        message: 'Success! Order fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async checkFraudOrder(
    shop: string,
    phoneNo: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const fShop = await this.shopModel.findById(shop);
      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! no shop found',
        } as ResponsePayload;
      }

      if (fShop.fraudCheckDate) {
        const isSameDay = this.utilsService.isSameDay(
          new Date(fShop.fraudCheckDate),
        );
        if (isSameDay) {
          if (fShop.todayFraudCheckCount >= FRAUD_CHECK_DAILY_LIMIT) {
            return {
              success: false,
              message: `Daily limit of ${FRAUD_CHECK_DAILY_LIMIT} status checks exceeded`,
            } as ResponsePayload;
          }
          fShop.todayFraudCheckCount += 1;
        } else {
          // New day
          fShop.todayFraudCheckCount = 1;
          fShop.fraudCheckDate = this.utilsService.getDateString(new Date());
        }
      } else {
        fShop.todayFraudCheckCount = 1;
        fShop.fraudCheckDate = this.utilsService.getDateString(new Date());
      }

      await fShop.save();

      const data = await this.courierService.checkFraudOrder(phoneNo);
      return {
        success: true,
        message: 'Success!',
        data: data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateOrderById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderStatus, advancePaymentStatus } = updateOrderDto;

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

      await this.orderModel.findByIdAndUpdate(id, {
        $set: updateOrderDto,
      });

      // Setting Data
      const fSetting: any = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods orderSetting courierMethods productSetting -_id',
        );

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      if (orderStatus) {
        await this.adjustDataOnOrderStatusUpdate({
          order_id: id,
          orderStatus: orderStatus,
          smsMethod: smsMethod,
          smsSendingOption: smsSendingOption,
          fProductSetting: fProductSetting,
        });

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: orderStatus,
          courierMethod: courierMethod,
          id: id,
        });
      }

      // IP Block Logic here
      if (fSetting.orderSetting.isEnableSingleIpBlock) {
        const fOrder: any = await this.orderModel.findById(id);
        if (fOrder.userIpAddress) {
          const durationMinutes = this.getDurationInMinutes(
            updateOrderDto.blockTime,
          ); // ← ফ্রন্টএন্ড থেকে পাঠানো blockTime
          await this.blockIp(fOrder, durationMinutes, updateOrderDto.blockTime);
        }
      }

      // Log Report Create with no await
      // const orderData = JSON.parse(
      //   JSON.stringify(await this.orderModel.findById(id)),
      // );
      // this.logReportService.createLogReport({
      //   collectionName: 'Update order',
      //   type: 'update',
      //   description: `Update order. Order Id is ${orderData?.orderId} `,
      //   vendor: {
      //     _id: vendor?._id,
      //     username: vendor?.username,
      //   },
      //   shop: shop,
      // });

      return {
        success: true,
        message: 'Success! Order updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateOrderUserById(
    user: User,
    shop: string,
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderStatus } = updateOrderDto;

      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const orderData = JSON.parse(
        JSON.stringify(await this.orderModel.findById(id)),
      );
      const orderTimeline = orderData.orderTimeline;

      if (orderStatus === 'cancel') {
        orderTimeline.cancelled = {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        };

        // Sent Notification
        // this.notificationService.createNotification({
        //   name: 'Order cancel.',
        //   description: `A order cancelled. Order ID #${orderData?.orderId}`,
        //   url: `/sales/order-details/${orderData._id}`,
        //   isRead: false,
        // });
      }

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods courierMethods productSetting -_id',
        );

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      if (orderStatus === 'cancel') {
        await this.adjustDataOnOrderStatusUpdate({
          order_id: id,
          orderStatus: orderStatus,
          smsMethod: smsMethod,
          smsSendingOption: smsSendingOption,
          fProductSetting: fProductSetting,
        });

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: orderStatus,
          courierMethod: courierMethod,
          id: id,
        });
      }

      const mData = {
        ...updateOrderDto,
        ...{
          orderTimeline: orderTimeline,
        },
      };
      await this.orderModel.findByIdAndUpdate(id, {
        $set: mData,
      });

      return {
        success: true,
        message: 'Success! Order updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateIncompleteOrderById(
    shop: string,
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderStatus, cartData, carts } = updateOrderDto;

      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }
      let cartItems: any[] = [];

      if (carts && carts.length > 0 && cartData && cartData.length > 0) {
        const fProducts = JSON.parse(
          JSON.stringify(
            await this.productModel.find({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            }),
          ),
        );

        if (fProducts && fProducts.length) {
          cartItems = cartData.map((t1) => ({
            ...t1,
            ...{ product: fProducts.find((t2) => t2._id === t1.product) },
          }));
        }
      }

      const products = this.getOrderItems(cartItems);

      // console.log('updateOrderDto', updateOrderDto);
      // console.log('products', products);

      const mData = {
        ...updateOrderDto,
        ...{
          orderedItems: products,
        },
      };
      await this.incompleteOrderModel.findByIdAndUpdate(id, {
        $set: mData,
      });

      return {
        success: true,
        message: 'Success! Incomplete Order updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleOrderById(
    vendor: Vendor,
    shop: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { ids, orderStatus } = updateOrderDto;
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

      const mIds = ids.map((m) => new ObjectId(m));

      await this.orderModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateOrderDto },
      );

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods productSetting courierMethods -_id',
        );

      // console.log("Multiple Order shop",shop);
      // console.log("Multiple Order fSetting",fSetting);

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      if (orderStatus) {
        // Courier Manage
        this.addMultipleOrderToCourier({
          orderStatus: orderStatus,
          courierMethod: courierMethod,
          mIds: mIds,
        });

        for (const id of mIds) {
          await this.adjustDataOnOrderStatusUpdate({
            order_id: id,
            orderStatus: orderStatus,
            smsMethod: smsMethod,
            smsSendingOption: smsSendingOption,
            fProductSetting: fProductSetting,
          });
        }
      }

      return {
        success: true,
        message: 'Success! multiple order updated.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTrashOrder(
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

      await this.orderModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
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

      await this.orderModel.deleteMany({ shop: shop, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleOrderByIdByVendor(
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

      await this.orderModel.updateMany(
        { _id: ids },
        {
          $set: {
            status: 'trash',
            deleteDateString: this.utilsService.getDateString(new Date()),
          },
        },
      );

      for (const id of ids) {
        // Log Report Create with no await
        const orderData = JSON.parse(
          JSON.stringify(await this.orderModel.findById(id)),
        );
        this.logReportService.createLogReport({
          collectionName: 'Delete order for Trash',
          type: 'update',
          description: `Delete order for Trash. Order Id is ${orderData?.orderId} `,
          vendor: {
            _id: vendor?._id,
            username: vendor?.username,
          },
          shop: shop,
        });
      }
      return {
        success: true,
        message: 'Success! Order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleIncompleteOrderById(
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

      await this.incompleteOrderModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! Order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleOrdersById(
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

      await this.orderModel.deleteMany({ _id: ids });

      // for (const id of ids) {
      //   // Log Report Create with no await
      //   const orderData = JSON.parse(
      //     JSON.stringify(await this.orderModel.findById(id)),
      //   );
      //   this.logReportService.createLogReport({
      //     collectionName: 'Delete order',
      //     type: 'update',
      //     description: `Delete order. Order Id is ${orderData?.orderId} `,
      //     vendor: {
      //       _id: vendor?._id,
      //       username: vendor?.username,
      //     },
      //     shop: shop,
      //   });
      // }
      return {
        success: true,
        message: 'Success! Order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleOrderById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.orderModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success! multiple order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Invoice Methods
   * generateInvoiceById()
   */

  async generateInvoiceById(
    shop: string,
    vendor: Vendor,
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

      const fShopInfo = await this.shopInformationModel.findOne({
        shop: shop,
      });

      const fOrderData = JSON.parse(
        JSON.stringify(await this.orderModel.findById(id)),
      );

      // Shop Data
      const fShopDomain = await this.shopModel
        .findById(shop)
        .select('domain subDomain');

      const invoiceData = {
        _id: fOrderData._id,
        shopLogo: fShopInfo.logoPrimary,
        signatureImage: null,
        shopName: fShopInfo.websiteName,
        color: fShopInfo.color,
        shopPhoneNo: fShopInfo.phones.length ? fShopInfo.phones[0].value : '-',
        shopWhatsappNo: fShopInfo.whatsappNumber ?? '-',
        shopAddress: fShopInfo.addresses.length
          ? fShopInfo.addresses[0].value
          : '-',
        shopEmail: fShopInfo.emails.length ? fShopInfo.emails[0].value : '-',
        orderId: fOrderData.orderId,
        customerId: null,
        name: fOrderData.name,
        phoneNo: fOrderData.phoneNo,
        address: fOrderData.addresses,
        additionalDiscount: fOrderData.additionalDiscount,
        shippingAddress: fOrderData.shippingAddress,
        domain: fShopDomain.domain,
        date: fOrderData?.checkoutDate,
        paymentStatus: fOrderData?.paymentStatus,
        subTotal: fOrderData.subTotal,
        discount: fOrderData.discount,
        deliveryCharge: fOrderData.deliveryCharge,
        grandTotal: fOrderData.grandTotal,
        items: fOrderData.orderedItems,
        couponDiscount: fOrderData.couponDiscount,
        deliveryNote: fOrderData.deliveryNote,
        paymentType: fOrderData.paymentType,
        paidAmount: fOrderData.paidAmount,
        advancePaymentStatus: fOrderData.advancePaymentStatus,
        advancePayment: fOrderData.advancePayment,
      };

      return {
        success: true,
        message: 'Success',
        data: invoiceData,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async generateInvoiceUserById(
    shop: string,
    vendor: Vendor,
    id: string,
  ): Promise<ResponsePayload> {
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

      const fShopInfo = await this.shopInformationModel.findOne({
        shop: shop,
      });

      const fOrderData = JSON.parse(
        JSON.stringify(await this.orderModel.findById(id)),
      );

      // Shop Data
      const fShopDomain = await this.shopModel
        .findById(shop)
        .select('domain subDomain');

      const invoiceData = {
        _id: fOrderData._id,
        shopLogo: fShopInfo.logoPrimary,
        signatureImage: null,
        shopName: fShopInfo.websiteName,
        color: fShopInfo.color,
        shopPhoneNo: fShopInfo.phones.length ? fShopInfo.phones[0].value : '-',
        shopWhatsappNo: fShopInfo.whatsappNumber ?? '-',
        shopAddress: fShopInfo.addresses.length
          ? fShopInfo.addresses[0].value
          : '-',
        shopEmail: fShopInfo.emails.length ? fShopInfo.emails[0].value : '-',
        orderId: fOrderData.orderId,
        customerId: null,
        name: fOrderData.name,
        phoneNo: fOrderData.phoneNo,
        address: fOrderData.addresses,
        shippingAddress: fOrderData.shippingAddress,
        domain: fShopDomain.domain,
        date: fOrderData?.checkoutDate,
        paymentStatus: fOrderData?.paymentStatus,
        subTotal: fOrderData.subTotal,
        discount: fOrderData.discount,
        deliveryCharge: fOrderData.deliveryCharge,
        couponDiscount: fOrderData.couponDiscount,
        grandTotal: fOrderData.grandTotal,
        items: fOrderData.orderedItems,
      };

      return {
        success: true,
        message: 'Success',
        data: invoiceData,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * PRIVATE METHODS
   * adjustDataOnOrderStatusUpdate()
   * adjustProductQuantityOnOrderStatus()
   */

  private async adjustDataOnOrderStatusUpdate(data: {
    order_id: any;
    orderStatus: string;
    smsMethod?: any;
    smsSendingOption?: any;
    fProductSetting?: any;
  }) {
    const {
      order_id,
      orderStatus,
      smsMethod,
      smsSendingOption,
      fProductSetting,
    } = data;
    const fOrder = await this.orderModel
      .findById(order_id)
      .select(
        'orderTimeline orderedItems phoneNo orderId email shop phoneNo name ',
      );
    // console.log('fOrder', fOrder);
    let orderTimeline: any;
    switch (orderStatus) {
      case 'pending':
        orderTimeline = {
          pending: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        if (fOrder.adjustProductQuantity) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'pending',
          );
        }
        break;

      case 'confirmed':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        if (fOrder.adjustProductQuantity) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'confirmed',
          );
        }

        // Sms Sending
        if (smsMethod && smsSendingOption && smsSendingOption.orderConfirmed) {
          const smsSentConfig: SmsSentConfig = {
            providerName: smsMethod.providerName,
            smsSenderSecret: smsMethod.secretKey,
            smsSenderId: smsMethod.senderId,
            smsClientId: smsMethod.clientId,
            apiKey: smsMethod.apiKey,
            phoneNo: fOrder?.phoneNo,
            countryCode: smsMethod?.currency?.countryCode,
            message: `Your order ${fOrder?.orderId} has been confirmed. Thank you for shopping with us!`,
          };

          this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
        }

        break;
      case 'on_hold':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        if (fOrder.adjustProductQuantity) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'on_hold',
          );
        }
        break;
      case 'processing':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        if (fOrder.adjustProductQuantity) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'processing',
          );
        }
        break;
      case 'sent to courier':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          'sent to courier': {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        if (fOrder.adjustProductQuantity) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'sent to courier',
          );
        }
        break;
      case 'shipped':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          shipped: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        if (fOrder.adjustProductQuantity) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'shipped',
          );
        }
        break;

      case 'delivered':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          shipped: fOrder.orderTimeline.shipped ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          delivered: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };

        await this.orderModel.findByIdAndUpdate(order_id, {
          $set: {
            paymentStatus: 'paid',
          },
        });

        // Adjust Quantity
        // if (fOrder.adjustProductQuantity) {
        await this.adjustProductQuantityOnOrderStatus(
          fOrder._id,
          JSON.parse(JSON.stringify(fOrder.orderedItems)),
          '-',
          '+',
          true,
          'delivered',
        );
        // }

        // Sms Sending
        if (smsMethod && smsSendingOption && smsSendingOption.orderDelivered) {
          const smsSentConfig: SmsSentConfig = {
            providerName: smsMethod.providerName,
            smsSenderSecret: smsMethod.secretKey,
            smsSenderId: smsMethod.senderId,
            smsClientId: smsMethod.clientId,
            apiKey: smsMethod.apiKey,
            phoneNo: fOrder?.phoneNo,
            countryCode: smsMethod?.currency?.countryCode,
            message: `Your order ${fOrder?.orderId} has been delivered. Thank you for shopping with us!`,
          };
          this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
        }
        // Email Sending
        if (
          fOrder?.email &&
          fProductSetting?.productType === 'digitalProduct'
        ) {
          this.emailSendForPurchaseDigitalProductLinks(fOrder);
        }

        break;
      case 'returned':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          shipped: fOrder.orderTimeline.shipped ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          delivered: fOrder.orderTimeline.delivered ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          returned: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        // if (fOrder.adjustProductQuantity) {
        await this.adjustProductQuantityOnOrderStatus(
          fOrder._id,
          JSON.parse(JSON.stringify(fOrder.orderedItems)),
          '+',
          '-',
          false,
          'returned',
        );
        // }
        break;
      case 'refunded':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          shipped: fOrder.orderTimeline.shipped ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          delivered: fOrder.orderTimeline.delivered ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          returned: fOrder.orderTimeline.returned ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          refunded: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        // if (fOrder.adjustProductQuantity) {
        await this.adjustProductQuantityOnOrderStatus(
          fOrder._id,
          JSON.parse(JSON.stringify(fOrder.orderedItems)),
          '+',
          '-',
          false,
          'refunded',
        );
        // }
        break;
      case 'cancelled':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? null,
          confirmed: fOrder.orderTimeline.confirmed ?? null,
          onHold: fOrder.orderTimeline.onHold ?? null,
          processing: fOrder.orderTimeline.processing ?? null,
          shipped: fOrder.orderTimeline.shipped ?? null,
          delivered: fOrder.orderTimeline.delivered ?? null,
          returned: fOrder.orderTimeline.returned ?? null,
          cancelled: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        // if (fOrder.adjustProductQuantity) {
        await this.adjustProductQuantityOnOrderStatus(
          fOrder._id,
          JSON.parse(JSON.stringify(fOrder.orderedItems)),
          '+',
          '-',
          false,
          'cancelled',
        );
        // }

        // Sms Sending
        if (smsMethod && smsSendingOption && smsSendingOption.orderCanceled) {
          const smsSentConfig: SmsSentConfig = {
            providerName: smsMethod.providerName,
            smsSenderSecret: smsMethod.secretKey,
            smsSenderId: smsMethod.senderId,
            smsClientId: smsMethod.clientId,
            apiKey: smsMethod.apiKey,
            phoneNo: fOrder?.phoneNo,
            countryCode: smsMethod?.currency?.countryCode,
            message: `Your order ${fOrder?.orderId} has been cancelled. Thank you for shopping with us!`,
          };
          this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
        }
        break;
    }

    await this.orderModel.findByIdAndUpdate(order_id, {
      $set: {
        orderTimeline: orderTimeline,
      },
    });

    // console.log(orderTimeline);
  }

  async emailSendForPurchaseDigitalProductLinks(fOrder: any) {
    // Make drive links array
    const driveLinks: any = await this.extractDriveLinksFromOrder(fOrder);

    const shopData: any = await this.shopModel
      .findById(fOrder.shop)
      .select('domain');
    const shopInformationData: any = await this.shopInformationModel
      .findOne({ shop: fOrder.shop })
      .select('logoPrimary');

    // console.log("fOrder.email",fOrder.email);

    if (fOrder.email && driveLinks && driveLinks.length) {
      //  Email html
      const html = `
       <div style="width: 450px; font-family: Helvetica, Arial, sans-serif; border: 1px solid #e2e2e2; border-radius: 6px; overflow: hidden;">
       <div style="padding: 15px 20px; background: #fff;">
        <img src="${shopInformationData.logoPrimary ?? ''}" alt="" width="70" style="margin-bottom: 10px;" loading="lazy"/>
         <h2 style="margin: 0 0 10px;">Hello, ${fOrder.name}</h2>

      <p style="margin: 4px 0;"><strong>Phone No:</strong> ${fOrder.phoneNo}</p>
      <p style="margin: 4px 0;"><strong>Order No:</strong> ${fOrder.orderId}</p>
      <p style="margin: 4px 0;"><strong>Website:</strong> <a href="${shopData.domain}" style="color: #2563eb; text-decoration: none;" target="_blank">${shopData.domain}</a></p>

      <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;" />

      <div>
        <h4 style="margin: 0 0 10px;">Your Product Links:</h4>
        ${driveLinks
          .map(
            (item) => `
              <p style="margin-bottom: 6px;"><strong>Product:</strong> ${item.productName}</p>
              ${item.driveLinks
                .map(
                  (link) =>
                    `<p style="margin: 2px 0;"><strong>${link.name}:</strong> <a href="${link.value}" style="color: #2563eb;" target="_blank">${link.value}</a></p>`,
                )
                .join('')}
            `,
          )
          .join('')}
      </div>

      <div style="margin-top: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">Thank you for shopping with us! If you have any questions, feel free to contact our support team.</p>
      </div>
      </div>
     </div>
     `;

      this.emailService.sendEmail(
        fOrder.email,
        `Your order has been delivered and order id #${fOrder.orderId}`,
        html,
        shopData,
      );
    } else {
      //  Email html
      const html = `
       <div style="width: 450px; font-family: Helvetica, Arial, sans-serif; border: 1px solid #e2e2e2; border-radius: 6px; overflow: hidden;">
       <div style="padding: 15px 20px; background: #fff;">
        <img src="${shopInformationData.logoPrimary ?? ''}" alt="" width="70" style="margin-bottom: 10px;" loading="lazy"/>
         <h2 style="margin: 0 0 10px;">Hello, ${fOrder.name}</h2>

      <p style="margin: 4px 0;"><strong>Phone No:</strong> ${fOrder.phoneNo}</p>
      <p style="margin: 4px 0;"><strong>Order No:</strong> ${fOrder.orderId}</p>
      <p style="margin: 4px 0;"><strong>Website:</strong> <a href="${shopData.domain}" style="color: #2563eb; text-decoration: none;" target="_blank">${shopData.domain}</a></p>

      <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;" />


      <div style="margin-top: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">Thank you for shopping with us! If you have any questions, feel free to contact our support team.</p>
      </div>
      </div>
     </div>
     `;

      this.emailService.sendEmail(
        fOrder.email,
        `Your order has been delivered and order id #${fOrder.orderId}`,
        html,
        shopData,
      );
    }
  }

  async extractDriveLinksFromOrder(order: any) {
    if (!order) {
      return {};
    }

    const driveLinks = [];

    for (const item of order.orderedItems) {
      const product = await this.productModel.findById(item.product).lean();

      if (
        product &&
        Array.isArray(product.driveLinks) &&
        product.driveLinks.length > 0
      ) {
        driveLinks.push({
          productId: product._id,
          productName: product.name,
          driveLinks: product.driveLinks.map((link) => ({
            name: link.name,
            value: link.value,
          })),
        });
      }
    }

    return driveLinks;
  }

  private async adjustProductQuantityOnOrderStatus(
    order_id: any,
    orderedItems: any[],
    qtyIncrementType: '-' | '+',
    soldIncrementType: '-' | '+',
    adjustQty: boolean,
    orderStatus: any,
  ) {
    // console.log(order_id, orderedItems);
    for (const item of orderedItems) {
      const qty = item.selectedQuantity ?? item.quantity ?? 0; // fallback fix

      if (item.variation) {
        try {
          await this.productModel.updateOne(
            {
              _id: new ObjectId(item.product),
              'variationList._id': new ObjectId(item.variation._id),
            },
            {
              $inc: {
                'variationList.$[e1].quantity':
                  qtyIncrementType === '-' ? -qty : qty,
                totalSold:
                  orderStatus !== 'delivered'
                    ? soldIncrementType === '-'
                      ? -qty
                      : qty
                    : 0,
              },
            },
            {
              arrayFilters: [{ 'e1._id': new ObjectId(item.variation._id) }],
            },
          );
        } catch (err) {
          console.log(err);
        }
      } else {
        await this.productModel.findByIdAndUpdate(item.product, {
          $inc: {
            quantity:
              orderStatus !== 'delivered'
                ? qtyIncrementType === '-'
                  ? -qty
                  : qty
                : 0,
            totalSold: soldIncrementType === '-' ? -qty : qty,
          },
        });
      }
    }
    await this.orderModel.findByIdAndUpdate(order_id, {
      $set: {
        adjustProductQuantity: adjustQty,
      },
    });
  }

  /**
   * Courier Methods
   * addSingleOrderToCourier()
   * addMultipleOrderToCourier()
   */

  private async addSingleOrderToCourier(data: {
    orderStatus: string;
    courierMethod: any;
    id: string;
  }) {
    const { orderStatus, courierMethod, id } = data;
    if (orderStatus === 'sent to courier' && courierMethod) {
      const courierApiConfig: CourierApiConfig = {
        providerName: courierMethod?.providerName,
        apiKey: courierMethod?.apiKey,
        secretKey: courierMethod?.secretKey,
        username: courierMethod?.username,
        password: courierMethod?.password,
        specialInstruction: courierMethod?.specialInstruction,
        storeId: courierMethod?.storeId,
      };
      const fOrder = await this.orderModel.findById(id);
      if (courierMethod?.providerName === 'Steadfast Courier') {
        if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
        } else {
          const getFullAddress = () => {
            return `Division: ${fOrder?.division}, Area: ${
              fOrder?.area
            }, Zone: ${fOrder?.zone ?? 'n/a'}, ${fOrder?.shippingAddress}`;
          };

          const cashOnDeliveryAmount = () => {
            if (fOrder?.paymentStatus === 'paid') {
              return 0;
            } else {
              return fOrder?.grandTotal ?? 0;
            }
          };
          const payload: SteadfastCourierPayload = {
            invoice: fOrder?.orderId,
            recipient_name: fOrder?.name,
            recipient_phone: fOrder?.phoneNo,
            recipient_address: getFullAddress(),
            cod_amount: cashOnDeliveryAmount(),
            note: fOrder?.deliveryNote
              ? `${fOrder.deliveryNote} (${courierMethod?.specialInstruction || ''})`
              : courierMethod?.specialInstruction || '',
          };

          const courierResponse =
            await this.courierService.createOrderWithProvider(
              courierApiConfig,
              payload,
            );
          if (courierResponse.status === 200) {
            const orderCourierData = {
              providerName: 'Steadfast Courier',
              consignmentId: courierResponse?.consignment?.consignment_id,
              trackingId: courierResponse?.consignment?.tracking_code,
              createdAt: this.utilsService.getDateString(new Date()),
            };
            await this.orderModel.findByIdAndUpdate(id, {
              $set: {
                courierData: orderCourierData,
              },
            });
          }
        }
      }

      if (courierMethod?.providerName === 'Pathao Courier') {
        // if (courierMethod) {
        if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
        } else {
          const courierResponse =
            await this.courierService.createOrderWithProvider(
              courierApiConfig,
              fOrder,
            );

          if (courierResponse.code === 200) {
            const orderCourierData = {
              providerName: courierMethod?.providerName,
              consignmentId: courierResponse?.data?.consignment_id,
              trackingId: courierResponse?.data?.merchant_order_id,
              createdAt: this.utilsService.getDateString(new Date()),
            };
            await this.orderModel.findByIdAndUpdate(id, {
              $set: {
                courierData: orderCourierData,
              },
            });
          }
        }
      }
    }
  }

  private async addMultipleOrderToCourier(data: {
    orderStatus: string;
    courierMethod: any;
    mIds: any[];
  }) {
    const { orderStatus, courierMethod, mIds } = data;
    if (orderStatus === 'sent to courier' && courierMethod) {
      const courierApiConfig: CourierApiConfig = {
        providerName: courierMethod?.providerName,
        apiKey: courierMethod?.apiKey,
        secretKey: courierMethod?.secretKey,
        username: courierMethod?.username,
        password: courierMethod?.password,
        specialInstruction: courierMethod?.specialInstruction,
        storeId: courierMethod?.storeId,
      };
      for (const id of mIds) {
        const fOrder = await this.orderModel.findById(id);
        if (courierMethod?.providerName === 'Steadfast Courier') {
          if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
          } else {
            const getFullAddress = () => {
              return `Division: ${fOrder?.division}, Area: ${
                fOrder?.area
              }, Zone: ${fOrder?.zone ?? 'n/a'}, ${fOrder?.shippingAddress}`;
            };

            const cashOnDeliveryAmount = () => {
              if (fOrder?.paymentStatus === 'paid') {
                return 0;
              } else {
                return fOrder?.grandTotal ?? 0;
              }
            };
            const payload: SteadfastCourierPayload = {
              invoice: fOrder?.orderId,
              recipient_name: fOrder?.name,
              recipient_phone: fOrder?.phoneNo,
              recipient_address: getFullAddress(),
              cod_amount: cashOnDeliveryAmount(),
              note: fOrder?.deliveryNote
                ? `${fOrder.deliveryNote} (${courierMethod?.specialInstruction || ''})`
                : courierMethod?.specialInstruction || '',
            };

            const courierResponse =
              await this.courierService.createOrderWithProvider(
                courierApiConfig,
                payload,
              );
            if (courierResponse.status === 200) {
              const orderCourierData = {
                providerName: 'Steadfast Courier',
                consignmentId: courierResponse?.consignment?.consignment_id,
                trackingId: courierResponse?.consignment?.tracking_code,
                createdAt: this.utilsService.getDateString(new Date()),
              };
              await this.orderModel.findByIdAndUpdate(id, {
                $set: {
                  courierData: orderCourierData,
                },
              });
            }
          }
        }

        if (courierMethod?.providerName === 'Pathao Courier') {
          // if (courierMethod) {
          if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
          } else {
            const courierResponse =
              await this.courierService.createOrderWithProvider(
                courierApiConfig,
                fOrder,
              );

            if (courierResponse.code === 200) {
              const orderCourierData = {
                providerName: courierMethod?.providerName,
                consignmentId: courierResponse?.data?.consignment_id,
                trackingId: courierResponse?.data?.merchant_order_id,
                createdAt: this.utilsService.getDateString(new Date()),
              };
              await this.orderModel.findByIdAndUpdate(id, {
                $set: {
                  courierData: orderCourierData,
                },
              });
            }
          }
        }
      }
    }
  }

  /**
   * Support Methods
   * getUniqueOrderId()
   * getUniqueIncompleteOrderId()
   * getOrderItems()
   * cartRegularSubTotal()
   * cartSaleSubTotal()
   * cartDiscountAmount()
   * getDeliveryCharge()
   * getOrderGrandTotal()
   * offerDiscountAmount()
   */

  private async getUniqueOrderId(shop: string) {
    const incOrder = await this.uniqueIdModel.findOneAndUpdate(
      { shop: shop },
      { $inc: { orderId: 1 } },
      { new: true, upsert: true, returnDocument: 'after' },
    );

    return this.utilsService.padLeadingZeros(incOrder.orderId);
  }

  private async getUniqueIncompleteOrderId(shop: string) {
    const incOrder = await this.uniqueIdModel.findOneAndUpdate(
      { shop: shop },
      { $inc: { incompleteOrderId: 1 } },
      { new: true, upsert: true, returnDocument: 'after' },
    );

    return this.utilsService.padLeadingZeros(incOrder.incompleteOrderId);
  }

  private getOrderItems(cartItems: Cart[]) {
    return cartItems.map((m) => {
      return {
        product: m.product._id,
        name: m.product.name,
        slug: m.product.slug,
        image:
          m.product.images && m.product.images.length
            ? m.product.images[0]
            : null,
        category: {
          _id: m.product.category?._id,
          name: m.product.category?.name,
          slug: m.product.category?.slug,
        },
        subCategory: m.product.subCategory
          ? {
              _id: m.product.subCategory?._id,
              name: m.product.subCategory?.name,
              slug: m.product.category?.slug,
            }
          : null,
        childCategory: m.product.childCategory
          ? {
              _id: m.product.childCategory?._id,
              name: m.product.childCategory?.name,
              slug: m.product.childCategory?.slug,
            }
          : null,
        brand: m.product.brand
          ? {
              _id: m.product.brand?._id,
              name: m.product.brand?.name,
              slug: m.product.category?.slug,
            }
          : null,
        model: m.product.model ?? null,
        regularPrice: this.utilsService.getProductPrice(
          m.product,
          'regularPrice',
          m.variation?._id,
        ),
        salePrice: m.isWholesale
          ? m.product.wholesalePrice
          : this.utilsService.getProductPrice(
              m.product,
              'salePrice',
              m.variation?._id,
            ),
        costPrice: m.product.costPrice,
        quantity: m.selectedQty,
        isReview: false,
        deliveryCharge: m.product.deliveryCharge,
        advancePayment: m.product.advancePayment,
        variation: m.variation,
        purchaseType: m.isWholesale ? 'Wholesale' : 'Retail',
        phoneModel:
          m.product.isEnablePhoneModel && m.phoneModel
            ? m.phoneModel.trim()
            : null,
      };
    });
  }

  private cartRegularSubTotal(cartItems: Cart[]) {
    return cartItems
      .map((item) => {
        return this.utilsService.getProductPrice(
          item.product,
          'regularPrice',
          item.variation?._id,
          item.selectedQty,
        ) as number;
      })
      .reduce((acc, value) => acc + value, 0);
  }

  private cartSaleSubTotal(cartItems: Cart[]) {
    return cartItems
      .map((item) => {
        return this.utilsService.getProductPrice(
          item.product,
          'salePrice',
          item.variation?._id,
          item.selectedQty,
          item.isWholesale,
        ) as number;
      })
      .reduce((acc, value) => acc + value, 0);
  }

  // private cartDeliveryChargeTotal(cartItems: Cart[]): number {
  //   return cartItems
  //     .map((item: any) => (item.product.deliveryCharge || 0) * item.selectedQty)
  //     .reduce((acc, value) => acc + value, 0);
  // }

  // Service Method

  getCartDeliveryChargeTotal(
    cartItems: any[],
    isInsideCity: boolean,
  ): { total: number; hasZero: boolean } {
    let hasZero = false;

    const total = cartItems
      .map((item) => {
        const charge = isInsideCity
          ? item.product?.deliveryCharge?.insideCity || 0
          : item.product?.deliveryCharge?.outsideCity || 0;

        if (charge === 0) {
          hasZero = true;
        }

        return charge * item.selectedQty;
      })
      .reduce((acc, value) => acc + value, 0);

    return { total, hasZero };
  }

  private cartAdvancePaymentTotal(cartItems: Cart[]): {
    total: number;
    hasZero: boolean;
  } {
    let hasZero = false;

    const total = cartItems
      .map((item: any) => {
        if (item.product.advancePayment === 0) {
          hasZero = true;
        }
        return (item.product.advancePayment || 0) * item.selectedQty;
      })
      .reduce((acc, value) => acc + value, 0);

    return { total, hasZero };
  }

  private cartDiscountAmount(cartItems: Cart[]) {
    return cartItems
      .map((item) => {
        return this.utilsService.getProductPrice(
          item.product,
          'discountAmount',
          item.variation?._id,
          item.selectedQty,
          item?.isWholesale,
        ) as number;
      })
      .reduce((acc, value) => acc + value, 0);
  }

  // private getDeliveryCharge(
  //   deliveryCharges: any,
  //   division: string,
  //   deliveryType: string,
  //   cartItems: any,
  // ): number {
  //   const selectedDelivery = deliveryCharges.find(
  //     (charge: any) => charge.type === deliveryType,
  //   );
  //
  //   if (!selectedDelivery) {
  //     return 0;
  //   }
  //
  //   // For free delivery, always return 0
  //   if (deliveryType === 'free') {
  //     return 0;
  //   }
  //
  //   if (
  //     selectedDelivery?.freeDeliveryMinAmount &&
  //     this.cartSaleSubTotal(cartItems) >=
  //       selectedDelivery?.freeDeliveryMinAmount
  //   ) {
  //     return 0;
  //   }
  //
  //   // Determine charge based on city match
  //   if (selectedDelivery.city === division) {
  //     return selectedDelivery.insideCity || 0;
  //   } else {
  //     return selectedDelivery.outsideCity || 0;
  //   }
  // }

  private getDeliveryCharge(
    deliveryCharges: any,
    division: string,
    deliveryType: string,
    cartItems: any,
  ): { deliveryCharge: number; isInsideCity: boolean } {
    const selectedDelivery = deliveryCharges.find(
      (charge: any) => charge.type === deliveryType,
    );

    if (!selectedDelivery) {
      return { deliveryCharge: 0, isInsideCity: true };
    }

    if (deliveryType === 'free') {
      return { deliveryCharge: 0, isInsideCity: true };
    }

    if (
      selectedDelivery?.freeDeliveryMinAmount &&
      this.cartSaleSubTotal(cartItems) >=
        selectedDelivery?.freeDeliveryMinAmount
    ) {
      return { deliveryCharge: 0, isInsideCity: true };
    }

    const isInsideCity = selectedDelivery.city === division;
    const deliveryCharge = isInsideCity
      ? selectedDelivery.insideCity || 0
      : selectedDelivery.outsideCity || 0;

    return { deliveryCharge, isInsideCity };
  }

  private getOrderGrandTotal(
    cartItems: Cart[],
    finalDeliveryCharge: any,
    offerDiscount?: any,
    couponDiscount?: any,
  ) {
    return (
      this.cartSaleSubTotal(cartItems) +
      finalDeliveryCharge -
      (offerDiscount?.amount ?? 0) -
      (couponDiscount ?? 0)
    );
  }

  private async offerDiscountAmount(data: {
    offersSetting: any[];
    user: User;
    userOffer: string;
    subTotal: number;
  }) {
    const { offersSetting, user, userOffer, subTotal } = data;

    const offers = offersSetting
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

    const selectedUserOffer = offers.find((f) => f.offerType === userOffer);

    let canUserGetNewRegistration: boolean = false;
    if (
      selectedUserOffer &&
      selectedUserOffer.offerType === 'new-registration'
    ) {
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

    if (finalData.length) {
      const getDiscountAmount = () => {
        if (selectedUserOffer) {
          const discount = selectedUserOffer.discount;
          let discountValue = 0;
          if (discount.endsWith('%')) {
            const percentage = parseFloat(discount.replace('%', ''));
            discountValue = (percentage / 100) * subTotal;
          } else {
            discountValue = parseFloat(discount);
          }
          // Ensure discount doesn't exceed subtotal
          return Math.min(discountValue, subTotal);
        } else {
          return 0;
        }
      };
      return {
        offerType: selectedUserOffer?.offerType,
        amount: getDiscountAmount(),
      };
    } else {
      return null;
    }
  }

  /**
   * On Success Payment
   * onSuccessfulPayment()
   */

  private async onSuccessfulPayment(
    paymentResult: any,
    orderData: any,
    fSetting: any,
  ) {
    await this.orderModel.findByIdAndUpdate(orderData?._id, {
      $set: paymentResult,
    });

    // Remove from Carts
    await this.cartModel.deleteMany({
      _id: { $in: orderData?.carts.map((m) => new ObjectId(m)) },
    });

    //Order Notification
    const fOrderNotification = fSetting?.orderNotification ?? {};

    // Sms Providers
    const fSmsMethods = fSetting?.smsMethods ?? [];
    const smsMethod = fSmsMethods.find((f) => f.status === 'active');
    const smsSendingOption = fSetting?.smsSendingOption;

    // Sms Sending
    if (smsMethod && smsSendingOption && smsSendingOption.orderPlaced) {
      const smsSentConfig: SmsSentConfig = {
        providerName: smsMethod.providerName,
        smsSenderSecret: smsMethod.secretKey,
        smsSenderId: smsMethod.senderId,
        smsClientId: smsMethod.clientId,
        apiKey: smsMethod.apiKey,
        phoneNo: orderData?.phoneNo,
        countryCode: smsMethod?.currency?.countryCode,
        message: `Thank you for shopping with Saleecom! Your order ${orderData?.orderId} has been successfully placed.`,
      };
      this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
    }

    // Order Notification For Admin
    if (
      orderData &&
      fOrderNotification &&
      (fOrderNotification.isEnableSMSNotification ||
        fOrderNotification.isEnableEmailNotification)
    ) {
      this.orderNotificationForAdmin(orderData, fSetting, fOrderNotification);
    }
  }

  /**
   * Manage Bkash Payment Api
   * payWithBkash()
   * callbackBkashPayment()
   */
  private async payWithBkash(bkashApiConfig: BkashApiConfig) {
    try {
      const { callbackURL, amount, order_Id } = bkashApiConfig;
      const paymentData: BkashApiConfig = {
        mode: '0011',
        payerReference: ' ',
        callbackURL: callbackURL,
        amount: amount,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: order_Id,
      };
      const finalData: BkashApiConfig = {
        ...bkashApiConfig,
        ...paymentData,
      };
      const responsePayload =
        await this.paymentControlService.createBkashPayment(finalData);

      if (responsePayload.data['paymentID']) {
        await this.orderModel.findByIdAndUpdate(order_Id, {
          $set: {
            paymentRefId: responsePayload.data['paymentID'],
            paymentApiType: 'Bkash',
            paymentMethod: 'Bkash',
          },
        });
        return {
          success: true,
          message: 'Success! Redirecting to the payment page',
          data: {
            _id: order_Id,
            providerName: 'Bkash',
            providerType: 'api',
            link: responsePayload.data['bkashURL'],
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

  async callbackBkashPayment(
    res: Response,
    paymentID: string,
    status: string,
  ): Promise<any> {
    try {
      const fOrder: any = await this.orderModel.findOne({
        paymentApiType: 'Bkash',
        paymentRefId: paymentID,
      });

      const fShopDomain = await this.shopModel
        .findById(fOrder?.shop)
        .select('domain subDomain');

      // console.log('process.env.PRODUCTION_BUILD', process.env.PRODUCTION_BUILD);
      const redirectUrlBase =
        process.env.PRODUCTION_BUILD === 'true'
          ? `https://${fShopDomain.domain}`
          : 'http://localhost:4200';

      // console.log('redirectUrlBase', redirectUrlBase);

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: fOrder?.shop })
        .select(
          'smsSendingOption currency smsMethods paymentMethods orderNotification -_id',
        );

      // Payment Providers
      const fPaymentMethods = fSetting?.paymentMethods ?? [];

      const fMethod = fPaymentMethods.find((f) => f.providerName === 'Bkash');
      if (fMethod) {
        const bkashApiConfig: BkashApiConfig = {
          url: fMethod.production
            ? 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout'
            : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout',
          appKey: fMethod.apiKey,
          paymentID: paymentID,
          appSecret: fMethod.secretKey,
          username: fMethod.username,
          password: fMethod.password,
        };
        if (status === 'success') {
          const result: any =
            await this.paymentControlService.executeBkashPayment(
              bkashApiConfig,
            );
          if (result.statusCode === '0000') {
            if (fOrder.advancePayment && fOrder.advancePayment > 0) {
              await this.onSuccessfulPayment(
                {
                  paidAmount: Number(fOrder.advancePayment ?? 0),
                  paymentApiTrxID: result.trxID,
                  paymentMethod: 'Bkash',
                  advancePaymentStatus: 'paid',
                },
                fOrder,
                fSetting,
              );

              return res.redirect(
                `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=${result.statusMessage}`,
              );
            } else {
              await this.onSuccessfulPayment(
                {
                  paidAmount: Number(result.amount ?? 0),
                  paymentApiTrxID: result.trxID,
                  paymentMethod: 'Bkash',
                  paymentStatus: 'paid',
                },
                fOrder,
                fSetting,
              );

              return res.redirect(
                `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=${result.statusMessage}`,
              );
            }
          } else {
            await this.orderModel.findByIdAndDelete(fOrder?._id);
            return res.redirect(
              `${redirectUrlBase}/failed-order?message=${result.statusMessage}`,
            );
          }
        } else {
          await this.orderModel.findByIdAndDelete(fOrder?._id);
          return res.redirect(
            `${redirectUrlBase}/failed-order?message=${'Payment failed.'}`,
          );
        }
      } else {
        return res.redirect(
          `${redirectUrlBase}/failed-order?message=${'Payment Config failed. No Payment config found.'}`,
        );
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
  private async payWithSslCommerz(sslCommerzInit: SslCommerzInit) {
    try {
      const { tran_id } = sslCommerzInit;
      const responsePayload =
        await this.paymentControlService.sslCommerzInit(sslCommerzInit);

      if (responsePayload['status'] === 'SUCCESS') {
        await this.orderModel.findByIdAndUpdate(tran_id, {
          $set: {
            paymentRefId: responsePayload['sessionkey'],
            paymentApiType: 'SSl Commerz',
            paymentMethod: 'SSl Commerz',
          },
        });

        return {
          success: true,
          message: 'Success! Redirecting to the payment page',
          data: {
            _id: tran_id,
            providerName: 'SSl Commerz',
            providerType: 'api',
            link: responsePayload['GatewayPageURL'],
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

  private async payWithStripe(stripeConfig: {
    secretKey: string;
    production: boolean;
    amount: number;
    currency: string;
    orderId: string;
    baseUrl: string;
  }) {
    try {
      const { secretKey, amount, currency, orderId, baseUrl } = stripeConfig;

      const params = new URLSearchParams();
      params.append('mode', 'payment');
      // params.append('customer_email', 'customer@example.com');
      params.append(
        'success_url',
        `${baseUrl}/api/order/callback-stripe-payment?status=success&orderId=${orderId}`,
      );
      params.append(
        'cancel_url',
        `${baseUrl}/api/order/callback-stripe-payment?status=cancel&orderId=${orderId}`,
      );
      params.append('line_items[0][price_data][currency]', currency);
      params.append(
        'line_items[0][price_data][product_data][name]',
        `Order #${orderId}`,
      );
      params.append(
        'line_items[0][price_data][unit_amount]',
        `${Math.round(amount * 100)}`,
      );
      params.append('line_items[0][quantity]', '1');
      params.append('metadata[orderId]', orderId);

      const response = await axios.post(
        'https://api.stripe.com/v1/checkout/sessions',
        params,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        success: true,
        message: 'Redirecting to Stripe Checkout...',
        data: {
          _id: orderId,
          providerName: 'Stripe',
          providerType: 'api',
          link: response.data.url,
          sessionId: response.data.id,
        },
      };
    } catch (error) {
      console.error('Stripe API Error:', error?.response?.data || error);
      return {
        success: false,
        message: 'Stripe payment session creation failed',
        data: null,
      };
    }
  }

  async callbackSslCommerzPayment(
    res: Response,
    tran_id: any,
    status: string,
  ): Promise<any> {
    try {
      // Fetch Order Data
      const fOrder: any = await this.orderModel.findOne({
        paymentApiType: 'SSl Commerz',
        _id: tran_id,
      });

      const fShopDomain = await this.shopModel
        .findById(fOrder?.shop)
        .select('domain subDomain');

      const redirectUrlBase =
        process.env.PRODUCTION_BUILD === 'true'
          ? `https://${fShopDomain.domain}`
          : 'http://localhost:4200';

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: fOrder?.shop })
        .select(
          'smsSendingOption currency smsMethods orderNotification paymentMethods -_id',
        );

      // Payment Providers
      const fPaymentMethods = fSetting?.paymentMethods ?? [];

      const fMethod = fPaymentMethods.find(
        (f) => f.providerName === 'SSl Commerz',
      );
      if (fMethod) {
        const sslBaseURL = `https://${
          fMethod.production ? 'securepay' : 'sandbox'
        }.sslcommerz.com`;

        const sslCommerzApiConfig: SslCommerzApiConfig = {
          baseUrl: sslBaseURL,
          store_id: fMethod.username,
          store_passwd: fMethod.password,
          sessionKey: fOrder?.paymentRefId,
          tran_id: tran_id,
        };
        if (status === 'VALID') {
          const result: any =
            await this.paymentControlService.transactionQueryBySessionId(
              sslCommerzApiConfig,
            );
          if (result.status === 'VALID') {
            if (fOrder.advancePayment && fOrder.advancePayment > 0) {
              await this.onSuccessfulPayment(
                {
                  paidAmount: Number(fOrder.advancePayment ?? 0),
                  paymentApiTrxID: result['bank_tran_id'],
                  paymentMethod: result['card_type'],
                  advancePaymentStatus: 'paid',
                },
                fOrder,
                fSetting,
              );

              return res.redirect(
                `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=${result.statusMessage}`,
              );
            } else {
              await this.onSuccessfulPayment(
                {
                  paidAmount: Number(result.amount ?? 0),
                  paymentApiTrxID: result['bank_tran_id'],
                  paymentMethod: result['card_type'],
                  paymentStatus: 'paid',
                },
                fOrder,
                fSetting,
              );

              return res.redirect(
                `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=${result.statusMessage}`,
              );
            }
          } else {
            await this.orderModel.findByIdAndDelete(fOrder?._id);
            return res.redirect(
              `${redirectUrlBase}/failed-order?message=Payment failed`,
            );
          }
        } else {
          await this.orderModel.findByIdAndDelete(fOrder?._id);
          return res.redirect(
            `${redirectUrlBase}/failed-order?message=Payment failed.`,
          );
        }
      } else {
        return res.redirect(
          `${redirectUrlBase}/failed-order?message=Payment Config failed. No Payment config found.`,
        );
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async callbackStripePayment(
    res: Response,
    status: string,
    orderId: string,
    sessionId: string,
  ): Promise<any> {
    try {
      const fOrder = await this.orderModel.findById(orderId);
      console.log(fOrder);

      const fSetting = await this.settingModel
        .findOne({ shop: fOrder?.shop })
        .select(
          'smsSendingOption currency smsMethods orderNotification paymentMethods -_id',
        );

      const fShopDomain = await this.shopModel
        .findById(fOrder?.shop)
        .select('domain subDomain');

      const redirectUrlBase =
        process.env.PRODUCTION_BUILD === 'true'
          ? `https://${fShopDomain.domain}`
          : 'http://localhost:3007';

      if (status === 'success') {
        if (fOrder.advancePayment && fOrder.advancePayment > 0) {
          await this.onSuccessfulPayment(
            {
              paidAmount: fOrder?.advancePayment ?? fOrder?.grandTotal,
              paymentApiTrxID: sessionId,
              paymentMethod: 'Stripe',
              advancePaymentStatus: 'paid',
            },
            fOrder,
            fSetting,
          );

          return res.redirect(
            `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=Stripe payment successful`,
          );
        } else {
          await this.onSuccessfulPayment(
            {
              paidAmount: fOrder?.advancePayment ?? fOrder?.grandTotal,
              paymentApiTrxID: sessionId,
              paymentMethod: 'Stripe',
              paymentStatus: 'paid',
            },
            fOrder,
            fSetting,
          );
          return res.redirect(
            `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=Stripe payment successful`,
          );
        }
      } else {
        await this.orderModel.findByIdAndDelete(fOrder?._id);
        return res.redirect(
          `${redirectUrlBase}/failed-order?message=Stripe payment failed or cancelled.`,
        );
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
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

      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.orderModel.deleteMany({
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

  // Job Scheduler For Courier Status
  private async checkAndUpdateCourierStatus() {
    // schedule.scheduleJob('*/1 * * * *', async () => {
    schedule.scheduleJob('0 */6 * * *', async () => {
      // schedule.scheduleJob('*/20 * * * *', async () => {
      console.log('Get All Courier Status And Update Start...');
      await this.getAllCourierStatusAndUpdate();
    });
  }

  // get All Courier Status And Update

  async getAllCourierStatusAndUpdate(): Promise<void> {
    const last3Days = new Date(
      this.utilsService.getNextDateString(new Date(), -15),
    );
    const formattedDate = last3Days.toISOString().split('T')[0];

    const orders = await this.orderModel.find({
      'courierData.createdAt': { $gte: formattedDate },
      courierData: { $exists: true, $ne: null },
    });

    if (orders.length === 0) {
      console.log('No orders found for the last 3 days with courierData.');
      return;
    }

    const shopArray = [
      ...new Set(orders.map((order) => order.shop.toString())),
    ];

    const courierMethodArray: { shop: string; courier: any }[] = [];

    // Step 1: Prepare courier methods per shop
    for (const shop of shopArray) {
      try {
        const fSetting = await this.settingModel
          .findOne({ shop })
          .select('courierMethods -_id');

        const fCourierMethods = fSetting?.courierMethods ?? [];
        const activeCourier = fCourierMethods.find(
          (c: any) => c.status === 'active',
        );

        if (activeCourier) {
          courierMethodArray.push({ shop, courier: activeCourier });
        }
      } catch (err) {
        console.error(`Failed to fetch courier setting for shop ${shop}`, err);
      }
    }

    // Step 2: Batch process orders
    const BATCH_SIZE = 100;
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (order) => {
        const matchedCourier = courierMethodArray.find(
          (c) => c.shop === order.shop.toString(),
        );

        if (matchedCourier) {
          try {
            await this.getAndUpdateOrderStatusFromCourier(
              order,
              matchedCourier.courier,
            );
          } catch (err) {
            console.error(
              `Failed to update order ${order._id} for shop ${order.shop}`,
              err?.response?.data || err.message,
            );
          }
        }
      });

      // Wait for all promises in the batch to finish (even if some fail)
      await Promise.allSettled(batchPromises);
      console.log(`✅ Processed batch ${i / BATCH_SIZE + 1}`);
    }

    console.log('🎉 All courier status updates complete.');
  }

  async getAndUpdateOrderStatusFromCourier(order: any, courierMethod: any) {
    // Implement your logic here
    let orderStatus: any;
    // Courier Api Config
    const courierApiConfig: CourierApiConfig = {
      providerName: courierMethod?.providerName,
      apiKey: courierMethod?.apiKey,
      secretKey: courierMethod?.secretKey,
      username: courierMethod?.username,
      password: courierMethod?.password,
    };

    if (order.courierData.consignmentId) {
      const courierResponse =
        await this.courierService.getOrderStatusFormCourier(
          courierApiConfig,
          order.courierData.consignmentId,
        );

      switch (courierResponse && courierMethod?.providerName) {
        case 'Steadfast Courier':
          if (courierResponse.status === 200) {
            switch (courierResponse.delivery_status) {
              case 'delivered':
                orderStatus = 'delivered';
                break;
              case 'cancelled':
                orderStatus = 'cancelled';
                break;
            }

            await this.orderModel.findByIdAndUpdate(order.id, {
              $set: {
                orderStatus: orderStatus,
              },
            });
          }
          break;
        case 'Pathao Courier':
          if (courierResponse.code === 200) {
            console.log(
              'courierResponse.data.order_status',
              courierResponse.data.order_status,
            );
            switch (courierResponse.data.order_status) {
              case 'Delivered':
                orderStatus = 'delivered';
                break;
              case 'Cancelled':
                orderStatus = 'cancelled';
                break;
              case 'Cancel':
                orderStatus = 'cancelled';
                break;
              case 'Return':
                orderStatus = 'refunded';
                break;
              case 'Pending':
                orderStatus = 'Pathao Checking';
                break;

              // case 'Pending':
              //   console.log('Pending');
              //   orderStatus = 'confirmed';
              //   break;
              default:
                orderStatus = courierResponse.data.order_status; // default রাখবে
                break;
            }

            await this.orderModel.findByIdAndUpdate(order.id, {
              $set: {
                orderStatus: orderStatus,
              },
            });
          }
          break;
      }
    }
  }

  // Order Notification For Admin

  private async orderNotificationForAdmin(
    orderData: any,
    fSetting: any,
    fOrderNotification: any,
  ) {
    const { shop, orderId, phoneNo, name } = orderData;

    // Setting Data
    // const fSetting = await this.settingModel
    //   .findOne({ shop: shop })
    //   .select('smsSendingOption smsMethods orderNotification -_id');
    //
    // //Order Notification
    // const fOrderNotification = fSetting?.orderNotification ?? {};

    // Shop Data
    const fShopInfo = await this.shopModel
      .findById(shop)
      .select('domain subDomain owner');

    // Vendor Data
    const fVendorInfo = await this.vendorModel
      .findById(fShopInfo?.owner)
      .select('phoneNo email name');

    // Sms Providers
    const fSmsMethods = fSetting?.smsMethods ?? [];
    const smsMethod = fSmsMethods.find((f) => f.status === 'active');
    const smsSendingOption = fSetting?.smsSendingOption;

    // Shop Information
    const shopInformationData: any = await this.shopInformationModel
      .findOne({ shop: shop })
      .select('logoPrimary');

    // Sms Sending
    if (fOrderNotification && fOrderNotification.isEnableSMSNotification) {
      if (
        smsMethod &&
        smsSendingOption &&
        smsSendingOption.orderPlaced &&
        fVendorInfo.phoneNo
      ) {
        // const smsMessage = ` You've got a new order on your website! Order ID: #${orderId}. Customer Name: ${name},  Phone No: ${phoneNo} and Website: ${fShopInfo.domain}. View Order: https://admin.saleecom.com/order/order-details/${orderData._id}
        //                     `;

        const smsSentConfig: SmsSentConfig = {
          providerName: smsMethod.providerName,
          smsSenderSecret: smsMethod.secretKey,
          smsSenderId: smsMethod.senderId,
          smsClientId: smsMethod.clientId,
          apiKey: smsMethod.apiKey,
          phoneNo: fVendorInfo.phoneNo,
          countryCode: smsMethod?.currency?.countryCode,
          message: `You've got a new order on your website! Order ID: ${orderId}. Customer Name: ${name},  Phone No: ${phoneNo} and Website: ${fShopInfo.domain}. View Order: https://admin.saleecom.com/order/order-details/${orderData._id}`,
        };

        this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
      }
    }

    // Email Sending
    if (fOrderNotification && fOrderNotification.isEnableEmailNotification) {
      if (fVendorInfo.email) {
        //  Email html
        const html = `
       <div style="width: 450px; font-family: Helvetica, Arial, sans-serif; border: 1px solid #e2e2e2; border-radius: 6px; overflow: hidden;">
       <div style="padding: 15px 20px; background: #fff;">
        <img src="${shopInformationData.logoPrimary ?? ''}" width="70" alt="" style="margin-bottom: 10px;" loading="lazy"/>
         <h2 style="margin: 0 0 10px;">Hello, ${fVendorInfo.name}</h2>

      <p style="margin: 4px 0;">You’ve got a new order on your website and order id #${orderId}</p>
      <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${name}</p>
      <p style="margin: 4px 0;"><strong>Phone No:</strong> ${phoneNo}</p>
      <p style="margin: 4px 0;"><strong>Order No:</strong> ${orderId}</p>
      <p style="margin: 4px 0;"><strong>Website:</strong> <a href="${fShopInfo.domain}" style="color: #2563eb; text-decoration: none;" target="_blank">${fShopInfo.domain}</a></p>
    <p style="margin: 4px 0;"> <strong>Order Link:</strong> <a href="https://admin.saleecom.com/order/order-details/${orderData._id}"   style="color: #2563eb; text-decoration: none;"   target="_blank">  View order details </a></p>

      <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;" />
      <div style="margin-top: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">Thank you</p>
      </div>
          </div>
        </div>
      `;

        this.emailService.sendEmail(
          fVendorInfo.email,
          `You’ve got a new order on your website and order id #${orderId}`,
          html,
          fShopInfo,
        );
      }
    }
  }

  // Create Affiliate Sale Report
  private async createAffiliateReport(orderData: any) {
    // console.log("orderDat a",orderData);
    const affiliateProductData: any = await this.affiliateProductModel.findById(
      orderData.affiliateProductId,
    );

    const finalData = {
      type: 'earning',
      affiliate: orderData.affiliateId,
      product: orderData.affiliateProductId,
      ownerId: affiliateProductData.ownerId, // owner ID
      ownerType: affiliateProductData.ownerType, // assuming this is a shop
      shopId: orderData.shop, // shop ID
      amount: affiliateProductData.price,
      status: 'pending', // or 'pending', based on your logic
      dateString: orderData.checkoutDate,
    };

    // console.log('finalData', finalData);

    await this.affiliateReportModel.create(finalData);
  }

  private async updateProductQty(orderData: any) {
    for (const g of orderData?.orderedItems) {
      const product = await this.productModel.findById(g.product); // Use g.product, not g._id
      if (!product) {
        throw new BadRequestException(`Product not found: ${g.name}`);
      }

      const orderedQty = Number(g.quantity);
      if (isNaN(orderedQty) || orderedQty <= 0) {
        throw new BadRequestException(`Invalid quantity for ${g.name}`);
      }

      // If product has no variation (simple product)
      if (!product.isVariation) {
        const currentQty = Number(product.quantity);
        if (isNaN(currentQty)) {
          throw new BadRequestException(
            `Invalid product quantity for ${g.name}`,
          );
        }

        if (currentQty < orderedQty) {
          throw new BadRequestException(
            `Insufficient stock for ${g.name}. Only ${currentQty} left.`,
          );
        }

        await this.productModel.findByIdAndUpdate(
          product._id,
          {
            $set: { quantity: currentQty - orderedQty, totalSold: orderedQty },
          },
          { new: true },
        );
      }

      // If product has variation
      if (product.isVariation && g.variation && g.variation._id) {
        const variantIndex = product.variationList.findIndex(
          (v) => v._id.toString() === g.variation._id.toString(), // match string with string
        );

        if (variantIndex === -1) {
          throw new BadRequestException(
            `Variant not found for ${g.name} - ${g.variation.name}`,
          );
        }

        const variant = product.variationList[variantIndex];
        const currentVariantQty = Number(variant.quantity);

        if (isNaN(currentVariantQty)) {
          throw new BadRequestException(
            `Invalid variant quantity for ${g.name} - ${g.variation.name}`,
          );
        }

        if (currentVariantQty < orderedQty) {
          throw new BadRequestException(
            `Insufficient stock for ${g.name} variant. Only ${currentVariantQty} left.`,
          );
        }

        // Update quantity
        product.variationList[variantIndex].quantity =
          currentVariantQty - orderedQty;

        await this.productModel.findByIdAndUpdate(
          product._id,
          {
            $set: {
              variationList: product.variationList,
              totalSold: orderedQty,
            },
          },
          { new: true },
        );
      }
    }
  }

  getDurationInMinutes(blockTime: string): number {
    if (!blockTime) return 30;

    const parts = blockTime.trim().toLowerCase().split(' ');
    if (parts.length !== 2) return 30;

    const [valueStr, unit] = parts;
    const value = parseInt(valueStr);
    if (isNaN(value)) return 30;

    switch (unit) {
      case 'minute':
      case 'minutes':
        return value;

      case 'hour':
      case 'hours':
        return value * 60;

      case 'day':
      case 'days':
        return value * 24 * 60;

      case 'month':
      case 'months':
        return value * 30 * 24 * 60;

      case 'year':
      case 'years':
        return value * 365 * 24 * 60;

      case 'all':
      case 'alltime':
      case 'forever':
      case 'lifetime':
        return 100 * 365 * 24 * 60;

      default:
        return 30; // fallback
    }
  }

  async blockIp(order: any, durationMinutes: number, type: string) {
    const now = new Date();
    const blockUntil = new Date(now.getTime() + durationMinutes * 60000);

    await this.ipBlockModel.updateOne(
      {
        userIpAddress: order.userIpAddress,
        shop: order.shop,
        phoneNo: order.phoneNo,
      },
      {
        $set: {
          type,
          blockUntil,
          dateString: now.toISOString().split('T')[0],
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  async isIpBlocked(
    ip: string,
    shopId: string,
    phoneNo?: string,
  ): Promise<boolean> {
    const blockInfo = await this.ipBlockModel.findOne({
      userIpAddress: ip,
      shop: shopId,
      // phoneNo: phoneNo,
      blockUntil: { $gt: new Date() }, // এখনো সময় শেষ হয়নি
    });

    return !!blockInfo;
  }
}
