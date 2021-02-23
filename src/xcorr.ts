export function xcorr(A: number[] | undefined, B: number[] | undefined, size: number = 20) {
    if (A === undefined || B === undefined || A.length < 1 || B.length < 1) {
        return [];
    }
    
    const NA = A.length;
    const NB = B.length;
    const mA = A.reduce((sum, a) => sum + a) / NA;
    const mB = B.reduce((sum, b) => sum + b) / NB;

    // const vA = A.reduce((sum, a) => sum + (a - mA) ** 2, 0);
    // const vB = B.reduce((sum, b) => sum + (b - mB) ** 2, 0);

    const positive = Array.from({ length: size }, (_, m) => {
        return {
            x: m, 
            y: A.slice(m, NB + m).reduce((acc, a, i, self) => acc + (a - mA) * (B[i] - mB) / self.length, 0)
        };
    });

    // return positive;

    const negative = Array.from({ length: size }, (_, m) => {
        return {
            x: -m, 
            y: B.slice(m, NA + m).reduce((acc, b, i, self) => acc + (A[i] - mA) * (b - mB) / self.length, 0)
        };
    });

    return negative.slice(1).reverse().concat(positive);
}