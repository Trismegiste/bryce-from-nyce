/*
 * Eclipse Wiki
 */

const step = 100.0

export class TransfertFunction {

    tf = null
    xMin = -1
    xMax = 1
    yMin = 0
    yMax = 0;

    constructor(fct, min, max) {
        this.tf = fct
        this.xMin = min
        this.xMax = max

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
     * @param {type} x between 0 and 1
     * @returns {Number} between 0 and 1
     */
    getY(x) {
        x = x * (this.xMax - this.xMin) + this.xMin
        let y = this.tf(x)

        return (y - this.yMin) / (this.yMax - this.yMin)
    }
}