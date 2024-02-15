/*
 * Bryce
 */

const step = 100.0

export class TransfertFunction {

    tf = null
    xMin = -1
    xMax = 1
    yMin = 0
    yMax = 0;

    /**
     * Constructor
     * @param {callable} fct the transfer function, not normalized
     * @param {Float} min From x = min
     * @param {Float} max To y = max
     * @returns {TransfertFunction}
     */
    constructor(fct, min, max) {
        this.tf = fct
        this.xMin = min
        this.xMax = max

        // normalizes the transfer function [0,1] -> [0,1]

        let minHeight = Infinity
        let maxHeight = -Infinity
        for (let i = 0; i <= step; i++) {
            let x = i * (max - min) / step + min
            let y = fct(x)
            if (y > maxHeight) {
                maxHeight = y
            }
            if (y < minHeight) {
                minHeight = y
            }
        }

        this.yMin = minHeight
        this.yMax = maxHeight
    }

    /**
     * Gets ordinate
     * @param {Float} x between 0 and 1
     * @returns {Float} between 0 and 1
     */
    getY(x) {
        x = x * (this.xMax - this.xMin) + this.xMin
        let y = this.tf(x)

        return (y - this.yMin) / (this.yMax - this.yMin)
    }
}