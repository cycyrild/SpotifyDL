const base = BigInt(62);
const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function encode(integer: number | bigint): string {
    if (Number(integer) === 0) {
        return "0";
    }

    let num = BigInt(integer);
    let str: string[] = [];

    while (num > 0) {
        str = [charset[Number(num % base)], ...str];
        num = num / base;
    }

    return str.join("");
}

export function decodeToBigint(str: string): bigint {
    return str.split("").reverse().reduce(
        (prev, char, i) =>
            prev + (BigInt(charset.indexOf(char)) * bigIntPow(base, BigInt(i))),
        BigInt(0)
    );
}

export function decode(str: string): string {
    return decodeToBigint(str).toString();
}

function bigIntPow(base: bigint, exponent: bigint): bigint {
    let result = BigInt(1);
    while (exponent > 0) {
        if (exponent % BigInt(2) === BigInt(1)) {
            result *= base;
        }
        base *= base;
        exponent /= BigInt(2);
    }
    return result;
}
