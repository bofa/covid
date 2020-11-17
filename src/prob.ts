export const limit = 27;
export const states = [
    // Pennsylvania
    [1.0, 20, 'Pennsylvania'],
    // Georgia
    [0.0, 16, 'Georgia'],
    // North Carolina
    [0.0, 15, 'North Carolina'],
    // Arizona
    [0.4, 11, 'Arizona'],
    // Wisconsian
    [0.0, 10, 'Wisconsian'],
    // Nevada
    [0.4, 6, 'Nevada'],
] as any[] as number[];

/**
 * Generate all combinations of an array.
 * @param {Array} sourceArray - Array of input elements.
 * @param {number} comboLength - Desired length of combinations.
 * @return {Array} Array of combination arrays.
 */
export function generateCombinations<T>(sourceArray: T[], comboLength: number): T[][] {
    const sourceLength = sourceArray.length;
    if (comboLength > sourceLength) { return []; }

    const combos: T[][] = []; // Stores valid combinations as they are generated.

    // Accepts a partial combination, an index into sourceArray, 
    // and the number of elements required to be added to create a full-length combination.
    // Called recursively to build combinations, adding subsequent elements at each call depth.
    const makeNextCombos = (workingCombo: T[], currentIndex: number, remainingCount: number) => {
        const oneAwayFromComboLength = remainingCount === 1;

        // For each element that remaines to be added to the working combination.
        for (let sourceIndex = currentIndex; sourceIndex < sourceLength; sourceIndex++) {
            // Get next (possibly partial) combination.
            const next = [ ...workingCombo, sourceArray[sourceIndex] ];

            if (oneAwayFromComboLength) {
                // Combo of right length found, save it.
                combos.push(next as any);
            } else {
                // Otherwise go deeper to add more elements to the current partial combination.
                makeNextCombos(next, sourceIndex + 1, remainingCount - 1);
            }
        }
    };

    makeNextCombos([], 0, comboLength);
    return combos;
}

export const P = states.map(s => s[0]);
const Combos = generateCombinations(states.map((_, i) => i), 1)
    .concat(generateCombinations(states.map((_, i) => i), 2))
    .concat(generateCombinations(states.map((_, i) => i), 3))
    .filter(s => s.reduce((sum, i) => sum + states[i][1], 0) >= limit)
    .filter(s => s.reduce((sum, i) => sum + states[i][1], 0) - states[s[s.length - 1]][1] < limit)
    ;

console.log('Combos', Combos.map(c => c.map(i => states[i][2])));

export function insideOutside () {
    const probability = Combos.map((_, i) => (-1) ** i)
        .map((sign, comboLength) => sign * generateCombinations(Combos, comboLength + 1)
            .reduce((sum, c) => sum +
                c.reduce((a, b) => a.concat(b), [] as number[])
                    .filter((p, i, arr) => arr.indexOf(p) === i)
                    .map(i => P[i])
                    .reduce((prod, p) => prod * p, 1)
            , 0))
            .reduce((sum, Pn) => sum + Pn);

    return probability;
}