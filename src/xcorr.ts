const A = Array.from({length: 1000}, () => Math.random() - 0.5);
const B = [0, 0, ...A.slice(2)];

export function xcorr(size: number = 20) {
    const output = Array.from({length: size}, (_, m) => A.slice(m).reduce((acc, a, i) => a * B[i]));

    return output;
}