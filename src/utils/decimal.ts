import Decimal from 'decimal.js';
import BN from 'bn.js';

export const ZERO_DECIMAL = new Decimal(0);
export const ONE_DECIMAL = new Decimal(1);
export const ONE_HUNDRED_DECIMAL = new Decimal(100);

export class DecimalUtils {

  public static fromString(input: string, shift = 0): Decimal {
    return new Decimal(input||0).div(new Decimal(10).pow(shift));
  }

  public static fromNumber(input: number, shift = 0): Decimal {
    return new Decimal(input).div(new Decimal(10).pow(shift));
  }

  public static fromU64(input: BN, shift = 0): Decimal {
    return new Decimal(input.toString()).div(new Decimal(10).pow(shift));
  }

  public static toU64(input: Decimal, shift = 0): BN {
    if (input.isNeg()) {
      throw new Error(`Negative decimal value ${input} cannot be converted to u64.`);
    }
   
    const shiftedValue = new BN(input.mul(new Decimal(10).pow(new Decimal(shift))).toString());
    return shiftedValue;
  }

  public static beautify(input: Decimal, fixed?: number): string {
    if (!input) {
      return '0.00';
    }

    if (fixed === undefined) {
      fixed = 
        input.gt(ZERO_DECIMAL) && input.lt(ONE_DECIMAL) ? 6 : 
        2;
    }

    const str = input.toNumber().toFixed(fixed);
    
    const reg = str.indexOf('.') > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
   
    return str.replace(reg, '$1,');
  }
}