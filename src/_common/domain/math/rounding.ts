export type RoundingMode = 'HALF_UP' | 'DOWN' | 'BANKERS';

// Default rounding is kaufmaennisch (DIN 1333): 0-4 down, 5-9 up.
export const DEFAULT_ROUNDING: RoundingMode = 'HALF_UP';

export function roundDivide(numerator: number, denominator: number, mode: RoundingMode): number {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
        throw new Error('roundDivide expects finite numbers.');
    }
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
        throw new Error('roundDivide expects integer inputs.');
    }
    if (denominator === 0) {
        throw new Error('roundDivide denominator must be non-zero.');
    }

    const sign = Math.sign(numerator) || 1;
    const absNumerator = Math.abs(numerator);
    const absDenominator = Math.abs(denominator);

    const quotient = Math.floor(absNumerator / absDenominator);
    const remainder = absNumerator % absDenominator;

    let result = quotient;
    switch (mode) {
        case 'DOWN': {
            result = quotient;
            break;
        }
        case 'HALF_UP': {
            result = remainder * 2 >= absDenominator ? quotient + 1 : quotient;
            break;
        }
        case 'BANKERS': {
            if (remainder * 2 > absDenominator) {
                result = quotient + 1;
            } else if (remainder * 2 === absDenominator) {
                result = quotient % 2 === 0 ? quotient : quotient + 1;
            }
            break;
        }
        default: {
            throw new Error(`Unsupported rounding mode: ${mode}`);
        }
    }

    return result * sign;
}
