export const toShortAddress = (address: string) => {
  if (address.length <= 16) {
    return address;
  }
  return address.substr(0, 6) + '...' + address.substr(-6);
}

export function isNumber(value: any) {
  const reg = /^[0-9]+\.?[0-9]*$/;
  return reg.test(value);
}

export function beautify(str = ''): string {
  const reg = str.indexOf('.') > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
  str = str.replace(reg, '$1,');
  return str.replace(/(\.[0-9]+[1-9]+)(0)*/, '$1');
}
