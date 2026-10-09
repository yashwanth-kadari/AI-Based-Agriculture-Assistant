/**
 * AGRONOMIC QUALITATIVE-TO-NUMERIC MAPPING SERVICE
 * 
 * Maps simple farmer observations (fertility status, recent fertilizer application,
 * and soil texture type) to representative Nitrogen (N), Phosphorus (P), Potassium (K),
 * and pH numerical values.
 * 
 * Mapping Baseline derived from AgriSmart ML training profiles (generate_datasets.py):
 * 
 * 1. SOIL FERTILITY BASELINE (mg/kg):
 *    - 'poor'    : Weak crop growth, chlorotic leaves  -> N: 50.0, P: 20.0, K: 16.0
 *    - 'average' : Normal growth & average yield       -> N: 75.0, P: 35.0, K: 30.0
 *    - 'good'    : Vigorous growth, dark green leaves  -> N: 100.0, P: 50.0, K: 45.0
 * 
 * 2. RECENT FERTILIZER APPLICATION ADJUSTMENT:
 *    - 'none'    : No recent fertilizer applied        -> 0.85x N, 0.85x P, 0.85x K
 *    - 'light'   : Standard/moderate NPK application   -> 1.00x N, 1.00x P, 1.00x K
 *    - 'heavy'   : Heavy/frequent NPK application      -> 1.25x N, 1.20x P, 1.20x K
 * 
 * 3. SOIL TYPE TO pH PROXY:
 *    - 'sandy'   : Fast-draining, slightly acidic      -> pH: 5.8
 *    - 'loamy'   : Ideal balanced soil                 -> pH: 6.5
 *    - 'clayey'  : Heavy mineral-retaining soil        -> pH: 7.2
 *    - 'not_sure': Safe neutral default                -> pH: 6.5 (does not block submission)
 */

export const FERTILITY_OPTIONS = [
    { value: 'average', label: 'Average Fertility (Normal seasonal growth)' },
    { value: 'poor', label: 'Poor Fertility (Weak growth, pale/yellowish leaves)' },
    { value: 'good', label: 'Good / High Fertility (Vigorous growth, dark green leaves)' },
];

export const FERTILIZER_USAGE_OPTIONS = [
    { value: 'light', label: 'Light / Standard Application (Balanced NPK / compost)' },
    { value: 'none', label: 'None Recently (No fertilizer added this season)' },
    { value: 'heavy', label: 'Heavy Application (High dose chemical NPK / frequent)' },
];

export const SOIL_TYPE_OPTIONS = [
    { value: 'loamy', label: 'Loamy Soil (Balanced, loamy texture)' },
    { value: 'sandy', label: 'Sandy Soil (Light, quick-draining)' },
    { value: 'clayey', label: 'Clayey Soil (Heavy, moisture-retaining)' },
    { value: 'not_sure', label: 'Not Sure / Other (Uses safe neutral default)' },
];

export const mapQualitativeToNumeric = ({ soilFertility = 'average', fertilizerUse = 'light', soilType = 'loamy' }) => {
    const fertilityMap = {
        poor: { N: 50.0, P: 20.0, K: 16.0 },
        average: { N: 75.0, P: 35.0, K: 30.0 },
        good: { N: 100.0, P: 50.0, K: 45.0 },
    };

    const fertilizerMap = {
        none: { N: 0.85, P: 0.85, K: 0.85 },
        light: { N: 1.00, P: 1.00, K: 1.00 },
        heavy: { N: 1.25, P: 1.20, K: 1.20 },
    };

    const phMap = {
        sandy: 5.8,
        loamy: 6.5,
        clayey: 7.2,
        not_sure: 6.5,
    };

    const base = fertilityMap[soilFertility] || fertilityMap.average;
    const mult = fertilizerMap[fertilizerUse] || fertilizerMap.light;
    const ph = phMap[soilType] || 6.5;

    return {
        N: Math.round(base.N * mult.N * 10) / 10,
        P: Math.round(base.P * mult.P * 10) / 10,
        K: Math.round(base.K * mult.K * 10) / 10,
        ph: ph,
    };
};
