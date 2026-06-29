import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddSupportDto,
  FilterAndPaginationSupportDto,
  UpdateSupportDto,
} from './dto/support.dto';
import { Support } from './interfaces/support.interface';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { Shop } from '../shop/interfaces/shop.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class SupportService {
  private logger = new Logger(SupportService.name);

  constructor(
    @InjectModel('Support') private readonly supportModel: Model<Support>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Vendor') private readonly vendorModel: Model<Vendor>,
    private utilsService: UtilsService,
  ) {}

  /**
   * addSupport()
   * insertManySupport()
   * getAllSupports()
   * getSupportById()
   * updateSupportById()
   * updateMultipleSupportById()
   * deleteSupportById()
   * deleteMultipleSupportById()
   */
  async addSupport(
    vendor: Vendor,
    shop: string,
    addSupportDto: AddSupportDto,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.findOne({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const mData = {
        ...addSupportDto,
        ...{
          shop: fShop._id,
          priority: 'pending',
          status: 'Pending',
        },
      };

      const saveData = await this.supportModel.create(mData);
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManySupport(
    addSupportsDto: AddSupportDto[],
  ): Promise<ResponsePayload> {
    try {
      const bulkOps = addSupportsDto.map((data) => ({
        updateOne: {
          filter: { name: data.name },
          update: { $set: data },
          upsert: true,
        },
      }));

      const d = await this.supportModel.bulkWrite(bulkOps as any);
      // Convert the values to a string array
      const dataArr = Object.values(d.upsertedIds);

      return {
        success: true,
        message: `${
          dataArr && dataArr.length ? dataArr.length : 0
        }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSupportByShop(
    shop: string,
    filterSupportDto: FilterAndPaginationSupportDto,
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
      const { filter } = filterSupportDto;
      filterSupportDto.filter = { ...filter, ...{ shop: new ObjectId(shop) } };

      return this.getAllSupports(filterSupportDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSupports(
    filterSupportDto: FilterAndPaginationSupportDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterSupportDto;
    const { pagination } = filterSupportDto;
    const { sort } = filterSupportDto;
    const { select } = filterSupportDto;

    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Filter
    if (filter) {
      mFilter = { ...mFilter, ...filter, readOnly: null };
    } else {
      mFilter = { readOnly: null };
    }

    // Search
    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: this.utilsService.createRegexFromString(searchQuery) },
              { keyword: this.utilsService.createRegexFromString(searchQuery) },
            ],
          },
        ],
      };
    }

    // Sort
    mSort = sort || { createdAt: -1 };

    // Select
    mSelect = select || { name: 1 };

    // Match
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });
    }

    // Step 1: Populate shop
    aggregateStages.push({
      $lookup: {
        from: 'shops',
        let: { shopId: '$shop' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$shopId'] },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              username: 1,
              phoneNo: 1,
              email: 1,
              owner: 1, // needed for next lookup
            },
          },
        ],
        as: 'shop',
      },
    });

    aggregateStages.push({
      $unwind: {
        path: '$shop',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Step 2: Populate shop.owner
    aggregateStages.push({
      $lookup: {
        from: 'vendors', // change if your owner collection is different
        let: { ownerId: '$shop.owner' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$ownerId'] },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              username: 1,
              phoneNo: 1,
              email: 1,
            },
          },
        ],
        as: 'shop.owner',
      },
    });

    aggregateStages.push({
      $unwind: {
        path: '$shop.owner',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Sort stage
    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    // No Pagination
    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // With Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: pagination.pageSize * pagination.currentPage },
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
              { $skip: pagination.pageSize * pagination.currentPage },
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
      const dataAggregates = await this.supportModel.aggregate(aggregateStages);
      if (pagination) {
        return {
          ...dataAggregates[0],
          success: true,
          message: 'Success',
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
      throw new InternalServerErrorException();
    }
  }



  async getSupportById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.supportModel
        .findById(id)
        .select(select)
        .populate({
          path: 'shop',
          select: {
            websiteName: 1,
            owner: 1,
            domain: 1,
          },
          populate: {
            path: 'owner',
            select: {
              name: 1,
              phoneNo: 1,
              email: 1,
              username: 1,
            },
          },
        });
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateSupportById(
    id: string,
    updateSupportDto: UpdateSupportDto,
  ): Promise<ResponsePayload> {
    try {
      await this.supportModel.findByIdAndUpdate(id, {
        $set: updateSupportDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleSupportById(
    ids: string[],
    updateSupportDto: UpdateSupportDto,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.supportModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateSupportDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteSupportById(id: string): Promise<ResponsePayload> {
    try {
      await this.supportModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSupportById(ids: string[]): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.supportModel.deleteMany({ _id: mIds });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(err.message);
    }
  }
}
