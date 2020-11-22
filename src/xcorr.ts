export function xcorr(A: number[], B: number[], size: number = 20) {
    const mA = A.reduce((sum, a) => sum + a) / A.length;
    const mB = B.reduce((sum, b) => sum + b) / B.length;

    // const vA = A.reduce((sum, a) => sum + (a - mA) ** 2, 0);
    // const vB = B.reduce((sum, b) => sum + (b - mB) ** 2, 0);

    const positive = Array.from({ length: size }, (_, m) => {
        console.log('m', m, A.slice(m));

        return {
            x: m, 
            y: A.slice(m).reduce((acc, a, i) => acc + (a - mA) * (B[i] - mB), 0)
        };
    });

    // return positive;

    const negative = Array.from({ length: size }, (_, m) => {

        return {
            x: -m, 
            y: B.slice(m).reduce((acc, b, i) => acc + (A[i] - mA) * (b - mB), 0)
        };
    });

    return negative.slice(1).reverse().concat(positive);
}