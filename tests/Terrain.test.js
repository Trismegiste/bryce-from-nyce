import { expect, test, beforeEach, afterEach } from "bun:test";
import { Terrain } from '../src/Terrain.js';

let sut = null

beforeEach(() => {
    sut = new Terrain(4)
});

test("Test creation", () => {
    expect(sut.grid.length).toBe(17)
});

test("Test size", () => {
    expect(sut.getSide()).toBe(17)
});

test('Generation', () => {
    sut.generate()
    for(let x=0; x <= sut.lastIndex; x++) {
        for(let y=0; y <= sut.lastIndex; y++) {
            expect(sut.grid[x][y]).toBeGreaterThanOrEqual(0)
            expect(sut.grid[x][y]).toBeLessThanOrEqual(1)
        }
    }
})

test('Reset', () => {
    sut.generate()
    sut.reset()
    expect(sut.grid[8][8]).toBe(0)
})

test('Dump', () => {
    sut.generate()
    expect(sut.dump().length).toBe((2 ** 4 + 1) ** 2)
})

test('Increase tesselation', () => {
    sut.generate()
    sut.increaseTesselation()
    expect(sut.getSide()).toBe(33)
})

test('Decrease tesselation', () => {
    sut.generate()
    sut.decreaseTesselation()
    expect(sut.getSide()).toBe(9)
})

test.todo('Transfer function', () => {
    sut.applyTransferFunction(new TransferFunction(x=>x,0,1))
})

test.todo('Convolution', () => {
    sut.applyConvolution([[1]])
})

