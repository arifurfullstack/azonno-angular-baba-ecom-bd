import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { VendorRoles } from '../../../enum/vendor-roles.enum';
import { GenderTypes } from '../../../enum/gender-types.enum';
import { PaginationDto } from '../../../dto/pagination.dto';

export class CheckVendorDto {
  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  countryCode: string;
}

export class CreateVendorDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsBoolean()
  isPasswordLess: boolean;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  registrationType: string;

  @IsOptional()
  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  profileImg: string;

  @IsOptional()
  @IsString()
  profileBanner: string;

  @IsOptional()
  shops: any[];
}

export class AuthVendorDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  identifier: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;
}

export class VendorSelectFieldDto {
  @IsOptional()
  @Matches(/^((?!password).)*$/)
  select: string;
}

export class FilterVendorDto {
  @IsOptional()
  @IsBoolean()
  hasAccess: boolean;

  @IsOptional()
  role: any;

  @IsOptional()
  @IsString()
  @IsIn([GenderTypes.MALE, GenderTypes.FEMALE, GenderTypes.OTHER])
  gender: string;
}

export class FilterAndPaginationVendorDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterVendorDto)
  filter: FilterVendorDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  sort: object;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  select: any;
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  newPassword: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsString()
  @IsIn([VendorRoles.SUPER_ADMIN, VendorRoles.ADMIN, VendorRoles.EDITOR, VendorRoles.ACCOUNTANT])
  role: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  permissions: string[];

  @IsOptional()
  @IsString()
  @IsIn([GenderTypes.MALE, GenderTypes.FEMALE, GenderTypes.OTHER])
  gender: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsBoolean()
  hasAccess: string;

  @IsOptional()
  @IsString()
  profileImg: string;

  @IsOptional()
  @IsString()
  profileBanner: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

/**
 * DTO FOR SWAGGER
 */
class VendorAuthSuccessPayloadData {
  _id: string;

  role: string;

  permissions: string[];
}

class VendorRegistrationPayloadData {
  _id: string;

  username: string;

  name: string;
}

export class VendorRegistrationPayloadDto {
  success: boolean;

  message: string;

  data: VendorRegistrationPayloadData;
}

export class VendorAuthPayloadDto {
  success: boolean;

  message: string;

  data: VendorAuthSuccessPayloadData;

  token: string;

  tokenExpiredIn: number;
}

export class ResetVendorPasswordDto {
  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;
}
