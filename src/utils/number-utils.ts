
export class NumberUtils {
    static showWithCommas(value: number, fractionDigits: number = 2): string {
        return value.toFixed(fractionDigits).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}