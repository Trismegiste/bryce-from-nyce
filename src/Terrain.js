/*
 * Bryce
 */

/**
 * A fractal terrain
 */
export class Terrain {
    grid = [[]]
    lastIndex = 0
    gridTesselation = 0
    transferFunction = [];

    /**
     * Constructor
     * @param {Number} gridTesselation the level of tesselation from 1 to any integer. Warning, memory is growing exponentially
     * @returns {Terrain}
     */
    constructor(gridTesselation) {
        this.gridTesselation = gridTesselation
        this.lastIndex = 2 ** gridTesselation
        this.reset()
    }

    /**
     * Resets the grid
     */
    reset() {
        for (let x = 0; x <= this.lastIndex; x++) {
            this.grid[x] = []
            for (let y = 0; y <= this.lastIndex; y++) {
                this.grid[x][y] = 0
            }
        }

        this.grid[0][0] = Math.random()
        this.grid[this.lastIndex][0] = Math.random()
        this.grid[0][this.lastIndex] = Math.random()
        this.grid[this.lastIndex][this.lastIndex] = Math.random()
    }

    /**
     * Generates the terrain with the given tesselation level
     */
    generate() {
        for (let k = 0; k < this.gridTesselation; k++) {
            this.#generateAtLevel(k)
        }
        this.#normalize()
    }

    /**
     * Generates the terrain heights at a given level of tesselation
     * @param {Number} level the level of tesselation, from 0 to (this.tesselation - 1)
     */
    #generateAtLevel(level) {
        const step = 2 ** (this.gridTesselation - level)
        // the diamond step
        for (let left = 0; left < this.lastIndex; left += step) {
            for (let top = 0; top < this.lastIndex; top += step) {
                this.grid[left + step / 2][top + step / 2] = (
                        this.grid[left][top]
                        + this.grid[left + step][top]
                        + this.grid[left][top + step]
                        + this.grid[left + step][top + step]
                        ) / 4 + (Math.random() - 0.5) * 2 ** -level
            }
        }
        // the square step
        for (let left = 0; left <= this.lastIndex; left += step) {
            for (let top = 0; top <= this.lastIndex; top += step) {
                let pointToUpdate = [{x: left + step / 2, y: top}, {x: left, y: top + step / 2}]
                for (let coord of pointToUpdate) {
                    if ((coord.x <= this.lastIndex) && (coord.y <= this.lastIndex)) {
                        this.grid[coord.x][coord.y] = this.#average(coord, step / 2) + (Math.random() - 0.5) * 2 ** -level
                    }
                }
            }
        }
        "end"
    }

    #average(point, radius) {
        let sum = 0
        let count = 0
        // point on the left
        if ((point.x - radius) >= 0) {
            sum += this.grid[point.x - radius][point.y]
            count++
        }
        // point on the right
        if ((point.x + radius) <= this.lastIndex) {
            sum += this.grid[point.x + radius][point.y]
            count++
        }
        // point above
        if ((point.y - radius) >= 0) {
            sum += this.grid[point.x][point.y - radius]
            count++
        }
        // point below
        if ((point.y + radius) <= this.lastIndex) {
            sum += this.grid[point.x][point.y + radius]
            count++
        }

        return sum / count
    }

    /**
     * Gets the grid size
     * @returns {Number}
     */
    getSide() {
        return this.lastIndex + 1
    }

    /**
     * Normalizes all heights for being included in [0 , 1]
     */
    #normalize() {
        // Extract boundaries for normalizing
        let minHeight = Infinity
        let maxHeight = -Infinity

        for (let x = 0; x <= this.lastIndex; x++) {
            for (let y = 0; y <= this.lastIndex; y++) {
                if (this.grid[x][y] > maxHeight) {
                    maxHeight = this.grid[x][y]
                }
                if (this.grid[x][y] < minHeight) {
                    minHeight = this.grid[x][y]
                }
            }
        }

        // normalize betwseen [0,1]
        for (let x = 0; x <= this.lastIndex; x++) {
            for (let y = 0; y <= this.lastIndex; y++) {
                this.grid[x][y] = (this.grid[x][y] - minHeight) / (maxHeight - minHeight)
            }
        }
    }

    /**
     * Dumps all heights for building a mesh
     * Processes all transfer functions
     * @returns {Array}
     */
    dump() {
        let dataArray = new Array(this.getSide() * this.getSide())
        let index = 0
        for (let x = 0; x <= this.lastIndex; x++) {
            for (let y = 0; y <= this.lastIndex; y++) {
                let normalized = this.grid[x][y]
                for (let tf of this.transferFunction) {
                    normalized = tf.getY(normalized)
                }
                dataArray[index++] = normalized
            }
        }

        return dataArray;
    }

    /**
     * Stacks a transfer function
     * @param {TransferFunction} tf
     * @returns {Terrain}
     */
    applyTransferFunction(tf) {
        // checking definition
        for (let x = 0; x <= 1; x += 0.1) {
            const y = tf.getY(x)
            if ((y < 0) || (y > 1)) {
                throw new Error('Transfer function definition must be f: [0,1] -> [0,1]')
            }
        }
        // stacking
        this.transferFunction.push(tf)
        return this
    }

    /**
     * Apply a convolution matrix on the terrain grid
     * No "undo"
     */
    applyConvolution(matrix) {
        // temporary new grid
        let newGrid = new Array(this.grid.length)
        for (let k = 0; k < this.grid.length; k++) {
            newGrid[k] = new Array(this.grid.length)
        }
        // cheking matrix
        const dim = matrix.length
        if (1 !== (dim % 2)) {
            throw new Error('Dimension of convolution matrix must be odd')
        }
        for (let k = 0; k < dim; k++) {
            if (matrix[k].length !== dim) {
                throw new Error("Convolution matrix is not square")
            }
        }
        // convolution
        for (let x = 0; x <= this.lastIndex; x++) {
            for (let y = 0; y <= this.lastIndex; y++) {
                let sum = 0
                let weight = 0
                for (let mx = 0; mx < dim; mx++) {
                    for (let my = 0; my < dim; my++) {
                        const nx = x + mx - (dim - 1) / 2
                        const ny = y + my - (dim - 1) / 2
                        if ((nx >= 0) && (nx <= this.lastIndex) && (ny >= 0) && (ny <= this.lastIndex)) {
                            const coeff = matrix[mx][my]
                            sum += this.grid[nx][ny] * coeff
                            weight += coeff
                        }
                    }
                }
                newGrid[x][y] = sum / weight
            }
        }
        this.grid = newGrid
    }

    /**
     * Gets some statistics on heights
     * @param {Number} boxCount subdivision of height
     * @returns {Array}
     */
    getStatistics(boxCount = 20) {
        let stat = new Array(boxCount)
        stat.fill(0)
        for (let x = 0; x <= this.lastIndex; x++) {
            for (let y = 0; y <= this.lastIndex; y++) {
                const box = parseInt(Math.floor((boxCount - 1) * this.grid[x][y]))
                stat[box]++
            }
        }

        return stat
    }

    /**
     * Extends the grid and increases the tesselation of this terrain
     */
    increaseTesselation() {
        const newGridSide = 2 * this.lastIndex + 1
        let newGrid = new Array(newGridSide)

        for (let x = 0; x <= this.lastIndex; x++) {
            newGrid[2 * x] = new Array(newGridSide)
            newGrid[2 * x].fill(0)
            newGrid[2 * x + 1] = new Array(newGridSide)
            newGrid[2 * x + 1].fill(0)
            for (let y = 0; y <= this.lastIndex; y++) {
                newGrid[2 * x][2 * y] = this.grid[x][y]
            }
        }

        this.grid = newGrid
        this.gridTesselation++
        this.lastIndex *= 2
        this.#generateAtLevel(this.gridTesselation - 1)
    }

    /**
     * Shrinks the grid and decreases the tesselation of this terrain
     */
    decreaseTesselation() {
        const newGridSide = this.lastIndex / 2 + 1
        let newGrid = new Array(newGridSide)

        for (let x = 0; x <= this.lastIndex / 2; x++) {
            newGrid[x] = new Array(newGridSide)
            for (let y = 0; y <= this.lastIndex / 2; y++) {
                newGrid[x][y] = this.grid[2 * x][2 * y]
            }
        }

        this.grid = newGrid
        this.gridTesselation--
        this.lastIndex /= 2
    }
}